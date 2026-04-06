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

export async function getNotionStateFaqs(
  stateCode: string
): Promise<StateFaq[]> {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_FAQ_DB_ID) return [];

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_FAQ_DB_ID,
      filter: {
        and: [
          { property: "State Code", rich_text: { equals: stateCode } },
          { property: "Status", select: { equals: "Verified" } },
        ],
      },
    });

    return response.results
      .filter(
        (page): page is PageObjectResponse => page.object === "page"
      )
      .map((page) => ({
        question: getRichText(page, "Question"),
        answer: getRichText(page, "Answer"),
      }))
      .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
  } catch (error) {
    console.error(`Failed to fetch FAQs for state: ${stateCode}`, error);
    return [];
  }
}
