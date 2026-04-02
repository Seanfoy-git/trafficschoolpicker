/**
 * Orchestrator: runs all scrapers, collects health results, writes the
 * unified health report, and exits with code 1 if any scraper is failing.
 */

import { scrape as scrapeCa } from "./scrape-ca-dmv";
import { scrape as scrapeTx } from "./scrape-tx-tdlr";
import { scrape as scrapePrices } from "./scrape-prices";
import { writeHealthReport, ScrapeResult } from "./lib/validate";

async function main() {
  console.log("=== TrafficSchoolPicker Data Update ===\n");

  const results: ScrapeResult[] = [];

  // Run scrapers sequentially to be polite to sources
  console.log("--- CA DMV ---");
  results.push(await scrapeCa());
  console.log();

  console.log("--- TX TDLR ---");
  results.push(await scrapeTx());
  console.log();

  console.log("--- Tier 1 Prices ---");
  results.push(await scrapePrices());
  console.log();

  // Write health report
  const report = writeHealthReport(results);

  // Summary
  console.log("=== Health Report ===");
  console.log(`Overall: ${report.overall.toUpperCase()}`);
  console.log();

  for (const r of results) {
    const icon = r.status === "ok" && r.errors.length === 0 ? "✓" : "✗";
    console.log(`  ${icon} ${r.source}: ${r.recordCount} records (${r.durationMs}ms)`);
    for (const e of r.errors) console.error(`    ERROR: ${e}`);
    for (const w of r.warnings) console.warn(`    WARN: ${w}`);
  }

  if (report.overall === "failing") {
    console.error("\nOne or more scrapers failed. Check errors above.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
