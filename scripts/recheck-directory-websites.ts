/**
 * Re-check every directory website not set by hand (17 Nov 2026 brief, Task 3).
 *
 * Scope, row by row: a row with a Website whose Website Source is not Manual
 * (and Enrichment Status not Manual / Skipped).
 *   - State DMV: the state's own list (a scraper dry run, SCRAPER_DRY_RUN capture
 *     file) gives this school the same website. No Places call.
 *   - Everything else goes to Google Places with the enrich-places matcher
 *     (scripts/lib/places-match), one lookup per licence (per row where the
 *     licence is a placeholder), and gets one verdict:
 *       Confirmed     a proved listing whose website is the same registrable domain
 *       Changed       a proved listing with a different website: propose it
 *       Address only  a listing at the row's address without the school's name: propose clearing
 *       Unconfirmed   nothing proved: propose clearing (the table shows "—")
 *
 *   npx tsx scripts/recheck-directory-websites.ts --estimate --state-capture a.jsonl[,b.jsonl]
 *        scope and list-price cost; no Places calls
 *   npx tsx scripts/recheck-directory-websites.ts --lookup --state-capture … --lookups file.json
 *        Places lookups, saved to the file after each one (re-running resumes);
 *        stops before list price would pass the cap. Writes nothing to Notion.
 *   npx tsx scripts/recheck-directory-websites.ts --report --state-capture … --lookups file.json --out research/….md
 *   npx tsx scripts/recheck-directory-websites.ts --apply --state-capture … --lookups file.json
 *        writes the verdicts from the saved lookups (no Places calls). Only after
 *        Sean approves the report. A row whose Website changed since the lookup is skipped.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { existsSync, readFileSync, writeFileSync } from "fs";
import { makeNotionClient } from "./lib/notion-client";
import { isHandSet, loadDirectory, PROP, type DirRow } from "./lib/directory-rows";
import { CANDIDATES, PRICES, usage } from "./lib/places-client";
import { lookup, textQuery, type Lookup } from "./lib/places-lookup";
import { differentSchools, isPlaceholderLicence, normLicence, registrableDomain } from "./lib/places-match";

const arg = (name: string) => process.argv.find((_, i) => process.argv[i - 1] === name);
const has = (name: string) => process.argv.includes(name);
const CAP_USD = 120;

// ─── Scope ────────────────────────────────────────────────

interface Captured { state: string; name: string; licence: string; website: string }

/** Same website, ignoring scheme, "www.", host case and a trailing slash. */
const normUrl = (u: string) => u.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "").replace(/^[^/]+/, (h) => h.toLowerCase());

function loadCaptures(): Map<string, Captured> {
  const files = (arg("--state-capture") ?? "").split(",").filter(Boolean);
  if (!files.length) throw new Error("--state-capture <file.jsonl[,…]> is required (scraper dry runs with SCRAPER_DRY_RUN=<file>)");
  const m = new Map<string, Captured>();
  for (const f of files) {
    for (const line of readFileSync(f, "utf8").split("\n").filter(Boolean)) {
      const c = JSON.parse(line) as Captured;
      if (c.website) m.set(`${c.state}|${c.name.toLowerCase()}`, c); // scraper-utils matches rows by state + name
    }
  }
  return m;
}

export type Verdict = "State DMV" | "Confirmed" | "Changed" | "Address only" | "Unconfirmed";

/** Rows sharing a real licence in a state are one school: one lookup. */
const groupKey = (r: DirRow) => (isPlaceholderLicence(r.licence) ? `row|${r.id}` : `lic|${r.state}|${normLicence(r.licence)}`);

