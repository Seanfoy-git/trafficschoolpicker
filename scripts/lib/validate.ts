/**
 * Scrape validation and health-check module.
 *
 * Each scraper reports a ScrapeResult. The validator checks:
 * - Did the scraper error out entirely?
 * - Did record count drop below a minimum threshold?
 * - Did record count drop more than 30% vs previous run?
 * - Are required fields present and non-empty on every record?
 * - Did any expected fields disappear (schema change)?
 *
 * Results are written to data/scrape-health.json for the workflow
 * to read and decide whether to open a GitHub Issue.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import * as path from "path";

export type ScrapeResult = {
  source: string;
  status: "ok" | "error";
  recordCount: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  timestamp: string;
};

export type HealthReport = {
  generatedAt: string;
  overall: "healthy" | "degraded" | "failing";
  results: ScrapeResult[];
  issues: string[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const HEALTH_FILE = path.join(DATA_DIR, "scrape-health.json");
const PREV_HEALTH_FILE = HEALTH_FILE; // compare against last committed version

/** Load the previous health report from the last run (if any). */
export function loadPreviousHealth(): HealthReport | null {
  try {
    if (existsSync(HEALTH_FILE)) {
      return JSON.parse(readFileSync(HEALTH_FILE, "utf-8"));
    }
  } catch {
    // corrupt file, ignore
  }
  return null;
}

/** Get previous record count for a given source. */
export function getPreviousCount(source: string): number | null {
  const prev = loadPreviousHealth();
  if (!prev) return null;
  const result = prev.results.find((r) => r.source === source);
  return result?.recordCount ?? null;
}

/**
 * Validate a set of records against expected schema and thresholds.
 */
export function validateRecords(opts: {
  source: string;
  records: Record<string, unknown>[];
  requiredFields: string[];
  minRecords: number;
  maxDropPercent?: number;
}): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { source, records, requiredFields, minRecords, maxDropPercent = 30 } = opts;

  // Check minimum record count
  if (records.length === 0) {
    errors.push(`${source}: returned 0 records — source may be down or changed`);
  } else if (records.length < minRecords) {
    errors.push(
      `${source}: only ${records.length} records (expected at least ${minRecords}) — possible schema change or partial failure`
    );
  }

  // Check for drop vs previous run
  const prevCount = getPreviousCount(source);
  if (prevCount !== null && records.length > 0) {
    const dropPercent = ((prevCount - records.length) / prevCount) * 100;
    if (dropPercent > maxDropPercent) {
      errors.push(
        `${source}: record count dropped ${dropPercent.toFixed(0)}% (${prevCount} → ${records.length}) — possible source change`
      );
    } else if (dropPercent > 10) {
      warnings.push(
        `${source}: record count dropped ${dropPercent.toFixed(0)}% (${prevCount} → ${records.length})`
      );
    }
  }

  // Check required fields on each record
  const missingFieldCounts: Record<string, number> = {};
  const emptyFieldCounts: Record<string, number> = {};

  for (const record of records) {
    for (const field of requiredFields) {
      if (!(field in record)) {
        missingFieldCounts[field] = (missingFieldCounts[field] ?? 0) + 1;
      } else if (
        record[field] === "" ||
        record[field] === null ||
        record[field] === undefined
      ) {
        emptyFieldCounts[field] = (emptyFieldCounts[field] ?? 0) + 1;
      }
    }
  }

  for (const [field, count] of Object.entries(missingFieldCounts)) {
    if (count === records.length) {
      errors.push(
        `${source}: field "${field}" missing from ALL records — schema likely changed`
      );
    } else if (count > 0) {
      warnings.push(
        `${source}: field "${field}" missing from ${count}/${records.length} records`
      );
    }
  }

  for (const [field, count] of Object.entries(emptyFieldCounts)) {
    const emptyPercent = (count / records.length) * 100;
    if (emptyPercent > 80) {
      warnings.push(
        `${source}: field "${field}" empty in ${emptyPercent.toFixed(0)}% of records`
      );
    }
  }

  // Check for new unexpected fields (possible schema addition — informational)
  if (records.length > 0) {
    const sampleFields = Object.keys(records[0]);
    const unexpected = sampleFields.filter((f) => !requiredFields.includes(f));
    if (unexpected.length > 5) {
      warnings.push(
        `${source}: ${unexpected.length} fields not in expected schema — source may have added new fields`
      );
    }
  }

  return { errors, warnings };
}

/**
 * Write the final health report. Called after all scrapers have run.
 */
export function writeHealthReport(results: ScrapeResult[]): HealthReport {
  const allErrors = results.flatMap((r) => r.errors);
  const hasErrors = results.some((r) => r.status === "error" || r.errors.length > 0);
  const hasWarnings = results.some((r) => r.warnings.length > 0);

  const report: HealthReport = {
    generatedAt: new Date().toISOString(),
    overall: hasErrors ? "failing" : hasWarnings ? "degraded" : "healthy",
    results,
    issues: allErrors,
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(HEALTH_FILE, JSON.stringify(report, null, 2));
  return report;
}

/**
 * Helper: wrap a scraper's main logic and produce a ScrapeResult.
 */
export async function runScraper(
  source: string,
  fn: () => Promise<{ records: Record<string, unknown>[]; errors: string[]; warnings: string[] }>
): Promise<ScrapeResult> {
  const start = Date.now();
  try {
    const { records, errors, warnings } = await fn();
    return {
      source,
      status: errors.length > 0 ? "error" : "ok",
      recordCount: records.length,
      errors,
      warnings,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      source,
      status: "error",
      recordCount: 0,
      errors: [`${source}: fatal — ${(err as Error).message}`],
      warnings: [],
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}
