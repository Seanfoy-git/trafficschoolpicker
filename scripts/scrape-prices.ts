/**
 * DATA FLOW: School pricing pages → Playwright → Notion Traffic Schools DB
 *
 * Visits each school's state-specific pricing page.
 * Extracts the current price from the DOM.
 * Compares to what is stored in Notion.
 * Updates Notion and flags any changes.
 *
 * KNOWN LIMITATIONS:
 *
 * 1. SALE PRICES vs BASE PRICES
 *    We capture the displayed price, which may be a sale price.
 *    iDriveSafely often shows $29 (sale) vs $39 (regular).
 *    We store the sale price because that's what users actually pay.
 *    The Original Price field in Notion holds the base price (manually set).
 *
 * 2. CHECKOUT-ONLY PRICES
 *    Some schools don't show a price until checkout.
 *    These will show status = 'Failed'. Set their prices manually in Notion.
 *
 * 3. BOT DETECTION
 *    Traffic school sites may eventually block our scraper.
 *    Status = 'Blocked' means manual verification needed.
 *
 * 4. PRICE DISPLAY FORMATS
 *    The regex captures the smallest price found on the page.
 *    If a school shows "$19.95 or $24.95 with certificate rush",
 *    we capture $19.95 — the base price. This is correct behaviour.
 *
 * 5. FREQUENCY
 *    Prices change more often than DMV school lists.
 *    Consider running scrape:prices weekly instead of monthly
 *    once the site is live and revenue depends on accurate pricing.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { Client } from "@notionhq/client";
import { priceTargets } from "./config/price-sources";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;

/* eslint-disable @typescript-eslint/no-explicit-any */

interface NotionSchool {
  pageId: string;
  slug: string;
  priceCA: number | null;
  priceTX: number | null;
  priceFL: number | null;
  priceNY: number | null;
}

async function getSchoolsFromNotion(): Promise<NotionSchool[]> {
  if (!SCHOOLS_DB) {
    console.error("NOTION_SCHOOLS_DB not set");
    return [];
  }

  const response = await notion.databases.query({
    database_id: SCHOOLS_DB,
    filter: {
      or: [
        { property: "Tier", select: { equals: "Tier 1 - Fully Reviewed" } },
        { property: "Tier", select: { equals: "Tier 2 - Listed" } },
      ],
    },
  });

  return (response.results as any[]).map((page) => ({
    pageId: page.id,
    slug:
      page.properties["Slug"]?.rich_text?.[0]?.plain_text ??
      (page.properties["School Name"]?.title?.[0]?.plain_text ?? "")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    priceCA: page.properties["Price CA"]?.number ?? null,
    priceTX: page.properties["Price TX"]?.number ?? null,
    priceFL: page.properties["Price FL"]?.number ?? null,
    priceNY: page.properties["Price NY"]?.number ?? null,
  }));
}

function extractPrice(text: string): number | null {
  const regex = /\$\s*(\d{1,3}(?:\.\d{1,2})?)/g;
  const found: number[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    if (value >= 1 && value <= 200) {
      found.push(value);
    }
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
    await browserPage.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await browserPage.waitForTimeout(2000);

    const title = await browserPage.title();
    const bodyText = await browserPage.evaluate(() => document.body.innerText);

    const blockSignals = [
      "access denied",
      "captcha",
      "cloudflare",
      "robot",
      "blocked",
      "verify you are human",
      "403",
      "forbidden",
    ];
    if (
      blockSignals.some(
        (s) =>
          bodyText.toLowerCase().includes(s) || title.toLowerCase().includes(s)
      )
    ) {
      return { price: null, blocked: true };
    }

    let targetText = bodyText;

    if (selector) {
      try {
        const el = await browserPage.$(selector);
        if (el) {
          targetText = await el.innerText();
        }
      } catch {
        // Fall back to full page text
      }
    }

    const price = extractPrice(targetText);
    return { price, blocked: false };
  } catch {
    return { price: null, blocked: false };
  }
}

type SchoolUpdate = {
  priceCA?: number | null;
  priceTX?: number | null;
  priceFL?: number | null;
  priceNY?: number | null;
  hasChanged: boolean;
  blocked: boolean;
  failed: boolean;
  notes: string[];
};

