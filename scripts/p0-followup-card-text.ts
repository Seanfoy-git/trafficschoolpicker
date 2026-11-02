/**
 * P0 follow-up, Task 2 (30 Oct 2026): card text in the School State Variants
 * and Traffic Schools DBs. Wording reviewed by Sean.
 *
 *   npx tsx scripts/p0-followup-card-text.ts           # DRY RUN: prints every change, writes nothing
 *   npx tsx scripts/p0-followup-card-text.ts --apply   # writes (stops if the token can't write)
 *
 * 2a. Delete (not reword) "No final exam" pros that contradict the verified
 *     table / the regulator: VA (Virginia DMV: the online course and final test
 *     go through a DMV-licensed provider,
 *     https://www.dmv.virginia.gov/licenses-ids/improvement/clinics) and NJ (our
 *     NJ table says Final exam: Yes; NJ MVC's page doesn't mention an exam).
 * 2b. idrivesafely:VA "Approved by the Virginia DMV, accepted statewide" ->
 *     "Approved by the Virginia DMV" (a court that orders a clinic decides
 *     whether it earns the credit, Va. Code § 46.2-505(A)).
 * 2c. Every Pros, One Liner or Best For value containing "all 50 states", in
 *     the Traffic Schools DB and any School State Variants override: the three
 *     reviewed texts are deleted/replaced; any other hit is FLAGGED, unchanged.
 *     Cons are out of scope (DriveSafe Online's "Not available in all 50
 *     states" is accurate and stays).
 *
 * 2d. Two Traffic Schools rows the site doesn't render (a second DriversEd.com
 *     row and "[ARCHIVED DUP] iDriveSafely") are archived only if no row in any
 *     other database relates to them: Notion relations from School Pricing,
 *     School State Variants, School Directory and Affiliate Programs, and the
 *     slug text the variants join on. Affiliate Programs isn't shared with the
 *     site token; pass --affiliate-programs-db=<id> with a token that can read
 *     it. Anything related, or anything that can't be checked, means no archive:
 *     their "all 50 states" pros and One Liner text are deleted instead, and the
 *     relations are listed.
 *
 * Variant rows are the ones the site renders (getSchoolVariantsForState). Each
 * change is made only when the current text matches exactly.
 */
import { readFileSync } from "node:fs";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { APPLY, applyAll, changes, flags, fullText, notion, printPlan, richText, skips, splitList } from "./lib/notion-edit";
import { getSchoolVariantsForState } from "../lib/notion";

const VDB = "School State Variants";
const SDB = "Traffic Schools DB";

// 2a
const NO_EXAM: Array<[string, string]> = [
  ["drivesafeonline:VA", "No final exam required to complete the course"],
  ["trafficschoolonline:VA", "No final exam required to complete the course"],
  ["gototrafficschool:VA", "No final exam required to complete the course"],
  ["drivesafeonline:NJ", "No final exam required, just complete the course"],
  ["gototrafficschool:NJ", "No final exam required, just complete the course"],
  ["trafficschoolonline:NJ", "No final exam required to complete the course"],
  ["idrivesafely:NJ", "No final exam required to complete the course"],
];
// 2b
const IDS_VA: [string, string, string] = ["idrivesafely:VA", "Approved by the Virginia DMV, accepted statewide", "Approved by the Virginia DMV"];
// 2c: exact text -> replacement (null = delete the pro)
const ALL50: Record<string, string | null> = {
  "Available in all 50 states": null,
  "Trusted since 1998, available in all 50 states, with a premium course experience": "Trusted since 1998, with a premium course experience",
  "Among the most widely accepted online traffic schools, available in all 50 states":
    "National online provider. Check it's approved for your state's program before you buy.",
};
const ALL50_RE = /all[- ]50[- ]states?/i;

// 2d: rows the site doesn't render (from the first dry run), matched by page id AND title.
const UNUSED_ROWS = [
  { id: "9149e794-4352-823d-bfef-81bb0d1554d8", title: "DriversEd.com" },
  { id: "5e39e794-4352-837c-930c-016f6befff47", title: "[ARCHIVED DUP] iDriveSafely" },
];
const AFFILIATE_DB = process.argv.find((a) => a.startsWith("--affiliate-programs-db="))?.split("=")[1] ?? null;

/**
 * Affiliate Programs stays off the site token (read-only, scoped to site data
 * since the August incident). The check runs only with the write token used
 * for --apply, passed in the environment:
 *   NOTION_TOKEN=<write token> npx tsx scripts/p0-followup-card-text.ts --affiliate-programs-db=<id>
 * If NOTION_TOKEN is still the site token from .env.local, stop.
 */
