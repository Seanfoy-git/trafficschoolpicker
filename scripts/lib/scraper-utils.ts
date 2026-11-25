/**
 * Shared utilities for all state DMV scrapers.
 * Handles the common Notion write pattern so each scraper
 * only needs to define how to extract schools from the page.
 */

import { appendFileSync } from "fs";
import { config } from "dotenv";
import { DirectoryIndex, junkReason, rowIdentity } from "../../lib/directory-filter";
config({ path: ".env.local" });
import { makeNotionClient } from "./notion-client";
import { logIssue } from "./issues";
import { isHandSet } from "./directory-rows";

const notion = makeNotionClient();
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;
/**
 * SCRAPER_DRY_RUN=<file.jsonl>: write nothing to Notion; append each scraped
 * school (state, name, licence, website as it would be written, whether a row
 * exists) to the file. Used by scripts/recheck-directory-websites.ts to see
 * which Notion websites the state's own list supplies.
 */
const CAPTURE = process.env.SCRAPER_DRY_RUN;

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

/**
 * The state's existing Directory rows, indexed by real licence and cleaned name
 * (lib/directory-filter DirectoryIndex), plus the rows whose website a person owns
 * (Website Source = Manual or Enrichment Status = Manual / Skipped), which a sync
 * never overwrites (PR A, 17 Nov 2026).
 */
export class ExistingSchools extends DirectoryIndex {
  readonly handSet = new Set<string>();
}

export async function getExistingSchools(stateName: string): Promise<ExistingSchools> {
  const index = new ExistingSchools();
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
      const name = (props["School Name"]?.title ?? []).map((t: any) => t.plain_text).join("");
      const licenseNumber = (props["License Number"]?.rich_text ?? []).map((t: any) => t.plain_text).join("");
      if (!name) continue;
      index.add(page.id, name, licenseNumber);
      if (isHandSet({ websiteSource: props["Website Source"]?.select?.name ?? "", enrichmentStatus: props["Enrichment Status"]?.select?.name ?? "" }))
        index.handSet.add(page.id);
    }
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return index;
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
    // Match and write on the cleaned name and the real licence, never the raw scraped name.
    const id = rowIdentity(school.name, school.licenseNumber || "");
    const lic = id.licence.toUpperCase();
    if (lic) {
      if (seenLicense.has(lic)) {
        console.log(`  skip (duplicate license ${lic}): ${JSON.stringify(school.name)}`);
        continue;
      }
      seenLicense.add(lic);
    }

    const properties: any = {
      "School Name": { title: [{ text: { content: id.name } }] },
      // No licence scraped: leave the field empty, never a "{STATE}-approved" placeholder (P0 follow-up).
      "License Number": { rich_text: id.licence ? [{ text: { content: id.licence } }] : [] },
      Phone: { rich_text: [{ text: { content: school.phone } }] },
      Address: { rich_text: [{ text: { content: school.address } }] },
      State: { select: { name: stateName } },
      "Online Available": { checkbox: school.onlineAvailable },
      Source: { select: { name: sourceLabel } },
      "Date Scraped": { date: { start: TODAY } },
    };
    const match = existing.match(school.name, school.licenseNumber || "");
    // The regulator's own list gave a website: record where it came from. A website a
    // person set (Website Source = Manual) is never replaced.
    if (school.website && !(match && existing.handSet.has(match.id))) {
      const url = school.website.startsWith("http") ? school.website : `https://${school.website}`;
      try {
        new URL(url);
        properties.Website = { url };
        properties["Website Source"] = { select: { name: "State DMV" } };
      } catch { /* invalid URL, skip */ }
    }
    // Notes only on a new row: an update must not erase what Notes holds (17 Nov 2026).
    if (school.notes && !match) {
      properties.Notes = { rich_text: [{ text: { content: school.notes } }] };
    }

    if (CAPTURE) {
      appendFileSync(CAPTURE, JSON.stringify({ state: stateName, name: school.name, licence: school.licenseNumber || `${stateCode}-approved`, website: properties.Website?.url ?? "", existing: !!prior }) + "\n");
      if (prior) updated++;
      else created++;
      continue;
    }

    try {
      if (match) {
        await notion.pages.update({ page_id: match.id, properties });
        updated++;
      } else {
        const page = await notion.pages.create({ parent: { database_id: DIRECTORY_DB }, properties });
        existing.add(page.id, id.name, id.licence); // a second scrape of the same school in this run updates, not creates
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

  console.log(`\n  ${stateName} Sync${CAPTURE ? " (dry run, nothing written)" : ""}: ${scraped.length} scraped, ${created} ${CAPTURE ? "would be created" : "created"}, ${updated} ${CAPTURE ? "would be updated" : "updated"}`);
  return { created, updated };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
