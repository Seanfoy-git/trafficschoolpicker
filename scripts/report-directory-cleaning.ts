/**
 * Directory DB clean-up at source (P0 follow-up, Task 3, 30 Oct 2026).
 *
 *   npx tsx scripts/report-directory-cleaning.ts --keep-richer           # DRY RUN (default): report, write nothing
 *   npx tsx scripts/report-directory-cleaning.ts --keep-richer --apply   # write (stops if the token can't write)
 *
 * Runs the site's own directory filter (lib/directory-filter) over every
 * state's raw Directory DB rows, then:
 *  a. archives every row the filter removes (Notion trash, recoverable for 30
 *     days). For duplicates the keep rule (Sean, 30 Oct 2026) is: a row with a
 *     price AND a price source beats one without; next, a row with a phone
 *     beats one without; otherwise the first row is kept. The rest are archived,
 *     and every keep decision is printed (KEEP lines);
 *  b. writes back the cleaned name where the filter cleans rather than removes
 *     (a URL, phone, address or licence id glued into the name);
 *  c. unchecks Online Available on the Georgia DDS rows (classroom clinics);
 *  d. clears placeholder licence numbers ("VA-DIC", "GA-approved", "NY-PIRP"…),
 *     so the table shows no licence rather than a fake one. Where the name
 *     itself carries the real licence number (Nevada's TSS numbers), that
 *     number is written instead of clearing, so cleaning the name doesn't lose it.
 *
 * Safety stops, before anything is written:
 *  - the per-state removal counts must equal the reviewed table
 *    (EXPECTED_REMOVED: AZ 240, CT 2, FL 2, GA 9, MD 11, NV 45, NJ 3, NY 4,
 *    ND 1, VA 59, WA 7; total 383); any difference stops the run and is reported;
 *  - the keep rule can keep a row other than the first (it did for Arizona
 *    licence 552 and New Jersey's Driving School of America). Sean approved
 *    that with --keep-richer; without the flag such a set stops the run.
 * The dry run also simulates the result of --apply and re-runs the filter on
 * it (acceptance: zero rows removed), lists the kept rows created after the
 * 30 Oct review, and simulates the next scraper refresh against the
 * post-apply table: the last scrape's rows replayed through the scrapers'
 * matching (lib/directory-filter DirectoryIndex: real licence, then cleaned
 * name). Acceptance: it creates nothing except schools new in the source.
 */
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { APPLY, assertWritable, fullText, notion } from "./lib/notion-edit";

const KEEP_RICHER = process.argv.includes("--keep-richer");
import { cleanDirectory, cleanName, DirectoryIndex, directoryListLabel, junkReason, licenceFromName, PLACEHOLDER_LICENSE, richness } from "../lib/directory-filter";
import { getAllStateSlugs, getStateBySlug } from "../lib/state-utils";
import type { DirectorySchool } from "../lib/types";

/** Reviewed removal counts (Sean, 2 Nov 2026, after the 1 Nov Monthly Data Refresh): 383 rows. */
const EXPECTED_REMOVED: Record<string, number> = {
  Arizona: 240, Connecticut: 2, Florida: 2, Georgia: 9, Maryland: 11, Nevada: 45, "New Jersey": 3, "New York": 4, "North Dakota": 1, Virginia: 59, Washington: 7,
};
const EXPECTED_TOTAL = 383;
/** Rows created after the 30 Oct review (the 1 Nov Monthly Data Refresh added some): the ones kept are listed for a check. */
const REVIEWED_AT = "2026-10-31T00:00:00Z";

type Row = DirectorySchool & { page: PageObjectResponse; created: string };

