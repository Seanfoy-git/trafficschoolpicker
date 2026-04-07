/**
 * Issue tracker — logs scraper problems to a Notion Issues database.
 *
 * Notion DB schema (create manually, add NOTION_ISSUES_DB to env):
 *   Title         title     "Trustpilot blocked for iDriveSafely"
 *   Source        select    "Trustpilot" / "Google" / "BBB" / "App Store" / "Play Store" / "Price Scraper" / "DMV Scraper"
 *   Severity      select    "Critical" / "Warning" / "Info"
 *   School        text      School name or slug
 *   Status        select    "Open" / "In Progress" / "Resolved" / "Won't Fix"
 *   Details       text      Full error message or context
 *   First Seen    date      When the issue first appeared
 *   Last Seen     date      Updated each time the issue recurs
 *   Occurrences   number    How many times this has happened
 *
 * If NOTION_ISSUES_DB is not set, issues are logged to console only.
 */

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const ISSUES_DB = process.env.NOTION_ISSUES_DB;

/* eslint-disable @typescript-eslint/no-explicit-any */

export type IssueSeverity = "Critical" | "Warning" | "Info";
export type IssueSource =
  | "Trustpilot"
  | "Google"
  | "BBB"
  | "App Store"
  | "Play Store"
  | "Price Scraper"
  | "DMV Scraper";

const issueBuffer: {
  title: string;
  source: IssueSource;
  severity: IssueSeverity;
  school: string;
  details: string;
}[] = [];

export function logIssue(
  title: string,
  source: IssueSource,
  severity: IssueSeverity,
  school: string,
  details: string
) {
  const icon = severity === "Critical" ? "!!" : severity === "Warning" ? "!" : "i";
  console.warn(`  [${icon}] ${title} (${source}, ${school})`);
  issueBuffer.push({ title, source, severity, school, details });
}

/** Flush all buffered issues to Notion at the end of the run. */
export async function flushIssues() {
  if (!ISSUES_DB || issueBuffer.length === 0) {
    if (issueBuffer.length > 0) {
      console.log(`\n${issueBuffer.length} issue(s) logged (NOTION_ISSUES_DB not set — console only)`);
    }
    return;
  }

  const TODAY = new Date().toISOString().split("T")[0];
  console.log(`\nFlushing ${issueBuffer.length} issue(s) to Notion Issues DB...`);

  // Load existing open issues to check for duplicates
  const existing = new Map<string, { id: string; occurrences: number }>();
  try {
    const response: any = await notion.databases.query({
      database_id: ISSUES_DB,
      filter: {
        property: "Status",
        select: { does_not_equal: "Resolved" },
      },
      page_size: 100,
    });
    for (const page of response.results) {
      const title = (page as any).properties["Title"]?.title?.[0]?.plain_text ?? "";
      const occ = (page as any).properties["Occurrences"]?.number ?? 1;
      if (title) existing.set(title, { id: page.id, occurrences: occ });
    }
  } catch {
    // DB may not exist yet
  }

  for (const issue of issueBuffer) {
    try {
      const match = existing.get(issue.title);
      if (match) {
        // Update existing issue — bump occurrences and last seen
        await notion.pages.update({
          page_id: match.id,
          properties: {
            "Last Seen": { date: { start: TODAY } },
            Occurrences: { number: match.occurrences + 1 },
            Details: { rich_text: [{ text: { content: issue.details } }] },
          } as any,
        });
      } else {
        // Create new issue
        await notion.pages.create({
          parent: { database_id: ISSUES_DB },
          properties: {
            Title: { title: [{ text: { content: issue.title } }] },
            Source: { select: { name: issue.source } },
            Severity: { select: { name: issue.severity } },
            School: { rich_text: [{ text: { content: issue.school } }] },
            Status: { select: { name: "Open" } },
            Details: { rich_text: [{ text: { content: issue.details } }] },
            "First Seen": { date: { start: TODAY } },
            "Last Seen": { date: { start: TODAY } },
            Occurrences: { number: 1 },
          } as any,
        });
      }
    } catch {
      // Silently skip if Issues DB schema doesn't match
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`  ${issueBuffer.length} issue(s) written to Notion`);
}

/* eslint-enable @typescript-eslint/no-explicit-any */
