/**
 * Visits each Tier 1 school's pricing page, extracts the current price,
 * validates for anomalies, and writes data/tier1-prices.json.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import { runScraper, ScrapeResult } from "./lib/validate";

type PriceResult = {
  school: string;
  slug: string;
  url: string;
  price: number | null;
  previousPrice: number | null;
  scrapedAt: string;
  error: string | null;
};

const SCHOOLS = [
  {
    name: "iDriveSafely",
    slug: "idrivesafely",
    url: "https://www.idrivesafely.com/traffic-school/",
    selectors: ['[class*="price"]', '[class*="Price"]', '[data-price]', ".cost", ".amount"],
  },
  {
    name: "Aceable",
    slug: "aceable",
    url: "https://www.aceable.com/defensive-driving/",
    selectors: ['[class*="price"]', '[class*="Price"]', '[data-price]', ".cost", ".amount"],
  },
  {
    name: "TicketSchool",
    slug: "ticketschool",
    url: "https://www.ticketschool.com/",
    selectors: ['[class*="price"]', '[class*="Price"]', '[data-price]', ".cost", ".amount"],
  },
  {
    name: "Improv Traffic School",
    slug: "improv-traffic-school",
    url: "https://www.improvtrafficschool.com/",
    selectors: ['[class*="price"]', '[class*="Price"]', '[data-price]', ".cost", ".amount"],
  },
  {
    name: "DriversEd.com",
    slug: "driversed",
    url: "https://www.driversed.com/traffic-school/",
    selectors: ['[class*="price"]', '[class*="Price"]', '[data-price]', ".cost", ".amount"],
  },
];

function extractPrice(html: string, selectors: string[]): number | null {
  const $ = cheerio.load(html);

  for (const sel of selectors) {
    const els = $(sel);
    for (let i = 0; i < els.length; i++) {
      const text = els.eq(i).text();
      const match = text.match(/\$(\d+(?:\.\d{2})?)/);
      if (match) {
        const price = parseFloat(match[1]);
        if (price >= 5 && price <= 150) return price;
      }
      const dataPrice = els.eq(i).attr("data-price");
      if (dataPrice) {
        const price = parseFloat(dataPrice);
        if (price >= 5 && price <= 150) return price;
      }
    }
  }

  // Regex fallback — find most common reasonable dollar amount
  const allPrices: number[] = [];
  let m: RegExpExecArray | null;
  const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
  while ((m = priceRegex.exec(html)) !== null) {
    const p = parseFloat(m[1]);
    if (p >= 10 && p <= 100) allPrices.push(p);
  }

  if (allPrices.length > 0) {
    const freq: Record<number, number> = {};
    for (const p of allPrices) freq[p] = (freq[p] ?? 0) + 1;
    const sorted = Object.entries(freq).sort((a, b) => Number(b[1]) - Number(a[1]));
    return parseFloat(sorted[0][0]);
  }

  return null;
}

export async function scrape(): Promise<ScrapeResult> {
  return runScraper("tier1-prices", async () => {
    console.log("Scraping Tier 1 school prices...\n");

    // Load previous prices
    const prevPath = path.join(process.cwd(), "data", "tier1-prices.json");
    const prevPrices: Record<string, number> = {};
    if (existsSync(prevPath)) {
      try {
        const prev: PriceResult[] = JSON.parse(readFileSync(prevPath, "utf-8"));
        for (const p of prev) {
          if (p.price !== null) prevPrices[p.slug] = p.price;
        }
      } catch { /* ignore corrupt file */ }
    }

    const results: PriceResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const school of SCHOOLS) {
      process.stdout.write(`  ${school.name}... `);
      let price: number | null = null;
      let error: string | null = null;

      try {
        const res = await fetch(school.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          error = `HTTP ${res.status}`;
        } else {
          const html = await res.text();

          // Detect if we got a captcha/block page instead of real content
          if (html.length < 1000) {
            error = `Response suspiciously small (${html.length} bytes) — may be blocked`;
          } else if (html.includes("captcha") || html.includes("Captcha") || html.includes("CAPTCHA")) {
            error = "Page contains CAPTCHA — likely bot-blocked";
          } else {
            price = extractPrice(html, school.selectors);
            if (price === null) {
              error = "Could not extract price — page structure may have changed";
            }
          }
        }
      } catch (err) {
        error = (err as Error).message;
      }

      const previousPrice = prevPrices[school.slug] ?? null;

      // Validation: flag large price swings
      if (price !== null && previousPrice !== null) {
        const changePercent = Math.abs((price - previousPrice) / previousPrice) * 100;
        if (changePercent > 50) {
          warnings.push(
            `${school.name}: price changed ${changePercent.toFixed(0)}% ($${previousPrice} → $${price}) — verify manually`
          );
        }
      }

      if (error) {
        errors.push(`${school.name}: ${error}`);
      }

      results.push({
        school: school.name,
        slug: school.slug,
        url: school.url,
        price,
        previousPrice,
        scrapedAt: new Date().toISOString(),
        error,
      });

      if (price !== null) {
        const changed = previousPrice !== null && previousPrice !== price
          ? ` (was $${previousPrice.toFixed(2)})`
          : "";
        console.log(`$${price.toFixed(2)}${changed}`);
      } else {
        console.log(`FAILED: ${error}`);
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    // If ALL schools failed, that's a hard error
    const succeeded = results.filter((r) => r.price !== null).length;
    if (succeeded === 0 && results.length > 0) {
      errors.push("All price scrapes failed — network issue or all sites changed");
    }

    // Write data
    const outDir = path.join(process.cwd(), "data");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      path.join(outDir, "tier1-prices.json"),
      JSON.stringify(results, null, 2)
    );

    console.log(`\n${succeeded}/${results.length} prices scraped`);

    return {
      records: results as unknown as Record<string, unknown>[],
      errors,
      warnings,
    };
  });
}

if (require.main === module) {
  scrape().then((result) => {
    if (result.errors.length > 0) {
      console.error("\nERRORS:");
      result.errors.forEach((e) => console.error(`  ✗ ${e}`));
    }
    if (result.warnings.length > 0) {
      console.warn("\nWARNINGS:");
      result.warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
    }
    if (result.status === "error") process.exit(1);
  });
}
