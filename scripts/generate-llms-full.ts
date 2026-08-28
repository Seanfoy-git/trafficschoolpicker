/**
 * Auto-generates public/llms-full.txt from the Notion States DB.
 *
 * Runs as a prebuild step so llms-full.txt stays in sync with the per-state page
 * content the site actually renders — the Intro Paragraph + State FAQ JSON on the
 * States DB. This replaces the legacy FAQ-DB source (being retired after the State
 * FAQ JSON migration): states whose FAQs moved to the States DB — Washington DC
 * included — now appear, and each entry links to the real page slug (e.g.
 * /california) instead of the two-letter code the old generator emitted.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
import { writeFileSync } from "fs";
import { join } from "path";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { STATE_LIST } from "../lib/state-utils";
// Type-only imports are erased at compile time, so they don't trigger lib/notion's
// module-load (its Client reads the token then). The runtime helpers are pulled in
// via dynamic import inside main(), AFTER config() has loaded .env.local.
import type { School, ReviewBlock, ReviewRichText } from "../lib/types";

const notion = makeNotionClient();
const STATES_DB = process.env.NOTION_STATES_DB;
const BASE_URL = "https://www.trafficschoolpicker.com";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Concatenate every rich_text/title segment — Notion splits long values across
// 2000-char segments, so reading only [0] would truncate longer intros/FAQ JSON.
function fullText(page: PageObjectResponse, name: string): string {
  const prop = (page.properties as any)[name];
  if (prop?.type === "rich_text") return prop.rich_text.map((r: any) => r.plain_text).join("");
  if (prop?.type === "title") return prop.title.map((r: any) => r.plain_text).join("");
  if (prop?.type === "select") return prop.select?.name ?? "";
  return "";
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// The question-page "Sources" property mixes public cites (statutes, agency URLs)
// with internal working artifacts a reader/model can't resolve ("States DB AZ row",
// "Tranche-one CA ledger", "Pricing DB pull …"). Sanitize before emitting to the
// public llms file: drop the internal names, keep the real cites, preserve any
// verification date as "last verified YYYY-MM-DD", canonicalize the cost study to
// its public page, and point the stale FL statute URL at the current one.
function sanitizeSources(raw: string): string {
  const FL_CURRENT =
    "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0318/Sections/0318.14.html";
  const TICKET_COST = `Ticket Cost Study: ${BASE_URL}/blog/true-cost-of-a-traffic-ticket`;
  const out: string[] = [];
  for (let seg of raw.split("|").map((s) => s.trim()).filter(Boolean)) {
    if (/Pricing DB/i.test(seg)) continue; // internal, no public equivalent
    if (/Tranche-one/i.test(seg)) continue; // internal verification ledger
    if (/Ticket Cost Study/i.test(seg)) { out.push(TICKET_COST); continue; }
    // Stale FL statute URL + its editorial TODO parenthetical
    seg = seg.replace(/https?:\/\/www\.flsenate\.gov\/laws\/statutes\/2021\/318\.14/gi, FL_CURRENT);
    seg = seg.replace(/\s*\(update to current-year URL\)/gi, "");
    // "States DB … (verified 2026-08-13[, …])" / "States DB verified 2026-08-13" → keep the date
    seg = seg.replace(/States DB [A-Za-z ]*?\(verified (\d{4}-\d{2}-\d{2})[^)]*\)/gi, "last verified $1");
    seg = seg.replace(/States DB verified (\d{4}-\d{2}-\d{2})/gi, "last verified $1");
    // Remaining internal "States DB …" references (no clean date) → drop the phrase
    seg = seg.replace(/States DB [A-Z]{2} row \+ \d{4}-\d{2}-\d{2}[^,;|]*/gi, "");
    seg = seg.replace(/States DB [A-Z]{2} Minimum Hours(?:\s*\(corrected\))?/gi, "");
    seg = seg.replace(/States DB [A-Z]{2} rows?/gi, "");
    seg = seg.replace(/States DB[^|]*/gi, ""); // catch-all
    // Tidy leftover separators / label-only fragments
    seg = seg.replace(/^\s*[:,]\s*/, "").replace(/\s*[:,]\s*$/, "").replace(/\s{2,}/g, " ").trim();
    if (!seg || /^(Cost figures|Prices|Discount math|County fees[^|]*|via [^|]*)$/i.test(seg)) continue;
    out.push(seg);
  }
  const seen = new Set<string>();
  return out.filter((s) => { const k = s.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).join(" | ");
}

