/**
 * BUILD-TIME ROUTE GUARD (P0 incident fix #3, 2026-08-25).
 *
 * After static generation, assert the emitted question routes EXACTLY equal the
 * set of Complete rows in the Question Pages data source — count and path. Any
 * extra route (a route that isn't a Complete row) or missing route fails the
 * build, so a repeat of the incident becomes a failed deploy, not served content.
 * Also audits the generated sitemap for question URLs that aren't Complete rows.
 *
 * Runs as `postbuild` (after `next build`); a non-zero exit fails the Vercel build.
 * Fail-closed: if the Notion source can't be read, expected = [] and any generated
 * question route is treated as unexpected → build fails (never ship unverifiable).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { readdirSync, existsSync, statSync, readFileSync } from "fs";
import { join } from "path";

const SITE = "https://www.trafficschoolpicker.com";

async function main() {
  const { getQuestionPages } = await import("../lib/notion");
  const { getAllStateSlugs } = await import("../lib/state-utils");

  const rows = await getQuestionPages();
  const expected = new Set(rows.map((r) => `${r.stateSlug}/${r.questionSlug}`));
  const stateSlugs = new Set(getAllStateSlugs());

  // Generated question routes = prerendered {stateSlug}/{question}.html files.
  // /{state}/{question} is the ONLY two-segment route living under a state slug
  // (blog/reviews live under their own non-state dirs, so they're skipped).
  const appDir = join(process.cwd(), ".next", "server", "app");
  const actual = new Set<string>();
  if (existsSync(appDir)) {
    for (const entry of readdirSync(appDir)) {
      if (!stateSlugs.has(entry)) continue;
      const dir = join(appDir, entry);
      if (!statSync(dir).isDirectory()) continue;
      for (const f of readdirSync(dir)) {
        if (f.endsWith(".html")) actual.add(`${entry}/${f.replace(/\.html$/, "")}`);
      }
    }
  }

  const extra = [...actual].filter((x) => !expected.has(x)).sort();
  const missing = [...expected].filter((x) => !actual.has(x)).sort();

  // Sitemap audit: every question URL in the sitemap must be a Complete row.
  const smPath = join(appDir, "sitemap.xml.body");
  let sitemapExtra: string[] = [];
  if (existsSync(smPath)) {
    const xml = readFileSync(smPath, "utf8");
    const qUrls = [...xml.matchAll(new RegExp(`${SITE.replace(/\./g, "\\.")}/([a-z-]+)/([a-z-]+)(?=[<?])`, "g"))]
      .filter((m) => stateSlugs.has(m[1]))
      .map((m) => `${m[1]}/${m[2]}`);
    sitemapExtra = [...new Set(qUrls)].filter((u) => !expected.has(u)).sort();
  }

  if (extra.length || missing.length || sitemapExtra.length) {
    console.error("\n❌ ROUTE GUARD FAILED — question routes do not match Complete rows:");
    if (extra.length) console.error(`  EXTRA routes (generated but NOT a Complete row): ${extra.join(", ")}`);
    if (missing.length) console.error(`  MISSING routes (Complete row not generated): ${missing.join(", ")}`);
    if (sitemapExtra.length) console.error(`  SITEMAP has non-Complete question URLs: ${sitemapExtra.join(", ")}`);
    console.error("  Build failed. No deploy.\n");
    process.exit(1);
  }

  console.log(`✅ route guard OK — ${actual.size} question routes == ${expected.size} Complete rows; sitemap clean.`);
}

main().catch((e) => {
  console.error("❌ route guard error (fail-closed):", e?.message ?? e);
  process.exit(1);
});
