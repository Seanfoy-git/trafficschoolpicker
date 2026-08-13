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

type StateContent = { intro: string; faqs: { q: string; a: string }[] };

function writeOut(body: string) {
  writeFileSync(join(process.cwd(), "public", "llms-full.txt"), body);
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

  writeOut(lines.join("\n"));
  console.log(`Written llms-full.txt with ${emitted} states from the States DB`);
}

// Non-fatal: a Notion hiccup at build time should not fail the deploy — the
// committed llms-full.txt stays in place if generation can't complete.
main().catch((e) => {
  console.error("llms-full generation failed (keeping existing file):", e);
});
