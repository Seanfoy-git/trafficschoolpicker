/**
 * Shared utilities for all state DMV scrapers.
 * Handles the common Notion write pattern so each scraper
 * only needs to define how to extract schools from the page.
 */

import { config } from "dotenv";
import { DirectoryIndex, junkReason, rowIdentity } from "../../lib/directory-filter";
config({ path: ".env.local" });
import { makeNotionClient } from "./notion-client";
import { logIssue } from "./issues";

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

/** The state's existing Directory rows, indexed by real licence and cleaned name (lib/directory-filter DirectoryIndex). */
export async function getExistingSchools(stateName: string): Promise<DirectoryIndex> {
  const rows: { id: string; name: string; licenseNumber: string }[] = [];
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
      if (name) rows.push({ id: page.id, name, licenseNumber });
    }
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return new DirectoryIndex(rows);
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
    if (school.website) {
      const url = school.website.startsWith("http") ? school.website : `https://${school.website}`;
      try { new URL(url); properties.Website = { url }; } catch { /* invalid URL, skip */ }
    }
    if (school.notes) {
      properties.Notes = { rich_text: [{ text: { content: school.notes } }] };
    }

    try {
      const match = existing.match(school.name, school.licenseNumber || "");
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

  console.log(`\n  ${stateName} Sync: ${scraped.length} scraped, ${created} created, ${updated} updated`);
  return { created, updated };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