async function main() {
  const schools = await getSchoolsFromNotion();
  if (schools.length === 0) {
    console.log("No Tier 1/2 schools found in Notion. Nothing to scrape.");
    return;
  }

  const schoolMap = new Map(schools.map((s) => [s.slug, s]));

  console.log(
    `Found ${schools.length} Tier 1/2 schools. Processing ${priceTargets.length} price targets...\n`
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  const TODAY = new Date().toISOString().split("T")[0];
  const updatesBySchool = new Map<string, SchoolUpdate>();

  for (const target of priceTargets) {
    const school = schoolMap.get(target.schoolSlug);
    if (!school) {
      // Skip targets for schools not in Notion (not yet Tier 1/2)
      continue;
    }

    const current: SchoolUpdate = updatesBySchool.get(target.schoolSlug) ?? {
      hasChanged: false,
      blocked: false,
      failed: false,
      notes: [],
    };

    if (target.method === "fixed") {
      const key = `price${target.state}` as keyof SchoolUpdate;
      (current as any)[key] = target.fixedPrice;
      current.notes.push(`${target.state}: $${target.fixedPrice} (fixed)`);
      console.log(
        `  OK    ${target.schoolSlug} ${target.state}: $${target.fixedPrice} (fixed)`
      );
      updatesBySchool.set(target.schoolSlug, current);
      continue;
    }

    console.log(`  ...   ${target.schoolSlug} ${target.state}: ${target.url}`);
    const { price, blocked } = await scrapePriceFromPage(
      target.url,
      target.selector,
      page
    );

    if (blocked) {
      current.blocked = true;
      current.notes.push(`${target.state}: Blocked by site`);
      console.log(`  BLOCK ${target.schoolSlug} ${target.state}`);
    } else if (!price) {
      current.failed = true;
      current.notes.push(`${target.state}: Could not extract price`);
      console.log(`  FAIL  ${target.schoolSlug} ${target.state}`);
    } else {
      const key = `price${target.state}` as keyof SchoolUpdate;
      (current as any)[key] = price;

      const existingKey = `price${target.state}` as keyof NotionSchool;
      const existingPrice = school[existingKey] as number | null;

      if (existingPrice && Math.abs(price - existingPrice) > 0.5) {
        current.hasChanged = true;
        const arrow = price < existingPrice ? "↓" : "↑";
        current.notes.push(
          `${target.state}: $${existingPrice} → $${price} ${arrow}`
        );
        console.log(
          `  CHG   ${target.schoolSlug} ${target.state}: $${existingPrice} → $${price} ${arrow}`
        );
      } else {
        current.notes.push(`${target.state}: $${price}`);
        console.log(
          `  OK    ${target.schoolSlug} ${target.state}: $${price}`
        );
      }
    }

    updatesBySchool.set(target.schoolSlug, current);
    await new Promise((r) => setTimeout(r, 2500));
  }

  await browser.close();

  // Write updates to Notion
  console.log("\nUpdating Notion...");
  let changed = 0,
    blockedCount = 0,
    failedCount = 0,
    okCount = 0;

  const entries = Array.from(updatesBySchool.entries());
  for (let i = 0; i < entries.length; i++) {
    const [slug, update] = entries[i];
    const school = schoolMap.get(slug);
    if (!school) continue;

    const properties: any = {};

    if (update.priceCA !== undefined && update.priceCA !== null) {
      properties["Price CA"] = { number: update.priceCA };
      properties["Price"] = { number: update.priceCA };
    }
    if (update.priceTX !== undefined && update.priceTX !== null) {
      properties["Price TX"] = { number: update.priceTX };
    }
    if (update.priceFL !== undefined && update.priceFL !== null) {
      properties["Price FL"] = { number: update.priceFL };
    }
    if (update.priceNY !== undefined && update.priceNY !== null) {
      properties["Price NY"] = { number: update.priceNY };
    }

    if (Object.keys(properties).length > 0) {
      properties["Notes"] = {
        rich_text: [
          {
            text: {
              content: `Price scrape ${TODAY}: ${update.notes.join(" · ")}`,
            },
          },
        ],
      };

      try {
        await notion.pages.update({
          page_id: school.pageId,
          properties,
        });
      } catch (err) {
        console.error(`  Failed to update ${slug}:`, (err as Error).message);
      }
    }

    if (update.hasChanged) changed++;
    else if (update.blocked) blockedCount++;
    else if (update.failed) failedCount++;
    else okCount++;

    await new Promise((r) => setTimeout(r, 350));
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Price Scrape Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  OK:      ${okCount} schools`);
  console.log(`  Changed: ${changed} schools — review before deploying`);
  console.log(`  Blocked: ${blockedCount} schools — check manually`);
  console.log(`  Failed:  ${failedCount} schools — price not found`);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
