/**
 * populate-lawyer-block.ts — stage the "When a lawyer beats traffic school" copy
 * on the States DB (attorney-referral Play A).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  DO NOT RUN THIS UNTIL SEAN HAS REVIEWED research/lawyer-block-review.md.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * These firms are RESEARCHED CANDIDATES, not vetted relationships. Before the
 * block can go public, Sean must, per state:
 *   1. Approve or swap each firm.
 *   2. Paste each firm's VERIFIED live URL into the FIRMS table below (the `url`
 *      fields ship empty — a firm with an empty URL is silently dropped by the
 *      parser, so the block will NOT render until real URLs are added). This is
 *      the safety gate: no verified URL, no outbound link.
 *   3. Sign off on the Ohio copy specifically (court-discretion framing differs).
 *
 * The render also stays off production until branch `feat/lawyer-block` is merged.
 *
 * Usage:
 *   npx tsx scripts/populate-lawyer-block.ts            # DRY RUN (default) — prints, writes nothing
 *   npx tsx scripts/populate-lawyer-block.ts --apply    # writes the JSON field on the 10 state pages
 *   npx tsx scripts/populate-lawyer-block.ts --apply --stamp-reviewed   # also sets lastReviewed = today
 *
 * `--apply` writes the "Lawyer Block" rich_text field. It creates the property on
 * the States DB first if it does not exist. Firms with an empty url are still
 * written (so the copy is staged) but reported as INERT until a URL is added.
 */
import { Client } from "@notionhq/client";
import { readFileSync } from "node:fs";

// Load NOTION_TOKEN from .env.local (same pattern as the other data scripts).
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* env may already be in the environment */ }

// Use the same database_id the site reads at build time (NOTION_STATES_DB in
// .env.local) rather than the collection:// id from the brief — post the Notion
// data-source split those differ, and the API wants the database container id.
const STATES_DB = process.env.NOTION_STATES_DB ?? "";
const FIELD = "Lawyer Block";

type Firm = { name: string; url: string; note: string };
type Block = { code: string; disqualifier: string; firms: Firm[]; flag?: string };

