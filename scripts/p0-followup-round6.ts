/**
 * P0 follow-up, round 6 (Sean, 3 Nov 2026), PR #71 additions:
 *  2. "No final exam" clauses in One Liner / Best For: the clause deleted, the
 *     rest kept (a field left empty is cleared). Virginia DMV requires a final
 *     test; our NJ table says Final exam: Yes.
 *  3. States DB > Virginia > Notes ("Research Notes", the field the site reads as
 *     stateInfo.notes and llms-full prints): the INS clause rewritten. Source: Virginia
 *     DMV, Driver Improvement reasons, https://dmv.virginia.gov/licenses-ids/improvement/di-reason
 *     (read 2 Nov 2026): INS is listed separately from VOL, with no age limit.
 *
 *   npx tsx scripts/p0-followup-round6.ts           # DRY RUN: prints every change, writes nothing
 *   NOTION_TOKEN=<write token> npx tsx scripts/p0-followup-round6.ts --apply
 *
 * Exact match or skip and report. Any other "final exam" clause found in these
 * fields is FLAGGED (not changed).
 */
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { APPLY, applyAll, changes, flags, fullText, getPage, notion, printPlan, richText, skips } from "./lib/notion-edit";
import { getSchoolVariantsForState, getStateInfo } from "../lib/notion";

const VDB = "School State Variants";
const SDB = "Traffic Schools DB";
const DB = "States DB";

/** [variant "slug:STATE", field, OLD, NEW] — NEW is OLD with the clause deleted. */
const VARIANT_EDITS: Array<[string, "One Liner" | "Best For", string, string]> = [
  ["drivesafeonline:VA", "One Liner", "DMV-approved Driver Improvement Clinic, 4.8 stars, cinematic video, no final exam", "DMV-approved Driver Improvement Clinic, 4.8 stars, cinematic video"],
  ["drivesafeonline:NJ", "One Liner", "NJ MVC-approved defensive driving, 4.8 stars, no final exam, removes 2 points from your record", "NJ MVC-approved defensive driving, 4.8 stars, removes 2 points from your record"],
  ["driversed:NJ", "One Liner", "NJ MVC-approved defensive driving from a trusted provider, no final exam required", "NJ MVC-approved defensive driving from a trusted provider"],
  ["driversed:NJ", "Best For", "NJ drivers who want a well-reviewed, established provider to knock points off their record and lock in an insurance discount without the stress of a final exam.", "NJ drivers who want a well-reviewed, established provider to knock points off their record and lock in an insurance discount."],
  ["gototrafficschool:NJ", "Best For", "NJ drivers who want the lowest-cost way to knock 2 points off their record and lock in an insurance discount without sitting through a final exam.", "NJ drivers who want the lowest-cost way to knock 2 points off their record and lock in an insurance discount."],
  ["safe2drive:VA", "One Liner", "DMV-approved Driver Improvement Clinic, no final exam, earn safe driving points to offset your ticket", "DMV-approved Driver Improvement Clinic, earn safe driving points to offset your ticket"],
  ["safe2drive:NJ", "One Liner", "NJ MVC-approved defensive driving, no final exam, no timers, done on your schedule", "NJ MVC-approved defensive driving, no timers, done on your schedule"],
  ["defensivedriversinstitute:VA", "One Liner", "Virginia DMV-approved Driver Improvement Clinic, earn 5 safe driving points, no final exam", "Virginia DMV-approved Driver Improvement Clinic, earn 5 safe driving points"],
  ["nscdefensivedriving:NJ", "One Liner", "NJ MVC-approved defensive driving, narrated course, 2-point reduction, no final exam", "NJ MVC-approved defensive driving, narrated course, 2-point reduction"],
];
/** Traffic Schools > Safe2Drive > One Liner. */
const S2D_OLD = "No final exam, state-approved, simple traffic school";
const S2D_NEW = "State-approved, simple traffic school";

/** States DB > Virginia > "Research Notes": the INS clause. */
const NOTES_FIELD = "Research Notes";
const VA_INS_RE = /INS \(voluntary, insurance discount only, ages 54 and under[^)]*\)/g;
const VA_INS_NEW = "INS (for an insurance premium discount; no safe-driving points; check eligibility with your insurer)";

const FINAL_EXAM = /final (exam|test)/i;

async function queryAll(dbId: string): Promise<PageObjectResponse[]> {
  const out: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion.databases.query({ database_id: dbId, start_cursor: cursor, page_size: 100 });
    out.push(...(r.results as PageObjectResponse[]));
    cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}
