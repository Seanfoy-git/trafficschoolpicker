/**
 * FAQ-integrity gate (prebuild). One FAQ set per state, internally consistent.
 *
 * The legacy FAQ migration deduped by EXACT normalized question text, so two
 * questions asking the same thing in different words ("Does GA defensive driving
 * dismiss…" vs "Does GA traffic school dismiss…") slipped through as distinct —
 * and where the legacy DB gave them different answers, a state shipped two
 * contradictory dismissal answers (GA said both No and a wrong "Yes, masking";
 * VA said both No and a deferred-disposition Yes). This gate makes that class of
 * drift a red build instead of a silent escape. Same philosophy as the other
 * verify-* scripts: assert the invariant, fail loudly on regression.
 *
 * HARD FAIL:
 *   1. Exact-duplicate question within a state (normalized).
 *   2. Dismissal-polarity conflict: a state whose FAQ contains both a clear
 *      "yes, it dismisses" and a clear "no, it does not" answer. (A "no statewide
 *      program / court-by-court" answer is NOT a Yes, so genuine court-discretion
 *      states with several dismissal angles pass.)
 *
 *   npx tsx scripts/verify-faq-integrity.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = makeNotionClient();
const STATES_DB = process.env.NOTION_STATES_DB;

function fullText(page: PageObjectResponse, name: string): string {
  const prop = (page.properties as Record<string, any>)[name];
  if (prop?.type === "rich_text") return prop.rich_text.map((r: any) => r.plain_text).join("");
  if (prop?.type === "title") return prop.title.map((r: any) => r.plain_text).join("");
  if (prop?.type === "select") return prop.select?.name ?? "";
  return "";
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Answer polarity for a dismissal question. A "no statewide program / court-by-court"
// answer counts as NO (no statewide dismissal), not as a conflicting Yes.
const isYes = (a: string) => /^\s*yes\b/i.test(a);
const isNo = (a: string) =>
  /^\s*(no\b|there is no\b|not\b)/i.test(a) ||
  /\bdoes not dismiss\b|\bcannot dismiss\b|\bno statewide (ticket[- ]?)?dismissal\b/i.test(a);

async function main() {
  if (!STATES_DB) {
    console.error("❌ FAQ guard: NOTION_STATES_DB not set");
    process.exit(1);
  }
  const failures: string[] = [];
  let scanned = 0;
  let cursor: string | undefined;

  do {
    const res = await notion.databases.query({ database_id: STATES_DB, start_cursor: cursor, page_size: 100 });
    for (const page of res.results) {
      if (page.object !== "page") continue;
      const p = page as PageObjectResponse;
      const code = fullText(p, "Abbreviation").toUpperCase();
      const raw = fullText(p, "State FAQ").trim().replace(/^faqjson:\s*/i, "");
      if (!code || !raw) continue;
      let arr: { q: string; a: string }[];
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;
        arr = parsed.filter((f) => f?.q && f?.a).map((f) => ({ q: String(f.q), a: String(f.a) }));
      } catch {
        failures.push(`${code}: State FAQ is not valid JSON`);
        continue;
      }
      scanned++;

      // 1. exact-duplicate questions
      const seen = new Map<string, number>();
      for (const f of arr) {
        const k = norm(f.q);
        seen.set(k, (seen.get(k) ?? 0) + 1);
      }
      for (const [k, n] of seen) if (n > 1) failures.push(`${code}: duplicate question x${n}: "${k.slice(0, 60)}"`);

      // 2. dismissal-polarity conflict
      const dismiss = arr.filter((f) => /dismiss/i.test(f.q));
      const yes = dismiss.filter((f) => isYes(f.a));
      const no = dismiss.filter((f) => isNo(f.a));
      if (yes.length && no.length) {
        failures.push(
          `${code}: contradictory dismissal answers — "${yes[0].q}" says YES while "${no[0].q}" says NO`
        );
      }
    }
    cursor = res.next_cursor ?? undefined;
  } while (cursor);

  if (failures.length) {
    console.error(`❌ FAQ integrity guard: ${failures.length} problem(s) across ${scanned} states:`);
    for (const f of failures) console.error(`   - ${f}`);
    process.exit(1);
  }
  console.log(`✅ FAQ integrity guard OK — ${scanned} states, no duplicate or contradictory FAQ questions.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
