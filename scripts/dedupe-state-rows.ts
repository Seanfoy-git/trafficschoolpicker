/**
 * States DB row consolidation.
 *
 * Resolves the 118-rows-for-50-states problem caused by three legacy seed
 * batches (2026-04-02, 04-06, 04-08). For each state code:
 *   1. Pick a canonical row (most editorial content → Content Status=Complete →
 *      most recently edited → oldest creation_time).
 *   2. Merge content from duplicates onto canonical, but only into fields
 *      where canonical is empty. Never overwrite a canonical value.
 *   3. Trash duplicates via `archived: true` (Notion's 30-day recovery window).
 *
 * Conflict handling: if any field has different non-empty values across rows,
 * skip the trash for that state and flag the conflict for human resolution.
 * Non-conflicting merges still apply on the same state.
 *
 *   npx tsx scripts/dedupe-state-rows.ts            # dry run (default)
 *   npx tsx scripts/dedupe-state-rows.ts --apply    # writes + trashes
 */

import { makeNotionClient } from "./lib/notion-client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as fs from "fs";
import { STATE_LIST } from "../lib/state-utils";
import { pickCanonicalRow, richnessScore } from "../lib/state-canonical";

const envContent = fs.readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const APPLY = process.argv.includes("--apply");
const STATES_DB = process.env.NOTION_STATES_DB;
if (!STATES_DB || !process.env.NOTION_TOKEN) {
  console.error("Missing NOTION_STATES_DB or NOTION_TOKEN in .env.local");
  process.exit(1);
}
const notion = makeNotionClient();

// ─────────────────────────────────────────────────────────────────
// Field definitions
// ─────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

type FieldKind = "rich_text" | "date" | "select" | "checkbox" | "number" | "url" | "title";

// Conflict policy per Sean's 2026-05-05 spec:
//   strict          — canonical wins only if duplicate is empty; if both rows have
//                     non-empty different values, mark CONFLICT and skip trash for the state.
//                     Use for editorial and factual fields that need human judgment on conflict.
//   auto-canonical  — canonical wins on conflict; duplicate's value is discarded.
//                     If canonical is empty and duplicates disagree, the longest duplicate
//                     value wins (deterministic + tends to keep the more populated version).
//                     A DISCARD WARN line is printed for any non-empty duplicate value
//                     that gets thrown away — Sean reviews these before --apply.
type Policy = "strict" | "auto-canonical";

type FieldDef = {
  name: string;
  kind: FieldKind;
  short: string;
  isCore?: boolean;          // counts toward canonical "richness" score
  policy: Policy;
  policyExplicit: boolean;   // false = defaulted to strict because Sean didn't list it; flag in output
};