function assertNotSiteToken() {
  if (!AFFILIATE_DB) return;
  let siteToken: string | undefined;
  try {
    const env = readFileSync(".env.local", "utf8").match(/^\s*NOTION_TOKEN\s*=\s*(.*)\s*$/m);
    siteToken = env?.[1].replace(/^["']|["']$/g, "");
  } catch { /* no .env.local: nothing to compare against */ }
  if (!process.env.NOTION_TOKEN || (siteToken && process.env.NOTION_TOKEN === siteToken)) {
    console.error(
      "STOP: --affiliate-programs-db must run with the write token, never the site token in .env.local.\n" +
        "  NOTION_TOKEN=<write token> npx tsx scripts/p0-followup-card-text.ts --affiliate-programs-db=<id> [--apply]",
    );
    process.exit(2);
  }
}
const norm = (id: string) => id.replace(/-/g, "");

/** Every Notion relation into the Traffic Schools DB that points at `pageId`, across the databases we can read. */
async function relationsTo(pageId: string): Promise<{ found: string[]; unchecked: string[] }> {
  const schoolsDb = norm(process.env.NOTION_SCHOOLS_DB!);
  const dbs: Array<[string, string | undefined]> = [
    ["School Pricing", process.env.NOTION_PRICING_DB],
    ["School State Variants", process.env.NOTION_SCHOOL_VARIANTS_DB],
    ["School Directory", process.env.NOTION_DIRECTORY_DB],
    ["Affiliate Programs", AFFILIATE_DB ?? undefined],
  ];
  const found: string[] = [];
  const unchecked: string[] = [];
  for (const [name, id] of dbs) {
    if (!id) { unchecked.push(`${name}: no database id (not shared with this token; pass --affiliate-programs-db=<id>)`); continue; }
    let schema;
    try { schema = await notion.databases.retrieve({ database_id: id }); } catch (e) { unchecked.push(`${name}: can't read (${(e as { code?: string }).code ?? e})`); continue; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [prop, def] of Object.entries((schema as any).properties) as [string, any][]) {
      if (def.type !== "relation" || norm(def.relation.database_id) !== schoolsDb) continue;
      const r = await notion.databases.query({ database_id: id, filter: { property: prop, relation: { contains: pageId } } });
      for (const row of r.results as PageObjectResponse[]) found.push(`${name} > ${title(row)} (page ${row.id}) via "${prop}"`);
    }
  }
  return { found, unchecked };
}

/** Pending list edits per page+field, so several edits to one Pros field become one write. */
const pending = new Map<string, { pageId: string; db: string; page: string; field: string; raw: string; items: string[]; join: (x: string[]) => string; notes: string[] }>();
function listEdit(pageId: string, db: string, page: string, field: string, raw: string) {
  const key = `${pageId}|${field}`;
  if (!pending.has(key)) {
    const { items, join } = splitList(raw);
    pending.set(key, { pageId, db, page, field, raw, items: [...items], join, notes: [] });
  }
  return pending.get(key)!;
}

async function queryAll(db: string): Promise<PageObjectResponse[]> {
  const out: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion.databases.query({ database_id: db, start_cursor: cursor, page_size: 100 });
    out.push(...(r.results as PageObjectResponse[]));
    cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}
const title = (p: PageObjectResponse) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Object.values(p.properties).find((x: any) => x.type === "title") as any)?.title?.map((t: any) => t.plain_text).join("") ?? p.id;

async function main() {
  if (!process.env.NOTION_TOKEN) throw new Error("NOTION_TOKEN not set (.env.local)");
  assertNotSiteToken();

  // 2a + 2b, on the variant rows the site renders.
  const variants = new Map([...(await getSchoolVariantsForState("VA")), ...(await getSchoolVariantsForState("NJ"))]);
  const edits: Array<[string, string, string | null]> = [...NO_EXAM.map(([k, t]) => [k, t, null] as [string, string, null]), [IDS_VA[0], IDS_VA[1], IDS_VA[2]]];
  for (const [key, oldPro, newPro] of edits) {
    const v = variants.get(key);
    if (!v) { skips.push({ db: VDB, page: key, field: "Pros", reason: "no variant row", found: "" }); continue; }
    const page = (await notion.pages.retrieve({ page_id: v.id })) as PageObjectResponse;
    const raw = fullText(page, "Pros") ?? "";
    const e = listEdit(v.id, VDB, `${key} (page ${v.id})`, "Pros", raw);
    const i = e.items.indexOf(oldPro);
    if (i < 0) { skips.push({ db: VDB, page: key, field: "Pros", reason: `pro ${JSON.stringify(oldPro)} not found exactly`, found: raw }); continue; }
    if (newPro === null) e.items.splice(i, 1); else e.items[i] = newPro;
    e.notes.push(newPro === null ? `delete ${JSON.stringify(oldPro)}` : `${JSON.stringify(oldPro)} -> ${JSON.stringify(newPro)}`);
  }

  // 2d: archive the two unused rows only if nothing relates to them.
  const unusedIds = new Set<string>();
  for (const u of UNUSED_ROWS) {
    const page = (await notion.pages.retrieve({ page_id: u.id })) as PageObjectResponse;
    const t = title(page);
    if (t !== u.title) { skips.push({ db: SDB, page: u.id, field: "(row)", reason: `title is not ${JSON.stringify(u.title)}`, found: t }); continue; }
    unusedIds.add(u.id);
    const name = `${t} (page ${u.id})`;
    const { found, unchecked } = await relationsTo(u.id);
    // Variants join on slug text. A slug match counts only if no live Traffic Schools row
    // (Status = Active and Show On Site, the site's own filter) carries that slug: if one
    // does, the variants belong to it, not to this row.
    const slug = fullText(page, "Slug") ?? "";
    if (slug) {
      const v = await notion.databases.query({ database_id: process.env.NOTION_SCHOOL_VARIANTS_DB!, filter: { property: "School Slug", rich_text: { equals: slug } } });
      if (v.results.length) {
        const live = (await notion.databases.query({
          database_id: process.env.NOTION_SCHOOLS_DB!,
          filter: { and: [{ property: "Status", select: { equals: "Active" } }, { property: "Show On Site", checkbox: { equals: true } }, { property: "Slug", rich_text: { equals: slug } }] },
        })).results.filter((r) => r.id !== u.id) as PageObjectResponse[];
        if (live.length) console.log(`INFO    ${name}: ${v.results.length} School State Variants row(s) with School Slug "${slug}" belong to the live row ${title(live[0])} (page ${live[0].id}); not counted`);
        else found.push(`School State Variants: ${v.results.length} row(s) with School Slug "${slug}", and no live Traffic Schools row carries that slug`);
      }
    }
    if (!found.length && !unchecked.length) {
      changes.push({ db: SDB, page: name, pageId: u.id, field: "(archive row)", current: "row present (no relations found in any database)", next: "archived (Notion trash, 30 days)", property: {}, archive: true });
      continue;
    }
    for (const f of found) flags.push({ db: SDB, page: name, field: "(relation)", note: "relates to this row, so it is not archived", found: f });
    for (const x of unchecked) flags.push({ db: SDB, page: name, field: "(relation check)", note: "couldn't be checked, so the row is not archived", found: x });
    // Fallback: delete its "all 50 states" pros and One Liner text.
    const pros = fullText(page, "Pros") ?? "";
    if (ALL50_RE.test(pros)) {
      const e = listEdit(u.id, SDB, name, "Pros", pros);
      for (const item of [...e.items]) if (ALL50_RE.test(item)) { e.items.splice(e.items.indexOf(item), 1); e.notes.push(`delete ${JSON.stringify(item)}`); }
    }
    const ol = fullText(page, "One Liner") ?? "";
    if (ALL50_RE.test(ol)) changes.push({ db: SDB, page: name, pageId: u.id, field: "One Liner", current: ol, next: "", property: { "One Liner": { rich_text: [] } } });
    const bf = fullText(page, "Best For") ?? "";
    if (ALL50_RE.test(bf)) flags.push({ db: SDB, page: name, field: "Best For", note: "coverage claim outside the reviewed fields (Pros, One Liner); unchanged", found: bf });
  }

  // 2c: scan every row of both DBs.
  const scan = async (dbId: string, dbName: string) => {
    for (const page of await queryAll(dbId)) {
      if (unusedIds.has(page.id)) continue; // handled by 2d
      const name = `${title(page)} (page ${page.id})`;
      const fields = Object.keys(page.properties).filter((f) => /^Pros\b|^One Liner$|^Best For$/.test(f));
      for (const field of fields) {
        const raw = fullText(page, field) ?? "";
        if (!ALL50_RE.test(raw)) continue;
        if (field.startsWith("Pros")) {
          const e = listEdit(page.id, dbName, name, field, raw);
          for (const item of [...e.items]) {
            if (!ALL50_RE.test(item)) continue;
            if (item in ALL50) {
              const rep = ALL50[item];
              const i = e.items.indexOf(item);
              if (rep === null) e.items.splice(i, 1); else e.items[i] = rep;
              e.notes.push(rep === null ? `delete ${JSON.stringify(item)}` : `${JSON.stringify(item)} -> ${JSON.stringify(rep)}`);
            } else {
              flags.push({ db: dbName, page: name, field, note: "contains \"all 50 states\" but isn't one of the reviewed texts; unchanged", found: item });
            }
          }
        } else if (raw in ALL50 && ALL50[raw] !== null) {
          changes.push({ db: dbName, page: name, pageId: page.id, field, current: raw, next: ALL50[raw]!, property: { [field]: { rich_text: richText(ALL50[raw]!) } } });
        } else {
          flags.push({ db: dbName, page: name, field, note: "contains \"all 50 states\" but isn't one of the reviewed texts; unchanged", found: raw });
        }
      }
    }
  };
  await scan(process.env.NOTION_SCHOOLS_DB!, SDB);
  await scan(process.env.NOTION_SCHOOL_VARIANTS_DB!, VDB);

  // List edits become one change per field.
  for (const e of pending.values()) {
    const next = e.join(e.items);
    if (next === e.raw) continue;
    changes.push({ db: e.db, page: e.page, pageId: e.pageId, field: `${e.field} [${e.notes.join("; ")}]`, current: e.raw, next, property: { [e.field]: { rich_text: richText(next) } } });
  }

  printPlan("P0 follow-up Task 2: card text");
  await applyAll();
  if (APPLY) console.log("\nApplied. Rebuild and check /virginia, /new-jersey, every page for \"all 50 states\", and the llms files.");
}

main().catch((e) => { console.error(e); process.exit(1); });
