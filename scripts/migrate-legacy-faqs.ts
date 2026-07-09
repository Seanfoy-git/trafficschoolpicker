/**
 * Legacy FAQ DB → State FAQ JSON migration.
 *
 * Reads verified entries from NOTION_FAQ_DB_ID, groups them per US state
 * (handling slug, abbreviation, and name-with-space keying variants),
 * dedupes by normalized question text, formats as a JSON array, and writes
 * the result into the `State FAQ` rich_text property on the States DB.
 *
 *   npx tsx scripts/migrate-legacy-faqs.ts            # dry run (default — prints, writes nothing)
 *   npx tsx scripts/migrate-legacy-faqs.ts --apply    # actually writes to Notion
 *
 * Idempotent: skips state rows whose `State FAQ` is already non-empty
 * (so manually-authored rows like Wyoming/Montana are never overwritten).
 * Never touches Intro Paragraph, Last Verified, or Content Status.
 */

import { makeNotionClient } from "./lib/notion-client";
import * as fs from "fs";
import { STATE_LIST } from "../lib/state-utils";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const APPLY = process.argv.includes("--apply");
const MIN_LEGACY_ENTRIES = 5;
const DEDUPE_DROP_THRESHOLD = 0.5; // flag if ≥50% of entries collapse during dedupe

// States held back from --apply for editorial reasons. Their plan still renders
// in the dry run (so the eventual content is reviewable) but they're marked SKIP
// and not written. Add slugs here when a state needs human attention before
// going live; remove them when ready.
const HOLDOUT_SLUGS = new Set<string>([
  "ohio", // 6→4 after dedupe puts it exactly at the FAQPage JSON-LD schema floor;
          // hold until 1–2 more FAQs are authored manually (decision 2026-05-04)
]);

const DROPS_SIDECAR = "data/legacy-faq-migration-drops.json";

const FAQ_DB = process.env.NOTION_FAQ_DB_ID;
const STATES_DB = process.env.NOTION_STATES_DB;
if (!FAQ_DB || !STATES_DB) {
  console.error("Missing NOTION_FAQ_DB_ID or NOTION_STATES_DB in .env.local");
  process.exit(1);
}

const notion = makeNotionClient();

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function richText(prop: any): string {
  if (prop?.type !== "rich_text") return "";
  return (prop.rich_text ?? []).map((s: any) => s.plain_text ?? "").join("");
}

function titleText(prop: any): string {
  if (prop?.type !== "title") return "";
  return (prop.title ?? []).map((s: any) => s.plain_text ?? "").join("");
}

function selectName(prop: any): string | null {
  return prop?.select?.name ?? null;
}

async function queryAll(db: string, filter?: any): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const r: any = await notion.databases.query({
      database_id: db,
      page_size: 100,
      start_cursor: cursor,
      ...(filter ? { filter } : {}),
    });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor ?? undefined : undefined;
  } while (cursor);
  return out;
}

// Strips trailing punctuation/whitespace and lowercases for conservative dedupe.
function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .trim()
    .replace(/[?!.\s]+$/g, "")
    .replace(/\s+/g, " ");
}

// Splits content into ≤2000-char chunks so the rich_text update never trips
// Notion's per-segment cap. The reader (getFullRichText) concatenates segments,
// so split points don't affect downstream parsing.
function chunkForRichText(content: string, max = 2000): Array<{ type: "text"; text: { content: string } }> {
  if (content.length <= max) return [{ type: "text", text: { content } }];
  const chunks: Array<{ type: "text"; text: { content: string } }> = [];
  for (let i = 0; i < content.length; i += max) {
    chunks.push({ type: "text", text: { content: content.slice(i, i + max) } });
  }
  return chunks;
}

// ─────────────────────────────────────────────────────────────────
// Step 1 — schema discovery on the legacy FAQ DB
// ─────────────────────────────────────────────────────────────────

type LegacyFieldNames = {
  stateCode: string;        // expected "State Code" (rich_text)
  question: string;         // expected "Question"   (rich_text or title)
  answer: string;           // expected "Answer"     (rich_text)
  status: string;           // expected "Status"     (select)
  questionIsTitle: boolean; // some Notion DBs use title for the primary text
};

