import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export type StateFaq = {
  question: string;
  answer: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function getRichText(page: PageObjectResponse, property: string): string {
  const prop = (page.properties as any)[property];
  if (prop?.type === "rich_text") {
    return prop.rich_text[0]?.plain_text ?? "";
  }
  return "";
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// One fetch of every Verified FAQ row per build, grouped by the row's "State
// Code". React cache() only dedupes within a single render, so the old per-state
// query ran 51× per build (and logged 51 errors when rate-limited); this
// collapses it to one. On failure it caches an empty map rather than clearing —
// this is a legacy fallback (the States DB "State FAQ" JSON is the primary
// source and is being retired), so it must never re-hammer Notion during an
// outage; states just fall through to their States DB / static FAQs.
let allFaqsMemo: Promise<Map<string, StateFaq[]>> | null = null;

function getAllNotionFaqs(): Promise<Map<string, StateFaq[]>> {
  if (!allFaqsMemo) {
    allFaqsMemo = (async () => {
      const byCode = new Map<string, StateFaq[]>();
      const dbId = process.env.NOTION_FAQ_DB_ID;
      if (!process.env.NOTION_TOKEN || !dbId) return byCode;

      let cursor: string | undefined;
      do {
        const response = await notion.databases.query({
          database_id: dbId,
          filter: { property: "Status", select: { equals: "Verified" } },
          start_cursor: cursor,
          page_size: 100,
        });
        for (const page of response.results) {
          if (page.object !== "page") continue;
          const p = page as PageObjectResponse;
          const code = getRichText(p, "State Code");
          const faq = {
            question: getRichText(p, "Question"),
            answer: getRichText(p, "Answer"),
          };
          if (!code || !faq.question || !faq.answer) continue;
          const list = byCode.get(code);
          if (list) list.push(faq);
          else byCode.set(code, [faq]);
        }
        cursor = response.next_cursor ?? undefined;
      } while (cursor);
      return byCode;
    })().catch((error) => {
      // Cache empty (don't re-hammer) — the States DB FAQ is the primary source.
      console.error("Failed to fetch legacy Notion FAQs:", error);
      return new Map<string, StateFaq[]>();
    });
  }
  return allFaqsMemo;
}

export async function getNotionStateFaqs(
  stateCode: string
): Promise<StateFaq[]> {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_FAQ_DB_ID) return [];
  return (await getAllNotionFaqs()).get(stateCode) ?? [];
}
