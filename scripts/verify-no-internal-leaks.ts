/**
 * Internal-leak guard (postbuild). Fails the build if any built HTML/RSC payload or
 * generated llms file contains editorial working notes or QA debris that must never
 * reach readers or LLM crawlers. Same "assert the expected → red build" discipline as
 * the Notion boundary and route guards.
 *
 * Root cause it backstops: the States DB "Research Notes" and Schools DB "Pros" fields
 * mix internal working notes with reader-facing content, and templates render them
 * verbatim (see docs/content-standards.md §7). A leak here means a field leaked again.
 *
 *   npx tsx scripts/verify-no-internal-leaks.ts
 */
import fs from "fs";
import path from "path";

// Case-insensitive banned substrings. Each is internal-only — none legitimately
// appears in reader-facing copy. Keep in sync with the leak classes in Package 1.
const BANNED = [
  "verify before publishing",
  "unconfirmed — verify",
  // NB: narrowed from bare "affiliate commission" — that collides with the site's
  // legitimate FTC disclosure ("may earn affiliate commissions when you enroll").
  // The internal debris signature is the affiliate-economics note itself.
  "affiliate commission confirmed",
  "commission confirmed via",
  "Impact network",
  "Tranche-one",
  "States DB",
  "Pricing DB",
  "with Sean",
  "next deploy",
  "field bug",
  "update to current-year",
  "TODO:",
  "FIXME",
  "lorem",
  // Storage prefix for FAQ blobs edited through the Notion connector. The parser
  // and llms generator strip it; if a render path ever ships it raw, fail the build.
  "faqjson:",
];

function walk(dir: string, exts: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

const files = [
  ...walk(".next/server/app", [".html", ".rsc", ".body"]),
  ...["public/llms-full.txt", "public/llms.txt"].filter((f) => fs.existsSync(f)),
];

const hits: string[] = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf-8");
  const lower = text.toLowerCase();
  for (const banned of BANNED) {
    const idx = lower.indexOf(banned.toLowerCase());
    if (idx === -1) continue;
    const from = text.lastIndexOf("\n", idx) + 1;
    const nl = text.indexOf("\n", idx);
    const snippet = text.slice(from, nl === -1 ? idx + 100 : Math.min(nl, from + 200)).trim().slice(0, 180);
    hits.push(`${file}\n       banned: "${banned}"\n       line:   …${snippet}…`);
  }
}

if (hits.length) {
  console.error(`❌ internal-leak guard FAILED — ${hits.length} banned string(s) reached built output:\n`);
  for (const h of hits) console.error(`   - ${h}\n`);
  console.error("Fix at the Notion field / generator, not the built file. See docs/content-standards.md §7.");
  process.exit(1);
}
console.log(`✅ internal-leak guard OK — scanned ${files.length} built files, no internal/QA debris leaked.`);
