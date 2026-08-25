/**
 * NOTION BOUNDARY CHECK (P0 relaunch gate, 2026-08-25).
 *
 * Runs in `prebuild`; a non-zero exit fails the build (fail-closed). Asserts:
 *   1. every CMS database id the site is configured with (NOTION_*_DB env) is
 *      RETRIEVABLE and is an expected CMS database — a missing/mangled/mis-shared
 *      id fails HERE with the offending env var name, not deep in page generation;
 *   2. the OLD workspace's private hub id is NOT reachable (must 404);
 *   3. (best-effort) the token sees no UNEXPECTED database beyond the CMS set.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const notion: any = makeNotionClient();

const OLD_PRIVATE_HUB_ID = "3362c5a8-ad0a-8180-844b-f0f44d1b487c";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const EXPECTED = new Set([
  "Traffic Schools", "School Directory", "State Requirements", "School State Variants",
  "Question Pages", "States", "School Pricing", "State FAQ Facts", "Blog Content",
].map(norm));

// The DB env vars the SITE build reads. Each must point at a real, shared CMS db.
const SITE_DB_ENVS = [
  "NOTION_SCHOOLS_DB", "NOTION_DIRECTORY_DB", "NOTION_STATE_REQUIREMENTS_DB",
  "NOTION_SCHOOL_VARIANTS_DB", "NOTION_QUESTIONS_DB", "NOTION_STATES_DB",
  "NOTION_PRICING_DB", "NOTION_FAQ_DB_ID",
];
const dbTitle = (db: any) => (db?.title?.map((t: any) => t.plain_text).join("") || "").trim();

import { createHash } from "crypto";
// Redaction-proof fingerprint: length + a sha prefix (NOT a substring of the value,
// so Vercel won't redact it, and it never exposes the secret). Lets us compare a
// build-log value to the known-good one without printing either.
const fp = (v: string) => `len=${v.length} sha=${createHash("sha256").update(v).digest("hex").slice(0, 8)}`;

async function main() {
  if (!process.env.NOTION_TOKEN) { console.error("❌ NOTION_TOKEN not set"); process.exit(1); }
  const problems: string[] = [];

  // Diagnostic fingerprints (safe to log): compare against the known-good set.
  console.log(`env fingerprints — NOTION_TOKEN ${fp((process.env.NOTION_TOKEN || "").trim())}`);
  for (const env of ["NOTION_SCHOOLS_DB", "NOTION_DIRECTORY_DB", "NOTION_STATE_REQUIREMENTS_DB", "NOTION_SCHOOL_VARIANTS_DB", "NOTION_QUESTIONS_DB", "NOTION_STATES_DB", "NOTION_PRICING_DB", "NOTION_FAQ_DB_ID"]) {
    console.log(`  ${env} ${fp((process.env[env] || "").trim())}`);
  }

  // 1) every configured CMS db id must resolve to an expected database
  for (const env of SITE_DB_ENVS) {
    const id = (process.env[env] || "").trim();
    if (!id) { problems.push(`${env} is not set`); continue; }
    if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(id)) {
      problems.push(`${env} is not a valid Notion id: "${id}"`); continue;
    }
    try {
      const db = await notion.databases.retrieve({ database_id: id });
      const title = dbTitle(db);
      if (!EXPECTED.has(norm(title))) problems.push(`${env} → "${title}" is not an expected CMS database`);
    } catch (e: any) {
      problems.push(`${env} (${id}) → ${e?.code ?? e?.message ?? "unretrievable"} (bad id or not shared with tsp-site-cms)`);
    }
  }

  // 2) old private hub must be unreachable
  let hubReachable = false;
  for (const fn of [() => notion.pages.retrieve({ page_id: OLD_PRIVATE_HUB_ID }), () => notion.databases.retrieve({ database_id: OLD_PRIVATE_HUB_ID })]) {
    try { await fn(); hubReachable = true; } catch { /* expected 404 */ }
  }
  if (hubReachable) problems.push(`OLD PRIVATE HUB ${OLD_PRIVATE_HUB_ID} is REACHABLE — boundary breached`);

  // 3) best-effort: no unexpected database in scope
  try {
    const res = await notion.search({ filter: { property: "object", value: "database" }, page_size: 100 });
    const unexpected = (res.results as any[]).map(dbTitle).filter((t) => t && !EXPECTED.has(norm(t)));
    if (unexpected.length) problems.push(`UNEXPECTED database(s) visible to the token: ${unexpected.join(", ")}`);
  } catch { /* search is best-effort; the per-id checks above are authoritative */ }

  if (problems.length) {
    console.error("\n❌ NOTION BOUNDARY / ENV FAILED:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`✅ boundary OK — all ${SITE_DB_ENVS.length} CMS db ids resolve to expected databases; old private hub is 404.`);
}

main().catch((e) => { console.error("❌ boundary check error (fail-closed):", e?.message ?? e); process.exit(1); });
