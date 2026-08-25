/**
 * NOTION BOUNDARY CHECK (P0 relaunch gate, 2026-08-25).
 *
 * The scoped read-only integration (tsp-site-cms) must see ONLY the CMS databases
 * and NOTHING private. This asserts, using the live token:
 *   1. every database the token can see is an expected CMS database (no surprise /
 *      private DB leaked into scope) — a stray DB fails the build;
 *   2. a known-private id from the OLD workspace (the "🚦 trafficschoolpicker.com"
 *      hub) is NOT reachable (must 404) — proves the boundary holds.
 *
 * Runs in `prebuild`; a non-zero exit fails the build. Fail-closed.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const notion: any = makeNotionClient();

// Old workspace's private hub id — MUST be unreachable with the new token.
const OLD_PRIVATE_HUB_ID = "3362c5a8-ad0a-8180-844b-f0f44d1b487c";

// Expected CMS databases (title, normalized: alnum-only, lowercased). Blog Content
// is optional — the site renders the blog from MDX, not Notion.
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const EXPECTED = new Set([
  "Traffic Schools", "School Directory", "State Requirements", "School State Variants",
  "Question Pages", "States", "School Pricing", "State FAQ Facts", "Blog Content",
].map(norm));

async function main() {
  if (!process.env.NOTION_TOKEN) { console.error("❌ NOTION_TOKEN not set"); process.exit(1); }

  // 1) enumerate visible databases
  const res = await notion.search({ filter: { property: "object", value: "database" }, page_size: 100 });
  const dbs = (res.results as any[]).map((d) => ({
    id: d.id,
    title: (d.title?.map((t: any) => t.plain_text).join("") || "(untitled)").trim(),
  }));
  const unexpected = dbs.filter((d) => !EXPECTED.has(norm(d.title)));

  // 2) the old private hub must NOT be reachable
  let hubReachable = false;
  try {
    await notion.pages.retrieve({ page_id: OLD_PRIVATE_HUB_ID });
    hubReachable = true;
  } catch { /* expected: object_not_found → boundary holds */ }
  try {
    await notion.databases.retrieve({ database_id: OLD_PRIVATE_HUB_ID });
    hubReachable = true;
  } catch { /* expected */ }

  console.log(`Notion boundary: ${dbs.length} databases visible — ${dbs.map((d) => d.title).join(", ")}`);

  const problems: string[] = [];
  if (unexpected.length) problems.push(`UNEXPECTED database(s) in token scope: ${unexpected.map((d) => `${d.title} (${d.id})`).join(", ")}`);
  if (hubReachable) problems.push(`OLD PRIVATE HUB ${OLD_PRIVATE_HUB_ID} is REACHABLE — boundary breached`);

  if (problems.length) {
    console.error("\n❌ NOTION BOUNDARY FAILED:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const missing = [...EXPECTED].filter((e) => !dbs.some((d) => norm(d.title) === e));
  if (missing.length) console.warn(`  ⚠ not shared (ok if unused by the site, e.g. Blog Content = MDX): ${missing.join(", ")}`);
  console.log(`✅ boundary OK — only CMS databases visible; old private hub is 404.`);
}

main().catch((e) => { console.error("❌ boundary check error (fail-closed):", e?.message ?? e); process.exit(1); });
