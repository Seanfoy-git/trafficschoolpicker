/**
 * Sync per-state prices for JSON-LD schools (those that publish Course/Offer
 * structured data in server-rendered HTML — see scripts/lib/jsonld-pricing.ts).
 * Currently: Improv. Weekly cadence (tier-2, monetized but not a daily payer).
 *
 *   npx tsx scripts/sync-jsonld-prices.ts                 # DRY RUN (all configured)
 *   npx tsx scripts/sync-jsonld-prices.ts --school=improv # limit
 *   npx tsx scripts/sync-jsonld-prices.ts --write         # upsert
 *
 * SAFE BY DESIGN: writes Price (current) + Approved + School (canonical) + State
 * Code + Label; never the offer fields. A price outside the sane band (junk like a
 * $98 bundle bleeding into JSON-LD) is FLAGGED and skipped, never written. School
 * relation comes from getAllSchools (canonical) — a raw Schools-DB query can grab an
 * inactive duplicate page id that fails the Pricing join (learned 2026-08-20).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
import { resolveSitemapStateUrls, jsonLdPrices } from "./lib/jsonld-pricing";

const WRITE = process.argv.includes("--write");
const CI = process.argv.includes("--ci");
const schoolArg = process.argv.find((a) => a.startsWith("--school="))?.split("=")[1];
/* eslint-disable @typescript-eslint/no-explicit-any */

type SchoolCfg = { sitemaps: string[]; pathRe: RegExp; band: [number, number] };
const SCHOOLS: Record<string, SchoolCfg> = {
  improv: {
    sitemaps: ["https://www.myimprov.com/page-sitemap.xml", "https://www.myimprov.com/page-sitemap2.xml"],
    pathRe: /myimprov\.com\/(?:defensive-driving|traffic-school)\/([a-z-]+)\/$/,
    band: [10, 60], // reject junk (e.g. a $98 bundle bleeding into the JSON-LD)
  },
};

const notion = makeNotionClient();
const PRICING_DB = process.env.NOTION_PRICING_DB!;

async function schoolIdMap(): Promise<Map<string, string>> {
  const { getAllSchools } = await import("../lib/notion");
  const map = new Map<string, string>();
  for (const s of (await getAllSchools()) as any[]) if (s.slug) map.set(s.slug, s.id);
  return map;
}

async function existingRow(slug: string, code: string): Promise<{ id: string | null; price: number | null; activeOffer: boolean; salePrice: number | null; school: string | null }> {
  const res = await notion.databases.query({ database_id: PRICING_DB, filter: { property: "Label", title: { equals: `${slug}-${code}` } }, page_size: 1 });
  const r = res.results[0] as any;
  if (!r) return { id: null, price: null, activeOffer: false, salePrice: null, school: null };
  return {
    id: r.id,
    price: r.properties?.["Price"]?.number ?? null,
    activeOffer: r.properties?.["Active Offer"]?.checkbox ?? false,
    salePrice: r.properties?.["Sale Price"]?.number ?? null,
    school: r.properties?.["School"]?.relation?.[0]?.id ?? null,
  };
}

async function main() {
  if (!PRICING_DB) { console.error("NOTION_PRICING_DB not set"); process.exit(1); }
  const ids = await schoolIdMap();
  const schools = Object.keys(SCHOOLS).filter((s) => !schoolArg || s === schoolArg);

  const ops: Array<{ label: string; id: string | null; props: any }> = [];
  const flagged: Array<{ slug: string; code: string; prices: number[] }> = [];

  for (const slug of schools) {
    const schoolId = ids.get(slug);
    if (!schoolId) { console.log(`\n### ${slug}: not in Schools DB — skipping`); continue; }
    const cfg = SCHOOLS[slug];
    const targets = await resolveSitemapStateUrls(cfg.sitemaps, cfg.pathRe);
    const codes = [...targets.keys()].sort();
    console.log(`\n### ${slug} (${codes.length} states) — state | prices | -> current | action`);

    for (const code of codes) {
      const prices = await jsonLdPrices(targets.get(code)!);
      const inBand = prices.filter((p) => p >= cfg.band[0] && p <= cfg.band[1]);
      const current = inBand[0] ?? null; // lowest sane price = base tier
      if (current == null) { flagged.push({ slug, code, prices }); console.log(`${code} | [${prices.join(",")}] | — | FLAGGED (out of band)`); continue; }

      const ex = await existingRow(slug, code);
      const props: any = {
        Label: { title: [{ text: { content: `${slug}-${code}` } }] },
        "State Code": { rich_text: [{ text: { content: code } }] },
        School: { relation: [{ id: schoolId }] },
        Price: { number: current },
        Approved: { checkbox: true },
      };
      let clearedOffer = false;
      if (ex.activeOffer || ex.salePrice != null) {
        props["Active Offer"] = { checkbox: false };
        props["Sale Price"] = { number: null };
        props["Offer Seen"] = { date: null };
        clearedOffer = true;
      }
      const same = !!ex.id && ex.price === current && ex.school === schoolId && !clearedOffer;
      const action = !ex.id ? "CREATE" : same ? "unchanged" : "UPDATE";
      console.log(`${code} | [${prices.join(",")}] | $${current} | ${action}${clearedOffer ? "  clear offer" : ""}`);
      if (action !== "unchanged") ops.push({ label: `${slug}-${code}`, id: ex.id, props });
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  if (flagged.length) {
    console.log(`\n=== FLAGGED (out-of-band — skipped) ===`);
    for (const f of flagged) console.log(`${f.slug}-${f.code} | prices [${f.prices.join(", ")}]`);
  }

  if (CI) {
    const summary = {
      created: ops.filter((o) => !o.id).length,
      updated: ops.filter((o) => o.id).length,
      needsAttention: flagged.length > 0,
      flagged: flagged.map((f) => `${f.slug}-${f.code}: out of band, prices [${f.prices.join(", ")}]`),
    };
    const { writeFileSync } = await import("fs");
    const { join } = await import("path");
    writeFileSync(join(process.cwd(), "jsonld-price-sync.json"), JSON.stringify(summary, null, 2));
  }

  if (!WRITE && !CI) {
    console.log(`\nDRY RUN — ${ops.length} rows to write (${ops.filter((o) => !o.id).length} create, ${ops.filter((o) => o.id).length} update). Re-run with --write to apply.`);
    return;
  }
  let created = 0, updated = 0, errors = 0;
  for (const op of ops) {
    try {
      if (op.id) { await notion.pages.update({ page_id: op.id, properties: op.props }); updated++; }
      else { await notion.pages.create({ parent: { database_id: PRICING_DB }, properties: op.props }); created++; }
    } catch (e: any) { errors++; console.error(`  ERR ${op.label}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`\nWROTE: ${created} created, ${updated} updated, ${errors} errors.`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
