/**
 * Compares freshly scraped JSON files against the previously committed
 * versions and outputs a markdown summary of changes to data/diff-report.md.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

type DiffSection = {
  file: string;
  label: string;
  added: number;
  removed: number;
  changed: number;
  details: string[];
};

/** Get the previous version of a file from git HEAD. Returns null if not tracked. */
function gitShow(filePath: string): string | null {
  const relative = path.relative(process.cwd(), filePath);
  try {
    return execSync(`git show HEAD:${relative}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

/** Compare two arrays of records keyed by a unique field. */
function diffRecords(
  oldRecords: Record<string, unknown>[],
  newRecords: Record<string, unknown>[],
  keyField: string,
  labelField: string
): { added: string[]; removed: string[]; changed: string[] } {
  const oldMap = new Map<string, Record<string, unknown>>();
  for (const r of oldRecords) oldMap.set(String(r[keyField]), r);

  const newMap = new Map<string, Record<string, unknown>>();
  for (const r of newRecords) newMap.set(String(r[keyField]), r);

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  // Find added and changed
  newMap.forEach((newRec, key) => {
    const oldRec = oldMap.get(key);
    if (!oldRec) {
      added.push(`+ **${newRec[labelField]}** (${key})`);
    } else {
      const diffs: string[] = [];
      for (const field of Object.keys(newRec)) {
        const oldVal = JSON.stringify(oldRec[field]);
        const newVal = JSON.stringify(newRec[field]);
        if (oldVal !== newVal) {
          diffs.push(`  - \`${field}\`: ${oldVal} → ${newVal}`);
        }
      }
      if (diffs.length > 0) {
        changed.push(`~ **${newRec[labelField]}** (${key})\n${diffs.join("\n")}`);
      }
    }
  });

  // Find removed
  oldMap.forEach((oldRec, key) => {
    if (!newMap.has(key)) {
      removed.push(`- **${oldRec[labelField]}** (${key})`);
    }
  });

  return { added, removed, changed };
}

/** Diff the tier1-prices.json file specifically. */
function diffPrices(
  oldPrices: Record<string, unknown>[],
  newPrices: Record<string, unknown>[]
): string[] {
  const details: string[] = [];
  const oldMap = new Map<string, Record<string, unknown>>();
  for (const p of oldPrices) oldMap.set(String(p.slug), p);

  for (const p of newPrices) {
    const slug = String(p.slug);
    const oldP = oldMap.get(slug);
    const newPrice = p.price as number | null;
    const oldPrice = oldP?.price as number | null ?? null;

    if (p.error) {
      details.push(`- **${p.school}**: scrape failed (${p.error})`);
    } else if (oldPrice === null && newPrice !== null) {
      details.push(`- **${p.school}**: $${(newPrice).toFixed(2)} (new)`);
    } else if (oldPrice !== null && newPrice !== null && oldPrice !== newPrice) {
      const dir = newPrice > oldPrice ? "↑" : "↓";
      details.push(
        `- **${p.school}**: $${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)} ${dir}`
      );
    }
  }

  return details;
}

const DATA_FILES: {
  file: string;
  label: string;
  keyField: string;
  labelField: string;
}[] = [
  {
    file: "ca-schools.json",
    label: "California DMV Schools",
    keyField: "licenseNumber",
    labelField: "name",
  },
  {
    file: "tx-schools.json",
    label: "Texas TDLR Providers",
    keyField: "licenseNumber",
    labelField: "name",
  },
];

function main() {
  console.log("Comparing data files against last commit...\n");

  const sections: DiffSection[] = [];

  // Diff state school files
  for (const { file, label, keyField, labelField } of DATA_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!existsSync(filePath)) {
      console.log(`  ${file}: not found, skipping`);
      continue;
    }

    const newData = JSON.parse(readFileSync(filePath, "utf-8"));
    const oldRaw = gitShow(filePath);
    const oldData = oldRaw ? JSON.parse(oldRaw) : [];

    const { added, removed, changed } = diffRecords(
      oldData,
      newData,
      keyField,
      labelField
    );

    const details = [...added, ...removed, ...changed];
    sections.push({
      file,
      label,
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      details,
    });

    console.log(
      `  ${file}: +${added.length} -${removed.length} ~${changed.length}`
    );
  }

  // Diff prices
  const pricesPath = path.join(DATA_DIR, "tier1-prices.json");
  if (existsSync(pricesPath)) {
    const newPrices = JSON.parse(readFileSync(pricesPath, "utf-8"));
    const oldRaw = gitShow(pricesPath);
    const oldPrices = oldRaw ? JSON.parse(oldRaw) : [];
    const priceDetails = diffPrices(oldPrices, newPrices);

    sections.push({
      file: "tier1-prices.json",
      label: "Tier 1 School Prices",
      added: 0,
      removed: 0,
      changed: priceDetails.length,
      details: priceDetails,
    });

    console.log(`  tier1-prices.json: ${priceDetails.length} changes`);
  }

  // Build markdown report
  const now = new Date().toISOString().split("T")[0];
  let md = `# Data Update Report — ${now}\n\n`;

  const totalChanges = sections.reduce(
    (sum, s) => sum + s.added + s.removed + s.changed,
    0
  );

  if (totalChanges === 0) {
    md += "No changes detected.\n";
  } else {
    md += `**${totalChanges} total changes** across ${sections.filter((s) => s.details.length > 0).length} file(s).\n\n`;

    for (const section of sections) {
      if (section.details.length === 0) continue;
      md += `## ${section.label} (\`${section.file}\`)\n\n`;
      md += `| Added | Removed | Changed |\n|---|---|---|\n`;
      md += `| ${section.added} | ${section.removed} | ${section.changed} |\n\n`;
      md += section.details.join("\n") + "\n\n";
    }
  }

  mkdirSync(DATA_DIR, { recursive: true });
  const reportPath = path.join(DATA_DIR, "diff-report.md");
  writeFileSync(reportPath, md);
  console.log(`\nReport written to ${reportPath}`);
}

main();