// Order matters: the 6 core editorial fields come first so the bracket summary
// in the dry-run output matches Sean's spec layout exactly.
const FIELDS: FieldDef[] = [
  // Strict bucket per spec
  { name: "Intro Paragraph",          kind: "rich_text", short: "intro",          isCore: true, policy: "strict",         policyExplicit: true },
  { name: "State FAQ",                kind: "rich_text", short: "faq",            isCore: true, policy: "strict",         policyExplicit: true },
  { name: "Last Verified",            kind: "date",      short: "verified",       isCore: true, policy: "strict",         policyExplicit: true },
  { name: "Content Status",           kind: "select",    short: "status",         isCore: true, policy: "strict",         policyExplicit: true },
  { name: "Eligibility Requirements", kind: "rich_text", short: "elig",           isCore: true, policy: "strict",         policyExplicit: true },
  { name: "Court Acceptance Notes",   kind: "rich_text", short: "court",          isCore: true, policy: "strict",         policyExplicit: true },
  { name: "Minimum Hours",            kind: "number",    short: "minH",                          policy: "strict",         policyExplicit: true },
  { name: "Average Price",            kind: "number",    short: "price",                         policy: "strict",         policyExplicit: true },
  // Auto-canonical bucket per spec
  { name: "DMV URL",                  kind: "url",       short: "dmv",                           policy: "auto-canonical", policyExplicit: true },
  { name: "SEO Title",                kind: "rich_text", short: "seoT",                          policy: "auto-canonical", policyExplicit: true },
  { name: "SEO Description",          kind: "rich_text", short: "seoD",                          policy: "auto-canonical", policyExplicit: true },
  { name: "Fun Fact",                 kind: "rich_text", short: "fun",                           policy: "auto-canonical", policyExplicit: true },
  { name: "Certificate Submission",   kind: "select",    short: "cert",                          policy: "auto-canonical", policyExplicit: true },
  { name: "Research Notes",           kind: "rich_text", short: "research",                      policy: "auto-canonical", policyExplicit: true },
  { name: "Top School in State",      kind: "rich_text", short: "top",                           policy: "auto-canonical", policyExplicit: true },
  // Fields not listed in spec — default to strict per "I'd rather hand-resolve one extra
  // field than auto-merge a factual one wrong." policyExplicit: false flags them in the
  // dry-run output so Sean can promote any to auto-canonical before --apply.
  { name: "Approved School Count",    kind: "number",    short: "schools",                       policy: "strict",         policyExplicit: false },
  { name: "Last Updated",             kind: "date",      short: "updated",                       policy: "strict",         policyExplicit: false },
  { name: "Online Allowed",           kind: "checkbox",  short: "onAll",                         policy: "strict",         policyExplicit: false },
  { name: "Online Dismisses Ticket",  kind: "checkbox",  short: "dismiss",                       policy: "strict",         policyExplicit: false },
  { name: "Online Removes Points",    kind: "checkbox",  short: "rmPts",                         policy: "strict",         policyExplicit: false },
  { name: "Insurance Discount Available", kind: "checkbox", short: "ins",                        policy: "strict",         policyExplicit: false },
  { name: "Point System",             kind: "checkbox",  short: "pts",                           policy: "strict",         policyExplicit: false },
  { name: "Status",                   kind: "select",    short: "researchStatus",                policy: "strict",         policyExplicit: false },
];

const SHORT_DISPLAY_FIELDS = ["Intro Paragraph", "State FAQ", "Last Verified", "Content Status", "Eligibility Requirements", "Court Acceptance Notes"];

// ─────────────────────────────────────────────────────────────────
// Value extraction & comparison
// ─────────────────────────────────────────────────────────────────

type FieldValue = { isSet: boolean; raw: any; display: string };

function getValue(page: any, def: FieldDef): FieldValue {
  const prop = page.properties?.[def.name];
  if (!prop) return { isSet: false, raw: null, display: "" };
  switch (def.kind) {
    case "rich_text": {
      const text = (prop.rich_text ?? []).map((s: any) => s.plain_text ?? "").join("");
      return { isSet: text.length > 0, raw: prop.rich_text, display: text };
    }
    case "title": {
      const text = (prop.title ?? []).map((s: any) => s.plain_text ?? "").join("");
      return { isSet: text.length > 0, raw: prop.title, display: text };
    }
    case "date": {
      const start = prop.date?.start ?? null;
      return { isSet: !!start, raw: prop.date, display: start ?? "" };
    }
    case "select": {
      const name = prop.select?.name ?? null;
      return { isSet: !!name, raw: prop.select, display: name ?? "" };
    }
    case "checkbox": {
      // For booleans we treat false as "default/empty" — only true values are
      // candidates for merging. Two false values are not a conflict.
      const v = !!prop.checkbox;
      return { isSet: v, raw: v, display: v ? "true" : "false" };
    }
    case "number": {
      const n = prop.number;
      return { isSet: n !== null && n !== undefined, raw: n, display: n == null ? "" : String(n) };
    }
    case "url": {
      const u = prop.url ?? "";
      return { isSet: u.length > 0, raw: u, display: u };
    }
  }
}

function valuesEqual(a: any, b: any, kind: FieldKind): boolean {
  if (kind === "checkbox") return a === b;
  if (kind === "number") return a === b;
  if (kind === "url") return (a ?? "").trim() === (b ?? "").trim();
  if (kind === "rich_text" || kind === "title") {
    const flatten = (v: any) =>
      (typeof v === "string" ? v : (v ?? []).map((s: any) => s.plain_text ?? "").join("")).trim();
    return flatten(a) === flatten(b);
  }
  if (kind === "date") {
    return (a?.start ?? null) === (b?.start ?? null) && (a?.end ?? null) === (b?.end ?? null);
  }
  if (kind === "select") return (a?.name ?? null) === (b?.name ?? null);
  return false;
}

