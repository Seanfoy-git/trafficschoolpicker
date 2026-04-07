/**
 * Generic state DMV scraper. Reads state-sources.ts config and scrapes
 * all enabled static-html states. Playwright states and CSV states
 * still use their dedicated scripts (CA, TX, FL have custom logic).
 *
 * Usage:
 *   npx tsx scripts/scrape-states.ts           # all enabled static-html states
 *   npx tsx scripts/scrape-states.ts NY NV NJ   # specific states only
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { getEnabledSources, getSourceForState } from "./config/state-sources";
import { ScrapedSchool, syncToNotion } from "./lib/scraper-utils";
import { logIssue, flushIssues } from "./lib/issues";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── GENERIC STATIC-HTML PARSER ─────────────────────────────
// Uses Playwright to load the page, then extracts school-like
// data from tables, lists, and text patterns.

async function scrapeStaticHtml(
  url: string,
  stateCode: string,
  page: import("playwright").Page
): Promise<ScrapedSchool[]> {
  const schools: ScrapedSchool[] = [];

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Strategy 1: Look for HTML tables with school data
  const tableRows = await page.$$eval("table tbody tr, table tr", (trs) =>
    trs.map((tr) => {
      const cells = Array.from(tr.querySelectorAll("td, th")).map((td) => td.textContent?.trim() ?? "");
      const links = Array.from(tr.querySelectorAll("a[href]")).map((a) => ({
        text: a.textContent?.trim() ?? "",
        href: a.getAttribute("href") ?? "",
      }));
      return { cells, links };
    })
  );

  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

  for (const row of tableRows) {
    if (row.cells.length < 2) continue;
    // Skip header rows
    if (row.cells[0].toLowerCase().includes("name") && row.cells[0].length < 20) continue;
    if (row.cells.every((c) => c.length < 3)) continue;

    const name = row.cells[0] || row.links[0]?.text || "";
    if (name.length < 3 || name.length > 150) continue;

    const phone = row.cells.find((c) => phonePattern.test(c))?.match(phonePattern)?.[0] ?? "";
    const website = row.links.find((l) => l.href.startsWith("http") && !l.href.includes("gov"))?.href ?? "";
    const allText = row.cells.join(" ").toLowerCase();
    const isOnline = allText.includes("internet") || allText.includes("online") || allText.includes("web");

    schools.push({
      name,
      licenseNumber: "",
      phone,
      address: row.cells.slice(1).find((c) => c.length > 10 && !phonePattern.test(c) && !c.startsWith("http")) ?? "",
      website,
      onlineAvailable: isOnline,
      notes: "",
    });
  }

  // Strategy 2: If no table data, try to extract from page text
  if (schools.length === 0) {
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Look for school-name + phone patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // A school name is typically 5-100 chars, followed by a phone number nearby
      if (line.length > 5 && line.length < 100 && !line.match(/^\d/) && !line.match(/^(Home|About|Contact|FAQ|Search|Menu|Copyright|Privacy)/i)) {
        const nextLines = lines.slice(i + 1, i + 4).join(" ");
        const phoneMatch = nextLines.match(phonePattern);
        if (phoneMatch) {
          const urlMatch = nextLines.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/);
          schools.push({
            name: line,
            licenseNumber: "",
            phone: phoneMatch[0],
            address: "",
            website: urlMatch?.[0] ?? "",
            onlineAvailable: true,
            notes: "",
          });
          i += 2; // Skip consumed lines
        }
      }
    }
  }

  // Strategy 3: Extract from list items (ul/li patterns)
  if (schools.length === 0) {
    const listItems = await page.$$eval("main li, .content li, article li, .entry-content li", (lis) =>
      lis.map((li) => ({
        text: li.textContent?.trim() ?? "",
        link: li.querySelector("a[href]")?.getAttribute("href") ?? "",
        linkText: li.querySelector("a")?.textContent?.trim() ?? "",
      }))
    );

    for (const item of listItems) {
      if (item.text.length > 10 && item.text.length < 200) {
        const phoneMatch = item.text.match(phonePattern);
        if (phoneMatch || item.link) {
          schools.push({
            name: item.linkText || item.text.split(/[,\n(]/)[0].trim(),
            licenseNumber: "",
            phone: phoneMatch?.[0] ?? "",
            address: "",
            website: item.link.startsWith("http") ? item.link : "",
            onlineAvailable: true,
            notes: "",
          });
        }
      }
    }
  }

  return schools;
}

// ─── MAIN ───────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2).map((a) => a.toUpperCase());
  const dedicatedScripts = ["CA", "TX", "FL"]; // These have their own scripts

  let sources = getEnabledSources()
    .filter((s) => s.method === "static-html" || s.method === "playwright")
    .filter((s) => !dedicatedScripts.includes(s.stateCode));

  // If specific states requested, filter to just those
  if (args.length > 0) {
    sources = args
      .map((code) => getSourceForState(code))
      .filter((s): s is NonNullable<typeof s> => !!s && s.method !== "manual");
  }

  if (sources.length === 0) {
    console.log("No states to scrape. Check state-sources.ts config.");
    return;
  }

  console.log(`Scraping ${sources.length} states...\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results: { state: string; count: number; created: number; updated: number }[] = [];

  for (const source of sources) {
    console.log(`━━ ${source.stateName} (${source.stateCode}) ━━`);
    console.log(`  Source: ${source.source}`);
    console.log(`  URL: ${source.url}`);

    try {
      const schools = await scrapeStaticHtml(source.url, source.stateCode, page);
      console.log(`  Scraped: ${schools.length} schools`);

      if (schools.length === 0) {
        logIssue(
          `${source.stateName} scrape returned 0 results`,
          "DMV Scraper", "Warning", source.stateCode,
          `URL: ${source.url}. Page structure may have changed.`
        );
        results.push({ state: source.stateCode, count: 0, created: 0, updated: 0 });
      } else {
        const { created, updated } = await syncToNotion(
          schools, source.stateName, source.source, source.stateCode
        );
        results.push({ state: source.stateCode, count: schools.length, created, updated });
      }
    } catch (err) {
      logIssue(
        `${source.stateName} scrape failed`,
        "DMV Scraper", "Critical", source.stateCode,
        (err as Error).message
      );
      results.push({ state: source.stateCode, count: 0, created: 0, updated: 0 });
      console.error(`  ERROR: ${(err as Error).message}`);
    }

    console.log("");
    await new Promise((r) => setTimeout(r, 1000)); // Polite delay between states
  }

  await browser.close();
  await flushIssues();

  // Summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Multi-State Scrape Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  for (const r of results) {
    const icon = r.count > 0 ? "OK" : "!!";
    console.log(`  ${icon.padEnd(4)} ${r.state}: ${r.count} schools (${r.created} new, ${r.updated} updated)`);
  }
  const total = results.reduce((sum, r) => sum + r.count, 0);
  console.log(`\n  Total: ${total} schools across ${results.length} states`);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