// ── DRAFT COPY (from research/cc-brief lawyer-block; disqualifiers rewritten
//    em-dash-free per house style). PASTE VERIFIED URLs into each `url` below. ──
const BLOCKS: Block[] = [
  {
    code: "TX",
    disqualifier:
      "If your ticket was 25 or more mph over the limit, you hold a CDL, or this is a second eligible ticket inside the same 12-month window, a Texas court will not accept a driving safety course election. In those cases a lawyer is the better move.",
    firms: [
      { name: "Jack Byno & Associates", url: "", note: "20+ years, former municipal judge, DFW to Hunt County reach" },
      { name: "Joyner + Joyner", url: "", note: "Statewide reach; focus on CDL, no-license, and failure-to-appear cases" },
    ],
  },
  {
    code: "CA",
    disqualifier:
      "If you have taken traffic school in the past 18 months, your ticket was more than 25 mph over the limit, it was alcohol or drug related, or you were driving a commercial vehicle, the Vehicle Code section 1808.7(b) masking does not reach it. A lawyer is the better option there.",
    firms: [
      { name: "Ticket Crushers, A Law Corporation", url: "", note: "Statewide California reach, 75+ years combined experience" },
      { name: "FYourTicket", url: "", note: "LA-based, statewide California focus, 10,000+ tickets since 2014" },
    ],
  },
  {
    code: "FL",
    disqualifier:
      "If you already used a Basic Driver Improvement election in the past 12 months for the same ticket type, you are past the 5-election lifetime cap, or you missed the 30-day election window from the citation date, the course is off the table. A lawyer can still help.",
    firms: [
      { name: "The Ticket Clinic", url: "", note: "Largest traffic ticket firm in the US, Florida statewide" },
      { name: "Fight Your Ticket", url: "", note: "Statewide Florida; offices in Sarasota, Tampa, Clearwater, and Orlando" },
    ],
  },
  {
    code: "NY",
    disqualifier:
      "If you already have 4 or more points from the same violation type this cycle, or your ticket is not PIRP-eligible in the first place, the Point and Insurance Reduction Program will not help. A lawyer can look at the other options.",
    firms: [
      { name: "TicketHelp.com", url: "", note: "Statewide attorney network, Manhattan to the Canadian border" },
      { name: "trafficticketlawyernewyork.com", url: "", note: "Statewide court coverage: Buffalo, Rochester, Syracuse, and downstate" },
    ],
  },
  {
    code: "GA",
    disqualifier:
      "If you already used the 7-point reduction within the past 5 years (O.C.G.A. section 40-5-86), or your violation is not the kind the DDS course covers, the course will not help you. A lawyer is the better call.",
    firms: [
      { name: "Kohn & Yager (Bubba Head)", url: "", note: "Statewide Georgia network built for out-of-metro cases" },
      { name: "Scott Fortas", url: "", note: "Coverage across most courts in the state of Georgia" },
    ],
  },
  {
    code: "OH",
    flag: "NEEDS SEAN SIGN-OFF — court-discretion framing differs from the other 9 states.",
    disqualifier:
      "Ohio leaves traffic school acceptance up to the individual court. If your court is a hard no, or you are not sure, a lawyer who knows that specific courtroom is worth more than the course.",
    firms: [
      { name: "The Ticket Clinic (Ohio)", url: "", note: "National firm's Ohio arm" },
      { name: "Bartell, Georgalas & Juarez", url: "", note: "Three Ohio offices: Independence, Columbus, and Oxford" },
    ],
  },
  {
    code: "NC",
    disqualifier:
      "North Carolina does not dismiss a ticket automatically; it needs prior court permission on a per-case basis. The DMV point reduction needs 7 or more points and cannot be used more than once every 5 years, and many drivers use a Prayer for Judgment Continued instead, capped once every 3 years per household. A lawyer is the one who knows whether the course, the reduction, or a PJC is the right play for your ticket.",
    firms: [
      { name: "iTicket.law", url: "", note: "Proprietary statewide court-record lookup, works in any NC county" },
      { name: "The Ticket Clinic (NC)", url: "", note: "National firm's North Carolina arm" },
    ],
  },
  {
    code: "VA",
    disqualifier:
      "If your ticket was 20 or more mph over the limit, or over 85 mph regardless of the limit, Virginia charges it as reckless driving, a Class 1 misdemeanor on a different track from ordinary demerit-point speeding. A course will not touch it, so you want a lawyer.",
    firms: [
      { name: "SRIS, P.C.", url: "", note: "Statewide Virginia defense, former state trooper on staff" },
      { name: "Riley & Wells", url: "", note: "Statewide; US News Best Law Firm, 1,500+ reviews" },
    ],
  },
  {
    code: "NJ",
    disqualifier:
      "New Jersey only offers a 2-point reduction once every 5 years and never a dismissal. If your real goal is keeping the ticket off your record entirely, you need a lawyer, not a course.",
    firms: [
      { name: "Rosenblum Law", url: "", note: "Large, well-known New Jersey traffic firm" },
      { name: "Michael L. Nichnowitz", url: "", note: "Statewide NJ municipal court representation, CDL focus" },
    ],
  },
  {
    code: "AZ",
    disqualifier:
      "If you have taken Defensive Driving School within the past 24 months, or you hold a CDL and were cited in a commercial vehicle (the rule since September 1, 2019), you do not qualify for defensive driving school. A lawyer can help in those cases.",
    firms: [
      { name: "Law Offices of Brandon White", url: "", note: "Statewide reach (Phoenix, Gilbert, Chandler, Mesa, Yuma, Tucson), former AZ trooper" },
      { name: "Arizona Defense Network", url: "", note: "Broad Arizona traffic ticket presence" },
    ],
  },
];

