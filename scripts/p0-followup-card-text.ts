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
 * Variant rows are the ones the site renders (getSchoolVariantsForState). Each
 * change is made only when the current text matches exactly.
 */
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
const ALL50_RE = /all 50 states/i;

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

  // 2c: scan every row of both DBs.
  const scan = async (dbId: string, dbName: string) => {
    for (const page of await queryAll(dbId)) {
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