function scope(rows: DirRow[], captures: Map<string, Captured>) {
  const inScope = rows.filter((r) => r.website && !isHandSet(r));
  const stateDmv: DirRow[] = [];
  const places: DirRow[] = [];
  for (const r of inScope) {
    const c = captures.get(`${r.state}|${r.name.toLowerCase()}`);
    if (r.websiteSource === "State DMV" || (c && normUrl(c.website) === normUrl(r.website))) stateDmv.push(r);
    else places.push(r);
  }
  const groups = new Map<string, DirRow[]>();
  for (const r of places) groups.set(groupKey(r), [...(groups.get(groupKey(r)) ?? []), r]);
  return { inScope, stateDmv, places, groups };
}

// ─── Lookups file ─────────────────────────────────────────

interface SavedLookup {
  key: string;
  rowIds: string[];
  /** Each row's Website when looked up: the apply skips a row whose Website has changed since. */
  rowWebsites: Record<string, string>;
  /** The row looked up for the group (the one with the fullest address). */
  asRow: { licence: string; name: string; address: string; state: string };
  query: string;
  at: string;
  result: Lookup;
  calls: { textSearch: number; details: number };
}

type LookupsFile = { created: string; lookups: Record<string, SavedLookup> };

function readLookups(path: string): LookupsFile {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { created: new Date().toISOString(), lookups: {} };
}

const listPrice = (textSearch: number, details: number) => (textSearch * PRICES.textSearchPro.per1000 + details * PRICES.placeDetailsEnterprise.per1000) / 1000;

// ─── Verdicts ─────────────────────────────────────────────

interface RowVerdict { row: DirRow; verdict: Verdict; proposed: string | null; why: string; lookup?: SavedLookup }

function verdicts(rows: DirRow[], captures: Map<string, Captured>, file: LookupsFile): { list: RowVerdict[]; missing: number } {
  const { stateDmv, groups } = scope(rows, captures);
  const out: RowVerdict[] = stateDmv.map((row) => ({ row, verdict: "State DMV", proposed: row.website, why: "the state's list gives this website" }));
  // A listing proved for two different schools proves neither (order must not decide).
  const acceptedBy = new Map<string, SavedLookup[]>();
  for (const s of Object.values(file.lookups)) if (s.result.found) acceptedBy.set(s.result.candidate.id, [...(acceptedBy.get(s.result.candidate.id) ?? []), s]);
  let missing = 0;
  for (const [key, group] of groups) {
    const s = file.lookups[key];
    if (!s) {
      missing++;
      continue;
    }
    for (const row of group) {
      const r = s.result;
      if (r.found) {
        const clash = (acceptedBy.get(r.candidate.id) ?? []).find((o) => o.key !== key && differentSchools(o.asRow, s.asRow));
        if (clash) {
          out.push({ row, verdict: "Unconfirmed", proposed: null, why: `listing ${r.candidate.displayName} (${r.candidate.id}) was also proved for ${clash.asRow.licence} ${clash.asRow.name}`, lookup: s });
        } else if (!r.website) {
          out.push({ row, verdict: "Unconfirmed", proposed: null, why: `proved listing ${r.candidate.displayName} has no website`, lookup: s });
        } else if (registrableDomain(r.website) === registrableDomain(row.website)) {
          out.push({ row, verdict: "Confirmed", proposed: row.website, why: `${r.rule}, ${r.evidence} evidence: ${r.candidate.displayName}, ${r.candidate.formattedAddress}`, lookup: s });
        } else {
          out.push({ row, verdict: "Changed", proposed: r.website, why: `${r.rule}, ${r.evidence} evidence: ${r.candidate.displayName}, ${r.candidate.formattedAddress}`, lookup: s });
        }
      } else if (r.addressOnly.length) {
        out.push({ row, verdict: "Address only", proposed: null, why: r.addressOnly.map((c) => `${c.displayName}, ${c.formattedAddress}${r.websites[c.id] ? `, ${r.websites[c.id]}` : ""}`).join("; "), lookup: s });
      } else {
        out.push({ row, verdict: "Unconfirmed", proposed: null, why: r.reason, lookup: s });
      }
    }
  }
  return { list: out, missing };
}

// ─── Modes ────────────────────────────────────────────────