async function loadRows(): Promise<Row[]> {
  const db = process.env.NOTION_DIRECTORY_DB!;
  const out: Row[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion.databases.query({ database_id: db, start_cursor: cursor, page_size: 100 });
    for (const page of r.results as PageObjectResponse[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pr = page.properties as any;
      out.push({
        page,
        created: page.created_time,
        id: page.id,
        name: fullText(page, "School Name") ?? "",
        state: pr.State?.select?.name ?? fullText(page, "State") ?? "",
        licenseNumber: fullText(page, "License Number") ?? "",
        phone: fullText(page, "Phone") ?? "",
        address: fullText(page, "Address") ?? "",
        website: pr.Website?.url ?? null,
        onlineAvailable: !!pr["Online Available"]?.checkbox,
        source: pr.Source?.select?.name ?? fullText(page, "Source") ?? "",
        lastScraped: null,
        displayName: null,
        price: pr.Price?.number ?? null,
        priceSourceUrl: fullText(page, "Price Source URL") || pr["Price Source URL"]?.url || null,
        priceChecked: null, priceNote: null, priceIncludesFees: false,
        timers: null, timersSourceUrl: null, finalExam: null, finalExamSourceUrl: null, completionReporting: null, reportingSourceUrl: null,
      } as Row);
    }
    cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}

async function main() {
  if (!process.env.NOTION_TOKEN) throw new Error("NOTION_TOKEN not set (.env.local)");
  console.log(`Directory clean-up: ${APPLY ? "APPLY" : "DRY RUN (nothing written; pass --apply to write)"}\n`);
  const raw = await loadRows();

  const archive: { id: string; state: string; reason: string; name: string }[] = [];
  const updates = new Map<string, { state: string; name: string; props: Record<string, unknown>; notes: string[] }>();
  const upd = (r: Row) => {
    if (!updates.has(r.id)) updates.set(r.id, { state: r.state, name: r.name, props: {}, notes: [] });
    return updates.get(r.id)!;
  };
  const placeholderCounts = new Map<string, number>();
  const mismatches: string[] = [];
  const keepNotFirst: string[] = [];
  let total = 0;
  let licencesFromNames = 0;
  const newKept: string[] = [];

  console.log("state | raw rows | kept | removed | removed by reason | header");
  for (const slug of getAllStateSlugs()) {
    const st = getStateBySlug(slug)!;
    const rows = raw.filter((r) => r.state === st.name);
    if (!rows.length) continue;
    const { rows: kept, removed } = cleanDirectory(rows);
    total += removed.length;
    const by = new Map<string, number>();
    for (const x of removed) by.set(x.reason, (by.get(x.reason) ?? 0) + 1);
    const label = directoryListLabel(st.name, kept);
    console.log(`${st.name} | ${rows.length} | ${kept.length} | ${removed.length} | ${[...by].map(([k, v]) => `${k} ${v}`).join(", ") || "-"} | All ${kept.length} ${label.noun} (${label.source})`);
    if ((EXPECTED_REMOVED[st.name] ?? 0) !== removed.length) mismatches.push(`${st.name}: ${removed.length} removed, the reviewed table says ${EXPECTED_REMOVED[st.name] ?? 0}`);

    // a. archive. Duplicates: the richer row is kept (price + source, then phone), else the first.
    const order = new Map(rows.map((r, i) => [r.id, i]));
    const byId = new Map(rows.map((r) => [r.id, r]));
    const why = (r: Row) => [r.price != null && r.priceSourceUrl ? `price $${r.price} + source` : "no price+source", r.phone?.trim() ? "phone" : "no phone"].join(", ");
    for (const x of removed) {
      if (x.keptId) {
        const k = byId.get(x.keptId)!, d = byId.get(x.id)!;
        const firstKept = (order.get(x.keptId) ?? 0) < (order.get(x.id) ?? 0);
        const rule = richness(k) > richness(d) ? "richer" : "first (tie)";
        console.log(`KEEP     ${st.name} | ${x.reason} ${x.license} | keep ${JSON.stringify(k.name.slice(0, 60))} [${why(k)}; ${firstKept ? "first" : "later"} row] over ${JSON.stringify(d.name.slice(0, 60))} [${why(d)}] -> ${rule}`);
        if (!firstKept) keepNotFirst.push(`${st.name}: keeps ${JSON.stringify(k.name)} [${why(k)}] over the first, ${JSON.stringify(d.name)} [${why(d)}]`);
      }
      archive.push({ id: x.id, state: st.name, reason: x.reason, name: x.name });
    }

    const keptIds = new Set(kept.map((k) => k.id));
    for (const r of rows.filter((x) => keptIds.has(x.id) && x.created >= REVIEWED_AT)) {
      newKept.push(`${st.name} | ${JSON.stringify(cleanName(r.name))} | licence ${JSON.stringify(r.licenseNumber || "(none)")} | created ${r.created.slice(0, 10)} | page ${r.id}`);
    }
    for (const r of rows.filter((x) => keptIds.has(x.id))) {
      // b. cleaned name
      const clean = cleanName(r.name);
      if (clean !== r.name) {
        const u = upd(r);
        u.props["School Name"] = { title: [{ type: "text", text: { content: clean } }] };
        u.notes.push(`name ${JSON.stringify(r.name)} -> ${JSON.stringify(clean)}`);
      }
      // c. Georgia DDS clinics are classroom, not online
      if (r.source === "GA DDS" && r.onlineAvailable) {
        const u = upd(r);
        u.props["Online Available"] = { checkbox: false };
        u.notes.push("Online Available: checked -> unchecked");
      }
      // d. placeholder licence
      const lic = r.licenseNumber.trim();
      if (PLACEHOLDER_LICENSE.test(lic)) {
        placeholderCounts.set(lic, (placeholderCounts.get(lic) ?? 0) + 1);
        const fromName = licenceFromName(r.name);
        const u = upd(r);
        u.props["License Number"] = { rich_text: fromName ? [{ type: "text", text: { content: fromName } }] : [] };
        u.notes.push(`License Number ${JSON.stringify(lic)} -> ${fromName ? JSON.stringify(fromName) + " (from the name)" : "(empty)"}`);
        if (fromName) licencesFromNames++;
      }
    }
  }
  console.log(`total removed: ${total}\n`);

  for (const a of archive) console.log(`ARCHIVE  ${a.state} | ${a.reason} | ${JSON.stringify(a.name)} | page ${a.id}`);
  for (const [id, u] of updates) console.log(`UPDATE   ${u.state} | ${JSON.stringify(u.name)} | page ${id} | ${u.notes.join("; ")}`);
  const renames = [...updates.values()].filter((u) => u.props["School Name"]).length;
  const unchecks = [...updates.values()].filter((u) => u.props["Online Available"]).length;
  console.log(`\nsummary: ${archive.length} to archive; ${renames} names cleaned; ${unchecks} Georgia rows unchecked; ${[...placeholderCounts.values()].reduce((a, b) => a + b, 0)} placeholder licences cleared`);
  console.log(`placeholder licences: ${[...placeholderCounts].map(([k, v]) => `${k} ${v}`).join(", ") || "none"}; of these, ${licencesFromNames} get the licence number found in the name instead of empty`);
  const renamesByState = new Map<string, number>();
  for (const u of updates.values()) if (u.props["School Name"]) renamesByState.set(u.state, (renamesByState.get(u.state) ?? 0) + 1);
  console.log(`names cleaned by state: ${[...renamesByState].map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);

  // Simulate --apply and run the filter again: acceptance is zero removed.
  const archivedIds = new Set(archive.map((a) => a.id));
  const after: Row[] = raw.filter((r) => !archivedIds.has(r.id)).map((r) => {
    const u = updates.get(r.id);
    if (!u) return r;
    return {
      ...r,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name: u.props["School Name"] ? (u.props["School Name"] as any).title[0].text.content : r.name,
      onlineAvailable: u.props["Online Available"] ? false : r.onlineAvailable,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      licenseNumber: u.props["License Number"] ? ((u.props["License Number"] as any).rich_text[0]?.text.content ?? "") : r.licenseNumber,
    };
  });
  let rerun = 0;
  const rerunBy: string[] = [];
  for (const slug of getAllStateSlugs()) {
    const st = getStateBySlug(slug)!;
    const { removed } = cleanDirectory(after.filter((r) => r.state === st.name));
    rerun += removed.length;
    if (removed.length) rerunBy.push(`${st.name} ${removed.length} (${removed.slice(0, 3).map((x) => `${x.reason}: ${JSON.stringify(x.name)}`).join("; ")})`);
  }
  console.log(`simulated rerun after --apply: ${rerun} rows removed${rerunBy.length ? ` -> ${rerunBy.join(" | ")}` : ""}`);

  // Kept rows that weren't there at the 30 Oct review: check they're real schools.
  console.log(`\nkept rows created after the 30 Oct review (${newKept.length}):`);
  for (const n of newKept) console.log(`NEW      ${n}`);

  // Simulate the next refresh: replay the last scrape (every raw row, as scraped) through the
  // scrapers' matching against the post-apply table. Junk is skipped as the syncs skip it.
  console.log("\nsimulated next refresh against the post-apply table (state | updates | creates | skipped as junk):");
  let simCreates = 0;
  for (const slug of getAllStateSlugs()) {
    const st = getStateBySlug(slug)!;
    const source = raw.filter((r) => r.state === st.name);
    if (!source.length) continue;
    const index = new DirectoryIndex(after.filter((r) => r.state === st.name));
    let updates = 0, skipped = 0;
    const creates: string[] = [];
    for (const r of source) {
      if (junkReason(r.name)) { skipped++; continue; }
      if (index.match(r.name, r.licenseNumber)) updates++;
      else { creates.push(`${JSON.stringify(cleanName(r.name))} (${r.licenseNumber || "no licence"})`); index.add(`new:${r.id}`, r.name, r.licenseNumber); }
    }
    simCreates += creates.length;
    console.log(`${st.name} | ${updates} | ${creates.length} | ${skipped}${creates.length ? ` -> would create: ${creates.join("; ")}` : ""}`);
  }
  console.log(`simulated refresh: ${simCreates} row(s) created (the replayed source is the table itself, so any create is a matching gap)`);

  // Safety stops.
  if (total !== EXPECTED_TOTAL) mismatches.push(`total ${total}, the reviewed table says ${EXPECTED_TOTAL}`);
  if (mismatches.length || (keepNotFirst.length && !KEEP_RICHER)) {
    console.error(`\nSTOP before writing anything:`);
    for (const m of mismatches) console.error(`  count differs: ${m}`);
    if (!KEEP_RICHER) for (const k of keepNotFirst) console.error(`  keeps a row other than the first: ${k} (approved: rerun with --keep-richer)`);
    process.exit(1);
  }
  console.log(`\ncounts match the reviewed table (${Object.entries(EXPECTED_REMOVED).map(([k, v]) => `${k} ${v}`).join(", ")}; total ${EXPECTED_TOTAL}).`);
  if (keepNotFirst.length) console.log(`keeps that are not the first row (--keep-richer): \n  ${keepNotFirst.join("\n  ")}`);

  if (!APPLY) return;
  const first = archive[0]?.id ?? [...updates.keys()][0];
  if (first) await assertWritable(first);
  for (const a of archive) {
    await notion.pages.update({ page_id: a.id, archived: true });
    console.log(`  ✓ archived ${a.state} ${JSON.stringify(a.name)}`);
    await new Promise((r) => setTimeout(r, 350));
  }
  for (const [id, u] of updates) {
    await notion.pages.update({ page_id: id, properties: u.props as never });
    console.log(`  ✓ updated ${u.state} ${JSON.stringify(u.name)}: ${u.notes.join("; ")}`);
    await new Promise((r) => setTimeout(r, 350));
  }
  console.log("\nApplied. Rerun this script: it should report 0 rows removed. Then rebuild and check every directory header against its rows.");
}

main().catch((e) => { console.error(e); process.exit(1); });
