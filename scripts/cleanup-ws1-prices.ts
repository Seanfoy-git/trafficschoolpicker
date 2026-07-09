/**
 * WS1 one-off data cleanup — clear junk/orphaned/unverified prices so the
 * hardened scraper (PR #9) baselines on clean data.
 *
 * GUARDED: for every cell it (1) reads the current value, (2) asserts it equals
 * the expected value from the approved change list — SKIPPING with a warning if
 * it drifted — (3) writes the change, (4) reads back to verify. Never touches a
 * cell whose current value doesn't match what was approved.
 *
 *   npx tsx scripts/cleanup-ws1-prices.ts            # DRY RUN (read + assert only)
 *   npx tsx scripts/cleanup-ws1-prices.ts --apply    # write (run AFTER PR #9 is merged)
 *
 * Guardrails NEVER targeted: I Drive Safely Price NY (=24), and any Partner Slug/
 * Tracking Method/Affiliate Network/Affiliate URL field.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";

const notion = makeNotionClient();
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;
const PRICING_DB = process.env.NOTION_PRICING_DB!;
const APPLY = process.argv.includes("--apply");

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Approved change list ────────────────────────────────────────────────────
// Schools-DB per-state price columns to clear (these render on cards and outrank
// the Pricing DB). tag distinguishes the reason — junk vs correct-but-orphaned
// vs covered-but-unverified — so the baseline story stays honest.
const SCHOOL_COLUMN_CLEARS: { school: string; field: string; expect: number; tag: string }[] = [
  { school: "I Drive Safely", field: "Price FL", expect: 5.94, tag: "junk" },
  { school: "I Drive Safely", field: "Price CA", expect: 29, tag: "orphaned (correct-but-uncovered)" },
  { school: "I Drive Safely", field: "Price TX", expect: 25, tag: "unverified (covered; scraper repopulates)" },
  { school: "Improv Traffic School", field: "Price TX", expect: 3, tag: "junk" },
];

// Pricing-DB rows: clear Price, un-approve, mark Needs Review (all are junk $5/$3).
const PRICING_CLEARS: { school: string; state: string; expect: number; tag: string }[] = [
  { school: "I Drive Safely", state: "NY", expect: 5, tag: "junk" },
  { school: "I Drive Safely", state: "TX", expect: 5, tag: "junk" },
  { school: "I Drive Safely", state: "FL", expect: 5, tag: "junk" },
  { school: "I Drive Safely", state: "CA", expect: 5, tag: "junk" },
  { school: "Improv Traffic School", state: "TX", expect: 3, tag: "junk" },
];

// Group 3: Failed-but-Approved rows → un-approve only (no price to clear).
const PRICING_UNAPPROVE: { school: string; state: string }[] = [
  { school: "TicketSchool", state: "CA" },
  { school: "DriversEd.com", state: "FL" },
  { school: "DriversEd.com", state: "TX" },
  { school: "DriversEd.com", state: "CA" },
  { school: "Aceable", state: "FL" },
];

const GUARDRAIL_FORBIDDEN = new Set(["I Drive Safely::Price NY"]);

function T(p: any): string {
  if (!p) return "";
  if (p.type === "title") return p.title.map((t: any) => t.plain_text).join("");
  if (p.type === "rich_text") return p.rich_text.map((t: any) => t.plain_text).join("");
  if (p.type === "select") return p.select?.name ?? "";
  return "";
}
async function all(db: string): Promise<any[]> {
  let c: string | undefined;
  const out: any[] = [];
  do {
    const r: any = await notion.databases.query({ database_id: db, start_cursor: c, page_size: 100 });
    out.push(...r.results);
    c = r.has_more ? r.next_cursor : undefined;
  } while (c);
  return out;
}

let changed = 0, skipped = 0;

async function main() {
  console.log(APPLY ? "MODE: APPLY (writing)\n" : "MODE: DRY RUN (read + assert only)\n");

  const schools = await all(SCHOOLS_DB);
  const activeByName = new Map<string, any>();
  for (const s of schools) {
    if (T(s.properties["Status"]) === "Active" && s.properties["Show On Site"]?.checkbox) {
      activeByName.set(T(s.properties["School Name"]), s);
    }
  }
  const id2name = new Map(schools.map((s) => [s.id, T(s.properties["School Name"])]));
  const pricing = await all(PRICING_DB);
  const rowFor = (school: string, state: string) =>
    pricing.find(
      (r) =>
        id2name.get((r.properties["School"]?.relation ?? [])[0]?.id) === school &&
        T(r.properties["State Code"]) === state
    );

  // ── Group 1: Schools-DB columns ──
  console.log("── Group 1: Schools-DB Price XX columns (clear) ──");
  for (const c of SCHOOL_COLUMN_CLEARS) {
    const key = `${c.school}::${c.field}`;
    if (GUARDRAIL_FORBIDDEN.has(key)) { console.log(`  GUARDRAIL skip ${key}`); continue; }
    const page = activeByName.get(c.school);
    if (!page) { console.log(`  SKIP  ${key} — active school not found`); skipped++; continue; }
    const cur = page.properties[c.field]?.number ?? null;
    if (cur !== c.expect) {
      console.log(`  SKIP  ${key} — current ${cur} ≠ expected ${c.expect} (drifted; not touching)`);
      skipped++; continue;
    }
    console.log(`  ${APPLY ? "CLEAR" : "would clear"} ${key}: ${cur} → (null)   [${c.tag}]`);
    if (APPLY) {
      await notion.pages.update({ page_id: page.id, properties: { [c.field]: { number: null } } });
      const back: any = await notion.pages.retrieve({ page_id: page.id });
      if ((back.properties[c.field]?.number ?? null) !== null) throw new Error(`verify failed: ${key} not cleared`);
      changed++;
    }
  }

  // ── Group 2: Pricing-DB junk (clear price + un-approve + Needs Review) ──
  console.log("\n── Group 2: Pricing-DB rows (clear price, Approved→false, Needs Review) ──");
  for (const c of PRICING_CLEARS) {
    const row = rowFor(c.school, c.state);
    const key = `${c.school}-${c.state}`;
    if (!row) { console.log(`  SKIP  ${key} — pricing row not found`); skipped++; continue; }
    const cur = row.properties["Price"]?.number ?? null;
    if (cur !== c.expect) {
      console.log(`  SKIP  ${key} — current $${cur} ≠ expected $${c.expect} (drifted)`);
      skipped++; continue;
    }
    console.log(`  ${APPLY ? "CLEAR" : "would clear"} ${key}: $${cur} → (null), Approved→false, Needs Review   [${c.tag}]`);
    if (APPLY) {
      await notion.pages.update({
        page_id: row.id,
        properties: {
          Price: { number: null },
          Approved: { checkbox: false },
          "Price Scrape Status": { select: { name: "Needs Review" } },
        },
      });
      const back: any = await notion.pages.retrieve({ page_id: row.id });
      if ((back.properties["Price"]?.number ?? null) !== null || back.properties["Approved"]?.checkbox !== false)
        throw new Error(`verify failed: ${key}`);
      changed++;
    }
  }

  // ── Group 3: Failed-but-Approved → un-approve ──
  console.log("\n── Group 3: Failed-but-Approved rows (Approved→false) ──");
  for (const c of PRICING_UNAPPROVE) {
    const row = rowFor(c.school, c.state);
    const key = `${c.school}-${c.state}`;
    if (!row) { console.log(`  SKIP  ${key} — row not found`); skipped++; continue; }
    const status = T(row.properties["Price Scrape Status"]);
    const approved = row.properties["Approved"]?.checkbox;
    if (status !== "Failed" || approved !== true) {
      console.log(`  SKIP  ${key} — expected Failed+Approved, got ${status}/${approved} (drifted)`);
      skipped++; continue;
    }
    console.log(`  ${APPLY ? "UNAPPROVE" : "would un-approve"} ${key} (status stays Failed)`);
    if (APPLY) {
      await notion.pages.update({ page_id: row.id, properties: { Approved: { checkbox: false } } });
      const back: any = await notion.pages.retrieve({ page_id: row.id });
      if (back.properties["Approved"]?.checkbox !== false) throw new Error(`verify failed: ${key}`);
      changed++;
    }
  }

  console.log(`\n${APPLY ? `Applied ${changed} change(s), ${skipped} skipped.` : `Dry run: ${skipped} drift/absent. Re-run with --apply after PR #9 is merged.`}`);
  if (!APPLY && skipped === 0) console.log("All current values match the approved list — safe to --apply.");
}

main().catch((e) => { console.error(e); process.exit(1); });
