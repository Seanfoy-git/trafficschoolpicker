/**
 * Content-standards gate (prebuild). Best-INTENT checks: it can't verify a fact is
 * true, but it asserts the author did the work the standard requires
 * (docs/content-standards.md) — sources present, reference content kept clean,
 * freshness stamped, SEO wired. Same philosophy as verify-notion-boundary /
 * verify-question-routes: assert the expected so silent drift becomes a red build.
 *
 * HARD FAIL (invariants that currently hold — a violation is a regression):
 *   1. Every published blog post has a BLOG_SEO entry (else it's absent from the sitemap).
 *   2. The out-of-state reference guide carries NO affiliate/course/tracker/Notion links.
 *   3. The reference guide carries a "Last verified" stamp.
 *   4. Every NEW published blog post shows sources/citations (legacy posts grandfathered).
 *
 * REPORT ONLY (debt, non-fatal): the grandfathered unsourced legacy posts — printed
 * so the debt stays visible. Retrofit them and delete from LEGACY_UNSOURCED; when the
 * set is empty the grandfather clause is dead and every post is gated.
 *
 *   npx tsx scripts/verify-content-standards.ts
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BLOG_SEO } from "../lib/seo-config";

const BLOG_DIR = "content/blog";
const GUIDE_CONTENT = "app/out-of-state-ticket/content.ts";

// Legacy posts that predated the sourcing standard, now all retrofitted (2026-08-27)
// — the set is empty, so the grandfather clause is dead and EVERY published post is
// gated on sources. Do NOT add slugs here; source the post instead.
const LEGACY_UNSOURCED = new Set<string>([]);

// "Sources present" heuristic: a Sources section, a named statute/reg, or an
// external (non-TSP) source link. Deliberately broad — this is a nudge, not proof.
const SOURCE_RE =
  /##\s*Sources|\bSources:|§|U\.S\.C\.|C\.F\.R\.|\bCFR\b|Stat\.|O\.C\.G\.A\.|Va\.\s*Code|N\.J\.A\.C|N\.C\.G\.S|O\.R\.C|Veh\.\s*Code|Fla\.\s*Stat|\]\(https?:\/\/(?!www\.trafficschoolpicker\.com)/i;

const problems: string[] = [];
const notes: string[] = [];

// ── 1 + 4: blog posts ───────────────────────────────────────────────────────
const files = fs.existsSync(BLOG_DIR) ? fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx")) : [];
const seoKeys = new Set(Object.keys(BLOG_SEO));
let grandfathered = 0;

for (const f of files) {
  const raw = fs.readFileSync(path.join(BLOG_DIR, f), "utf-8");
  const { data, content } = matter(raw);
  if (data.published !== true) continue;
  const slug = (data.slug as string) ?? f.replace(/\.mdx$/, "");

  // 1. sitemap/SEO wiring
  if (!seoKeys.has(slug)) {
    problems.push(`blog "${slug}" has no BLOG_SEO entry → missing from sitemap (add it to lib/seo-config.ts).`);
  }

  // 4. sources present (new posts only; legacy grandfathered)
  if (!SOURCE_RE.test(content)) {
    if (LEGACY_UNSOURCED.has(slug)) {
      grandfathered++;
      notes.push(`  · ${slug}`);
    } else {
      problems.push(`blog "${slug}" shows no sources/citations — add a Sources section or cite the statute/agency (docs/content-standards.md §1).`);
    }
  } else if (LEGACY_UNSOURCED.has(slug)) {
    notes.push(`  ✓ ${slug} now has sources — remove it from LEGACY_UNSOURCED.`);
  }
}

// ── 2 + 3: out-of-state reference guide ─────────────────────────────────────
if (fs.existsSync(GUIDE_CONTENT)) {
  const guide = fs.readFileSync(GUIDE_CONTENT, "utf-8");
  if (/aceable|idrivesafely|track\.trafficschoolpicker|https?:\/\/(?:[a-z0-9-]+\.)*notion\.(?:so|com|site)/i.test(guide)) {
    problems.push(`out-of-state guide (${GUIDE_CONTENT}) contains an affiliate/course/tracker/Notion link — reference content must stay clean (docs/content-standards.md §4).`);
  }
  if (!/Last verified/i.test(guide)) {
    problems.push(`out-of-state guide (${GUIDE_CONTENT}) is missing its "Last verified" stamp (docs/content-standards.md §5).`);
  }
} else {
  problems.push(`expected reference guide at ${GUIDE_CONTENT} — not found.`);
}

// ── report ──────────────────────────────────────────────────────────────────
if (notes.length) {
  console.log(`ℹ content-standards: ${grandfathered} legacy post(s) still unsourced (debt to retrofit):`);
  notes.forEach((n) => console.log(n));
  console.log("");
}

if (problems.length) {
  console.error("❌ content-standards check FAILED:");
  problems.forEach((p) => console.error(`   - ${p}`));
  process.exit(1);
}

console.log(`✅ content-standards OK — SEO-wired, reference guide clean + stamped; new posts sourced (${grandfathered} legacy grandfathered).`);