const APPLY = process.argv.includes("--apply");
const STAMP = process.argv.includes("--stamp-reviewed");
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// The rich_text value we store, mirroring the State FAQ `faqjson:` pattern.
function fieldValue(b: Block, lastReviewed: string | null): string {
  const payload = {
    disqualifier: b.disqualifier,
    firms: b.firms,
    lastReviewed,
  };
  return "lawyerblock:" + JSON.stringify(payload);
}

async function ensureProperty() {
  const db: any = await notion.databases.retrieve({ database_id: STATES_DB });
  if (db.properties?.[FIELD]) {
    console.log(`• Property "${FIELD}" already exists on the States DB.`);
    return;
  }
  if (!APPLY) {
    console.log(`• [dry-run] would CREATE rich_text property "${FIELD}" on the States DB.`);
    return;
  }
  await notion.databases.update({
    database_id: STATES_DB,
    properties: { [FIELD]: { rich_text: {} } },
  });
  console.log(`• Created rich_text property "${FIELD}" on the States DB.`);
}

// Read a property's plain text whether it is title, rich_text, or select — the
// States DB code column ("Abbreviation") type is not assumed, so we match in JS
// rather than risk a type-mismatch 400 on a server-side filter.
function propText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return (prop.title ?? []).map((t: any) => t.plain_text).join("");
  if (prop.type === "rich_text") return (prop.rich_text ?? []).map((t: any) => t.plain_text).join("");
  if (prop.type === "select") return prop.select?.name ?? "";
  return "";
}

let pageIndex: Map<string, string> | null = null;
async function findStatePage(code: string): Promise<string | null> {
  if (!pageIndex) {
    pageIndex = new Map();
    let cursor: string | undefined;
    do {
      const res: any = await notion.databases.query({
        database_id: STATES_DB,
        start_cursor: cursor,
        page_size: 100,
      });
      for (const row of res.results ?? []) {
        const abbr = propText(row.properties?.["Abbreviation"]).trim().toUpperCase();
        if (abbr) pageIndex.set(abbr, row.id);
      }
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);
  }
  return pageIndex.get(code.toUpperCase()) ?? null;
}

async function main() {
  if (!process.env.NOTION_TOKEN) {
    console.error("NOTION_TOKEN not set (expected in .env.local). Aborting.");
    process.exit(1);
  }
  console.log(APPLY ? "APPLY mode — writing to Notion.\n" : "DRY RUN — nothing will be written. Pass --apply to write.\n");
  await ensureProperty();

  const today = STAMP ? new Date().toISOString().slice(0, 10) : null;
  let inert = 0;

  for (const b of BLOCKS) {
    const missing = b.firms.filter((f) => !/^https?:\/\//i.test(f.url));
    const status = missing.length
      ? `INERT (no verified URL on ${missing.length}/${b.firms.length} firm(s) — will not render)`
      : "renderable";
    if (missing.length) inert++;

    console.log(`\n[${b.code}] ${status}${b.flag ? "  ⚠ " + b.flag : ""}`);
    console.log(`   disqualifier: ${b.disqualifier.slice(0, 90)}...`);
    for (const f of b.firms) console.log(`   firm: ${f.name}  <${f.url || "NO URL — Sean to add"}>`);

    if (!APPLY) continue;

    const pageId = await findStatePage(b.code);
    if (!pageId) { console.log(`   ! no States row for ${b.code} — skipped`); continue; }
    await notion.pages.update({
      page_id: pageId,
      properties: { [FIELD]: { rich_text: [{ text: { content: fieldValue(b, today) } }] } },
    });
    console.log(`   ✓ wrote ${FIELD} for ${b.code}`);
  }

  console.log(
    `\nDone. ${BLOCKS.length} states staged, ${inert} still INERT (need verified URLs before they render).`,
  );
  if (!APPLY) console.log("Re-run with --apply once Sean has approved firms and pasted verified URLs above.");
}

main().catch((e) => { console.error(e); process.exit(1); });
