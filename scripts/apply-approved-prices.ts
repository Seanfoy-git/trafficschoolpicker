/**
 * Apply the operator-approved prices from the first hardened report sweep.
 * GUARDED: for each row, reads the current Pricing price, asserts it equals the
 * expected prior (skips on drift), writes {Price, Approved, Status OK, Last
 * Scraped}, then reads back to verify. Also reports the Schools-DB "Price XX"
 * column (which OUTRANKS the Pricing DB) so a masked write is never mistaken
 * for a live-card change.
 *
 *   npx tsx scripts/apply-approved-prices.ts            # DRY RUN
 *   npx tsx scripts/apply-approved-prices.ts --apply
 */
import { config } from "dotenv"; config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";

const notion = makeNotionClient();
const APPLY = process.argv.includes("--apply");
/* eslint-disable @typescript-eslint/no-explicit-any */

// Approved clean/plausible values only. HELD (not here): idrivesafely TX/NY,
// aceable-TX, improv CA/FL.
const APPROVED: { school: string; state: string; prior: number | null; price: number }[] = [
  { school: "Aceable", state: "CA", prior: 29, price: 26.1 },
  { school: "TicketSchool", state: "FL", prior: 24.95, price: 29 },
  { school: "TicketSchool", state: "TX", prior: 25, price: 25 },
  { school: "Improv Traffic School", state: "TX", prior: null, price: 28.95 },
  { school: "$5 Dollar Traffic School", state: "CA", prior: 5, price: 5 },
  { school: "$5 Dollar Traffic School", state: "FL", prior: 5, price: 5 },
];

function T(p: any) {
  if (!p) return "";
  if (p.type === "title") return p.title.map((t: any) => t.plain_text).join("");
  if (p.type === "rich_text") return p.rich_text.map((t: any) => t.plain_text).join("");
  if (p.type === "select") return p.select?.name ?? "";
  return "";
}
async function all(db: string) {
  let c: string | undefined; const o: any[] = [];
  do { const r: any = await notion.databases.query({ database_id: db, start_cursor: c, page_size: 100 }); o.push(...r.results); c = r.has_more ? r.next_cursor : undefined; } while (c);
  return o;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY\n" : "MODE: DRY RUN (read + assert only)\n");
  const schools = await all(process.env.NOTION_SCHOOLS_DB!);
  const activeByName = new Map<string, any>();
  for (const s of schools) if (T(s.properties["Status"]) === "Active" && s.properties["Show On Site"]?.checkbox) activeByName.set(T(s.properties["School Name"]), s);
  const id2name = new Map(schools.map((s) => [s.id, T(s.properties["School Name"])]));
  const pricing = await all(process.env.NOTION_PRICING_DB!);
  const TODAY = new Date().toISOString().split("T")[0];

  let applied = 0, skipped = 0; const masked: string[] = [];
  for (const a of APPROVED) {
    const key = `${a.school}-${a.state}`;
    const row = pricing.find((r) => id2name.get((r.properties["School"]?.relation ?? [])[0]?.id) === a.school && (r.properties["State Code"]?.rich_text?.[0]?.plain_text) === a.state);
    if (!row) { console.log(`  SKIP ${key} — pricing row not found`); skipped++; continue; }
    const cur = row.properties["Price"]?.number ?? null;
    if (cur !== a.prior) { console.log(`  SKIP ${key} — current $${cur} ≠ expected prior $${a.prior} (drift)`); skipped++; continue; }

    // Masking check: Schools-DB "Price {state}" column outranks the Pricing DB.
    const col = activeByName.get(a.school)?.properties[`Price ${a.state}`]?.number ?? null;
    let maskNote = "→ reaches card";
    if (col !== null && col !== a.price) { maskNote = `⚠ MASKED by Schools col Price ${a.state}=${col} → card still shows $${col}`; masked.push(`${key}: card shows $${col}, approved $${a.price}`); }
    else if (col !== null) maskNote = `(Schools col=${col}, same value)`;

    console.log(`  ${APPLY ? "WRITE" : "would write"} ${key}: pricing $${cur ?? "—"} → $${a.price}   ${maskNote}`);
    if (APPLY) {
      await notion.pages.update({ page_id: row.id, properties: {
        Price: { number: a.price },
        Approved: { checkbox: true },
        "Price Scrape Status": { select: { name: "OK" } },
        "Last Scraped": { date: { start: TODAY } },
      } });
      const back: any = await notion.pages.retrieve({ page_id: row.id });
      if ((back.properties["Price"]?.number ?? null) !== a.price || back.properties["Approved"]?.checkbox !== true) throw new Error(`verify failed: ${key}`);
      applied++;
    }
  }
  console.log(`\n${APPLY ? `Applied ${applied}, skipped ${skipped}.` : `Dry run: ${skipped} drift/absent.`}`);
  if (masked.length) {
    console.log(`\n⚠ MASKED — Pricing updated but the CARD is unchanged (Schools column wins):`);
    for (const m of masked) console.log(`    • ${m}`);
    console.log(`  To make these reach the card, the Schools "Price XX" column must be updated/cleared (your call).`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
