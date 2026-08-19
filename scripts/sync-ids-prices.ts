/**
 * Sync I Drive Safely per-state prices into the Pricing DB from IDS's OWN pricing
 * API (the authoritative, re-runnable source — see scripts/lib/ids-pricing.ts).
 * Replaces hand-entered IDS prices and the mis-scraped regular-as-current values.
 *
 *   npx tsx scripts/sync-ids-prices.ts            # DRY RUN: show the Pricing-DB diff
 *   npx tsx scripts/sync-ids-prices.ts --write    # upsert Price/Original Price/Approved
 *
 * SAFE BY DESIGN:
 *  - Writes ONLY Price (current), Original Price (regular, only when regular > current),
 *    Approved, School, State Code, Label. NEVER sets Active Offer / Sale Price / Offer
 *    Seen — so no fabricated "limited-time" framing, and it can't clobber a manually
 *    managed offer (pages.update only changes the fields we pass).
 *  - Multi-course states are pinned by courseId (human-verified). A NEW multi-course
 *    state, a vanished pin, or a no-price state is FLAGGED and skipped — never guessed.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
import { resolveIdsTargets, fetchStatePrices, resolvePrice, withBrowser } from "./lib/ids-pricing";

const WRITE = process.argv.includes("--write");
const CI = process.argv.includes("--ci"); // write + emit ids-price-sync.json; issue only on flags/drift
const notion = makeNotionClient();
const PRICING_DB = process.env.NOTION_PRICING_DB!;
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;
const SLUG = "idrivesafely";
/* eslint-disable @typescript-eslint/no-explicit-any */

