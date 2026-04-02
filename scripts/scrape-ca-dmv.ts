/**
 * DATA FLOW: DMV → Notion → Site
 *
 * 1. This script scrapes the official CA DMV source via Playwright
 * 2. It writes/updates records in the Notion School Directory database
 *    (ID: process.env.NOTION_DIRECTORY_DB)
 * 3. The Next.js site reads from Notion via getDirectoryForState()
 *    in lib/notion.ts on every request (cached for 24hrs via ISR)
 * 4. No JSON files are involved. Notion is the single source of truth.
 * 5. To see changes on the site immediately after scraping:
 *    - Run this script with --deploy flag: npm run scrape:ca -- --deploy
 *    - OR go to trafficschoolpicker.com/admin and click Trigger Redeploy
 *    - OR wait up to 24hrs for ISR to pick up Notion changes automatically
 *
 * Rate limits:
 * - Notion API: 3 requests/second → 350ms delay between writes
 * - CA DMV: no documented limit → Playwright adds natural delays
 */

import { chromium } from "playwright";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;

interface ScrapedSchool {
  name: string;
  license: string;
  address: string;
  phone: string;
  status: string;
}

async function scrapeCADMV(): Promise<ScrapedSchool[]> {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://drive.dmvonline.ca.gov/s/oll-traffic-schools");
  await page.waitForLoadState("networkidle");

  // Select Internet type
  console.log("Selecting Internet type and searching...");
  await page.click('[aria-label="Type of Instruction"]');
  await page.click("text=Internet");
  await page.click("text=Search");

  // Wait for results
  await page.waitForSelector("text=Total Number of Records Found", {
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  // Extract from DOM text
  const rawText = await page.evaluate(() => document.body.innerText);

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const licensePattern = /^E\d{4}$/;
  const schools: ScrapedSchool[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (licensePattern.test(lines[i])) {
      schools.push({
        name: lines[i - 1] ?? "",
        license: lines[i],
        address: lines[i + 1] ?? "",
        phone: lines[i + 2] ?? "",
        status: lines[i + 3] ?? "Active",
      });
    }
  }

  await browser.close();
  console.log(`Scraped ${schools.length} CA schools from DMV`);
  return schools;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getExistingNotionSchools(): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  let cursor: string | undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: DIRECTORY_DB,
      filter: { property: "State", select: { equals: "California" } },
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      const props = (page as any).properties;
      const license =
        props["License Number"]?.rich_text?.[0]?.plain_text;
      if (license) existing.set(license, page.id);
    }

    cursor = response.has_more
      ? response.next_cursor ?? undefined
      : undefined;
  } while (cursor);

  console.log(`Found ${existing.size} existing CA schools in Notion`);
  return existing;
}

async function syncToNotion(scraped: ScrapedSchool[]) {
  const existing = await getExistingNotionSchools();
  const scrapedLicenses = new Set(scraped.map((s) => s.license));

  let created = 0,
    updated = 0,
    deactivated = 0;
  const TODAY = new Date().toISOString().split("T")[0];

  for (const school of scraped) {
    const existingId = existing.get(school.license);

    const properties: any = {
      "School Name": { title: [{ text: { content: school.name } }] },
      "License Number": {
        rich_text: [{ text: { content: school.license } }],
      },
      Phone: { phone_number: school.phone || null },
      Address: { rich_text: [{ text: { content: school.address } }] },
      State: { select: { name: "California" } },
      "Online Available": { checkbox: true },
      Source: { select: { name: "CA DMV" } },
      "Date Scraped": { date: { start: TODAY } },
      Notes: {
        rich_text: [{ text: { content: `Status: ${school.status}` } }],
      },
    };

    if (existingId) {
      await notion.pages.update({
        page_id: existingId,
        properties,
      });
      updated++;
    } else {
      await notion.pages.create({
        parent: { database_id: DIRECTORY_DB },
        properties,
      });
      created++;
    }

    // Respect Notion rate limits (3 req/sec)
    await new Promise((r) => setTimeout(r, 350));
  }

  // Deactivate schools no longer in DMV list
  const existingEntries = Array.from(existing.entries());
  for (let idx = 0; idx < existingEntries.length; idx++) {
    const [license, pageId] = existingEntries[idx];
    if (!scrapedLicenses.has(license)) {
      await notion.pages.update({
        page_id: pageId,
        properties: {
          Notes: {
            rich_text: [
              {
                text: {
                  content: `Status: Inactive - not in DMV list as of ${TODAY}`,
                },
              },
            ],
          },
        } as any,
      });
      deactivated++;
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━
  CA DMV Sync Complete
  ━━━━━━━━━━━━━━━━━━━━━━━━
  Scraped:     ${scraped.length} schools from DMV
  Created:     ${created} new Notion records
  Updated:     ${updated} existing records
  Deactivated: ${deactivated} schools (no longer in DMV list)
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
  console.log("Starting CA DMV scrape...");
  const scraped = await scrapeCADMV();
  await syncToNotion(scraped);

  if (process.argv.includes("--deploy")) {
    await triggerDeploy();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