function estimate(rows: DirRow[], captures: Map<string, Captured>) {
  const { inScope, stateDmv, places, groups } = scope(rows, captures);
  const n = groups.size;
  // Details: the accepted listing's website, plus any at-address candidates without the name (at most CANDIDATES).
  const typical = listPrice(n, n);
  const worst = listPrice(n, n * (CANDIDATES + 1));
  console.log(`In scope: ${inScope.length} rows with a Website not set by hand (${rows.filter((r) => r.website && isHandSet(r)).length} hand-set left out).`);
  console.log(`  State DMV (state list gives the same website, no Places call): ${stateDmv.length}`);
  console.log(`  Places re-check: ${places.length} rows, ${n} lookups (one per licence)`);
  console.log(`  List price: Text Search Pro ${n} × $0.032 = $${listPrice(n, 0).toFixed(2)}; with one Place Details per lookup $${typical.toFixed(2)}; worst case (${CANDIDATES + 1} Details each) $${worst.toFixed(2)}. Cap $${CAP_USD}: the lookup run stops before passing it.`);
  return { n, typical };
}

async function runLookups(rows: DirRow[], captures: Map<string, Captured>, path: string) {
  const { groups } = scope(rows, captures);
  const file = readLookups(path);
  const spentBefore = Object.values(file.lookups).reduce((a, s) => a + listPrice(s.calls.textSearch, s.calls.details), 0);
  let spent = spentBefore;
  let done = 0;
  for (const [key, group] of groups) {
    if (file.lookups[key]) continue;
    // Next lookup costs at most one search + CANDIDATES + 1 Details.
    if (spent + listPrice(1, CANDIDATES + 1) > CAP_USD) {
      console.log(`Stopping before the $${CAP_USD} cap: $${spent.toFixed(2)} spent at list price; ${groups.size - Object.keys(file.lookups).length} lookups left.`);
      break;
    }
    const asRow = [...group].sort((a, b) => b.address.length - a.address.length)[0];
    const before = { ...usage };
    try {
      const result = await lookup(asRow, new Map());
      const calls = { textSearch: usage.textSearch - before.textSearch, details: usage.details - before.details };
      file.lookups[key] = { key, rowIds: group.map((r) => r.id), rowWebsites: Object.fromEntries(group.map((r) => [r.id, r.website])), asRow: { licence: asRow.licence, name: asRow.name, address: asRow.address, state: asRow.state }, query: textQuery(asRow), at: new Date().toISOString().slice(0, 10), result, calls };
      spent += listPrice(calls.textSearch, calls.details);
      writeFileSync(path, JSON.stringify(file, null, 1));
    } catch (err) {
      console.error(`  ERR ${asRow.state} ${asRow.licence} ${asRow.name}: ${(err as Error).message}`);
    }
    if (++done % 100 === 0) console.log(`  ${Object.keys(file.lookups).length}/${groups.size} lookups, $${spent.toFixed(2)} at list price`);
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log(`Lookups saved: ${Object.keys(file.lookups).length}/${groups.size} in ${path}. This run $${(spent - spentBefore).toFixed(2)}, total $${spent.toFixed(2)} at list price (before Google's monthly free calls).`);
}

const NAMED_LICENCES = [
  "E1008", "E0893", "E0954", "E0803", "E0138", "E1392", "E0957", "E0962", "E0948",
  "E9634", "E1883", "E1293", "E0129", "E0127", "E0462", "E0067", "E0119", "E1989",
];
const VERDICTS: Verdict[] = ["State DMV", "Confirmed", "Changed", "Address only", "Unconfirmed"];
const cell = (s: string | null | undefined) => (s && s.trim() ? s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim() : "—");

function report(rows: DirRow[], captures: Map<string, Captured>, file: LookupsFile, out: string) {
  const { list, missing } = verdicts(rows, captures, file);
  const { inScope, groups } = scope(rows, captures);
  const states = [...new Set(list.map((v) => v.row.state))].sort();
  const spent = Object.values(file.lookups).reduce((a, s) => a + listPrice(s.calls.textSearch, s.calls.details), 0);
  const calls = Object.values(file.lookups).reduce((a, s) => ({ t: a.t + s.calls.textSearch, d: a.d + s.calls.details }), { t: 0, d: 0 });
  const L: string[] = [];
  L.push("# Directory websites re-check (dry run), November 2026", "");
  L.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/recheck-directory-websites.ts\`. **Nothing has been written to Notion.** The apply writes these verdicts from the saved lookups, with no new Places calls, after Sean approves.`, "");
  L.push("Verdicts:", "");
  L.push("- **State DMV**: the state's own list (scraper dry run today) gives the same website. The apply sets Website Source = State DMV.");
  L.push("- **Confirmed**: a proved Places listing (address and name evidence, see `scripts/lib/places-match.ts`) has the same registrable domain. The apply writes the provenance fields only.");
  L.push("- **Changed**: a proved listing has a different website. The apply writes the proposed one.");
  L.push("- **Address only**: a listing at the row's address without the school's name. The apply clears Website.");
  L.push("- **Unconfirmed**: nothing proved. The apply clears Website, and the table shows \"—\".", "");
  L.push(`Scope: ${inScope.length} rows with a Website not set by hand (${rows.filter((r) => r.website && isHandSet(r)).length} hand-set rows left out). Places lookups: ${Object.keys(file.lookups).length} of ${groups.size} (one per licence)${missing ? `, **${missing} not yet looked up (their rows are not in the counts)**` : ""}. Calls: ${calls.t} Text Search Pro and ${calls.d} Place Details, $${spent.toFixed(2)} at list price before Google's monthly free calls.`, "");
  L.push("## Counts per state", "");
  L.push(`| State | Rows | Distinct licences | ${VERDICTS.join(" | ")} |`);
  L.push(`|---|---:|---:|${VERDICTS.map(() => "---:").join("|")}|`);
  const tot = Object.fromEntries(VERDICTS.map((v) => [v, 0])) as Record<Verdict, number>;
  let totRows = 0, totLic = 0;
  for (const st of states) {
    const vs = list.filter((v) => v.row.state === st);
    const lic = new Set(vs.map((v) => (isPlaceholderLicence(v.row.licence) ? `row|${v.row.id}` : normLicence(v.row.licence)))).size;
    const c = VERDICTS.map((k) => vs.filter((v) => v.verdict === k).length);
    VERDICTS.forEach((k, i) => (tot[k] += c[i]));
    totRows += vs.length;
    totLic += lic;
    L.push(`| ${st} | ${vs.length} | ${lic} | ${c.join(" | ")} |`);
  }
  L.push(`| **Total** | **${totRows}** | **${totLic}** | ${VERDICTS.map((k) => `**${tot[k]}**`).join(" | ")} |`, "");
  if (totRows !== VERDICTS.reduce((a, k) => a + tot[k], 0)) throw new Error("per-verdict counts do not add up to the row total");
  L.push("Distinct licences: a placeholder licence (\"NJ-approved\", blank) counts each row as its own school.", "");

  L.push("## Named rows", "");
  L.push("| State | Licence | Name | Address | Current website | Verdict | Proposed | Why |", "|---|---|---|---|---|---|---|---|");
  const named = rows.filter((r) => NAMED_LICENCES.includes(normLicence(r.licence)) || /^SAFEWAY DRIVING/i.test(r.name));
  for (const r of named.sort((a, b) => a.licence.localeCompare(b.licence))) {
    const v = list.find((x) => x.row.id === r.id);
    const verdict = v ? v.verdict : isHandSet(r) ? "Hand-set: untouched" : !r.website ? "No website: out of scope" : "Not yet looked up";
    L.push(`| ${r.state} | ${cell(r.licence)} | ${cell(r.name)} | ${cell(r.address)} | ${cell(r.website)} | ${verdict} | ${cell(v ? v.proposed : r.website)} | ${cell(v?.why ?? (isHandSet(r) ? `Website Source ${r.websiteSource || "—"}, Enrichment Status ${r.enrichmentStatus || "—"}` : ""))} |`);
  }
  L.push("");
  for (const k of ["Changed", "Address only", "Unconfirmed"] as Verdict[]) {
    const vs = list.filter((v) => v.verdict === k).sort((a, b) => a.row.state.localeCompare(b.row.state) || a.row.licence.localeCompare(b.row.licence));
    L.push(`## ${k} (${vs.length})`, "");
    if (k === "Address only") L.push("Both names: the school's (Name) and the listing at its address (Listing).", "");
    L.push(`| State | Licence | Name | Address | Current website | Proposed | ${k === "Address only" ? "Listing" : "Why"} |`, "|---|---|---|---|---|---|---|");
    for (const v of vs) L.push(`| ${v.row.state} | ${cell(v.row.licence)} | ${cell(v.row.name)} | ${cell(v.row.address)} | ${cell(v.row.website)} | ${cell(v.proposed)} | ${cell(v.why)} |`);
    L.push("");
  }
  writeFileSync(out, L.join("\n"));
  console.log(`Report: ${out} (${totRows} rows; ${VERDICTS.map((k) => `${k} ${tot[k]}`).join(", ")})`);
}