type StateContent = { intro: string; faqs: { q: string; a: string }[] };

function writeOut(body: string) {
  writeFileSync(join(process.cwd(), "public", "llms-full.txt"), body);
}

// ─── School review helpers ──────────────────────────────────

// A single representative price for the one-line summary: the school's generic
// price, else the cheapest per-state price. null when neither is set.
function representativePrice(s: School): number | null {
  if (s.genericPrice != null) return s.genericPrice;
  const vals = Object.values(s.statePrices).filter((v): v is number => typeof v === "number");
  return vals.length ? Math.min(...vals) : null;
}

// Whole dollars render bare ($29), cents to two places ($23.20) — never "$23.2".
function formatPrice(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(2);
}

// One-line fact summary — only the parts that are present (never a placeholder).
function schoolFacts(s: School): string {
  const parts: string[] = [];
  if (s.rating != null) {
    let r = `Rating ${s.rating}/5`;
    if (s.reviewCount != null) {
      r += ` (${s.reviewCount.toLocaleString()} reviews${s.reviewSource ? ` on ${s.reviewSource}` : ""})`;
    }
    parts.push(r);
  }
  const price = representativePrice(s);
  if (price != null) parts.push(`from $${formatPrice(price)}`);
  if (s.stateCodes.includes("all")) parts.push("Available nationwide");
  else if (s.stateCodes.length) parts.push(`Covers ${s.stateCodes.length} states (${s.stateCodes.join(", ")})`);
  if (s.courtAcceptance) parts.push(s.courtAcceptance);
  if (s.completionHours != null) parts.push(`${s.completionHours}h course`);
  return parts.length ? `**Facts:** ${parts.join(" · ")}` : "";
}

// Render one block's rich-text runs to inline markdown (bold/italic/link).
function runsToMarkdown(runs: ReviewRichText[]): string {
  return runs
    .map((r) => {
      let t = r.text;
      if (r.bold) t = `**${t}**`;
      if (r.italic) t = `*${t}*`;
      if (r.href) t = `[${t}](${r.href})`;
      return t;
    })
    .join("");
}

// Render the review body blocks to plain markdown: paragraphs as text, headings
// as ###, list items as -/N. (numbering resets after any non-list block).
function blocksToMarkdown(blocks: ReviewBlock[]): string {
  const out: string[] = [];
  let numbered = 0;
  blocks.forEach((b, i) => {
    const md = runsToMarkdown(b.richText);
    if (b.type === "heading_2" || b.type === "heading_3") out.push(`### ${md}`);
    else if (b.type === "bulleted_list_item") out.push(`- ${md}`);
    else if (b.type === "numbered_list_item") {
      numbered = blocks[i - 1]?.type === "numbered_list_item" ? numbered + 1 : 1;
      out.push(`${numbered}. ${md}`);
    } else out.push(md);
  });
  return out.join("\n\n");
}