// ─────────────────────────────────────────────────────────────────
// Canonical picker
// ─────────────────────────────────────────────────────────────────

// Wraps the shared pickCanonicalRow helper from lib/state-canonical to also
// produce a human-readable reason string for the dry-run output. The picking
// decision itself is delegated entirely so the consolidation script and
// production getStateInfo() always agree on canonical.
function pickCanonical(rows: any[]): { canonical: any; reason: string } {
  const canonical = pickCanonicalRow(rows as PageObjectResponse[]) as any;
  const score = richnessScore(canonical as PageObjectResponse);

  // Reconstruct why the helper picked this row, for the dry-run report.
  const sameScore = rows.filter(r => richnessScore(r as PageObjectResponse) === score);
  if (sameScore.length === 1) return { canonical, reason: `richness=${score}` };

  const completes = sameScore.filter(r => (r.properties?.["Content Status"]?.select?.name ?? null) === "Complete");
  if (completes.length === 1 && completes[0].id === canonical.id) {
    return { canonical, reason: `richness=${score} tie, broken by Content Status=Complete` };
  }

  const newestEditTime = [...sameScore].sort((a, b) =>
    (b.last_edited_time ?? "").localeCompare(a.last_edited_time ?? "")
  )[0].last_edited_time;
  const newestEdited = sameScore.filter(r => (r.last_edited_time ?? "") === newestEditTime);
  if (newestEdited.length === 1 && newestEdited[0].id === canonical.id) {
    return { canonical, reason: `richness=${score} tie, broken by most recent last_edited_time` };
  }

  return { canonical, reason: `richness=${score} tie, broken by oldest created_time` };
}

// ─────────────────────────────────────────────────────────────────
// Plan
// ─────────────────────────────────────────────────────────────────

type FieldPlan = {
  field: FieldDef;
  action:
    | "no-merge-canonical-set"
    | "no-merge-empty"
    | "merge"
    | "merge-from-multiple-same"
    | "conflict"                   // strict policy: different non-empty values → human review
    | "auto-canonical-keep"        // auto policy: canonical has it, duplicate disagrees → discard duplicate
    | "auto-canonical-merge";      // auto policy: canonical empty, picked from longest duplicate
  fromPageId?: string;
  conflict?: Array<{ pageId: string; display: string }>;
  discarded?: Array<{ pageId: string; display: string }>;  // duplicates whose values are about to be thrown away
  raw?: any;
};

type StatePlan = {
  code: string;
  name: string;
  rows: any[];
  canonical: any;
  canonicalReason: string;
  fieldPlans: FieldPlan[];
  hasConflict: boolean;
  toTrash: string[];
  duplicatesUntouched: string[];
};

