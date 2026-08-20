/**
 * Sync the xgrit FAMILY's per-state prices into the Pricing DB from each brand's
 * OWN pricing API (authoritative + re-runnable — see scripts/lib/ids-pricing.ts).
 * The Aceable-owned family (I Drive Safely, Aceable, and DriversEd) all render
 * prices from the same xgrit backend and live in the same Tune account.
 *
 *   npx tsx scripts/sync-xgrit-prices.ts                     # DRY RUN (all brands)
 *   npx tsx scripts/sync-xgrit-prices.ts --brands=aceable    # limit to one/more brands
 *   npx tsx scripts/sync-xgrit-prices.ts --write             # upsert Price/Original Price/Approved
 *
 * SAFE BY DESIGN:
 *  - Writes ONLY Price (current), Original Price (struck regular, when > current),
 *    Approved, School, State Code, Label. NEVER sets Active Offer / Sale Price /
 *    Offer Seen — no fabricated "limited-time" framing, and it can't clobber a
 *    manually-managed offer (pages.update only changes the fields we pass).
 *  - Multi-course states are pinned by courseId (human-verified). A NEW multi-course
 *    state, a vanished pin, or a no-price state is FLAGGED and skipped — never guessed.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
import { resolveBrandTargets, fetchStatePrices, resolvePrice, withBrowser } from "./lib/ids-pricing";

const WRITE = process.argv.includes("--write");
const CI = process.argv.includes("--ci"); // write + emit xgrit-price-sync.json; issue only on flags/drift
const brandArg = process.argv.find((a) => a.startsWith("--brands="))?.split("=")[1];
const BRANDS = (brandArg ? brandArg.split(",") : ["idrivesafely", "aceable"]).map((s) => s.trim()).filter(Boolean);
const LABEL: Record<string, string> = { idrivesafely: "IDS", aceable: "Aceable", driversed: "DriversEd" };

const notion = makeNotionClient();
const PRICING_DB = process.env.NOTION_PRICING_DB!;
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;
/* eslint-disable @typescript-eslint/no-explicit-any */

// slug -> CANONICAL school page id. MUST come from getAllSchools (Active + Show On
// Site), the same source getSchoolPricingForState joins Pricing rows against — a
// raw all-pages query can pick an INACTIVE DUPLICATE page id, which then fails the
// join and every card renders null. (Learned the hard way 2026-08-20.)
async function schoolIdMap(): Promise<Map<string, string>> {
  const { getAllSchools } = await import("../lib/notion");
  const map = new Map<string, string>();
  for (const s of (await getAllSchools()) as any[]) if (s.slug) map.set(s.slug, s.id);
  return map;
}

async function existingRow(slug: string, code: string): Promise<{ id: string | null; price: number | null; original: number | null; activeOffer: boolean; salePrice: number | null; school: string | null }> {
  const res = await notion.databases.query({ database_id: PRICING_DB, filter: { property: "Label", title: { equals: `${slug}-${code}` } }, page_size: 1 });
  const r = res.results[0] as any;
  if (!r) return { id: null, price: null, original: null, activeOffer: false, salePrice: null, school: null };
  return {
    id: r.id,
    price: r.properties?.["Price"]?.number ?? null,
    original: r.properties?.["Original Price"]?.number ?? null,
    activeOffer: r.properties?.["Active Offer"]?.checkbox ?? false,
    salePrice: r.properties?.["Sale Price"]?.number ?? null,
    school: r.properties?.["School"]?.relation?.[0]?.id ?? null,
  };
}

