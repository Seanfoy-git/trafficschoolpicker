/**
 * DATA FLOW: DMV → Notion → Site
 *
 * 1. This script fetches the TX TDLR driving safety provider CSV
 * 2. It writes/updates records in the Notion School Directory database
 *    (ID: process.env.NOTION_DIRECTORY_DB)
 * 3. The Next.js site reads from Notion via getDirectoryForState()
 *    in lib/notion.ts on every request (cached for 24hrs via ISR)
 * 4. No JSON files are involved. Notion is the single source of truth.
 * 5. To see changes on the site immediately after scraping:
 *    - Run this script with --deploy flag: npm run scrape:tx -- --deploy
 *    - OR go to trafficschoolpicker.com/admin and click Trigger Redeploy
 *    - OR wait up to 24hrs for ISR to pick up Notion changes automatically
 *
 * Rate limits:
 * - Notion API: 3 requests/second → 350ms delay between writes
 * - TX TDLR: CSV download → single request, no rate limit
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;

const CSV_URL =
  "https://www.tdlr.texas.gov/dbproduction2/vsDriverEduProvider.csv";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n");
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/"/g, ""));

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = values[i] ?? ""));
      return row;
    });
}

function pickField(
  row: Record<string, string>,
  ...candidates: string[]
): string {
  for (const key of candidates) {
    if (row[key]) return row[key];
  }
  return "";
}

async function scrapeTXTDLR(): Promise<Record<string, string>[]> {
  console.log("Fetching TX TDLR CSV...");
  const response = await fetch(CSV_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TrafficSchoolPicker/1.0)",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} fetching CSV`);

  const csv = await response.text();
  console.log(`Downloaded ${(csv.length / 1024).toFixed(0)} KB`);

  if (csv.trimStart().startsWith("<!") || csv.trimStart().startsWith("<html")) {
    throw new Error("Received HTML instead of CSV — endpoint may have changed");
  }

  const all = parseCSV(csv);
  console.log(`Parsed ${all.length} total records`);

  if (all.length > 0) {
    console.log("Columns:", Object.keys(all[0]).join(", "));
  }

  // Filter for driving safety / defensive driving providers
  const schools = all.filter((row) => {
    const type = pickField(
      row,
      "License Type",
      "Type",
      "Category",
      "School Type"
    ).toLowerCase();
    return (
      type.includes("safety") ||
      type.includes("defensive") ||
      type.includes("driving safety") ||
      type === "" // include if no type column (assume all are relevant)
    );
  });

  console.log(`Filtered to ${schools.length} driving safety providers`);
  return schools;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getExistingTXSchools(): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  let cursor: string | undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: DIRECTORY_DB,
      filter: { property: "State", select: { equals: "Texas" } },
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

  console.log(`Found ${existing.size} existing TX schools in Notion`);
  return existing;
}

async function syncTXToNotion(schools: Record<string, string>[]) {
  const existing = await getExistingTXSchools();
  const TODAY = new Date().toISOString().split("T")[0];
  let created = 0,
    updated = 0;

  for (const row of schools) {
    const name = pickField(row, "Name", "Business Name", "BusinessName", "DBA Name");
    const license = pickField(
      row,
      "LicenseNumber",
      "License Number",
      "License",
      "Provider Number"
    );
    const phone = pickField(row, "Phone", "PhoneNumber", "Phone Number");
    const city = pickField(row, "City");
    const address = [
      pickField(row, "Address", "Street"),
      city,
      "TX",
      pickField(row, "Zip", "ZipCode", "Zip Code"),
    ]
      .filter(Boolean)
      .join(", ");

    if (!name || !license) continue;

    const properties: any = {
      "School Name": { title: [{ text: { content: name } }] },
      "License Number": { rich_text: [{ text: { content: license } }] },
      Phone: { rich_text: [{ text: { content: phone || "" } }] },
      "Counties Approved": { rich_text: [{ text: { content: address } }] },
      State: { select: { name: "Texas" } },
      "Online Available": { checkbox: true },
      Source: { select: { name: "TX TDLR" } },
      "Date Scraped": { date: { start: TODAY } },
    };

    const existingId = existing.get(license);

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
  TX TDLR Sync Complete
  ━━━━━━━━━━━━━━━━━━━━━━━━
  Parsed:  ${schools.length} providers from CSV
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
  console.log("Starting TX TDLR scrape...");
  const schools = await scrapeTXTDLR();
  await syncTXToNotion(schools);

  if (process.argv.includes("--deploy")) {
    await triggerDeploy();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