function buildStatePlan(code: string, name: string, rows: any[]): StatePlan {
  if (rows.length === 1) {
    // Single-row state: nothing to merge, nothing to trash.
    return {
      code, name, rows,
      canonical: rows[0],
      canonicalReason: "sole row",
      fieldPlans: [],
      hasConflict: false,
      toTrash: [],
      duplicatesUntouched: [],
    };
  }

  const { canonical, reason } = pickCanonical(rows);
  const duplicates = rows.filter(r => r.id !== canonical.id);

  const fieldPlans: FieldPlan[] = [];
  for (const def of FIELDS) {
    if (def.kind === "title") continue;
    const cV = getValue(canonical, def);
    const dups = duplicates.map(d => ({ pageId: d.id, val: getValue(d, def) }));
    const dupsSet = dups.filter(d => d.val.isSet);

    if (cV.isSet) {
      // Canonical has it. Conflict if any duplicate has a different non-empty value.
      const conflicting = dupsSet.filter(d => !valuesEqual(d.val.raw, cV.raw, def.kind));
      if (conflicting.length === 0) {
        fieldPlans.push({ field: def, action: "no-merge-canonical-set" });
      } else if (def.policy === "strict") {
        fieldPlans.push({
          field: def,
          action: "conflict",
          conflict: [
            { pageId: `${canonical.id} (canonical)`, display: cV.display },
            ...conflicting.map(c => ({ pageId: c.pageId, display: c.val.display })),
          ],
        });
      } else {
        // auto-canonical: canonical wins, duplicate values discarded.
        fieldPlans.push({
          field: def,
          action: "auto-canonical-keep",
          discarded: conflicting.map(c => ({ pageId: c.pageId, display: c.val.display })),
        });
      }
    } else {
      // Canonical empty.
      if (dupsSet.length === 0) {
        fieldPlans.push({ field: def, action: "no-merge-empty" });
      } else {
        const first = dupsSet[0];
        const allEqual = dupsSet.every(d => valuesEqual(d.val.raw, first.val.raw, def.kind));
        if (allEqual) {
          // Same value across all dupes — clean merge regardless of policy.
          fieldPlans.push({
            field: def,
            action: dupsSet.length === 1 ? "merge" : "merge-from-multiple-same",
            fromPageId: first.pageId,
            raw: first.val.raw,
          });
        } else if (def.policy === "strict") {
          fieldPlans.push({
            field: def,
            action: "conflict",
            conflict: dupsSet.map(d => ({ pageId: d.pageId, display: d.val.display })),
          });
        } else {
          // auto-canonical, canonical empty, dupes disagree.
          // Pick the longest non-empty value (most-specific tends to win) and
          // record the others as discarded for the DISCARD WARN report.
          const sorted = [...dupsSet].sort((a, b) => b.val.display.length - a.val.display.length);
          const winner = sorted[0];
          const losers = sorted.slice(1);
          fieldPlans.push({
            field: def,
            action: "auto-canonical-merge",
            fromPageId: winner.pageId,
            raw: winner.val.raw,
            discarded: losers.map(l => ({ pageId: l.pageId, display: l.val.display })),
          });
        }
      }
    }
  }

  const hasConflict = fieldPlans.some(p => p.action === "conflict");
  return {
    code, name, rows,
    canonical,
    canonicalReason: reason,
    fieldPlans,
    hasConflict,
    toTrash: hasConflict ? [] : duplicates.map(d => d.id),
    duplicatesUntouched: hasConflict ? duplicates.map(d => d.id) : [],
  };
}

// ─────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────

function rowSummary(row: any, isCanonical: boolean): string {
  const created = (row.created_time ?? "").slice(0, 10);
  const flags = FIELDS
    .filter(f => f.isCore)
    .map(f => `${f.short}:${getValue(row, f).isSet ? "Y" : "N"}`)
    .join(" ");
  return `  - ${row.id} created ${created} [${flags}]${isCanonical ? "   ← CANONICAL" : ""}`;
}

