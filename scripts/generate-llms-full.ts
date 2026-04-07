/**
 * Auto-generates public/llms-full.txt from the Notion FAQ database.
 * Run as prebuild step — keeps llms-full.txt in sync with FAQ facts.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";
import { join } from "path";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const FAQ_DB_ID = process.env.NOTION_FAQ_DB_ID;
const BASE_URL = "https://www.trafficschoolpicker.com";

/* eslint-disable @typescript-eslint/no-explicit-any */

function getProp(page: PageObjectResponse, name: string): string {
  const prop = (page.properties as any)[name];
  if (prop?.type === "rich_text") return prop.rich_text[0]?.plain_text ?? "";
  if (prop?.type === "select") return prop.select?.name ?? "";
  if (prop?.type === "title") return prop.title[0]?.plain_text ?? "";
  return "";
}

/* eslint-enable @typescript-eslint/no-explicit-any */

type FaqRow = {
  state: string;
  stateCode: string;
  question: string;
  answer: string;
  keyFact: string;
};

async function main() {
  if (!FAQ_DB_ID) {
    console.log("NOTION_FAQ_DB_ID not set — generating placeholder llms-full.txt");
    writeFileSync(
      join(process.cwd(), "public", "llms-full.txt"),
      "# TrafficSchoolPicker.com — Full State Reference\n\n> FAQ database not configured yet.\n"
    );
    return;
  }

  const rows: FaqRow[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.databases.query({
      database_id: FAQ_DB_ID,
      filter: { property: "Status", select: { equals: "Verified" } },
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of res.results) {
      if (page.object !== "page") continue;
      const p = page as PageObjectResponse;
      rows.push({
        state: getProp(p, "State"),
        stateCode: getProp(p, "State Code"),
        question: getProp(p, "Question"),
        answer: getProp(p, "Answer"),
        keyFact: getProp(p, "Key Fact"),
      });
    }
    cursor = res.next_cursor ?? undefined;
  } while (cursor);

  // Group by state
  const byState: Record<string, FaqRow[]> = {};
  for (const row of rows) {
    if (!byState[row.stateCode]) byState[row.stateCode] = [];
    byState[row.stateCode].push(row);
  }

  const lines: string[] = [
    "# TrafficSchoolPicker.com — Full State Reference",
    "",
    "> Structured facts for every US state traffic school program.",
    "> Source: Official DMV and court records, verified April 2026.",
    "> Data updates automatically from the TrafficSchoolPicker fact database.",
    "",
  ];

  for (const [stateCode, faqs] of Object.entries(byState).sort()) {
    const stateName = faqs[0]?.state ?? stateCode;
    lines.push(`## ${stateName}`);
    lines.push("");
    lines.push(`**URL:** ${BASE_URL}/${stateCode}`);
    lines.push("");

    for (const faq of faqs) {
      lines.push(`**${faq.question}**`);
      lines.push(faq.answer);
      if (faq.keyFact) lines.push(`*Key fact: ${faq.keyFact}*`);
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  const outputPath = join(process.cwd(), "public", "llms-full.txt");
  writeFileSync(outputPath, lines.join("\n"));
  console.log(
    `Written llms-full.txt with ${Object.keys(byState).length} states, ${rows.length} facts`
  );
}

main().catch(console.error);