async function discoverLegacySchema(): Promise<LegacyFieldNames> {
  const meta: any = await notion.databases.retrieve({ database_id: FAQ_DB! });
  const props: Record<string, any> = meta.properties ?? {};

  // Find each expected field, with a small set of accepted aliases to be defensive.
  const find = (candidates: string[], typeMatch: (t: string) => boolean): string | null => {
    for (const name of candidates) {
      if (props[name] && typeMatch(props[name].type)) return name;
    }
    // Fallback: any prop whose normalized name matches and has the right type
    const lower = candidates.map(c => c.toLowerCase());
    for (const [name, p] of Object.entries(props)) {
      if (lower.includes(name.toLowerCase()) && typeMatch(p.type)) return name;
    }
    return null;
  };

  const stateCode = find(["State Code", "StateCode", "state_code"], t => t === "rich_text" || t === "title" || t === "select");
  const question = find(["Question", "Q", "Prompt"], t => t === "rich_text" || t === "title");
  const answer = find(["Answer", "A", "Response"], t => t === "rich_text");
  const status = find(["Status"], t => t === "select" || t === "status");

  if (!stateCode || !question || !answer || !status) {
    console.error("Legacy FAQ DB schema does not match expectations.");
    console.error("Available properties:");
    for (const [name, p] of Object.entries(props)) console.error(`  - "${name}" (${(p as any).type})`);
    console.error(`\nResolved fields: stateCode=${stateCode}, question=${question}, answer=${answer}, status=${status}`);
    console.error("Halting — fix the schema or update the field aliases at the top of this script.");
    process.exit(1);
  }

  const questionIsTitle = props[question].type === "title";

  console.log("Legacy FAQ DB schema:");
  console.log(`  State Code field: "${stateCode}" (${props[stateCode].type})`);
  console.log(`  Question field:   "${question}" (${props[question].type})`);
  console.log(`  Answer field:     "${answer}" (${props[answer].type})`);
  console.log(`  Status field:     "${status}" (${props[status].type})\n`);

  return { stateCode, question, answer, status, questionIsTitle };
}

// ─────────────────────────────────────────────────────────────────
// Step 2 — load entries, group per state
// ─────────────────────────────────────────────────────────────────

type LegacyEntry = {
  id: string;
  createdTime: string;
  stateKey: string;
  q: string;
  a: string;
};

async function loadLegacyEntries(schema: LegacyFieldNames): Promise<LegacyEntry[]> {
  const filter = schema.status
    ? { property: schema.status, select: { equals: "Verified" } }
    : undefined;
  const pages = await queryAll(FAQ_DB!, filter);
  const entries: LegacyEntry[] = [];
  for (const p of pages) {
    const sc = (p.properties[schema.stateCode] && richText(p.properties[schema.stateCode])) || "";
    const q = schema.questionIsTitle
      ? titleText(p.properties[schema.question])
      : richText(p.properties[schema.question]);
    const a = richText(p.properties[schema.answer]);
    if (!sc.trim() || !q.trim() || !a.trim()) continue;
    entries.push({
      id: p.id,
      createdTime: p.created_time,
      stateKey: sc.trim(),
      q: q.trim(),
      a: a.trim(),
    });
  }
  return entries;
}

function resolveKeyToSlug(key: string): string | null {
  const lower = key.toLowerCase();
  const upper = key.toUpperCase();
  // exact slug
  let m = STATE_LIST.find(s => s.slug === lower);
  if (m) return m.slug;
  // abbreviation
  m = STATE_LIST.find(s => s.code === upper);
  if (m) return m.slug;
  // full state name OR space-variant of slug ("new york" → "new-york")
  m = STATE_LIST.find(
    s => s.name.toLowerCase() === lower || s.slug.replace(/-/g, " ") === lower
  );
  if (m) return m.slug;
  return null;
}

// ─────────────────────────────────────────────────────────────────
// Step 3 — existing State FAQ values on the States DB (idempotency)
// ─────────────────────────────────────────────────────────────────

type StateRow = { pageId: string; slug: string; name: string; code: string; existingFaqLen: number };

