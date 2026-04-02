/**
 * DATA FLOW: DMV → Notion → Site
 *
 * 1. This script scrapes Florida DHSMV traffic school providers via Playwright
 * 2. It writes/updates records in the Notion School Directory database
 *    (ID: process.env.NOTION_DIRECTORY_DB)
 * 3. The Next.js site reads from Notion via getDirectoryForState()
 *    in lib/notion.ts on every request (cached for 24hrs via ISR)
 * 4. No JSON files are involved. Notion is the single source of truth.
 * 5. To see changes on the site immediately after scraping:
 *    - Run this script with --deploy flag: npm run scrape:fl -- --deploy
 *    - OR go to trafficschoolpicker.com/admin and click Trigger Redeploy
 *    - OR wait up to 24hrs for ISR to pick up Notion changes automatically
 *
 * Rate limits:
 * - Notion API: 3 requests/second → 350ms delay between writes
 * - FL DHSMV: no documented limit → Playwright adds natural delays
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;

// FL DHSMV school lookup page
const DHSMV_URL =
  "https://www.flhsmv.gov/driver-licenses-id-cards/education-courses/traffic-law-substance-abuse-education/course-provider-search/";

interface ScrapedSchool {
  name: string;
  license: string;
  phone: string;
  website: string;
  courseType: string;
}

async function scrapeFLDHSMV(): Promise<ScrapedSchool[]> {
  console.log("Launching browser for FL DHSMV...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(DHSMV_URL, { waitUntil: "networkidle", timeout: 30000 });

  // FL DHSMV has a search form — try to find and interact with it
  // The page structure varies, so we try multiple approaches
  const schools: ScrapedSchool[] = [];

  try {
    // Look for BDI (Basic Driver Improvement) online providers
    // The FL DHSMV page typically lists providers in a table or list format
    // Try to select "Online" or "Internet" course type if available
    const selects = await page.$$("select");
    for (const select of selects) {
      const options = await select.$$("option");
      for (const option of options) {
        const text = await option.textContent();
        if (text && (text.includes("Online") || text.includes("Internet") || text.includes("BDI"))) {
          await select.selectOption({ label: text.trim() });
          break;
        }
      }
    }

    // Look for a search/submit button
    const searchBtn = await page.$(
      'button[type="submit"], input[type="submit"], button:has-text("Search"), button:has-text("Find")'
    );
    if (searchBtn) {
      await searchBtn.click();
      await page.waitForTimeout(3000);
    }

    // Extract data from whatever table/list is rendered
    const rawText = await page.evaluate(() => document.body.innerText);
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // FL providers often have license numbers like "FL-XXXXX" or just numbers
    // Parse line by line looking for provider patterns
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.\w{2,}/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for lines that look like school names (capitalized, not too short, not a header)
      if (
        line.length > 5 &&
        line.length < 100 &&
        !line.includes("Search") &&
        !line.includes("Filter") &&
        !line.includes("Page") &&
        !line.includes("Copyright")
      ) {
        const nextLines = lines.slice(i + 1, i + 5).join(" ");
        const phoneMatch = nextLines.match(phonePattern);
        const urlMatch = nextLines.match(urlPattern);

        // Only add if we found a phone number nearby (indicates it's a provider listing)
        if (phoneMatch) {
          schools.push({
            name: line,
            license: "", // FL may not show license in DOM
            phone: phoneMatch[0],
            website: urlMatch ? urlMatch[0] : "",
            courseType: "BDI",
          });
          i += 3; // Skip lines we already parsed
        }
      }
    }
  } catch (err) {
    console.warn(
      `Warning: FL DHSMV page structure may have changed: ${(err as Error).message}`
    );
    console.warn(
      "The scraper will continue but may have captured incomplete data."
    );
  }

  await browser.close();
  console.log(`Scraped ${schools.length} FL schools from DHSMV`);
  return schools;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getExistingFLSchools(): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  let cursor: string | undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: DIRECTORY_DB,
      filter: { property: "State", select: { equals: "Florida" } },
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      const props = (page as any).properties;
      const name = props["School Name"]?.title?.[0]?.plain_text;
      if (name) existing.set(name, page.id);
    }

    cursor = response.has_more
      ? response.next_cursor ?? undefined
      : undefined;
  } while (cursor);

  console.log(`Found ${existing.size} existing FL schools in Notion`);
  return existing;
}

async function syncFLToNotion(scraped: ScrapedSchool[]) {
  const existing = await getExistingFLSchools();
  const TODAY = new Date().toISOString().split("T")[0];
  let created = 0,
    updated = 0;

  for (const school of scraped) {
    if (!school.name) continue;

    const properties: any = {
      "School Name": { title: [{ text: { content: school.name } }] },
      "License Number": {
        rich_text: [{ text: { content: school.license || "N/A" } }],
      },
      Phone: { rich_text: [{ text: { content: school.phone || "" } }] },
      State: { select: { name: "Florida" } },
      "Online Available": { checkbox: true },
      Source: { select: { name: "FL DHSMV" } },
      "Date Scraped": { date: { start: TODAY } },
      Notes: {
        rich_text: [
          { text: { content: `Course type: ${school.courseType}` } },
        ],
      },
    };

    if (school.website) {
      properties["Website"] = {
        url: school.website.startsWith("http")
          ? school.website
          : `https://${school.website}`,
      };
    }

    const existingId = existing.get(school.name);

    if (existingId) {
      await notion.pages.update({ page_id: existingId, properties });
      updated++;
    } else {
      await notion.pages.create({
        parent: { database_id: DIRECTORY_DB },
        properties,
      });
      created++;
    }

    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━
  FL DHSMV Sync Complete
  ━━━━━━━━━━━━━━━━━━━━━━━━
  Scraped: ${scraped.length} schools from DHSMV
  Created: ${created} new Notion records
  Updated: ${updated} existing records
  ━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

async function triggerDeploy() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK;
  if (!hookUrl) {
    console.log("No deploy hook configured — skipping redeploy");
    return;
  }
  await fetch(hookUrl, { method: "POST" });
  console.log("Vercel redeploy triggered");
}

async function main() {
  console.log("Starting FL DHSMV scrape...");
  const scraped = await scrapeFLDHSMV();
  await syncFLToNotion(scraped);

  if (process.argv.includes("--deploy")) {
    await triggerDeploy();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
