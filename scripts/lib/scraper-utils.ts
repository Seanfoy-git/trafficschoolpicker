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
/** Capture without Notion at all (no token): diagnose a scraper anywhere. */
const CAPTURE_OFFLINE = !!CAPTURE && !process.env.NOTION_TOKEN;

/**
 * Directory health (25 Nov 2026). The monthly job's scrape step runs with
 * continue-on-error, so for months a broken scraper left its state's list stale
 * with a green run and no email (Virginia's last write was 1 May; its pager had
 * changed and it read only page 1). Now:
 *  - SHRINK GUARD: a scrape that returns under SHRINK_RATIO of the rows we hold
 *    (when we hold at least MIN_HELD) writes nothing and logs a Critical issue.
 *    The regulator's page probably changed; fix the scraper, or set
 *    DIRECTORY_ALLOW_SHRINK=1 if the list really did shrink.
 *  - DELISTING: after a near-complete scrape (at least DELIST_MIN_SHARE of the
 *    rows we hold), a row the regulator no longer lists is
 *    marked Licence Status = Inactive (the site already hides those); a row that
 *    is listed again goes back to Active. Hand-set rows are never touched.
 *  - SUMMARY: each sync appends one JSON line to DIRECTORY_SCRAPE_SUMMARY (when
 *    set) for scripts/report-directory-health.ts.
 */
const SHRINK_RATIO = 0.5;
const MIN_HELD = 10;
const DELIST_MIN_SHARE = 0.8;
const ALLOW_SHRINK = process.env.DIRECTORY_ALLOW_SHRINK === "1";
const SUMMARY = process.env.DIRECTORY_SCRAPE_SUMMARY;

export type ScrapeStatus = "ok" | "shrunk" | "empty" | "error";

export function recordScrapeResult(r: {
  state: string;
  code: string;
  scraped: number;
  valid: number;
  held: number;
  created: number;
  updated: number;
  delisted?: number;
  relisted?: number;
  status: ScrapeStatus;
  note?: string;
}) {
  if (!SUMMARY) return;
  appendFileSync(SUMMARY, JSON.stringify({ ...r, date: new Date().toISOString().slice(0, 10) }) + "\n");
}

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
  /** Every row id, with its current Licence Status, for the shrink guard and delisting. */
  readonly rows = new Map<string, { status: string }>();
}

/**
 * `sources`: index only rows whose Source is one of these. A scraper that moves a
 * state to a different official list (Texas, 25 Nov 2026: TDLR's driving safety
 * provider file replaced its driver-ed file) matches, counts and delists only rows
 * from its own list, so it never rewrites the old list's rows, whose hand-set
 * prices still feed the comparison.
 */
export async function getExistingSchools(stateName: string, sources?: string[]): Promise<ExistingSchools> {
  const index = new ExistingSchools();
  if (CAPTURE_OFFLINE) return index;
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
      if (sources && !sources.includes(props["Source"]?.select?.name ?? "")) continue;
      index.add(page.id, name, licenseNumber);
      index.rows.set(page.id, { status: props["Licence Status"]?.select?.name ?? "" });
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
  stateCode: string,
  opts: { ownSourceOnly?: boolean } = {}
): Promise<{ created: number; updated: number }> {
  // ownSourceOnly: match, guard and delist against this list's rows only (see getExistingSchools).
  const existing = await getExistingSchools(stateName, opts.ownSourceOnly ? [sourceLabel] : undefined);
  const TODAY = new Date().toISOString().split("T")[0];
  let created = 0, updated = 0;

  // Count what would be written (same junk + duplicate-licence rules as the loop).
  const lics = new Set<string>();
  const valid = scraped.filter((s) => {
    if (junkReason(s.name)) return false;
    const L = rowIdentity(s.name, s.licenseNumber || "").licence.toUpperCase();
    if (L && lics.has(L)) return false;
    if (L) lics.add(L);
    return true;
  }).length;
  const held = existing.rows.size;
  const base = { state: stateName, code: stateCode, scraped: scraped.length, valid, held };
  if (valid === 0) {
    logIssue(`${stateName} scrape found no schools`, "DMV Scraper", "Critical", stateCode, "Nothing written.");
    recordScrapeResult({ ...base, created: 0, updated: 0, status: "empty" });
    return { created, updated };
  }
  if (!CAPTURE && held >= MIN_HELD && valid < held * SHRINK_RATIO && !ALLOW_SHRINK) {
    logIssue(
      `${stateName} list shrank: ${valid} scraped vs ${held} held`,
      "DMV Scraper", "Critical", stateCode,
      "Nothing written. The regulator's page probably changed; fix the scraper, or set DIRECTORY_ALLOW_SHRINK=1 if the list really did shrink.",
    );
    console.error(`  ${stateName}: ${valid} scraped vs ${held} held, under ${SHRINK_RATIO * 100}% — nothing written`);
    recordScrapeResult({ ...base, created: 0, updated: 0, status: "shrunk" });
    return { created, updated };
  }
  const seen = new Set<string>();

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
    if (match) {
      seen.add(match.id);
      // Listed again after being marked Inactive by an earlier sync.
      if (existing.rows.get(match.id)?.status.toLowerCase() === "inactive") properties["Licence Status"] = { select: { name: "Active" } };
    }
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
      appendFileSync(CAPTURE, JSON.stringify({ state: stateName, name: school.name, licence: school.licenseNumber || `${stateCode}-approved`, website: properties.Website?.url ?? "", existing: !!match }) + "\n");
      if (match) updated++;
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

  // Delisting: rows the regulator no longer lists. Only after a near-complete
  // scrape (at least DELIST_MIN_SHARE of what we hold), so a partial scrape of a
  // small list can't mark real schools Inactive; never a hand-set row.
  let delisted = 0;
  const delistOk = valid >= held * DELIST_MIN_SHARE;
  for (const [id, row] of delistOk ? existing.rows : new Map<string, { status: string }>()) {
    if (seen.has(id) || existing.handSet.has(id) || row.status.toLowerCase() === "inactive") continue;
    delisted++;
    if (CAPTURE) continue;
    try {
      await notion.pages.update({ page_id: id, properties: { "Licence Status": { select: { name: "Inactive" } } } as any });
    } catch (err) {
      logIssue(`Failed to mark a delisted ${stateName} row Inactive`, "DMV Scraper", "Warning", stateCode, (err as Error).message);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\n  ${stateName} Sync${CAPTURE ? " (dry run, nothing written)" : ""}: ${scraped.length} scraped, ${created} ${CAPTURE ? "would be created" : "created"}, ${updated} ${CAPTURE ? "would be updated" : "updated"}, ${delisted} ${CAPTURE ? "would be marked" : "marked"} Inactive (no longer listed)`);
  recordScrapeResult({ ...base, created, updated, delisted, status: "ok" });
  return { created, updated };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
