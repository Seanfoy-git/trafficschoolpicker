/**
 * DATA FLOW: Scraper Rules DB → target pages → Playwright → Notion Pricing DB.
 *
 * WS2 (course-type gating): targets come from the Scraper Rules DB (one Verified
 * row per school × state × course-type: exact Target URL, Course Type + Variant,
 * a hand-Verified Price anchor, a per-rule Expected Min/Max band, Extract Hint).
 * price-sources.ts is a typed FALLBACK used only if the Rules DB is unreachable,
 * so a Notion outage can't leave the cron with zero targets.
 *
 * HARDENED (WS1): a scrape is validated by the rule's band AND its Verified Price
 * anchor. Out-of-band or drifting-from-verified → QUARANTINED ("Needs Review",
 * nothing written) and flagged to RE-VERIFY — a human-verified price is never
 * clobbered. A confirming scrape writes the VERIFIED value (not the parse) so the
 * anchor stays exact. Blocked/Failed/Dead never write. Unmapped monetized cards
 * (a live card with no rule) surface as "needs a rule". The run exits non-zero on
 * anomalies so the monthly job can't "succeed" silently over bad data.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { makeNotionClient } from "./lib/notion-client";
import { priceTargets } from "./config/price-sources";
import { fetchVerifiedRules, type ScraperRule } from "./config/scraper-rules";
import { pickPrice, classify, classifyAgainstRule, type PriceDecision } from "./lib/price-extract";

const notion = makeNotionClient();
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;
const PRICING_DB = process.env.NOTION_PRICING_DB!;
// --report: scrape + classify + print, but make ZERO Notion writes. Nothing
// reaches a live card; used to review the sweep before any price is applied.
const REPORT = process.argv.includes("--report");

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
    if (slug) map.set(slug.toLowerCase(), page.id);
    // Also key by Partner Slug — Scraper Rules rows use it (e.g. "idrivesafely",
    // whose derived Slug would be "i-drive-safely").
    const partner = (page.properties["Partner Slug"]?.rich_text?.[0]?.plain_text ?? "").toLowerCase();
    if (partner) map.set(partner, page.id);
  }
  return map;
}

// ─── Notion: monetized cards (for the "needs a rule" report) ────────────────
// A live monetized card = Active + Show On Site + monetizable network + a real
// working link (direct+partnerSlug, or a non-placeholder affiliate URL).
async function getMonetizedCards(): Promise<{ slug: string; name: string; states: string[]; coversAll: boolean }[]> {
  const MONETIZABLE = ["CJ", "Impact", "ShareASale", "Direct", "Pending"];
  const res = await notion.databases.query({
    database_id: SCHOOLS_DB,
    filter: { and: [
      { property: "Status", select: { equals: "Active" } },
      { property: "Show On Site", checkbox: { equals: true } },
    ] },
  });
  const cards: { slug: string; name: string; states: string[]; coversAll: boolean }[] = [];
  for (const page of res.results as any[]) {
    const p = page.properties;
    const network = p["Affiliate Network"]?.select?.name ?? "";
    if (!MONETIZABLE.includes(network)) continue;
    const trackingMethod = p["Tracking Method"]?.select?.name ?? "";
    const partnerSlug = (p["Partner Slug"]?.rich_text?.[0]?.plain_text ?? "").toLowerCase();
    const affiliateUrl = p["Affiliate URL"]?.url ?? p["Affiliate URL"]?.rich_text?.[0]?.plain_text ?? "";
    // A real working link: direct tracking with a partner slug, OR an affiliate
    // URL that isn't a sign-up/inquiry placeholder (e.g. affiliate_inquiry_*).
    const hasLink =
      (trackingMethod === "direct" && !!partnerSlug) ||
      (!!affiliateUrl && !/affiliate_inquiry/i.test(affiliateUrl));
    if (!hasLink) continue;
    const slug = partnerSlug || (p["Slug"]?.rich_text?.[0]?.plain_text ?? "").toLowerCase();
    const name = p["School Name"]?.title?.[0]?.plain_text ?? "";
    const codesRaw = p["State Codes"]?.rich_text?.[0]?.plain_text ?? "";
    const coversAll = /(^|,)\s*all\s*(,|$)/i.test(codesRaw);
    const states = coversAll ? [] : codesRaw.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);
    if (slug) cards.push({ slug, name, states, coversAll });
  }
  return cards;
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
): Promise<{ price: number | null; blocked: boolean; dead: boolean; httpStatus: number }> {
  try {
    const resp = await browserPage.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const httpStatus = resp?.status() ?? 0;
    // Dead target (404/410/5xx): the page no longer exists — a selector can't
    // help. Surface it distinctly instead of a vague "Failed / no price parsed".
    if (httpStatus >= 400) return { price: null, blocked: false, dead: true, httpStatus };
    await browserPage.waitForTimeout(2000);

    const title = await browserPage.title();
    const bodyText = await browserPage.evaluate(() => document.body.innerText);

    const blockSignals = [
      "access denied", "captcha", "cloudflare", "robot", "blocked",
      "verify you are human", "403", "forbidden",
    ];
    if (blockSignals.some((s) => bodyText.toLowerCase().includes(s) || title.toLowerCase().includes(s))) {
      return { price: null, blocked: true, dead: false, httpStatus };
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

    return { price: pickPrice(targetText, fromSelector), blocked: false, dead: false, httpStatus };
  } catch {
    return { price: null, blocked: false, dead: false, httpStatus: 0 };
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

  // Targets from the Scraper Rules DB (Verified rows); fall back to the static
  // price-sources.ts list if the DB is unset/unreachable (Notion-outage safety).
  const rules = await fetchVerifiedRules(notion);
  const usingRules = rules.length > 0;

  type RunTarget = {
    schoolSlug: string; state: string; url: string;
    method: "dom" | "fixed"; fixedPrice?: number; selector?: string | null;
    rule?: ScraperRule; note?: string;
  };
  const targets: RunTarget[] = usingRules
    ? rules.map((r) => ({ schoolSlug: r.schoolSlug, state: r.state, url: r.url, method: "dom", rule: r, note: r.ruleName }))
    : priceTargets.map((t) => ({ schoolSlug: t.schoolSlug, state: t.state, url: t.url, method: t.method, fixedPrice: t.fixedPrice, selector: t.selector, note: t.notes }));

  console.log(
    `${REPORT ? "MODE: REPORT (no Notion writes)\n\n" : ""}Source: ${usingRules ? `Scraper Rules DB (${rules.length} Verified rules)` : "⚠ price-sources.ts FALLBACK (Rules DB unreachable)"}. Processing ${targets.length} targets...\n`
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  const TODAY = new Date().toISOString().split("T")[0];
  let ok = 0, review = 0, failed = 0, blocked = 0, dead = 0, errors = 0;
  const reviewQueue: { label: string; anchor: number | null; proposed: number | null; reason: string }[] = [];
  const okQueue: { label: string; anchor: number | null; proposed: number | null }[] = [];

  for (const t of targets) {
    const schoolPageId = schoolIdMap.get(t.schoolSlug.toLowerCase());
    const label = `${t.schoolSlug}-${t.state}`;
    const existing = await getExistingRow(t.schoolSlug, t.state);
    // The gate baselines on the rule's Verified Price (the human anchor), or the
    // prior stored price when running from the fallback list.
    const anchor = t.rule?.verifiedPrice ?? existing.priorPrice;

    let decision: PriceDecision;
    let candidate: number | null = null;

    if (t.method === "fixed") {
      candidate = t.fixedPrice ?? null;
      decision = candidate != null
        ? { status: "OK", writePrice: candidate, approve: true, reason: "fixed (config)" }
        : { status: "Failed", writePrice: null, approve: false, reason: "fixed target missing fixedPrice" };
    } else {
      const result = await scrapePriceFromPage(t.url, t.selector, page);
      candidate = result.price;
      decision = t.rule
        ? classifyAgainstRule(candidate, t.rule, result.blocked, result.dead)
        : result.dead
          ? { status: "Dead URL", writePrice: null, approve: false, reason: `HTTP ${result.httpStatus} — target URL is dead` }
          : classify(candidate, existing.priorPrice, result.blocked);
    }

    const ctx = t.rule ? ` [${t.rule.courseType}/${t.rule.variant}]` : "";
    const anchorStr = t.rule ? `verified $${t.rule.verifiedPrice ?? "—"}` : `prior $${existing.priorPrice ?? "—"}`;
    console.log(`  ${decision.status.padEnd(12)} ${label}${ctx}: got ${candidate != null ? `$${candidate}` : "—"} ${anchorStr} — ${decision.reason}`);

    if (decision.status === "OK") { ok++; okQueue.push({ label, anchor, proposed: decision.writePrice }); }
    else if (decision.status === "Needs Review") { review++; reviewQueue.push({ label, anchor, proposed: candidate, reason: decision.reason }); }
    else if (decision.status === "Blocked") blocked++;
    else if (decision.status === "Dead URL") dead++;
    else failed++;

    // Write ONLY a validated price; Approved set ONLY for a validated OK — never
    // flipped for Needs Review/Blocked/Failed/Dead, so a verified card is never
    // silently clobbered.
    const properties: any = {
      Label: { title: [{ text: { content: label } }] },
      "State Code": { rich_text: [{ text: { content: t.state } }] },
      "Price Scrape Status": { select: { name: decision.status } },
      "Last Scraped": { date: { start: TODAY } },
    };
    if (schoolPageId) properties.School = { relation: [{ id: schoolPageId }] };
    if (decision.writePrice != null) properties.Price = { number: decision.writePrice };
    if (decision.approve) properties.Approved = { checkbox: true };
    if (t.note) properties["Price Note"] = { rich_text: [{ text: { content: t.note } }] };

    if (!REPORT) {
      if (!existing.id && !schoolPageId) {
        console.warn(`  WARN  ${label}: no pricing row and no school match for slug "${t.schoolSlug}" — skipping create`);
      } else {
        try {
          if (existing.id) await notion.pages.update({ page_id: existing.id, properties });
          else await notion.pages.create({ parent: { database_id: PRICING_DB }, properties });
        } catch (err) {
          errors++;
          console.error(`  ERR   ${label}: ${(err as Error).message}`);
        }
      }
    }

    await new Promise((r) => setTimeout(r, t.method === "fixed" ? 350 : 2500));
  }

  await browser.close();

  const total = ok + review + failed + blocked + dead;
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Price Scrape Summary");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  OK (${REPORT ? "would write" : "written"}):  ${ok}`);
  console.log(`  Needs Review:  ${review}  (quarantined — live price left untouched)`);
  console.log(`  Failed:        ${failed}`);
  console.log(`  Blocked:       ${blocked}`);
  console.log(`  Dead URL:      ${dead}  (404/5xx — fix the URL in price-sources.ts)`);
  if (!REPORT) console.log(`  Write errors:  ${errors}`);

  if (REPORT && okQueue.length) {
    console.log("\n  CONFIRMED (matches verified / in band):");
    for (const r of okQueue) {
      console.log(`    • ${r.label}: anchor=${r.anchor ?? "—"} → write=${r.proposed ?? "—"}`);
    }
  }

  if (reviewQueue.length) {
    console.log("\n  REVIEW QUEUE — nothing written (re-verify):");
    for (const r of reviewQueue) {
      console.log(`    • ${r.label}: anchor=${r.anchor ?? "—"} proposed=${r.proposed ?? "—"} — ${r.reason}`);
    }
  }

  // Unmapped: any live monetized card with no Scraper Rules row → "needs a rule"
  // (never a silent fall-through). Only meaningful when running from the Rules DB.
  if (usingRules) {
    const ruleKey = new Set(rules.map((r) => `${r.schoolSlug}:${r.state}`));
    const cards = await getMonetizedCards();
    const gaps: string[] = [];
    for (const c of cards) {
      if (c.coversAll) {
        const have = rules.filter((r) => r.schoolSlug === c.slug).length;
        gaps.push(`${c.name} (${c.slug}): covers ALL states, ${have} rule(s) — needs a rule per monetized state`);
      } else {
        const missing = c.states.filter((s) => !ruleKey.has(`${c.slug}:${s}`));
        if (missing.length) gaps.push(`${c.name} (${c.slug}): no rule for ${missing.join(", ")}`);
      }
    }
    if (gaps.length) {
      console.log("\n  ⚠ UNMAPPED monetized cards — need a Scraper Rules row:");
      gaps.forEach((g) => console.log(`    • ${g}`));
    } else {
      console.log("\n  ✅ Every monetized card has a Scraper Rules row.");
    }
  }

  // In report mode we never mutate Notion and never fail the process — it's a
  // read-only preview. The non-zero-exit anomaly signalling only applies to a
  // real (writing) run.
  if (REPORT) {
    console.log("\nREPORT ONLY — no Notion writes were made.");
    return;
  }

  if (reviewQueue.length) {
    console.log(`::warning::price-scrape: ${reviewQueue.length} price(s) need review; live values left untouched`);
  }
  const failureRate = total ? (failed + blocked + dead) / total : 0;
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