async function main() {
  if (!PRICING_DB || !SCHOOLS_DB) { console.error("NOTION_PRICING_DB / NOTION_SCHOOLS_DB not set"); process.exit(1); }
  const ids = await schoolIdMap();

  const ops: Array<{ label: string; id: string | null; props: any }> = [];
  const flaggedAll: Array<{ brand: string; code: string; status: string; options: any[]; note?: string }> = [];
  const driftsAll: Array<{ brand: string; code: string; drift: string }> = [];

  await withBrowser(async (pg) => {
    for (const brand of BRANDS) {
      const schoolId = ids.get(brand);
      if (!schoolId) { console.log(`\n### ${brand}: not in Schools DB — skipping`); continue; }
      const targets = await resolveBrandTargets(brand);
      const codes = [...targets.keys()].sort();
      console.log(`\n### ${brand} (${codes.length} states) — state | now -> current | orig | status | action`);

      for (const code of codes) {
        const r = resolvePrice(brand, code, await fetchStatePrices(pg, targets.get(code)!));
        if (r.current == null) { flaggedAll.push({ brand, code, status: r.status, options: r.options, note: r.note }); continue; }
        if ((r as any).drift) driftsAll.push({ brand, code, drift: (r as any).drift });

        const ex = await existingRow(brand, code);
        // Struck regular: prefer the API's. If the API collapsed it but an existing
        // offer-model row carried the true regular in its Price field, recover it.
        let regular = r.regular;
        if (!(regular > r.current + 0.01) && ex.price != null && ex.price > r.current + 0.01) regular = ex.price;
        const setOriginal = regular > r.current + 0.01;

        const props: any = {
          Label: { title: [{ text: { content: `${brand}-${code}` } }] },
          "State Code": { rich_text: [{ text: { content: code } }] },
          School: { relation: [{ id: schoolId }] },
          Price: { number: r.current },
          Approved: { checkbox: true },
        };
        if (setOriginal) props["Original Price"] = { number: regular };
        if (r.status === "pinned" && r.note) props["Price Note"] = { rich_text: [{ text: { content: `${LABEL[brand] ?? brand} ${r.note}` } }] };

        // ROBUST MODEL: current lives in Price (+ struck Original Price), NOT the offer
        // mechanism. Clear any Active Offer so no "limited-time" badge shows and the
        // price can't TTL-revert to the regular. (These brands are managed by this sync.)
        let clearedOffer = false;
        if (ex.activeOffer || ex.salePrice != null) {
          props["Active Offer"] = { checkbox: false };
          props["Sale Price"] = { number: null };
          props["Offer Seen"] = { date: null };
          clearedOffer = true;
        }

        const priceSame = ex.price === r.current;
        const origSame = (ex.original ?? null) === (setOriginal ? regular : (ex.original ?? null));
        const relSame = ex.school === schoolId; // a wrong/missing relation must force a rewrite
        const same = !!ex.id && priceSame && origSame && relSame && !clearedOffer;
        const action = !ex.id ? "CREATE" : same ? "unchanged" : "UPDATE";
        const flags = [clearedOffer ? "clear offer" : "", (r as any).drift ? `⚠ ${(r as any).drift}` : ""].filter(Boolean).join("  ");
        console.log(`${code} | ${ex.price ?? "—"} -> $${r.current}${setOriginal ? ` | reg $${regular}` : " | —"} | ${r.status} | ${action}${flags ? "  " + flags : ""}`);
        if (action !== "unchanged") ops.push({ label: `${brand}-${code}`, id: ex.id, props });
        await new Promise((res) => setTimeout(res, 300));
      }
    }
  });

  if (flaggedAll.length) {
    console.log(`\n=== FLAGGED (skipped — need a human pin, not guessed) ===`);
    for (const f of flaggedAll) console.log(`${f.brand}-${f.code} | ${f.status} | options [${f.options.map((o: any) => "$" + o.current).join(", ")}] | ${f.note ?? ""}`);
  }

  if (CI) {
    const summary = {
      created: ops.filter((o) => !o.id).length,
      updated: ops.filter((o) => o.id).length,
      needsAttention: flaggedAll.length > 0 || driftsAll.length > 0,
      flagged: flaggedAll.map((f) => `${f.brand}-${f.code}: ${f.status} — options [${f.options.map((o: any) => "$" + o.current).join(", ")}]${f.note ? ` (${f.note})` : ""}`),
      drifts: driftsAll.map((d) => `${d.brand}-${d.code}: ${d.drift}`),
    };
    const { writeFileSync } = await import("fs");
    const { join } = await import("path");
    writeFileSync(join(process.cwd(), "xgrit-price-sync.json"), JSON.stringify(summary, null, 2));
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
    await new Promise((res) => setTimeout(res, 250));
  }
  console.log(`\nWROTE: ${created} created, ${updated} updated, ${errors} errors. Publishes on next build / ISR (24h).`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
