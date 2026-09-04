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

// ── APPROVED LOAD LIST — research/lawyer-block-approved-2026-09.md (Sean signed
//    2026-09-04). These are the "suggested per-page picks" (the 2-3 the doc says each
//    page carries; the remaining vetted firms are outreach rows, not rendered here).
//    Firm names, metros (note), URLs, and per-state disqualifier lines are VERBATIM
//    from that doc. The prior researched-not-vetted candidates were discarded.
//    Listing notes from the doc: Driving Defense Law under Norfolk (HQ; VB is a
//    service-area page); Corso Law Group under Scottsdale (office; Phoenix is a metro page).
const BLOCKS: Block[] = [
  {
    code: "TX",
    disqualifier:
      "A course cannot help if you were more than 25 mph over the limit, hold a CDL, used your once-per-12-months dismissal already, or missed the deadline to request the course before your appearance date. Those are the tickets a traffic attorney handles.",
    firms: [
      { name: "Sullo & Sullo, LLP", url: "https://sullolaw.com/traffic-tickets/", note: "Houston" },
      { name: "Cofer & Connelly, PLLC", url: "https://www.coferconnelly.com/austin-criminal-defense-attorney/traffic-tickets/", note: "Austin" },
      { name: "Law Offices of Anthony B. Cantrell", url: "https://www.anthonycantrell.com/traffic-violations/", note: "San Antonio" },
    ],
  },
  {
    code: "CA",
    disqualifier:
      "Traffic school is off the table if you used it in the past 18 months, hold a commercial license, or the violation was alcohol-related or a serious offense. When masking is not available, fighting the ticket is the remaining move.",
    firms: [
      { name: "Ticket Crushers", url: "https://www.ticketcrusherslaw.com/traffic-ticket/", note: "San Francisco, Sacramento & Los Angeles" },
      { name: "Crowell Law Offices", url: "https://www.crowelllawoffices.com/criminal-defense/traffic-tickets/", note: "Sacramento" },
      { name: "Law Office of George Gedulin", url: "https://www.gedulinlaw.com/criminal-defense/traffic-offense/", note: "San Diego" },
    ],
  },
  {
    code: "FL",
    disqualifier:
      "If you have used your election in the past 12 months, hit the eight-per-lifetime cap, missed the 30-day election window, or the violation is criminal, the course path is closed. That is when a lawyer earns the fee.",
    firms: [
      { name: "Moses & Rooth", url: "https://www.mosesandrooth.com/dui-traffic-offenses/orlando-traffic-ticket-lawyer/", note: "Orlando" },
      { name: "Fernandez Law Group", url: "https://thefernandezlawgroup.com/tampa-traffic-ticket-lawyers/", note: "Tampa" },
      { name: "Law Offices of Kate Mesic", url: "https://www.mesiclaw.com/criminal-defense/traffic-violations/", note: "Jacksonville" },
    ],
  },
  {
    code: "NY",
    disqualifier:
      "PIRP never dismisses the ticket. It reduces points after you are convicted. If the conviction itself is the problem, for your job, your insurance, or a license already near suspension, that is a fight, not a course.",
    firms: [
      { name: "Weiss & Associates, P.C.", url: "https://nytrafficticket.com/traffic-violations-lawyer-nyc/", note: "New York City" },
      { name: "Arthur L. Pressman", url: "https://www.arthurpressmanlaw.com/criminal-defense/traffic-violations/", note: "Buffalo" },
      { name: "Sharifov & Associates", url: "https://trafficlawyeronlongisland.com/traffic-violations-long-island/traffic-tickets/", note: "Long Island" },
    ],
  },
  {
    code: "GA",
    disqualifier:
      "Dismissal in Georgia is decided court by court. If your solicitor will not offer it, the ticket is DUI, aggressive driving, or another serious offense, or a conviction risks your license regardless of points, talk to an attorney first.",
    firms: [
      { name: "Kohn & Yager", url: "https://www.georgiacriminaldefense.com/atlanta-traffic.html", note: "Atlanta" },
      { name: "Schneider Lerch, LLC", url: "https://www.savannahtriallawyers.com/criminal-defense/traffic-offenses/", note: "Savannah" },
      { name: "Ward & Spires, LLC", url: "https://www.wardspires.com/criminal-defense/traffic-violations/", note: "Augusta" },
    ],
  },
  {
    code: "OH",
    disqualifier:
      "The Ohio course earns a two-point credit. It does not dismiss anything. If the charge is serious or a conviction would push you toward the 12-point suspension, an attorney can do what the course cannot.",
    firms: [
      { name: "Riddell Law LLC", url: "https://www.riddelllaw.com/traffic-attorney/", note: "Columbus" },
      { name: "Patituce & Associates", url: "https://www.patitucelaw.com/traffic-ticket-lawyer-cleveland-ohio/", note: "Cleveland" },
      { name: "Rittgers Rittgers & Nakajima", url: "https://www.rittgers.com/criminal-defense/vehicle-related-crimes/traffic-violations/", note: "Cincinnati" },
    ],
  },
  {
    code: "NC",
    disqualifier:
      "An online course in North Carolina will not dismiss your ticket or cut points. Dismissal needs the court's permission or a Prayer for Judgment Continued, and deciding when to spend a PJC is exactly what a local attorney is for.",
    firms: [
      { name: "Kissling Law", url: "https://www.kisslinglaw.com/areas-of-practice/traffic-tickets/", note: "Raleigh" },
      { name: "Arnold & Smith PLLC", url: "https://www.arnoldsmithlaw.com/traffic-citations.html", note: "Charlotte" },
      { name: "Garrett, Walker, Aycoth & Olson", url: "https://www.garrettandwalker.com/traffic-ticket-attorney/", note: "Greensboro" },
    ],
  },
  {
    code: "VA",
    disqualifier:
      "The Virginia course earns safe driving points or an insurance discount. It never dismisses a ticket, and reckless driving by speed is a criminal charge in Virginia. That charge needs a lawyer, not a course.",
    firms: [
      { name: "Law Office of Ann Thayer", url: "https://www.thayernovalaw.com/what-we-do/reckless-driving/", note: "Fairfax" },
      { name: "Riley & Wells", url: "https://www.rileywellslaw.com/richmond-va/reckless-driving-lawyer/", note: "Richmond" },
      { name: "Driving Defense Law", url: "https://www.drivingdefenselaw.com/virginia-beach-speeding-and-reckless-driving-attorneys/", note: "Norfolk" },
    ],
  },
  {
    code: "NJ",
    disqualifier:
      "New Jersey has no course that dismisses a ticket. The online course only trims points you already carry. If the ticket threatens surcharges or your license, fighting it is the only lever.",
    firms: [
      { name: "Peter Michael Law LLC", url: "https://pmlawnj.com/traffic-municipal-court/", note: "Jersey City" },
      { name: "Ginsberg & O'Connor P.C.", url: "https://www.ginsberglaw.com/municipal-court/traffic-violations/", note: "Cherry Hill" },
    ],
  },
  {
    code: "AZ",
    disqualifier:
      "Defensive driving school is out if you used it in the past 12 months, the citation is criminal speeding or another serious violation, or you hold a CDL and were cited in a commercial vehicle. Those cases belong with an attorney.",
    firms: [
      { name: "Feldman Royle", url: "https://www.feldmanroyle.com/criminal-traffic/", note: "Phoenix" },
      { name: "Law Office of Alec Hanus", url: "https://www.alechanuslaw.com/practice-areas/traffic-charges/", note: "Tucson" },
      { name: "Corso Law Group", url: "https://www.corsolawgroup.com/phoenix-criminal-traffic-lawyer/", note: "Scottsdale" },
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
