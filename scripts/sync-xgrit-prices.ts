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
import { resolveBrandTargets, fetchStatePrices, resolvePrice, withBrowser, CHECKOUT_ADJUST } from "./lib/ids-pricing";
import { fetchVerifiedRules } from "./config/scraper-rules";

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

async function existingRow(slug: string, code: string): Promise<{ id: string | null; price: number | null; original: number | null; activeOffer: boolean; salePrice: number | null; school: string | null; checked?: string | null; sourceUrl?: string | null; offerSeen?: string | null }> {
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
    checked: r.properties?.["Price Checked"]?.date?.start ?? null,
    sourceUrl: r.properties?.["Price Source URL"]?.url ?? null,
    offerSeen: r.properties?.["Offer Seen"]?.date?.start ?? null,
  };
}

// P17 provenance: the comparison table prices a row only when the Pricing row says
// WHERE the price was read (the school's own state page) and WHEN (today, on every
// successful read). Query strings are tracking noise, not part of the page.
const TODAY = new Date().toISOString().slice(0, 10);
const cleanUrl = (u: string) => u.split("?")[0].split("#")[0];

async function main() {
  if (!PRICING_DB || !SCHOOLS_DB) { console.error("NOTION_PRICING_DB / NOTION_SCHOOLS_DB not set"); process.exit(1); }
  const ids = await schoolIdMap();
  // Fail loudly: getAllSchools() returns [] on any Notion error (e.g. a stale token
  // in the CI secrets), and the sync then "skips" every brand and exits green. That
  // hid a dead sync for five weeks (Sep 2026). Zero schools is never a valid state.
  if (ids.size === 0) throw new Error("No schools returned from Notion: check NOTION_TOKEN / NOTION_SCHOOLS_DB (the run would otherwise skip every brand and pass).");

  // Verified-ruled rows (Sean, 1 Oct 2026): where the Scraper Rules DB holds a Verified
  // rule for a brand-state, its Verified Price owns the Pricing row's Price. This sync
  // never overwrites it; it only writes the live checkout price as a Sale Price offer
  // when that is lower. Unreadable rules must stop the run: proceeding would overwrite
  // the very prices the rules protect.
  const rules = await fetchVerifiedRules(notion);
  if (process.env.NOTION_SCRAPER_RULES_DB && rules.length === 0) {
    throw new Error("Scraper Rules DB returned no Verified rules (unshared or unreadable): refusing to run, as it would overwrite Verified prices.");
  }
  const verified = new Map(
    rules.filter((x) => x.verifiedPrice != null).map((x) => [`${x.schoolSlug}-${x.state}`, x.verifiedPrice as number])
  );

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

        // P17: apply any verified checkout truth (conditional promo -> course-only
        // price; mandatory checkout fee -> all-in price) before anything is written.
        const adj = CHECKOUT_ADJUST[brand]?.[code];
        if (adj?.basis === "regular") r.current = r.regular;
        // The struck "was" figure stays the course's own regular price.
        if (adj?.addFee) r.current = +(r.current + adj.addFee).toFixed(2);

        const ex = await existingRow(brand, code);

        const ruled = verified.get(`${brand}-${code}`);
        if (ruled != null) {
          const sourceUrl = cleanUrl(targets.get(code)!);
          if (!ex.id) { console.log(`${code} | verified $${ruled} (Scraper Rules owns this row; none exists yet) | skip`); continue; }
          const discounted = r.current < ruled - 0.01;
          const props: any = { "Price Source URL": { url: sourceUrl }, "Price Checked": { date: { start: TODAY } } };
          if (discounted) {
            props["Active Offer"] = { checkbox: true };
            props["Sale Price"] = { number: r.current };
            props["Offer Seen"] = { date: { start: TODAY } };
          }
          const same =
            ex.checked === TODAY && ex.sourceUrl === sourceUrl &&
            (!discounted || (ex.activeOffer && ex.salePrice === r.current && ex.offerSeen === TODAY));
          console.log(`${code} | verified $${ruled} kept | checkout $${r.current}${discounted ? ` -> Sale Price $${r.current}` : " (no discount)"} | ${r.status} | ${same ? "unchanged" : "UPDATE"} (Verified rule)`);
          if (!same) ops.push({ label: `${brand}-${code}`, id: ex.id, props });
          await new Promise((res) => setTimeout(res, 300));
          continue;
        }

        // Struck regular: prefer the API's. If the API collapsed it but an existing
        // offer-model row carried the true regular in its Price field, recover it.
        let regular = r.regular;
        if (!(regular > r.current + 0.01) && ex.price != null && ex.price > r.current + 0.01) regular = ex.price;
        const setOriginal = adj?.basis !== "regular" && regular > r.current + 0.01;

        const props: any = {
          Label: { title: [{ text: { content: `${brand}-${code}` } }] },
          "State Code": { rich_text: [{ text: { content: code } }] },
          School: { relation: [{ id: schoolId }] },
          Price: { number: r.current },
          Approved: { checkbox: true },
        };
        if (setOriginal) props["Original Price"] = { number: regular };
        const sourceUrl = cleanUrl(targets.get(code)!);
        props["Price Source URL"] = { url: sourceUrl };
        props["Price Checked"] = { date: { start: TODAY } };
        if (r.status === "pinned" && r.note) props["Price Note"] = { rich_text: [{ text: { content: `${LABEL[brand] ?? brand} ${r.note}` } }] };
        if (adj) {
          const base = r.status === "pinned" && r.note ? `${LABEL[brand] ?? brand} ${r.note}. ` : "";
          props["Price Note"] = { rich_text: [{ text: { content: `${base}${adj.note} (checkout verified ${adj.verified})` } }] };
        }
        props["Price Includes Fees"] = { checkbox: !!adj?.addFee };
        // A conditional promo is not a struck "was" price: the course-only price is the price.
        if (adj?.basis === "regular") props["Original Price"] = { number: null };

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
        const provenanceSame = ex.checked === TODAY && ex.sourceUrl === sourceUrl;
        const same = !!ex.id && priceSame && origSame && relSame && !clearedOffer && provenanceSame;
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
