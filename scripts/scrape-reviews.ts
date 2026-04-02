/**
 * DATA FLOW: Trustpilot → Notion → Site
 *
 * JOB 2: Scrapes Trustpilot ratings for Tier 1/2 curated schools.
 * Only touches the 6-8 schools in the Traffic Schools DB that have
 * a Review URL set. Updates Rating, Review Count, and flags changes.
 *
 * Rate limits:
 * - Notion API: 3 requests/second → 350ms delay between writes
 * - Trustpilot: no documented API limit → 2s delay between pages
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ReviewData {
  rating: number;
  reviewCount: number;
  source: "Trustpilot";
}

async function scrapeTrustpilot(
  domain: string,
  page: import("playwright").Page
): Promise<ReviewData | null> {
  try {
    const url = `https://www.trustpilot.com/review/${domain}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    const text = await page.evaluate(() => document.body.innerText);
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Pattern: "Reviews 26,916  •  4.8"
    for (let i = 0; i < lines.length; i++) {
      const reviewMatch = lines[i].match(/Reviews\s+([\d,]+)/);
      if (reviewMatch) {
        const reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""));
        const ratingMatch =
          lines[i].match(/(\d\.\d)/) ||
          (lines[i + 1] && lines[i + 1].match(/(\d\.\d)/));
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

        if (reviewCount > 0 && rating) {
          return { rating, reviewCount, source: "Trustpilot" };
        }
      }
    }

    console.warn(`  Could not parse reviews from Trustpilot for ${domain}`);
    return null;
  } catch (err) {
    console.error(`  Failed to scrape ${domain}:`, (err as Error).message);
    return null;
  }
}

interface NotionSchool {
  pageId: string;
  name: string;
  reviewUrl: string;
  currentRating: number | null;
  currentReviewCount: number | null;
}

async function getSchoolsFromNotion(): Promise<NotionSchool[]> {
  if (!SCHOOLS_DB) {
    console.error("NOTION_SCHOOLS_DB not set");
    return [];
  }

  const response = await notion.databases.query({
    database_id: SCHOOLS_DB,
    filter: {
      and: [
        { property: "Status", select: { equals: "Active" } },
        { property: "Review URL", url: { is_not_empty: true } },
      ],
    },
  });

  return (response.results as any[]).map((page) => ({
    pageId: page.id,
    name: page.properties["School Name"].title[0]?.plain_text ?? "",
    reviewUrl: page.properties["Review URL"].url ?? "",
    currentRating: page.properties["Rating"]?.number ?? null,
    currentReviewCount: page.properties["Review Count"]?.number ?? null,
  }));
}

function extractDomain(reviewUrl: string): string | null {
  const match = reviewUrl.match(/trustpilot\.com\/review\/(.+)/);
  return match ? match[1].replace(/\/$/, "") : null;
}

async function main() {
  const schools = await getSchoolsFromNotion();
  if (schools.length === 0) {
    console.log("No schools with Review URL found in Notion. Nothing to scrape.");
    return;
  }

  console.log(`Scraping reviews for ${schools.length} schools...\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const TODAY = new Date().toISOString().split("T")[0];

  const results: {
    name: string;
    oldRating: number | null;
    oldCount: number | null;
    scraped: ReviewData | null;
    changed: boolean;
  }[] = [];

  for (const school of schools) {
    if (!school.reviewUrl.includes("trustpilot.com")) {
      console.log(`  ${school.name}: skipping (not Trustpilot)`);
      continue;
    }

    const domain = extractDomain(school.reviewUrl);
    if (!domain) {
      console.warn(`  ${school.name}: could not extract domain from ${school.reviewUrl}`);
      continue;
    }

    console.log(`  ${school.name} (${domain})...`);
    const scraped = await scrapeTrustpilot(domain, page);

    if (!scraped) {
      results.push({
        name: school.name,
        oldRating: school.currentRating,
        oldCount: school.currentReviewCount,
        scraped: null,
        changed: false,
      });
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    const ratingChanged = scraped.rating !== school.currentRating;
    const countChanged = scraped.reviewCount !== school.currentReviewCount;
    const hasChanged = ratingChanged || countChanged;

    // Build update properties — only include fields that exist in the DB
    const updateProps: any = {
      Rating: { number: scraped.rating },
      "Review Count": { number: scraped.reviewCount },
    };

    // Try to set Last Verified date
    try {
      updateProps["Last Verified"] = { date: { start: TODAY } };
    } catch {
      // Field may not exist
    }

    await notion.pages.update({
      page_id: school.pageId,
      properties: updateProps,
    });

    results.push({
      name: school.name,
      oldRating: school.currentRating,
      oldCount: school.currentReviewCount,
      scraped,
      changed: hasChanged,
    });

    // Polite delay between Trustpilot requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  await browser.close();

  // Print summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Review Scrape Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (const r of results) {
    if (!r.scraped) {
      console.log(`  FAILED  ${r.name}`);
      continue;
    }
    const flag = r.changed ? "  CHANGED" : "  OK     ";
    console.log(`  ${flag} ${r.name}`);
    console.log(`          Rating: ${r.oldRating ?? "n/a"} -> ${r.scraped.rating}`);
    console.log(
      `          Reviews: ${r.oldCount?.toLocaleString() ?? "n/a"} -> ${r.scraped.reviewCount.toLocaleString()}`
    );
  }

  const changed = results.filter((r) => r.changed);
  if (changed.length > 0) {
    console.log(
      `\n  ${changed.length} school(s) changed — review in Notion before deploying`
    );
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