async function apply(rows: DirRow[], captures: Map<string, Captured>, file: LookupsFile) {
  const notion = makeNotionClient();
  const { list, missing } = verdicts(rows, captures, file);
  if (missing) throw new Error(`${missing} lookups missing: run --lookup to finish before --apply`);
  let written = 0, skipped = 0;
  for (const v of list) {
    if (isHandSet(v.row)) continue;
    const props: Record<string, unknown> = {};
    if (v.verdict === "State DMV") props[PROP.websiteSource] = { select: { name: "State DMV" } };
    else {
      const r = v.lookup!.result;
      props[PROP.enrichedAt] = { date: { start: v.lookup!.at } };
      if (v.verdict === "Confirmed" || v.verdict === "Changed") {
        props[PROP.placeId] = { rich_text: [{ text: { content: (r as Extract<Lookup, { found: true }>).candidate.id } }] };
        props[PROP.websiteSource] = { select: { name: "Google Places" } };
        props[PROP.enrichmentStatus] = { select: { name: "Enriched" } };
        if (v.verdict === "Changed") props.Website = { url: v.proposed };
      } else {
        props.Website = { url: null };
        props[PROP.websiteSource] = { select: null };
        props[PROP.enrichmentStatus] = { select: { name: "Not Found" } };
      }
    }
    // Someone changed the Website since the lookup: their edit wins; report it.
    if (v.lookup && v.lookup.rowWebsites[v.row.id] !== v.row.website) {
      console.log(`  skip ${v.row.state} ${v.row.licence} ${v.row.name}: Website changed since the lookup`);
      skipped++;
      continue;
    }
    await notion.pages.update({ page_id: v.row.id, properties: props as never });
    written++;
    await new Promise((r) => setTimeout(r, 350));
  }
  console.log(`Applied: ${written} rows written, ${skipped} skipped.`);
}

async function main() {
  const rows = await loadDirectory();
  const captures = loadCaptures();
  const lookups = arg("--lookups");
  if (has("--estimate")) return void estimate(rows, captures);
  if (!lookups) throw new Error("--lookups <file.json> is required");
  if (has("--lookup")) {
    const { typical } = estimate(rows, captures);
    if (typical > CAP_USD) throw new Error(`estimate $${typical.toFixed(2)} is over the $${CAP_USD} cap: stopping`);
    return runLookups(rows, captures, lookups);
  }
  if (has("--report")) return report(rows, captures, readLookups(lookups), arg("--out") ?? "research/directory-websites-recheck-2026-11.md");
  if (has("--apply")) return apply(rows, captures, readLookups(lookups));
  console.log("Pick a mode: --estimate | --lookup | --report | --apply");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