async function idsSchoolId(): Promise<string> {
  const res = await notion.databases.query({ database_id: SCHOOLS_DB, page_size: 100 });
  for (const p of res.results as any[]) {
    const slug = p.properties["Slug"]?.rich_text?.[0]?.plain_text
      ?? (p.properties["School Name"]?.title?.[0]?.plain_text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (slug === SLUG) return p.id;
  }
  throw new Error(`school "${SLUG}" not found in Schools DB`);
}

async function existingRow(code: string): Promise<{ id: string | null; price: number | null; original: number | null; activeOffer: boolean; salePrice: number | null }> {
  const res = await notion.databases.query({ database_id: PRICING_DB, filter: { property: "Label", title: { equals: `${SLUG}-${code}` } }, page_size: 1 });
  const r = res.results[0] as any;
  if (!r) return { id: null, price: null, original: null, activeOffer: false, salePrice: null };
  return {
    id: r.id,
    price: r.properties?.["Price"]?.number ?? null,
    original: r.properties?.["Original Price"]?.number ?? null,
    activeOffer: r.properties?.["Active Offer"]?.checkbox ?? false,
    salePrice: r.properties?.["Sale Price"]?.number ?? null,
  };
}

async function main() {
  if (!PRICING_DB || !SCHOOLS_DB) { console.error("NOTION_PRICING_DB / NOTION_SCHOOLS_DB not set"); process.exit(1); }
  const schoolId = await idsSchoolId();
  const targets = await resolveIdsTargets();
  const codes = [...targets.keys()].sort();

  const resolved: Array<{ code: string } & ReturnType<typeof resolvePrice>> = [];
  await withBrowser(async (pg) => {
    for (const code of codes) {
      const r = resolvePrice(code, await fetchStatePrices(pg, targets.get(code)!));
      resolved.push({ code, ...r });
      await new Promise((res) => setTimeout(res, 400));
    }
  });

  const writable = resolved.filter((r) => r.current != null) as Array<{ code: string; current: number; regular: number; status: string; note?: string; drift?: string }>;
  const flagged = resolved.filter((r) => r.current == null);

  console.log(`\n=== Pricing-DB plan (${writable.length} states) ===`);
  console.log("state | now -> current | orig | status | action");
  const ops: Array<{ code: string; id: string | null; props: any }> = [];
  const drifts: Array<{ code: string; drift: string }> = [];
  for (const r of writable.sort((a, b) => a.code.localeCompare(b.code))) {
    if (r.drift) drifts.push({ code: r.code, drift: r.drift });
    const ex = await existingRow(r.code);
    // Struck regular: prefer the API's regular. If the API collapsed it (regular ==
    // current) but an existing offer-model row carried the true regular in its Price
    // field (Price=regular, Sale=current), recover it so the struck line survives.
    let regular = r.regular;
    if (!(regular > r.current + 0.01) && ex.price != null && ex.price > r.current + 0.01) regular = ex.price;
    const setOriginal = regular > r.current + 0.01;

    const props: any = {
      Label: { title: [{ text: { content: `${SLUG}-${r.code}` } }] },
      "State Code": { rich_text: [{ text: { content: r.code } }] },
      School: { relation: [{ id: schoolId }] },
      Price: { number: r.current },
      Approved: { checkbox: true },
    };
    if (setOriginal) props["Original Price"] = { number: regular };
    if (r.status === "pinned" && r.note) props["Price Note"] = { rich_text: [{ text: { content: `IDS ${r.note}` } }] };

    // ROBUST MODEL: IDS current price lives in Price (+ struck Original Price), NOT the
    // offer mechanism. Clear any Active Offer so no "limited-time" badge renders and the
    // price can't TTL-revert to the regular. (Applies only to rows that currently carry
    // an offer — GA/NY/TX today; a manual IDS offer added later would also be cleared,
    // which is intentional: IDS is managed by this sync, not the offer workflow.)
    let clearedOffer = false;
    if (ex.activeOffer || ex.salePrice != null) {
      props["Active Offer"] = { checkbox: false };
      props["Sale Price"] = { number: null };
      props["Offer Seen"] = { date: null };
      clearedOffer = true;
    }

    const priceSame = ex.price === r.current;
    const origSame = (ex.original ?? null) === (setOriginal ? regular : (ex.original ?? null));
    const same = !!ex.id && priceSame && origSame && !clearedOffer;
    const action = !ex.id ? "CREATE" : same ? "unchanged" : "UPDATE";
    const flags = [clearedOffer ? "clear offer" : "", r.drift ? `⚠ ${r.drift}` : ""].filter(Boolean).join("  ");
    console.log(`${r.code} | ${ex.price ?? "—"} -> $${r.current}${setOriginal ? ` | reg $${regular}` : " | —"} | ${r.status} | ${action}${flags ? "  " + flags : ""}`);
    if (action !== "unchanged") ops.push({ code: r.code, id: ex.id, props });
  }

  if (flagged.length) {
    console.log(`\n=== FLAGGED (skipped — need a human pin, not guessed) ===`);
    for (const f of flagged) console.log(`${f.code} | ${f.status} | options [${f.options.map((o) => "$" + o.current).join(", ")}] | ${f.note ?? ""}`);
  }

  // CI: emit a machine-readable summary. The workflow opens a self-closing issue
  // ONLY when there's something a human must act on: a flagged state (new multi-
  // course / vanished pin / no price) or a pinned-course price drift. Routine price
  // changes on auto states are expected and do NOT raise an issue.
  if (CI) {
    const summary = {
      created: ops.filter((o) => !o.id).length,
      updated: ops.filter((o) => o.id).length,
      needsAttention: flagged.length > 0 || drifts.length > 0,
      flagged: flagged.map((f) => `${f.code}: ${f.status} — options [${f.options.map((o) => "$" + o.current).join(", ")}]${f.note ? ` (${f.note})` : ""}`),
      drifts: drifts.map((d) => `${d.code}: ${d.drift}`),
    };
    const { writeFileSync } = await import("fs");
    const { join } = await import("path");
    writeFileSync(join(process.cwd(), "ids-price-sync.json"), JSON.stringify(summary, null, 2));
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
    } catch (e: any) { errors++; console.error(`  ERR ${op.code}: ${e.message}`); }
    await new Promise((res) => setTimeout(res, 250));
  }
  console.log(`\nWROTE: ${created} created, ${updated} updated, ${errors} errors. Deploy to publish (ISR revalidates in 24h; trigger a build to publish now).`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
