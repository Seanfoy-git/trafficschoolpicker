/**
 * Scrapes NY DMV PIRP (Point & Insurance Reduction Program) providers.
 * Two tables: Classroom providers and Internet/Alternative providers.
 * Needs real browser User-Agent to bypass Cloudflare.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { ScrapedSchool, syncToNotion } from "./lib/scraper-utils";
import { logIssue, flushIssues } from "./lib/issues";

const URL = "https://dmv.ny.gov/points-and-penalties/pirp-and-ipirp";

async function scrape(): Promise<ScrapedSchool[]> {
  console.log("Launching browser for NY DMV...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  const schools: ScrapedSchool[] = [];

  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Extract from all tables on the page
    const rows = await page.$$eval("table tbody tr, table tr", (trs) =>
      trs.map((tr) => {
        const cells = Array.from(tr.querySelectorAll("td, th")).map((td) => td.textContent?.trim() ?? "");
        const links = Array.from(tr.querySelectorAll("a[href]")).map((a) => ({
          href: a.getAttribute("href") ?? "",
          text: a.textContent?.trim() ?? "",
        }));
        return { cells, links };
      })
    );

    for (const row of rows) {
      if (row.cells.length < 2) continue;
      const name = row.cells[0];
      // Skip header rows
      if (!name || name.length < 3 || name.toLowerCase().includes("provider") || name.toLowerCase().includes("name")) continue;

      const phone = row.cells.find((c) => c.match(/\d{3}[-.)]\s*\d{3}/)) ?? "";
      const website = row.links.find((l) => l.href.startsWith("http") && !l.href.includes("ny.gov"))?.href ?? "";
      const allText = row.cells.join(" ").toLowerCase();
      const isOnline = allText.includes("internet") || allText.includes("online") || allText.includes("ipirp");

      schools.push({
        name,
        licenseNumber: "NY-PIRP",
        phone,
        address: row.cells.find((c) => c.includes(",") && c.length > 15) ?? "",
        website,
        onlineAvailable: isOnline,
        notes: isOnline ? "Internet/IPIRP" : "Classroom",
      });
    }

    // Fallback: parse from page text if tables didn't work
    if (schools.length === 0) {
      const text = await page.evaluate(() => document.body.innerText);
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

      for (let i = 0; i < lines.length; i++) {
        if (phonePattern.test(lines[i]) && i > 0 && lines[i - 1].length > 3 && lines[i - 1].length < 100) {
          schools.push({
            name: lines[i - 1],
            licenseNumber: "NY-PIRP",
            phone: lines[i].match(phonePattern)?.[0] ?? "",
            address: "",
            website: "",
            onlineAvailable: true,
            notes: "",
          });
        }
      }
    }
  } catch (err) {
    logIssue("NY DMV scrape failed", "DMV Scraper", "Critical", "NY", (err as Error).message);
  }

  await browser.close();
  console.log(`Scraped ${schools.length} NY PIRP providers`);
  return schools;
}

async function main() {
  console.log("Starting NY DMV PIRP scrape...");
  const schools = await scrape();
  if (schools.length === 0) {
    logIssue("NY DMV scrape returned 0 results", "DMV Scraper", "Warning", "NY", `URL: ${URL}`);
  }
  await syncToNotion(schools, "New York", "NY DMV", "NY");
  await flushIssues();
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
