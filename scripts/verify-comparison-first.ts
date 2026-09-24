/**
 * COMPARISON-FIRST GUARD (postbuild, deploy-blocking). P17 Task 7.
 *
 * P17 moved each state page's priced comparison table to the first H2 after the H1
 * because that shape (a question H1, a priced table first, every price sourced and
 * dated) is what answer engines cite for "which school". This guard keeps it there.
 * For every state page on the comparison-first layout (P17_LAYOUT_STATES) it fails
 * the build when:
 *   (a) the comparison H2 does not precede the True Cost H2;
 *   (b) fewer than 80 percent of the rendered table rows carry a price (logs the
 *       page and its unpriced rows);
 *   (e) the H1 does not begin with "Which online";
 *   (f) a Texas row shows a price below $25.00 (Tex. Educ. Code § 1001.352).
 * And for EVERY state page (51 + DC):
 *   (c) the string "Check website" appears anywhere in the page (also every other
 *       built page, since the acceptance is grep-zero sitewide);
 *   (d) the page's directory counts disagree: the hero "from N" figure and the
 *       directory heading "All N" are both marked data-count="directory" and must
 *       be one number (one source of truth: the directory row count).
 *
 * Same discipline as the other verify-* gates: assert the invariant against the
 * build output, fail loudly, fix at the source (Notion field or generator).
 *
 *   npx tsx scripts/verify-comparison-first.ts [buildDir]   (default .next/server/app)
 */
import fs from "fs";
import path from "path";
import { getAllStateSlugs } from "../lib/state-utils";
import { P17_LAYOUT_STATES, TX_PRICE_FLOOR } from "../lib/comparison";

const MIN_PRICED_SHARE = 0.8;

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function textOf(html: string): string {
  return html.replace(/<!--.*?-->/g, "").replace(/<[^>]+>/g, "").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").trim();
}

function scanStatePage(slug: string, html: string): string[] {
  const problems: string[] = [];

  // (c) — every state page
  if (html.includes("Check website")) problems.push(`(c) "Check website" appears on the page`);

  // (d) — every state page: all directory-count marks agree
  const counts = [...html.matchAll(/data-count="directory"[^>]*>(?:<!--.*?-->)*(\d+)/g)].map((m) => m[1]);
  if (new Set(counts).size > 1) problems.push(`(d) subhead and directory counts differ: ${counts.join(" vs ")}`);

  if (!P17_LAYOUT_STATES.has(slug)) return problems;

  // (e)
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const h1Text = h1 ? textOf(h1[1]) : "";
  if (!h1Text.startsWith("Which online")) problems.push(`(e) H1 does not begin with "Which online": "${h1Text.slice(0, 80)}"`);

  // (a)
  const compareAt = html.indexOf('id="compare-heading"');
  const trueCostAt = html.search(/<h2[^>]*>(?:<!--.*?-->|[^<])*The True Cost of a Ticket/);
  if (compareAt < 0) problems.push(`(a) no comparison H2 (id="compare-heading") on the page`);
  else if (trueCostAt >= 0 && trueCostAt < compareAt) problems.push(`(a) the True Cost H2 precedes the comparison H2`);
  // The comparison must be the FIRST H2 after the H1.
  const h1End = h1 ? (h1.index ?? 0) + h1[0].length : 0;
  const rel = html.slice(h1End).search(/<h2[\s>]/);
  const firstH2 = rel >= 0 ? h1End + rel : -1;
  if (compareAt >= 0 && firstH2 >= 0 && firstH2 < html.lastIndexOf("<h2", compareAt)) {
    const m = html.slice(firstH2).match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    problems.push(`(a) first H2 is not the comparison: "${m ? textOf(m[1]).slice(0, 60) : "?"}"`);
  }

  // (b) + (f)
  const rows = [...html.matchAll(/<tr\b[^>]*data-priced="(yes|no)"[^>]*>/g)].map((m) => m[0]);
  if (rows.length === 0) problems.push(`(b) comparison table has no rows`);
  else {
    const unpriced = rows.filter((t) => attr(t, "data-priced") === "no");
    const share = (rows.length - unpriced.length) / rows.length;
    if (share < MIN_PRICED_SHARE) {
      problems.push(
        `(b) only ${rows.length - unpriced.length}/${rows.length} rows priced (${Math.round(share * 100)}%, need ${MIN_PRICED_SHARE * 100}%). ` +
          `Unpriced: ${unpriced.map((t) => attr(t, "data-school")).join(", ")}`
      );
    }
  }
  if (slug === "texas") {
    for (const t of rows) {
      const p = attr(t, "data-price");
      if (p !== null && Number(p) < TX_PRICE_FLOOR) {
        problems.push(`(f) Texas row "${attr(t, "data-school")}" priced $${p}, below the $${TX_PRICE_FLOOR.toFixed(2)} floor`);
      }
    }
  }
  return problems;
}

function allHtmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...allHtmlFiles(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function main() {
  const buildDir = process.argv[2] ?? path.join(process.cwd(), ".next", "server", "app");
  if (!fs.existsSync(buildDir)) {
    console.error(`❌ comparison-first guard: build dir not found: ${buildDir} (run next build first)`);
    process.exit(1);
  }
  const failures: string[] = [];
  let scanned = 0;
  for (const slug of getAllStateSlugs()) {
    const file = path.join(buildDir, `${slug}.html`);
    if (!fs.existsSync(file)) {
      failures.push(`${slug}: built page missing (${file})`);
      continue;
    }
    scanned++;
    for (const p of scanStatePage(slug, fs.readFileSync(file, "utf8"))) failures.push(`${slug}: ${p}`);
  }
  // (c) sitewide: no other built page may carry the retired label either.
  const stateFiles = new Set(getAllStateSlugs().map((s) => path.join(buildDir, `${s}.html`)));
  for (const f of allHtmlFiles(buildDir)) {
    if (stateFiles.has(f)) continue;
    if (fs.readFileSync(f, "utf8").includes("Check website")) failures.push(`${path.relative(buildDir, f)}: (c) "Check website" appears`);
  }
  if (failures.length) {
    console.error(`❌ comparison-first guard: ${failures.length} problem(s):`);
    for (const f of failures) console.error(`   - ${f}`);
    process.exit(1);
  }
  console.log(
    `✅ comparison-first guard OK — ${scanned} state pages (${P17_LAYOUT_STATES.size} on the comparison-first layout), no "Check website" sitewide.`
  );
}

main();
