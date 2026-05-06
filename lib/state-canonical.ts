/**
 * Canonical-row picker for the 🗺️ States Notion DB.
 *
 * Three seed batches (2026-04-02, 04-06, 04-08) created duplicate rows for
 * every state. Without intervention `getStateInfo` would call
 * `notion.databases.query({..., page_size: 1})` and Notion's default sort
 * returned the empty 2026-04-02 row first, so production rendered templated
 * content for every state. See the TSP Bug & Oddity Log, "States DB has 118
 * rows for 50 states" entry, for the discovery context.
 *
 * Both the production read path (`getStateInfo` in lib/notion.ts) and the
 * consolidation script (scripts/dedupe-state-rows.ts) import this helper so
 * they always agree on which row is canonical.
 *
 * Picking heuristic, in order:
 *   1. Most editorial content — count of non-empty fields among the six core
 *      editorial fields (Intro Paragraph, State FAQ, Last Verified,
 *      Content Status, Eligibility Requirements, Court Acceptance Notes).
 *   2. Content Status = Complete wins if exactly one tied row has it.
 *   3. Most-recently-edited wins (Notion's `last_edited_time`).
 *   4. Oldest `created_time` as deterministic last resort.
 */

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const CORE_RICHNESS_FIELDS = [
  "Intro Paragraph",
  "State FAQ",
  "Last Verified",
  "Content Status",
  "Eligibility Requirements",
  "Court Acceptance Notes",
] as const;

function isFieldSet(page: PageObjectResponse, name: string): boolean {
  const prop = (page.properties as any)[name];
  if (!prop) return false;
  switch (prop.type) {
    case "rich_text":
      return ((prop.rich_text ?? []) as any[]).some((s: any) => (s.plain_text ?? "").length > 0);
    case "title":
      return ((prop.title ?? []) as any[]).some((s: any) => (s.plain_text ?? "").length > 0);
    case "date":
      return prop.date?.start != null;
    case "select":
      return prop.select?.name != null;
    case "checkbox":
      return prop.checkbox === true;
    case "number":
      return prop.number != null;
    case "url":
      return ((prop.url ?? "") as string).length > 0;
    default:
      return false;
  }
}

export function richnessScore(page: PageObjectResponse): number {
  let n = 0;
  for (const name of CORE_RICHNESS_FIELDS) {
    if (isFieldSet(page, name)) n++;
  }
  return n;
}

function contentStatusName(page: PageObjectResponse): string | null {
  const prop = (page.properties as any)["Content Status"];
  return prop?.select?.name ?? null;
}

export function pickCanonicalRow<T extends PageObjectResponse>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0];

  // 1. Most editorial content
  const scored = rows.map(r => ({ r, score: richnessScore(r) }));
  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  let candidates = scored.filter(s => s.score === topScore).map(s => s.r);
  if (candidates.length === 1) return candidates[0];

  // 2. Content Status = Complete wins if exactly one candidate has it
  const completes = candidates.filter(r => contentStatusName(r) === "Complete");
  if (completes.length === 1) return completes[0];

  // 3. Most recent last_edited_time
  candidates = [...candidates].sort((a, b) =>
    (b.last_edited_time ?? "").localeCompare(a.last_edited_time ?? "")
  );
  const newestEdit = candidates[0].last_edited_time ?? "";
  const newestEdited = candidates.filter(r => (r.last_edited_time ?? "") === newestEdit);
  if (newestEdited.length === 1) return newestEdited[0];

  // 4. Oldest created_time deterministic fallback
  newestEdited.sort((a, b) =>
    (a.created_time ?? "").localeCompare(b.created_time ?? "")
  );
  return newestEdited[0];
}

/* eslint-enable @typescript-eslint/no-explicit-any */