async function main() {
  if (!STATES_DB) {
    console.log("NOTION_STATES_DB not set — generating placeholder llms-full.txt");
    writeOut("# TrafficSchoolPicker.com — Full State Reference\n\n> States database not configured yet.\n");
    return;
  }

  // Pull every States row; keep the first Complete row per state code. The DB is
  // already consolidated to one canonical row per state, so this is defensive.
  const byCode: Record<string, StateContent> = {};
  let cursor: string | undefined;

  do {
    const res = await notion.databases.query({
      database_id: STATES_DB,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of res.results) {
      if (page.object !== "page") continue;
      const p = page as PageObjectResponse;
      const code = fullText(p, "Abbreviation").toUpperCase();
      if (!code || byCode[code]) continue;
      if (fullText(p, "Content Status") !== "Complete") continue;

      const intro = fullText(p, "Intro Paragraph").trim();
      let faqs: { q: string; a: string }[] = [];
      const raw = fullText(p, "State FAQ").trim();
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            faqs = parsed
              .filter((f) => f?.q && f?.a)
              .map((f) => ({ q: String(f.q), a: String(f.a) }));
          }
        } catch {
          /* malformed JSON — skip FAQs for this state, keep the intro */
        }
      }
      byCode[code] = { intro, faqs };
    }
    cursor = res.next_cursor ?? undefined;
  } while (cursor);

  const lines: string[] = [
    "# TrafficSchoolPicker.com — Full State Reference",
    "",
    "> Structured facts for every US state (and Washington DC) traffic school program.",
    "> Source: TrafficSchoolPicker per-state editorial content, verified against official DMV and court records.",
    "> Auto-generated at build time from the States content database.",
    "",
  ];

  // Iterate STATE_LIST so slugs and names are canonical and only routed pages
  // appear (a Complete States row with no matching route is skipped).
  let emitted = 0;
  for (const s of STATE_LIST) {
    const content = byCode[s.code.toUpperCase()];
    if (!content || (!content.intro && content.faqs.length === 0)) continue;

    lines.push(`## ${s.name}`);
    lines.push("");
    lines.push(`**URL:** ${BASE_URL}/${s.slug}`);
    lines.push("");
    if (content.intro) {
      lines.push(content.intro);
      lines.push("");
    }
    for (const faq of content.faqs) {
      lines.push(`**${faq.q}**`);
      lines.push(faq.a);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
    emitted++;
  }

  // ── School reviews ──
  // The long-form written reviews live in each School's Notion page body; emit
  // them so they become citable LLM content. Reuse the app's getters via dynamic
  // import (config() has already loaded .env.local, so lib/notion's Client sees
  // the token). getAllSchools is already Show-On-Site + eligible. Any failure here
  // propagates to main().catch → the committed llms-full.txt is left in place.
  const { getAllSchools, getSchoolReviewBody } = await import("../lib/notion");
  const schools = [...(await getAllSchools())].sort(
    (a, b) => a.tier - b.tier || a.name.localeCompare(b.name)
  );

  let schoolsEmitted = 0;
  if (schools.length) {
    lines.push("# TrafficSchoolPicker.com — School Reviews");
    lines.push("");
    lines.push("> Independent, long-form reviews of each online traffic school we cover.");
    lines.push("> Source: TrafficSchoolPicker editorial reviews.");
    lines.push("");

    for (const school of schools) {
      const body = await getSchoolReviewBody(school.id);
      lines.push(`## ${school.name} Review`);
      lines.push("");
      lines.push(`**URL:** ${BASE_URL}/reviews/${school.slug}`);
      lines.push("");
      const facts = schoolFacts(school);
      if (facts) {
        lines.push(facts);
        lines.push("");
      }
      if (body.length) {
        lines.push(blocksToMarkdown(body));
        lines.push("");
      }
      lines.push("---");
      lines.push("");
      schoolsEmitted++;
    }
  }

  // ── State question pages (gated on Content Status = Complete) ──
  // Each Complete question row's Key Facts + prose + sources become citable
  // per-state LLM facts. Same gate as the pages themselves — Draft rows never emit.
  const { getQuestionPages, getQuestionBody } = await import("../lib/notion");
  const questions = [...(await getQuestionPages())].sort(
    (a, b) => a.stateSlug.localeCompare(b.stateSlug) || a.questionSlug.localeCompare(b.questionSlug)
  );
  let questionsEmitted = 0;
  if (questions.length) {
    lines.push("# TrafficSchoolPicker.com — State Question Pages");
    lines.push("");
    lines.push("> Per-state answers to common traffic-school questions, each verified against primary sources.");
    lines.push("> Source: TrafficSchoolPicker editorial content, verified against official DMV, court, and statute records.");
    lines.push("");
    for (const q of questions) {
      const body = await getQuestionBody(q.id);
      if (!body) continue; // fail-closed: skip a row whose body couldn't be fetched
      lines.push(`## ${q.h1}`);
      lines.push("");
      lines.push(`**URL:** ${BASE_URL}/${q.stateSlug}/${q.questionSlug}`);
      lines.push("");
      if (body.keyFacts.length) {
        for (const f of body.keyFacts) lines.push(`- **${f.label}:** ${f.value}`);
        lines.push("");
      }
      if (body.body.length) {
        lines.push(blocksToMarkdown(body.body));
        lines.push("");
      }
      const cleanSources = sanitizeSources(q.sources);
      if (cleanSources) {
        lines.push(`**Sources:** ${cleanSources}`);
        lines.push("");
      }
      lines.push("---");
      lines.push("");
      questionsEmitted++;
    }
  }

  // ── True Cost of a Traffic Ticket (fixed 2026 study) ──
  // A static block (no Notion data) so the per-state cost figures become citable
  // LLM facts. Appended last so the file ends with the study section.
  lines.push(
    "## The True Cost of a Traffic Ticket (2026 study)",
    "",
    "> TrafficSchoolPicker analysis of all 51 US jurisdictions. All-in cost of a first speeding ticket",
    "> = fine + estimated 3-year insurance surcharge. Full write-up:",
    "> https://www.trafficschoolpicker.com/blog/true-cost-of-a-traffic-ticket",
    "",
    "- Nationally, one speeding ticket costs about $435 more per year in insurance (~$1,300 over 3 years). The average 24-25% rate increase dwarfs the ~$130 average 10-over fine.",
    "- Most expensive states, all-in: Michigan $8,742, California $5,619, Hawaii $5,227, Texas $5,047, New Jersey $4,965, Delaware $4,582, Louisiana $4,512, Rhode Island $4,481, Nevada $4,228, Florida $4,170.",
    "- Cheapest states, all-in: Vermont $1,305, Montana $1,486, Pennsylvania $1,494, Nebraska $1,528, Ohio $1,684, Utah $1,792, Virginia $1,818, Maryland $1,869, New Hampshire $2,024, Maine $2,100.",
    "- Biggest traffic-school net savings: Michigan ~$8,600, California ~$5,300, Hawaii ~$5,050, Texas ~$4,650, Louisiana ~$4,300, Nevada ~$3,950, Florida ~$3,900, Tennessee ~$2,950, Arizona ~$2,950, Oklahoma ~$2,350.",
    "- Texas example: a driving-safety-course dismissal (~$182 all-in incl. court fee + driving record) prevents ~$4,800 in 3-year surcharges, ~26x return. Mechanism is dismissal, not a discount.",
    "- Course mechanisms differ by state: masking (CA, VC §1808.7), dismissal (TX, Art. 45A.352), adjudication withheld (FL, §318.14), base-rate discount (NY PIRP, insurers still see the ticket), one-time point masking (MI BDIC). PA/MA/NJ/KS offer little for a first ticket.",
    "- Sources: FinanceBuzz (fines), CarInsurance.com/Quadrant (surcharges), U.S. News, NHTSA. Rankings are source-dependent (esp. Hawaii).",
    ""
  );

  writeOut(lines.join("\n"));
  console.log(
    `Written llms-full.txt with ${emitted} states, ${schoolsEmitted} school reviews, ${questionsEmitted} question pages, and the True Cost study`
  );
}

// Non-fatal: a Notion hiccup at build time should not fail the deploy — the
// committed llms-full.txt stays in place if generation can't complete.
main().catch((e) => {
  console.error("llms-full generation failed (keeping existing file):", e);
});
