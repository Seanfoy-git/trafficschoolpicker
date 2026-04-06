/**
 * DATA FLOW: School pricing pages → Playwright → Notion School Pricing DB
 *
 * Writes to the School Pricing DB (one row per school × state combination).
 * Creates new rows if they don't exist, updates existing rows.
 * The School relation field links each pricing row to the Traffic Schools DB.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { Client } from "@notionhq/client";
import { priceTargets } from "./config/price-sources";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
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

// ─── Notion: find existing pricing row ──────────────────────

async function findPricingRow(
  slug: string,
  stateCode: string
): Promise<string | null> {
  if (!PRICING_DB) return null;

  try {
    const label = `${slug}-${stateCode}`;
    const response = await notion.databases.query({
      database_id: PRICING_DB,
      filter: {
        property: "Label",
        title: { equals: label },
      },
      page_size: 1,
    });
    return response.results[0]?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Price extraction ───────────────────────────────────────

function extractPrice(text: string): number | null {
  const regex = /\$\s*(\d{1,3}(?:\.\d{1,2})?)/g;
  const found: number[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    if (value >= 1 && value <= 200) found.push(value);
  }
  if (found.length === 0) return null;
  return Math.min(...found);
}

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
    if (selector) {
      try {
        const el = await browserPage.$(selector);
        if (el) targetText = await el.innerText();
      } catch { /* fall back */ }
    }

    return { price: extractPrice(targetText), blocked: false };
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
  let created = 0, updated = 0, failed = 0, blocked = 0;

  for (const target of priceTargets) {
    const schoolPageId = schoolIdMap.get(target.schoolSlug);
    if (!schoolPageId) continue;

    let price: number | null = null;
    let isBlocked = false;

    if (target.method === "fixed") {
      price = target.fixedPrice ?? null;
      console.log(`  OK    ${target.schoolSlug}-${target.state}: $${price} (fixed)`);
    } else {
      console.log(`  ...   ${target.schoolSlug}-${target.state}: ${target.url}`);
      const result = await scrapePriceFromPage(target.url, target.selector, page);
      price = result.price;
      isBlocked = result.blocked;

      if (isBlocked) {
        console.log(`  BLOCK ${target.schoolSlug}-${target.state}`);
        blocked++;
      } else if (!price) {
        console.log(`  FAIL  ${target.schoolSlug}-${target.state}`);
        failed++;
      } else {
        console.log(`  OK    ${target.schoolSlug}-${target.state}: $${price}`);
      }
    }

    // Write to School Pricing DB
    const label = `${target.schoolSlug}-${target.state}`;
    const status = isBlocked ? "Blocked" : !price ? "Failed" : "OK";

    const properties: any = {
      Label: { title: [{ text: { content: label } }] },
      School: { relation: [{ id: schoolPageId }] },
      "State Code": { rich_text: [{ text: { content: target.state } }] },
      "Price Scrape Status": { select: { name: status } },
      "Last Scraped": { date: { start: TODAY } },
      Approved: { checkbox: true },
    };

    if (price !== null) {
      properties.Price = { number: price };
    }
    if (target.notes) {
      properties["Price Note"] = {
        rich_text: [{ text: { content: target.notes } }],
      };
    }

    try {
      const existingId = await findPricingRow(target.schoolSlug, target.state);

      if (existingId) {
        await notion.pages.update({ page_id: existingId, properties });
        updated++;
      } else {
        await notion.pages.create({
          parent: { database_id: PRICING_DB },
          properties,
        });
        created++;
      }
    } catch (err) {
      console.error(`  ERR   ${label}: ${(err as Error).message}`);
    }

    await new Promise((r) => setTimeout(r, target.method === "fixed" ? 350 : 2500));
  }

  await browser.close();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Price Scrape Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Created: ${created} new pricing rows`);
  console.log(`  Updated: ${updated} existing rows`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Blocked: ${blocked}`);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
