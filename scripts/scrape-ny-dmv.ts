/**
 * Scrapes NY DMV PIRP (Point & Insurance Reduction Program) providers
 * from the static HTML table at dmv.ny.gov
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { Client } from "@notionhq/client";
import { logIssue, flushIssues } from "./lib/issues";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;

/* eslint-disable @typescript-eslint/no-explicit-any */

const URL = "https://dmv.ny.gov/points-and-penalties/pirp-and-ipirp";

interface ScrapedSchool {
  name: string;
  phone: string;
  website: string;
  method: string;
}

async function scrape(): Promise<ScrapedSchool[]> {
  console.log("Launching browser for NY DMV...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  const schools: ScrapedSchool[] = [];

  // Extract from tables on the page
  const rows = await page.$$eval("table tbody tr", (trs) =>
    trs.map((tr) => {
      const cells = Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() ?? "");
      const link = tr.querySelector("a[href]")?.getAttribute("href") ?? "";
      return { cells, link };
    })
  );

  for (const row of rows) {
    if (row.cells.length >= 2 && row.cells[0].length > 2) {
      schools.push({
        name: row.cells[0],
        phone: row.cells.find((c) => c.match(/\d{3}[-.)]\s*\d{3}/)) ?? "",
        website: row.link,
        method: row.cells.find((c) => c.toLowerCase().includes("internet") || c.toLowerCase().includes("online")) ? "Internet" : "Classroom",
      });
    }
  }

  // Fallback: parse from page text if no table found
  if (schools.length === 0) {
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

    for (let i = 0; i < lines.length; i++) {
      if (phonePattern.test(lines[i]) && i > 0 && lines[i - 1].length > 3 && lines[i - 1].length < 100) {
        schools.push({
          name: lines[i - 1],
          phone: lines[i].match(phonePattern)?.[0] ?? "",
          website: "",
          method: "Internet",
        });
      }
    }
  }

  await browser.close();
  console.log(`Scraped ${schools.length} NY PIRP providers`);
  return schools;
}

async function getExisting(): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const response: any = await notion.databases.query({
      database_id: DIRECTORY_DB,
      filter: { property: "State", select: { equals: "New York" } },
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of response.results) {
      const name = (page as any).properties["School Name"]?.title?.[0]?.plain_text;
      if (name) existing.set(name.toLowerCase(), page.id);
    }
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return existing;
}

async function sync(scraped: ScrapedSchool[]) {
  const existing = await getExisting();
  const TODAY = new Date().toISOString().split("T")[0];
  let created = 0, updated = 0;

  for (const school of scraped) {
    if (!school.name) continue;
    const isOnline = school.method.toLowerCase().includes("internet");

    const properties: any = {
      "School Name": { title: [{ text: { content: school.name } }] },
      "License Number": { rich_text: [{ text: { content: "NY-PIRP" } }] },
      Phone: { rich_text: [{ text: { content: school.phone } }] },
      Address: { rich_text: [{ text: { content: school.method } }] },
      State: { select: { name: "New York" } },
      "Online Available": { checkbox: isOnline },
      Source: { select: { name: "NY DMV" } },
      "Date Scraped": { date: { start: TODAY } },
    };
    if (school.website) properties.Website = { url: school.website.startsWith("http") ? school.website : `https://${school.website}` };

    const existingId = existing.get(school.name.toLowerCase());
    if (existingId) { await notion.pages.update({ page_id: existingId, properties }); updated++; }
    else { await notion.pages.create({ parent: { database_id: DIRECTORY_DB }, properties }); created++; }
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\n  NY Sync: ${scraped.length} scraped, ${created} created, ${updated} updated`);
}

async function main() {
  console.log("Starting NY DMV PIRP scrape...");
  try {
    const schools = await scrape();
    if (schools.length === 0) {
      logIssue("NY DMV scrape returned 0 results", "DMV Scraper", "Critical", "NY", `URL: ${URL}`);
    }
    await sync(schools);
  } catch (err) {
    logIssue("NY DMV scrape failed", "DMV Scraper", "Critical", "NY", (err as Error).message);
    console.error("Fatal:", err);
  }
  await flushIssues();
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