function renderPlan(plan: StatePlan): void {
  console.log(`\n=== ${plan.name} ===`);
  console.log(`Rows found: ${plan.rows.length}`);
  for (const r of plan.rows) console.log(rowSummary(r, r.id === plan.canonical.id));

  if (plan.rows.length === 1) {
    console.log("(single row — no consolidation needed)");
    return;
  }

  console.log(`Canonical pick: ${plan.canonicalReason}`);
  console.log("");
  console.log("Merge plan:");
  for (const p of plan.fieldPlans) {
    const padded = (p.field.name + ":").padEnd(28);
    const isShort = SHORT_DISPLAY_FIELDS.includes(p.field.name);
    if (p.action === "no-merge-canonical-set") {
      if (isShort) console.log(`  ${padded} canonical (no merge)`);
    } else if (p.action === "no-merge-empty") {
      if (isShort) console.log(`  ${padded} <empty everywhere, no change>`);
    } else if (p.action === "merge") {
      console.log(`  ${padded} ← MERGE FROM ${p.fromPageId}`);
    } else if (p.action === "merge-from-multiple-same") {
      console.log(`  ${padded} ← MERGE FROM ${p.fromPageId} (multiple dupes have identical value)`);
    } else if (p.action === "conflict") {
      console.log(`  ${padded} CONFLICT (strict policy)`);
      for (const c of p.conflict ?? []) {
        const truncated = c.display.length > 100 ? c.display.slice(0, 100) + "…" : c.display;
        console.log(`    ${c.pageId}: ${JSON.stringify(truncated)}`);
      }
    } else if (p.action === "auto-canonical-keep") {
      console.log(`  ${padded} canonical wins (auto policy) — discarding ${p.discarded?.length ?? 0} duplicate value(s)`);
      for (const d of p.discarded ?? []) {
        const truncated = d.display.length > 100 ? d.display.slice(0, 100) + "…" : d.display;
        console.log(`    [DISCARD WARN] ${d.pageId}: ${JSON.stringify(truncated)}`);
      }
    } else if (p.action === "auto-canonical-merge") {
      console.log(`  ${padded} ← MERGE FROM ${p.fromPageId} (auto policy, longest dup value)`);
      for (const d of p.discarded ?? []) {
        const truncated = d.display.length > 100 ? d.display.slice(0, 100) + "…" : d.display;
        console.log(`    [DISCARD WARN] ${d.pageId}: ${JSON.stringify(truncated)}`);
      }
    }
  }
  const anyAction = plan.fieldPlans.some(p =>
    p.action === "merge" || p.action === "merge-from-multiple-same" ||
    p.action === "conflict" || p.action === "auto-canonical-merge" || p.action === "auto-canonical-keep"
  );
  if (!anyAction) {
    console.log("  (no merges needed — all data already on canonical or empty everywhere)");
  }

  console.log("");
  if (plan.hasConflict) {
    const conflictFields = plan.fieldPlans.filter(p => p.action === "conflict").map(p => p.field.name);
    console.log(`Trash plan: SKIPPED — ${conflictFields.length} conflict field(s): ${conflictFields.join(", ")}`);
    for (const id of plan.duplicatesUntouched) console.log(`  ${id} → untouched (resolve conflict manually)`);
  } else {
    console.log("Trash plan:");
    for (const id of plan.toTrash) console.log(`  ${id} → archived: true`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Apply
// ─────────────────────────────────────────────────────────────────

async function applyMerges(plan: StatePlan): Promise<{ mergedFields: number; trashed: number }> {
  // Apply non-conflict merges onto canonical regardless of whether the state
  // has any strict-conflict fields. Strict conflicts only block the trash step;
  // safe merges (canonical empty + dupe has value, or auto-policy resolutions)
  // are still applied so we don't leave content stranded on an un-archived
  // duplicate row that getStateInfo will never read.
  const propsToWrite: Record<string, any> = {};
  for (const p of plan.fieldPlans) {
    if (p.action !== "merge" && p.action !== "merge-from-multiple-same" && p.action !== "auto-canonical-merge") continue;
    const def = p.field;
    switch (def.kind) {
      case "rich_text": propsToWrite[def.name] = { rich_text: p.raw }; break;
      case "date":      propsToWrite[def.name] = { date: p.raw }; break;
      case "select":    propsToWrite[def.name] = { select: p.raw }; break;
      case "checkbox":  propsToWrite[def.name] = { checkbox: p.raw }; break;
      case "number":    propsToWrite[def.name] = { number: p.raw }; break;
      case "url":       propsToWrite[def.name] = { url: p.raw }; break;
    }
  }
  const mergedFields = Object.keys(propsToWrite).length;
  if (mergedFields > 0) {
    await notion.pages.update({ page_id: plan.canonical.id, properties: propsToWrite });
  }

  // Trash duplicates. Notion API: `archived: true` (a.k.a. in_trash) — recoverable
  // from trash for 30 days. plan.toTrash is empty when the state has any
  // strict-policy conflicts; that's set in buildStatePlan, not here.
  let trashed = 0;
  for (const id of plan.toTrash) {
    await notion.pages.update({ page_id: id, archived: true } as any);
    trashed++;
  }
  return { mergedFields, trashed };
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

async function queryAll(): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const r: any = await notion.databases.query({ database_id: STATES_DB!, page_size: 100, start_cursor: cursor });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor ?? undefined : undefined;
  } while (cursor);
  return out;
}

(async () => {
  console.log(`Mode: ${APPLY ? "APPLY (will merge + trash)" : "DRY RUN (no writes)"}\n`);

  const all = await queryAll();
  console.log(`Total rows in States DB: ${all.length}`);

  const byCode: Record<string, any[]> = {};
  const noCode: any[] = [];
  for (const p of all) {
    const code = ((p.properties?.["Abbreviation"]?.rich_text ?? [])
      .map((s: any) => s.plain_text ?? "").join("") || "").trim().toUpperCase();
    if (!code) { noCode.push(p); continue; }
    (byCode[code] ??= []).push(p);
  }

  if (noCode.length > 0) {
    console.log(`\n⚠️  ${noCode.length} row(s) with empty Abbreviation — not consolidated:`);
    for (const p of noCode) {
      const title = (p.properties?.["State Name"]?.title ?? []).map((s: any) => s.plain_text ?? "").join("") || "(empty title)";
      console.log(`  - ${p.id} title=${JSON.stringify(title)}`);
    }
  }

  const plans: StatePlan[] = [];
  for (const meta of STATE_LIST) {
    const rows = byCode[meta.code] ?? [];
    if (rows.length === 0) {
      console.log(`\n⚠️  No row found for ${meta.name} (${meta.code})`);
      continue;
    }
    plans.push(buildStatePlan(meta.code, meta.name, rows));
  }

  for (const p of plans) renderPlan(p);

  // ─── Summary ───
  console.log("\n========================================================================");
  console.log("=== SUMMARY ===");
  console.log("========================================================================\n");

  const dupes = plans.filter(p => p.rows.length > 1);
  const conflicting = plans.filter(p => p.hasConflict);
  const willMerge = plans.filter(p => !p.hasConflict && p.fieldPlans.some(f =>
    f.action === "merge" || f.action === "merge-from-multiple-same" || f.action === "auto-canonical-merge"
  ));
  const willTrashTotal = plans.reduce((n, p) => n + p.toTrash.length, 0);

  // Bucket counts per Sean's spec
  const cleanCount = dupes.filter(p => !p.hasConflict).length;
  const coreConflictStates: string[] = [];
  for (const p of conflicting) {
    const conflictFields = p.fieldPlans.filter(f => f.action === "conflict").map(f => f.field.name);
    coreConflictStates.push(p.name);
    void conflictFields;
  }

  console.log(`States with rows:                  ${plans.length}`);
  console.log(`States with >1 row (dupes):        ${dupes.length}`);
  console.log(`  - Clean (will trash):            ${cleanCount}`);
  console.log(`  - Will skip trash (conflicts):   ${conflicting.length}`);
  console.log(`States with at least 1 merge:      ${willMerge.length}`);
  console.log(`Rows that would be archived:       ${willTrashTotal}`);

  if (conflicting.length > 0) {
    console.log("\nStates with strict-policy conflicts (trash skipped — manual resolution needed):");
    for (const p of conflicting) {
      const fields = p.fieldPlans.filter(f => f.action === "conflict").map(f => f.field.name).join(", ");
      console.log(`  ${p.name}: ${fields}`);
    }
  }

  // Surface fields that defaulted to strict because Sean didn't list them in either bucket.
  const defaultedFields = FIELDS.filter(f => !f.policyExplicit);
  if (defaultedFields.length > 0) {
    console.log("\nFields that defaulted to STRICT (not explicitly bucketed in spec — promote to auto-canonical if you want them merged silently):");
    for (const f of defaultedFields) {
      // Did this field actually generate any conflicts? Only worth Sean's attention if so.
      const stateConflicts = plans.filter(p =>
        p.fieldPlans.some(fp => fp.field.name === f.name && fp.action === "conflict")
      );
      console.log(`  ${f.name.padEnd(32)} (${f.kind}) — strict-default; conflicts on ${stateConflicts.length} state(s)${stateConflicts.length > 0 ? `: ${stateConflicts.map(s => s.name).join(", ")}` : ""}`);
    }
  }

  // Spot-check: confirm State FAQ merges from 04-08 onto canonical for each
  // of the 9 FAQ-migration-affected states (closes the FAQ-migration retry question).
  const FAQ_RETRY_STATES = ["Michigan", "New York", "Virginia", "Georgia", "Wisconsin", "Mississippi", "Tennessee", "Louisiana", "Missouri"];
  console.log("\nFAQ-migration retry spot-check (the 9 states whose FAQ landed on the 04-08 row):");
  for (const name of FAQ_RETRY_STATES) {
    const p = plans.find(pp => pp.name === name);
    if (!p) { console.log(`  ${name.padEnd(15)} NOT FOUND in plans (unexpected)`); continue; }
    const faqPlan = p.fieldPlans.find(fp => fp.field.name === "State FAQ");
    if (!faqPlan) { console.log(`  ${name.padEnd(15)} no State FAQ plan (unexpected)`); continue; }
    let status: string;
    if (faqPlan.action === "merge" || faqPlan.action === "merge-from-multiple-same") {
      status = `MERGE ✓ from ${faqPlan.fromPageId}`;
    } else if (faqPlan.action === "no-merge-canonical-set") {
      status = "canonical already has FAQ (no merge needed) — likely already correct";
    } else if (faqPlan.action === "no-merge-empty") {
      status = "empty everywhere (NO migration write found — investigate)";
    } else if (faqPlan.action === "conflict") {
      status = "CONFLICT (unexpected — investigate)";
    } else {
      status = `${faqPlan.action} (unexpected)`;
    }
    console.log(`  ${name.padEnd(15)} → ${status}`);
  }
  // Quick sanity check that the 11 clean migration states show no FAQ merge needed.
  const FAQ_CLEAN_STATES = ["Florida", "Texas", "California", "Indiana", "Illinois", "Oklahoma", "Nebraska", "Kansas", "Arizona", "Colorado", "Washington"];
  const cleanFaqMergeOk = FAQ_CLEAN_STATES.filter(name => {
    const p = plans.find(pp => pp.name === name);
    if (!p) return false;
    const faqPlan = p.fieldPlans.find(fp => fp.field.name === "State FAQ");
    return faqPlan?.action === "no-merge-canonical-set";
  });
  console.log(`Clean FAQ states (canonical already has FAQ, no merge needed): ${cleanFaqMergeOk.length}/${FAQ_CLEAN_STATES.length}`);

  // Per-state row count after consolidation
  console.log("\nPer-state row count after consolidation (excluding conflict states):");
  console.log("State              | Before | After | Action");
  console.log("-------------------+--------+-------+-------");
  for (const p of plans) {
    if (p.rows.length === 1) continue;
    const after = p.hasConflict ? p.rows.length : 1;
    const action = p.hasConflict ? "CONFLICT" : (p.fieldPlans.some(f => f.action === "merge" || f.action === "merge-from-multiple-same") ? "merge+trash" : "trash only");
    console.log(`${p.name.padEnd(18)} | ${String(p.rows.length).padStart(6)} | ${String(after).padStart(5)} | ${action}`);
  }

  // ─── Apply ───
  if (!APPLY) {
    console.log("\nDry run complete. No writes performed.");
    console.log("Re-run with --apply to merge content onto canonical and archive duplicates.");
    return;
  }

  console.log("\n--apply set — merging + trashing…\n");
  let okCount = 0, partialCount = 0;
  let totalFieldsMerged = 0, totalRowsTrashed = 0;
  for (const p of plans) {
    if (p.rows.length === 1) continue;
    try {
      const { mergedFields, trashed } = await applyMerges(p);
      if (p.hasConflict) {
        console.log(`PARTIAL ${p.name}: merged ${mergedFields} field(s) onto canonical, ${p.duplicatesUntouched.length} duplicate(s) left untouched (strict conflicts pending manual resolution)`);
        partialCount++;
      } else {
        console.log(`OK ${p.name}: merged ${mergedFields} field(s) onto canonical, archived ${trashed} duplicate(s)`);
        okCount++;
      }
      totalFieldsMerged += mergedFields;
      totalRowsTrashed += trashed;
    } catch (err) {
      console.error(`FAILED ${p.name}: ${(err as Error).message}`);
    }
  }
  console.log(`\nDone. ${okCount} state(s) fully consolidated, ${partialCount} state(s) merged-but-trash-skipped (strict conflict).`);
  console.log(`Total fields merged: ${totalFieldsMerged}. Total rows archived: ${totalRowsTrashed}.`);
})().catch(e => { console.error("FATAL:", e); process.exit(1); });

/* eslint-enable @typescript-eslint/no-explicit-any */
