/**
 * School Directory rows as the enrichment, re-check, guard and schema scripts
 * see them: one full scan (25 queries for ~2,500 rows), plain strings.
 *
 * Provenance lives in its own properties (17 Nov 2026), never in Notes:
 *   Google Place ID   the Places listing the Website came from
 *   Website Source    Google Places | State DMV | Manual | Unknown
 *   Enrichment Status Pending | Enriched | Not Found | Manual | Skipped
 *   Enriched At       date of the last Places lookup
 *   Licence Status    Active | Probation | Inactive (from the regulator's list)
 */
import { makeNotionClient } from "./notion-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PROP = {
  placeId: "Google Place ID",
  websiteSource: "Website Source",
  enrichmentStatus: "Enrichment Status",
  enrichedAt: "Enriched At",
  licenceStatus: "Licence Status",
} as const;

export const LICENCE_STATUSES = ["Active", "Probation", "Inactive"] as const;
export type LicenceStatus = (typeof LICENCE_STATUSES)[number];

export interface DirRow {
  id: string;
  name: string;
  state: string;
  licence: string;
  address: string;
  website: string;
  onlineAvailable: boolean;
  notes: string;
  placeId: string;
  websiteSource: string;
  enrichmentStatus: string;
  enrichedAt: string;
  licenceStatus: string;
}

const text = (p: any): string =>
  !p ? "" :
  p.type === "title" ? p.title.map((r: any) => r.plain_text).join("") :
  p.type === "rich_text" ? p.rich_text.map((r: any) => r.plain_text).join("") :
  p.type === "select" ? p.select?.name ?? "" :
  p.type === "url" ? p.url ?? "" :
  p.type === "date" ? p.date?.start ?? "" :
  p.type === "checkbox" ? String(p.checkbox) : "";

export function toRow(page: any): DirRow {
  const p = page.properties;
  return {
    id: page.id,
    name: text(p["School Name"]),
    state: text(p["State"]),
    licence: text(p["License Number"]),
    address: text(p["Address"]),
    website: text(p["Website"]),
    onlineAvailable: p["Online Available"]?.checkbox === true,
    notes: text(p["Notes"]),
    placeId: text(p[PROP.placeId]).trim(),
    websiteSource: text(p[PROP.websiteSource]),
    enrichmentStatus: text(p[PROP.enrichmentStatus]),
    enrichedAt: text(p[PROP.enrichedAt]),
    licenceStatus: text(p[PROP.licenceStatus]),
  };
}

export async function loadDirectory(notion = makeNotionClient()): Promise<DirRow[]> {
  const db = process.env.NOTION_DIRECTORY_DB;
  if (!db) throw new Error("NOTION_DIRECTORY_DB not set in environment");
  const rows: DirRow[] = [];
  let cursor: string | undefined;
  do {
    const r: any = await notion.databases.query({ database_id: db, start_cursor: cursor, page_size: 100 });
    rows.push(...r.results.map(toRow));
    cursor = r.has_more ? r.next_cursor ?? undefined : undefined;
  } while (cursor);
  return rows;
}

/** Directory property names → type, for scripts that must fail closed when the schema lacks a property they write. */
export async function directorySchema(notion = makeNotionClient()): Promise<Record<string, { type: string; options: string[] }>> {
  const db: any = await notion.databases.retrieve({ database_id: process.env.NOTION_DIRECTORY_DB! });
  const out: Record<string, { type: string; options: string[] }> = {};
  for (const [name, v] of Object.entries<any>(db.properties)) {
    out[name] = { type: v.type, options: v.type === "select" ? v.select.options.map((o: any) => o.name) : [] };
  }
  return out;
}

/** Rows a person set by hand, or chose to leave alone: no script ever changes them. */
export const isHandSet = (r: Pick<DirRow, "websiteSource" | "enrichmentStatus">) =>
  r.websiteSource === "Manual" || r.enrichmentStatus === "Manual" || r.enrichmentStatus === "Skipped";

/* eslint-enable @typescript-eslint/no-explicit-any */