async function loadStateRows(): Promise<Map<string, StateRow>> {
  const pages = await queryAll(STATES_DB!);
  const map = new Map<string, StateRow>();
  for (const p of pages) {
    const code = richText(p.properties["Abbreviation"]).trim().toUpperCase();
    if (!code) continue;
    const meta = STATE_LIST.find(s => s.code === code);
    if (!meta) continue;
    const existing = richText(p.properties["State FAQ"]);
    map.set(meta.slug, {
      pageId: p.id,
      slug: meta.slug,
      name: meta.name,
      code,
      existingFaqLen: existing.length,
    });
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────
// Step 4 — dedupe + plan per state
// ─────────────────────────────────────────────────────────────────

type DedupeDrop = {
  droppedQ: string;
  droppedA: string;
  keptIndex: number;
  keptQ: string;
  keptA: string;
};

type StatePlan = {
  slug: string;
  name: string;
  pageId: string;
  legacyCount: number;
  finalCount: number;
  json: string;
  drops: DedupeDrop[];
  skipReason: string | null;
  perKeyCounts: Record<string, number>; // raw key → count, e.g. {"michigan": 12, "MI": 0}
};

function planForState(
  row: StateRow,
  entriesForState: LegacyEntry[]
): StatePlan {
  const perKeyCounts: Record<string, number> = {};
  for (const e of entriesForState) perKeyCounts[e.stateKey] = (perKeyCounts[e.stateKey] ?? 0) + 1;

  // Preserve created-time order (legacy DB order)
  const sorted = [...entriesForState].sort((a, b) => a.createdTime.localeCompare(b.createdTime));

  const kept: LegacyEntry[] = [];
  const drops: DedupeDrop[] = [];
  const seen = new Map<string, number>(); // normalized question → kept-index

  for (const entry of sorted) {
    const norm = normalizeQuestion(entry.q);
    if (seen.has(norm)) {
      const keptIdx = seen.get(norm)!;
      drops.push({
        droppedQ: entry.q,
        droppedA: entry.a,
        keptIndex: keptIdx + 1, // 1-indexed for human-readable output
        keptQ: kept[keptIdx].q,
        keptA: kept[keptIdx].a,
      });
    } else {
      seen.set(norm, kept.length);
      kept.push(entry);
    }
  }

  const json = JSON.stringify(kept.map(e => ({ q: e.q, a: e.a })));
  let skipReason: string | null = null;
  if (row.existingFaqLen > 0) skipReason = `existing State FAQ value (${row.existingFaqLen} chars) — leaving untouched`;
  else if (HOLDOUT_SLUGS.has(row.slug)) skipReason = `holdout (see HOLDOUT_SLUGS in script) — not writing this run`;

  return {
    slug: row.slug,
    name: row.name,
    pageId: row.pageId,
    legacyCount: entriesForState.length,
    finalCount: kept.length,
    json,
    drops,
    skipReason,
    perKeyCounts,
  };
}

// ─────────────────────────────────────────────────────────────────
// Step 5 — render dry-run report
// ─────────────────────────────────────────────────────────────────

function renderPlan(plan: StatePlan): void {
  console.log("\n========================================================================");
  console.log(`=== ${plan.name} (${plan.legacyCount} entries → after dedupe: ${plan.finalCount}) ===`);
  console.log("========================================================================");

  // Show how each State Code key contributed
  const keyBreakdown = Object.entries(plan.perKeyCounts)
    .map(([k, n]) => `"${k}"=${n}`)
    .join(", ");
  console.log(`Source keys: ${keyBreakdown}`);

  if (plan.skipReason) {
    console.log(`SKIP: ${plan.skipReason}`);
  }

  // Drop ratio guard
  const dropRatio = plan.legacyCount > 0 ? 1 - plan.finalCount / plan.legacyCount : 0;
  if (dropRatio >= DEDUPE_DROP_THRESHOLD) {
    console.log(`⚠️  DEDUPE DROP ${(dropRatio * 100).toFixed(0)}% — ${plan.legacyCount} → ${plan.finalCount}. Investigate before applying.`);
  }

  // The JSON array (pretty-printed for review)
  const pretty = JSON.stringify(JSON.parse(plan.json), null, 2);
  console.log("\nFinal JSON (will be written verbatim — single line on apply):");
  console.log(pretty);

  // Dropped-entry details
  if (plan.drops.length > 0) {
    console.log(`\nDropped ${plan.drops.length} entr${plan.drops.length === 1 ? "y" : "ies"} (exact-question dedupe):`);
    for (const d of plan.drops) {
      console.log(`\n  DROPPED → matched kept entry #${d.keptIndex}:`);
      console.log(`    kept    q: ${JSON.stringify(d.keptQ)}`);
      console.log(`    kept    a (first 160 chars): ${JSON.stringify(d.keptA.slice(0, 160))}${d.keptA.length > 160 ? "…" : ""}`);
      console.log(`    dropped q: ${JSON.stringify(d.droppedQ)}`);
      console.log(`    dropped a (first 160 chars): ${JSON.stringify(d.droppedA.slice(0, 160))}${d.droppedA.length > 160 ? "…" : ""}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Step 6 — apply (only if --apply)
// ─────────────────────────────────────────────────────────────────

async function applyPlan(plan: StatePlan): Promise<void> {
  // notion.pages.update throws on non-2xx, so reaching the next line means
  // the API returned 200. We log explicitly so the apply summary can claim
  // "all writes returned 200" with confidence.
  await notion.pages.update({
    page_id: plan.pageId,
    properties: {
      "State FAQ": {
        rich_text: chunkForRichText(plan.json),
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

(async () => {
  console.log(`Mode: ${APPLY ? "APPLY (will write to Notion)" : "DRY RUN (no writes)"}\n`);

  const schema = await discoverLegacySchema();
  const entries = await loadLegacyEntries(schema);
  console.log(`Loaded ${entries.length} verified legacy FAQ entries\n`);

  const stateRows = await loadStateRows();

  // Group entries by canonical slug
  type Bucket = { entries: LegacyEntry[]; unmatchedKeys: Record<string, number> };
  const bySlug = new Map<string, Bucket>();
  const trulyUnmatched: Record<string, number> = {};
  for (const e of entries) {
    const slug = resolveKeyToSlug(e.stateKey);
    if (!slug) {
      trulyUnmatched[e.stateKey] = (trulyUnmatched[e.stateKey] ?? 0) + 1;
      continue;
    }
    if (!bySlug.has(slug)) bySlug.set(slug, { entries: [], unmatchedKeys: {} });
    bySlug.get(slug)!.entries.push(e);
  }

  if (Object.keys(trulyUnmatched).length > 0) {
    console.log("⚠️  Unrecognized State Code values (not migrated):");
    for (const [k, n] of Object.entries(trulyUnmatched)) console.log(`  "${k}": ${n} entries`);
    console.log("");
  }

  // Build per-state plans for states meeting the threshold
  const plans: StatePlan[] = [];
  for (const [slug, bucket] of bySlug) {
    if (bucket.entries.length < MIN_LEGACY_ENTRIES) continue;
    const row = stateRows.get(slug);
    if (!row) {
      console.warn(`No States-DB row found for slug=${slug} — skipping`);
      continue;
    }
    plans.push(planForState(row, bucket.entries));
  }
  // Stable order: largest legacy count first
  plans.sort((a, b) => b.legacyCount - a.legacyCount);

  for (const p of plans) renderPlan(p);

  // ─── Summary table ───
  console.log("\n\n========================================================================");
  console.log("=== SUMMARY ===");
  console.log("========================================================================\n");
  console.log("State              | Legacy | Final | Dropped | Action");
  console.log("-------------------+--------+-------+---------+--------");
  for (const p of plans) {
    const action = p.skipReason ? "SKIP" : APPLY ? "WRITE" : "(would write)";
    console.log(
      `${p.name.padEnd(18)} | ${String(p.legacyCount).padStart(6)} | ${String(p.finalCount).padStart(5)} | ${String(p.drops.length).padStart(7)} | ${action}`
    );
  }

  // ─── Drops sidecar ───
  // Always (re)written — drops aren't lost text, they're alternative framings of
  // questions that survived. Sean does a manual editorial pass over this file
  // later to merge useful wording back into kept entries by hand.
  const dropsByState: Record<string, Array<{ kept_question: string; dropped_question: string; dropped_answer: string }>> = {};
  for (const p of plans) {
    if (p.drops.length === 0) continue;
    dropsByState[p.slug] = p.drops.map(d => ({
      kept_question: d.keptQ,
      dropped_question: d.droppedQ,
      dropped_answer: d.droppedA,
    }));
  }
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(DROPS_SIDECAR, JSON.stringify(dropsByState, null, 2) + "\n");
  const totalDrops = Object.values(dropsByState).reduce((n, arr) => n + arr.length, 0);
  console.log(`\nDrops sidecar written: ${DROPS_SIDECAR} (${Object.keys(dropsByState).length} states, ${totalDrops} dropped entries)`);

  // ─── Apply phase ───
  if (!APPLY) {
    console.log("\nDry run complete. No writes performed.");
    console.log("Review the output above. To apply, re-run with --apply.");
    return;
  }

  console.log("\n--apply set — writing to Notion…\n");
  let written = 0;
  let skipped = 0;
  for (const p of plans) {
    if (p.skipReason) {
      console.log(`SKIP ${p.name}: ${p.skipReason}`);
      skipped++;
      continue;
    }
    try {
      await applyPlan(p);
      console.log(`WROTE ${p.name} (${p.finalCount} entries, ${p.json.length} chars)`);
      written++;
    } catch (err) {
      console.error(`FAILED ${p.name}:`, (err as Error).message);
    }
  }
  console.log(`\nDone. Wrote ${written}, skipped ${skipped}.`);
})().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});

/* eslint-enable @typescript-eslint/no-explicit-any */
