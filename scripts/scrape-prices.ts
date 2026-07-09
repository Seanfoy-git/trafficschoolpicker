/**
 * DATA FLOW: School pricing pages → Playwright → Notion School Pricing DB
 *
 * Writes to the School Pricing DB (one row per school × state combination).
 *
 * HARDENED (WS1): a scraped price is validated (scripts/lib/price-extract.ts)
 * against a sane band AND the prior stored value before it can touch a live
 * card. An implausible value is QUARANTINED — status "Needs Review", the Price
 * is NOT overwritten, and Approved is left exactly as a human last set it.
 * Blocked/Failed likewise never write Price or flip Approved. The run prints a
 * review queue and exits non-zero when there are anomalies (systemic failure or
 * anything quarantined) so the monthly job can't "succeed" silently over bad data.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { makeNotionClient } from "./lib/notion-client";
import { priceTargets } from "./config/price-sources";
import { pickPrice, classify, type PriceDecision } from "./lib/price-extract";

const notion = makeNotionClient();
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;
const PRICING_DB = process.env.NOTION_PRICING_DB!;

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Notion: get school page IDs by slug ────────────────────

async function getSchoolIdMap(): Promise<Map<string, string>> {
  if (!SCHOOLS_DB) return new Map();

  const response = await notion.databases.query({
    database_id: SCHOOLS_DB,
    filter: {
      and: [
        { property: "Status", select: { equals: "Active" } },
        { property: "Show On Site", checkbox: { equals: true } },
      ],
    },
  });

  const map = new Map<string, string>();
  for (const page of response.results as any[]) {
    const slug =
      page.properties["Slug"]?.rich_text?.[0]?.plain_text ??
      (page.properties["School Name"]?.title?.[0]?.plain_text ?? "")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    if (slug) map.set(slug, page.id);
  }
  return map;
}

// ─── Notion: find existing pricing row (with its current price) ─────────────

async function getExistingRow(
  slug: string,
  stateCode: string
): Promise<{ id: string | null; priorPrice: number | null }> {
  if (!PRICING_DB) return { id: null, priorPrice: null };

  try {
    const label = `${slug}-${stateCode}`;
    const response = await notion.databases.query({
      database_id: PRICING_DB,
      filter: { property: "Label", title: { equals: label } },
      page_size: 1,
    });
    const row = response.results[0] as any;
    if (!row) return { id: null, priorPrice: null };
    return { id: row.id, priorPrice: row.properties?.["Price"]?.number ?? null };
  } catch {
    return { id: null, priorPrice: null };
  }
}

// ─── Price scraping (extraction/validation lives in lib/price-extract) ──────

async function scrapePriceFromPage(
  url: string,
  selector: string | null | undefined,
  browserPage: import("playwright").Page
): Promise<{ price: number | null; blocked: boolean }> {
  try {
    await browserPage.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await browserPage.waitForTimeout(2000);

    const title = await browserPage.title();
    const bodyText = await browserPage.evaluate(() => document.body.innerText);

    const blockSignals = [
      "access denied", "captcha", "cloudflare", "robot", "blocked",
      "verify you are human", "403", "forbidden",
    ];
    if (blockSignals.some((s) => bodyText.toLowerCase().includes(s) || title.toLowerCase().includes(s))) {
      return { price: null, blocked: true };
    }

    let targetText = bodyText;
    let fromSelector = false;
    if (selector) {
      try {
        const el = await browserPage.$(selector);
        if (el) {
          targetText = await el.innerText();
          fromSelector = true;
        }
      } catch { /* fall back to body text */ }
    }

    return { price: pickPrice(targetText, fromSelector), blocked: false };
  } catch {
    return { price: null, blocked: false };
  }
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  if (!PRICING_DB) {
    console.error("NOTION_PRICING_DB not set. Create the School Pricing DB first.");
    process.exit(1);
  }

  const schoolIdMap = await getSchoolIdMap();
  if (schoolIdMap.size === 0) {
    console.log("No schools found in Traffic Schools DB.");
    return;
  }

  console.log(`Found ${schoolIdMap.size} schools. Processing ${priceTargets.length} price targets...\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  const TODAY = new Date().toISOString().split("T")[0];
  let ok = 0, review = 0, failed = 0, blocked = 0, errors = 0;
  const reviewQueue: { label: string; prior: number | null; proposed: number | null; reason: string }[] = [];

  for (const target of priceTargets) {
    const schoolPageId = schoolIdMap.get(target.schoolSlug);
    if (!schoolPageId) continue;

    const label = `${target.schoolSlug}-${target.state}`;
    const existing = await getExistingRow(target.schoolSlug, target.state);

    let decision: PriceDecision;
    let candidate: number | null = null;

    if (target.method === "fixed") {
      // Hand-set price in config → trusted, bypasses the scrape gate.
      candidate = target.fixedPrice ?? null;
      decision = candidate != null
        ? { status: "OK", writePrice: candidate, approve: true, reason: "fixed (config)" }
        : { status: "Failed", writePrice: null, approve: false, reason: "fixed target missing fixedPrice" };
    } else {
      const result = await scrapePriceFromPage(target.url, target.selector, page);
      candidate = result.price;
      decision = classify(candidate, existing.priorPrice, result.blocked);
    }

    const priorStr = existing.priorPrice ?? "—";
    const gotStr = candidate != null ? `$${candidate}` : "—";
    console.log(`  ${decision.status.padEnd(12)} ${label}: got ${gotStr} prior ${priorStr} — ${decision.reason}`);

    if (decision.status === "OK") ok++;
    else if (decision.status === "Needs Review") {
      review++;
      reviewQueue.push({ label, prior: existing.priorPrice, proposed: candidate, reason: decision.reason });
    } else if (decision.status === "Blocked") blocked++;
    else failed++;

    // Build the write. Price is written ONLY when validated; Approved is set
    // ONLY for a validated OK price — never flipped for Needs Review/Blocked/Failed,
    // so a live, human-approved card is never silently clobbered.
    const properties: any = {
      Label: { title: [{ text: { content: label } }] },
      School: { relation: [{ id: schoolPageId }] },
      "State Code": { rich_text: [{ text: { content: target.state } }] },
      "Price Scrape Status": { select: { name: decision.status } },
      "Last Scraped": { date: { start: TODAY } },
    };
    if (decision.writePrice != null) properties.Price = { number: decision.writePrice };
    if (decision.approve) properties.Approved = { checkbox: true };
    if (target.notes) properties["Price Note"] = { rich_text: [{ text: { content: target.notes } }] };

    try {
      if (existing.id) {
        await notion.pages.update({ page_id: existing.id, properties });
      } else {
        await notion.pages.create({ parent: { database_id: PRICING_DB }, properties });
      }
    } catch (err) {
      errors++;
      console.error(`  ERR   ${label}: ${(err as Error).message}`);
    }

    await new Promise((r) => setTimeout(r, target.method === "fixed" ? 350 : 2500));
  }

  await browser.close();

  const total = ok + review + failed + blocked;
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Price Scrape Summary");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  OK (written):  ${ok}`);
  console.log(`  Needs Review:  ${review}  (quarantined — live price left untouched)`);
  console.log(`  Failed:        ${failed}`);
  console.log(`  Blocked:       ${blocked}`);
  console.log(`  Write errors:  ${errors}`);

  if (reviewQueue.length) {
    console.log("\n  REVIEW QUEUE — nothing was written for these:");
    for (const r of reviewQueue) {
      console.log(`    • ${r.label}: prior=${r.prior ?? "—"} proposed=${r.proposed ?? "—"} — ${r.reason}`);
    }
    console.log(`::warning::price-scrape: ${reviewQueue.length} price(s) need review; live values left untouched`);
  }

  const failureRate = total ? (failed + blocked) / total : 0;
  if (failureRate > 0.4) {
    console.log(
      `::error::price-scrape: ${Math.round(failureRate * 100)}% of targets failed/blocked — likely systemic (site change or IP block)`
    );
    process.exit(1);
  }
  // Surface quarantined anomalies as a non-zero exit so the monthly run can't
  // "succeed" silently. The workflow step uses continue-on-error so this stays
  // visible (red step) without blocking the deploy.
  if (reviewQueue.length || errors) process.exit(1);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
