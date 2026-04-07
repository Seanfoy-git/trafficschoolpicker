/**
 * Shared utilities for all state DMV scrapers.
 * Handles the common Notion write pattern so each scraper
 * only needs to define how to extract schools from the page.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { Client } from "@notionhq/client";
import { logIssue } from "./issues";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
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

export async function getExistingSchools(
  stateName: string
): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const response: any = await notion.databases.query({
      database_id: DIRECTORY_DB,
      filter: { property: "State", select: { equals: stateName } },
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of response.results) {
      const name = (page as any).properties["School Name"]?.title?.[0]?.plain_text?.toLowerCase();
      if (name) existing.set(name, page.id);
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

  for (const school of scraped) {
    if (!school.name || school.name.length < 2) continue;

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
    if (school.website) {
      const url = school.website.startsWith("http") ? school.website : `https://${school.website}`;
      try { new URL(url); properties.Website = { url }; } catch { /* invalid URL, skip */ }
    }
    if (school.notes) {
      properties.Notes = { rich_text: [{ text: { content: school.notes } }] };
    }

    try {
      const existingId = existing.get(school.name.toLowerCase());
      if (existingId) {
        await notion.pages.update({ page_id: existingId, properties });
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
