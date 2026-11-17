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

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { makeNotionClient } from "./lib/notion-client";
import { directorySchema, PROP, type LicenceStatus } from "./lib/directory-rows";

const notion = makeNotionClient();
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;
// --dry-run: scrape and report what would be written, without writing (a sync replay).
const DRY_RUN = process.argv.includes("--dry-run");
/**
 * A school missing from the scrape is marked Inactive only when the scrape looks
 * whole: at least this share of the CA rows already in Notion. A DMV page that
 * half-loads must not hide the whole California directory.
 */
const MIN_SCRAPE_SHARE = 0.8;

/**
 * The DMV list's status column → Licence Status. "Probation" schools are still
 * licensed and still shown; only Inactive is hidden on the site. Anything else
 * is not a status we know, so Licence Status is left as it is.
 */
export function licenceStatus(raw: string): LicenceStatus | null {
  const s = raw.trim().toLowerCase();
  if (s === "active") return "Active";
  if (s === "probation") return "Probation";
  if (s === "inactive" || s.startsWith("inactive")) return "Inactive";
  return null;
}

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

  await page.goto("https://drive.dmvonline.ca.gov/s/oll-traffic-schools", {
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Open the "Type of Instruction" Lightning combobox and pick "Internet"
  console.log("Selecting Internet type and searching...");
  await page.click('button[aria-label="Type of Instruction"]');
  await page.waitForTimeout(500);
  await page.click('[data-value="Internet"]');
  await page.waitForTimeout(500);

  // Click the Search button
  await page.click('button:has-text("Search")');

  // Wait for results to appear (the table renders with "Total Number of Records Found")
  await page.waitForFunction(
    () => document.body.innerText.includes("Total Number of Records Found"),
    { timeout: 30000 }
  );
  await page.waitForTimeout(2000);

  // Extract from DOM text
  const rawText = await page.evaluate(() => document.body.innerText);

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const licensePattern = /^E\d{4}$/;
  const schools: ScrapedSchool[] = [];

  // Results are formatted as:
  //   Show Details
  //   SCHOOL NAME
  //   E####            ← license number
  //   ADDRESS
  //   PHONE
  //   Active/Inactive
  for (let i = 0; i < lines.length; i++) {
    if (licensePattern.test(lines[i])) {
      // Name is the line before the license (skip "Show Details" if present)
      let name = lines[i - 1] ?? "";
      if (name === "Show Details" && i >= 2) {
        name = lines[i - 2] ?? "";
      }
      schools.push({
        name,
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
  const existing = new Map<string, string>(); // licence → page id
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
  // Licence Status is written only once the property exists (scripts/migrate-directory-schema.ts).
  const schema = await directorySchema(notion);
  // A dry run shows what would be written once the property exists.
  const hasStatus = schema[PROP.licenceStatus]?.type === "select" || DRY_RUN;
  if (schema[PROP.licenceStatus]?.type !== "select") console.warn(`::warning::School Directory has no "${PROP.licenceStatus}" select; licence status not written. Run scripts/migrate-directory-schema.ts.`);

  let created = 0,
    updated = 0,
    deactivated = 0;
  const TODAY = new Date().toISOString().split("T")[0];
  const statusCounts: Record<string, number> = {};

  // DMV fields only. Notes, Website, Google Place ID, Website Source and Enrichment
  // Status are never written here (17 Nov 2026): a sync used to overwrite Notes with
  // "Status: X" and erase the Places provenance kept there.
  for (const school of scraped) {
    const existingId = existing.get(school.license);
    const status = licenceStatus(school.status);
    statusCounts[status ?? `unknown (${school.status})`] = (statusCounts[status ?? `unknown (${school.status})`] ?? 0) + 1;

    const properties: any = {
      "School Name": { title: [{ text: { content: school.name } }] },
      "License Number": {
        rich_text: [{ text: { content: school.license } }],
      },
      Phone: { rich_text: [{ text: { content: school.phone || "" } }] },
      "Address": {
        rich_text: [{ text: { content: school.address } }],
      },
      State: { select: { name: "California" } },
      "Online Available": { checkbox: true },
      Source: { select: { name: "CA DMV" } },
      "Date Scraped": { date: { start: TODAY } },
    };
    if (status && hasStatus) properties[PROP.licenceStatus] = { select: { name: status } };

    if (existingId) {
      if (!DRY_RUN) await notion.pages.update({ page_id: existingId, properties });
      updated++;
    } else {
      if (!DRY_RUN) await notion.pages.create({ parent: { database_id: DIRECTORY_DB }, properties });
      created++;
    }
    if (DRY_RUN && created + updated === 1) console.log(`  [dry run] properties written per row: ${Object.keys(properties).join(", ")}`);

    // Respect Notion rate limits (3 req/sec)
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 350));
  }

  // Schools no longer in the DMV list: Licence Status = Inactive (hidden on the site).
  const gone = Array.from(existing.entries()).filter(([license]) => !scrapedLicenses.has(license));
  const whole = scraped.length >= MIN_SCRAPE_SHARE * existing.size;
  if (gone.length && !whole) {
    console.warn(`::warning::CA scrape returned ${scraped.length} schools vs ${existing.size} in Notion (< ${MIN_SCRAPE_SHARE * 100}%); not marking ${gone.length} missing schools Inactive.`);
  } else if (gone.length && hasStatus) {
    for (const [license, pageId] of gone) {
      if (!DRY_RUN) {
        await notion.pages.update({ page_id: pageId, properties: { [PROP.licenceStatus]: { select: { name: "Inactive" } } } as any });
        await new Promise((r) => setTimeout(r, 350));
      }
      console.log(`  ${DRY_RUN ? "[dry run] would mark" : "marked"} Inactive (not in DMV list): ${license}`);
      deactivated++;
    }
  }

  console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━
  CA DMV Sync ${DRY_RUN ? "DRY RUN (nothing written)" : "Complete"}
  ━━━━━━━━━━━━━━━━━━━━━━━━
  Scraped:     ${scraped.length} schools from DMV
  Created:     ${created} new Notion records
  Updated:     ${updated} existing records
  Deactivated: ${deactivated} schools (no longer in DMV list)
  Statuses:    ${Object.entries(statusCounts).map(([k, v]) => `${k} ${v}`).join(", ")}
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

  if (process.argv.includes("--deploy") && !DRY_RUN) {
    await triggerDeploy();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