const titleOf = (p: PageObjectResponse) => {
  const t = Object.entries(p.properties).find(([, v]) => v.type === "title")?.[0];
  return (t && fullText(p, t)) || p.id;
};

async function main() {
  if (!process.env.NOTION_TOKEN) throw new Error("NOTION_TOKEN not set (.env.local)");
  const handled = new Set<string>(); // pageId|field

  // 2. Variant fields, on the rows the site renders.
  const variants = new Map([...(await getSchoolVariantsForState("VA")), ...(await getSchoolVariantsForState("NJ"))]);
  for (const [key, field, oldT, newT] of VARIANT_EDITS) {
    const v = variants.get(key);
    if (!v) { skips.push({ db: VDB, page: key, field, reason: "no variant row", found: "" }); continue; }
    const page = await getPage(v.id);
    const cur = fullText(page, field) ?? "";
    handled.add(`${v.id}|${field}`);
    if (cur !== oldT) { skips.push({ db: VDB, page: `${key} (page ${v.id})`, field, reason: "current text is not the reviewed OLD text", found: cur }); continue; }
    changes.push({ db: VDB, page: `${key} (page ${v.id})`, pageId: v.id, field, current: oldT, next: newT, property: { [field]: { rich_text: richText(newT) } } });
  }

  // 2. Safe2Drive's Traffic Schools record.
  const schools = await queryAll(process.env.NOTION_SCHOOLS_DB!);
  const s2d = schools.filter((p) => (fullText(p, "One Liner") ?? "") === S2D_OLD);
  if (s2d.length !== 1) {
    skips.push({ db: SDB, page: "Safe2Drive", field: "One Liner", reason: `${s2d.length} rows carry the reviewed OLD text (expected exactly 1)`, found: s2d.map((p) => `${titleOf(p)} (page ${p.id})`).join("; ") });
  } else {
    const p = s2d[0];
    handled.add(`${p.id}|One Liner`);
    changes.push({ db: SDB, page: `${titleOf(p)} (page ${p.id})`, pageId: p.id, field: "One Liner", current: S2D_OLD, next: S2D_NEW, property: { "One Liner": { rich_text: richText(S2D_NEW) } } });
  }

  // Any other final-exam clause in One Liner / Best For: flagged, not changed.
  for (const p of schools) for (const f of ["One Liner", "Best For"]) {
    const t = fullText(p, f) ?? "";
    if (FINAL_EXAM.test(t) && !handled.has(`${p.id}|${f}`)) flags.push({ db: SDB, page: `${titleOf(p)} (page ${p.id})`, field: f, note: "mentions a final exam; not in the reviewed list, unchanged", found: t });
  }
  for (const [key, v] of variants) for (const f of ["One Liner", "Best For"] as const) {
    const t = f === "One Liner" ? v.oneLiner : v.bestFor;
    if (t && FINAL_EXAM.test(t) && !handled.has(`${v.id}|${f}`)) flags.push({ db: VDB, page: `${key} (page ${v.id})`, field: f, note: "mentions a final exam; not in the reviewed list, unchanged", found: t });
  }

  // 3. Virginia Notes: the INS clause.
  const va = await getStateInfo("VA");
  if (!va) skips.push({ db: DB, page: "VA", field: NOTES_FIELD, reason: "no canonical States row", found: "" });
  else {
    const page = await getPage(va.id);
    const notes = fullText(page, NOTES_FIELD) ?? "";
    const hits = [...notes.matchAll(VA_INS_RE)];
    if (hits.length !== 1) skips.push({ db: DB, page: `Virginia (VA, page ${va.id})`, field: `${NOTES_FIELD} (INS clause)`, reason: `${hits.length} INS clauses match (expected exactly 1)`, found: notes });
    else {
      const next = notes.replace(hits[0][0], VA_INS_NEW);
      console.log(`INFO    Virginia ${NOTES_FIELD}, full current text:\n${notes}\n`);
      changes.push({ db: DB, page: `Virginia (VA, page ${va.id})`, pageId: va.id, field: `${NOTES_FIELD} (INS clause)`, current: hits[0][0], next: VA_INS_NEW, property: { [NOTES_FIELD]: { rich_text: richText(next) } } });
    }
  }

  printPlan("P0 follow-up round 6 (PR #71): final-exam clauses and the Virginia INS note");
  if (APPLY && (skips.length || flags.length)) {
    console.error("\nSTOP: not applying, because something was skipped or flagged (round 6 rule: every match exact and nothing flagged).");
    process.exit(1);
  }
  await applyAll();
  if (APPLY) console.log("\nApplied. Rebuild the preview and rerun scripts/verify-p0-followup.ts.");
}

main().catch((e) => { console.error(e); process.exit(1); });
