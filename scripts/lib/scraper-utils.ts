/**
 * Shared utilities for all state DMV scrapers.
 * Handles the common Notion write pattern so each scraper
 * only needs to define how to extract schools from the page.
 */

import { config } from "dotenv";
import { junkReason } from "../../lib/directory-filter";
config({ path: ".env.local" });
import { makeNotionClient } from "./notion-client";
import { logIssue } from "./issues";
import { isHandSet } from "./directory-rows";

const notion = makeNotionClient();
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ScrapedSchool {
  name: string;
  licenseNumber: string;
  phone: string;
  address: string;
  website: string;
  onlineAvailable: boolean;
  notes: string;
}

export interface ExistingRow {
  id: string;
  /** Website Source = Manual or Enrichment Status = Manual / Skipped: a person owns its website. */
  handSet: boolean;
}

export async function getExistingSchools(
  stateName: string
): Promise<Map<string, ExistingRow>> {
  const existing = new Map<string, ExistingRow>();
  let cursor: string | undefined;
  do {
    const response: any = await notion.databases.query({
      database_id: DIRECTORY_DB,
      filter: { property: "State", select: { equals: stateName } },
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of response.results) {
      const props = (page as any).properties;
      const name = props["School Name"]?.title?.[0]?.plain_text?.toLowerCase();
      if (name) existing.set(name, { id: page.id, handSet: isHandSet({ websiteSource: props["Website Source"]?.select?.name ?? "", enrichmentStatus: props["Enrichment Status"]?.select?.name ?? "" }) });
    }
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return existing;
}

export async function syncToNotion(
  scraped: ScrapedSchool[],
  stateName: string,
  sourceLabel: string,
  stateCode: string
): Promise<{ created: number; updated: number }> {
  const existing = await getExistingSchools(stateName);
  const TODAY = new Date().toISOString().split("T")[0];
  let created = 0, updated = 0;

  // Same validation the site renders through (lib/directory-filter, P0 30 Oct 2026):
  // never write a URL, UI label, agency name or empty card as a school, and only
  // one row per license number.
  const seenLicense = new Set<string>();
  for (const school of scraped) {
    const junk = junkReason(school.name);
    if (junk) {
      console.log(`  skip (${junk}): ${JSON.stringify(school.name)}`);
      continue;
    }
    const lic = (school.licenseNumber || "").trim().toUpperCase();
    if (lic && !/^[A-Z]{2}-(APPROVED|[A-Z]{2,5})$/.test(lic)) {
      if (seenLicense.has(lic)) {
        console.log(`  skip (duplicate license ${lic}): ${JSON.stringify(school.name)}`);
        continue;
      }
      seenLicense.add(lic);
    }

    const properties: any = {
      "School Name": { title: [{ text: { content: school.name } }] },
      "License Number": { rich_text: [{ text: { content: school.licenseNumber || `${stateCode}-approved` } }] },
      Phone: { rich_text: [{ text: { content: school.phone } }] },
      Address: { rich_text: [{ text: { content: school.address } }] },
      State: { select: { name: stateName } },
      "Online Available": { checkbox: school.onlineAvailable },
      Source: { select: { name: sourceLabel } },
      "Date Scraped": { date: { start: TODAY } },
    };
    const prior = existing.get(school.name.toLowerCase());
    // The regulator's own list gave a website: record where it came from. A website a
    // person set (Website Source = Manual) is never replaced.
    if (school.website && !prior?.handSet) {
      const url = school.website.startsWith("http") ? school.website : `https://${school.website}`;
      try {
        new URL(url);
        properties.Website = { url };
        properties["Website Source"] = { select: { name: "State DMV" } };
      } catch { /* invalid URL, skip */ }
    }
    // Notes only on a new row: an update must not erase what Notes holds (17 Nov 2026).
    if (school.notes && !prior) {
      properties.Notes = { rich_text: [{ text: { content: school.notes } }] };
    }

    try {
      if (prior) {
        await notion.pages.update({ page_id: prior.id, properties });
        updated++;
      } else {
        await notion.pages.create({ parent: { database_id: DIRECTORY_DB }, properties });
        created++;
      }
    } catch (err) {
      logIssue(
        `Failed to write ${school.name} to Notion`,
        "DMV Scraper", "Warning", stateCode,
        (err as Error).message
      );
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\n  ${stateName} Sync: ${scraped.length} scraped, ${created} created, ${updated} updated`);
  return { created, updated };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
