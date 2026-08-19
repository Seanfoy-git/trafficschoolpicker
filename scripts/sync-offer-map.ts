/**
 * Generate the tracker offer map (tracker/seed/map.json) from the LIVE Tune
 * (HasOffers) catalogue, and DIFF it against the committed file. Replaces
 * hand-transcription (the source of the 324/duplicate errors).
 *
 *   npx tsx scripts/sync-offer-map.ts            # dry-run: generate + diff only
 *   npx tsx scripts/sync-offer-map.ts --write    # write tracker/seed/map.json
 *
 * SAFE BY DESIGN: writing the file is separate from seeding KV. Even with
 * --write, nothing reaches production until someone runs `npm run seed` in
 * tracker/. Review the diff first.
 *
 * Scope: TRAFFIC-SCHOOL family only (Defensive Driving / Traffic School / Driver
 * Improvement) for the brands we place as direct-tracking cards (idrivesafely,
 * aceable). Explicitly EXCLUDES drivers-ed (teen/adult), homeschool, pre-
 * licensing, homepages, and non-Driving verticals. DriversEd.com's Tune offers
 * are ALL drivers-ed, so none are traffic-school-eligible — reported, not mapped.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { STATE_LIST } from "../lib/state-utils";

const NET = process.env.TUNE_NETWORK_ID;
const KEY = process.env.TUNE_API_KEY;
const AFF_ID = "6858";
const WRITE = process.argv.includes("--write");

/* eslint-disable @typescript-eslint/no-explicit-any */
type Offer = { id: string; name: string; preview_url: string };

async function tune(target: string, method: string, params: Array<[string, string]>): Promise<any> {
  const u = new URL(`https://${NET}.api.hasoffers.com/Apiv3/json`);
  u.searchParams.set("NetworkId", NET!);
  u.searchParams.set("api_key", KEY!);
  u.searchParams.set("Target", target);
  u.searchParams.set("Method", method);
  for (const [k, v] of params) u.searchParams.append(k, v);
  const j = await (await fetch(u)).json();
  if (j?.response?.status !== 1) throw new Error(`${target}/${method}: ${JSON.stringify(j?.response?.errors ?? j).slice(0, 200)}`);
  return j.response.data;
}

async function fetchLiveOffers(): Promise<Offer[]> {
  const out: Offer[] = [];
  let page = 1;
  for (;;) {
    const d = await tune("Affiliate_Offer", "findAll", [
      ["fields[]", "id"], ["fields[]", "name"], ["fields[]", "preview_url"],
      ["fields[]", "status"], ["fields[]", "approval_status"], ["fields[]", "is_expired"],
      ["limit", "1000"], ["page", String(page)],
    ]);
    for (const r of Object.values(d.data) as any[]) {
      const o = r.Offer ?? r;
      if (o.status === "active" && o.approval_status === "approved" && o.is_expired === "0") {
        out.push({ id: String(o.id), name: o.name ?? "", preview_url: o.preview_url ?? "" });
      }
    }
    if (page >= (Number(d.pageCount) || 1)) break;
    page++;
  }
  return out;
}

function brandOf(name: string): "idrivesafely" | "aceable" | "driversed" | "other" {
  const n = name.toLowerCase();
  if (n.includes("i drive safely")) return "idrivesafely";
  if (/\baceable\b/.test(n) && !/aceableagent/.test(n)) return "aceable";
  if (/driversed|driver'?s ed/.test(n)) return "driversed";
  return "other";
}

// Traffic-school family (KEEP) vs drivers-ed / licensing / non-course (EXCLUDE).
// "reduction"/pirp catch NY's "Point & Insurance Reduction Program".
const KEEP = /defensive driving|traffic school|driver improvement|reduction|\bpirp\b|\bbdi\b|\badi\b|ticket/i;
const EXCLUDE = /homepage|homeschool|drivers? ?ed|driver'?s ed|\bteen\b|adult drivers|pre-licens|instructor led|\bmature\b|aarp|permit|packet|real estate|mortgage|all vertical|abbreviated/i;

const STATES = [...STATE_LIST].sort((a, b) => b.name.length - a.name.length); // longest first
function stateOf(name: string): string | null {
  const n = name.toLowerCase();
  // DC first — its offers read "Washington, DC", which otherwise mis-matches "Washington" (WA).
  if (/washington,?\s*d\.?c\.?|district of columbia/.test(n)) return "DC";
  for (const s of STATES) {
    if (s.code === "DC") continue;
    if (n.includes(s.name.toLowerCase())) return s.code;
  }
  return null;
}

async function main() {
  if (!NET || !KEY) { console.log("TUNE_API_KEY / TUNE_NETWORK_ID not set in .env.local"); return; }
  const live = await fetchLiveOffers();

  // Committed map = source of truth for (a) preserving the tracking domain per
  // brand (do NOT churn aceable's go2cloud.org → go.aceable.com; the brief says
  // keep it) and (b) carrying forward non-generated keys like partner _defaults.
  const cur: Array<{ key: string; value: string }> = JSON.parse(readFileSync(join(process.cwd(), "tracker", "seed", "map.json"), "utf8"));
  const domainFromCur = (brand: string): string | null => {
    const e = cur.find((x) => x.key.startsWith(`${brand}:`) && /^https?:\/\//.test(x.value));
    return e ? new URL(e.value).host : null;
  };
  const domains: Record<string, string> = {
    idrivesafely: domainFromCur("idrivesafely") ?? "go.idrivesafely.com",
    aceable: domainFromCur("aceable") ?? "aceable.go2cloud.org",
  };
  console.log(`domains (preserved from committed map): ${JSON.stringify(domains)}\n`);

  // Only map a brand:STATE where that brand actually renders a card (Notion
  // coverage). The account carries offers for states we don't place — e.g. IDS
  // in CA/FL, which are Aceable's states here. getAllSchools is build-memoized.
  const { getAllSchools } = await import("../lib/notion");
  const schools = await getAllSchools();
  const coverage: Record<string, Set<string>> = {};
  for (const slug of ["idrivesafely", "aceable"]) {
    const s = schools.find((x) => x.slug === slug);
    coverage[slug] = new Set((s?.stateCodes ?? []).filter((c) => c !== "all").map((c) => c.toUpperCase()));
  }

  // Build map: brand:STATE -> chosen offer (dedup: prefer the LOWER offer_id — this
  // matched Sam's canonical picks for TX/MA/IN/FL exactly).
  const chosen = new Map<string, { id: number; name: string }>();
  let driversedTS = 0, excluded = 0, offCoverage = 0;
  for (const o of live) {
    const brand = brandOf(o.name);
    if (brand === "other") continue;
    if (EXCLUDE.test(o.name) || !KEEP.test(o.name)) { excluded++; continue; }
    if (brand === "driversed") { driversedTS++; continue; } // all DriversEd = drivers-ed, no traffic-school card
    const code = stateOf(o.name);
    if (!code) continue;
    if (!coverage[brand]?.has(code)) { offCoverage++; continue; } // brand places no card in this state
    const key = `${brand}:${code}`;
    const id = Number(o.id);
    const prev = chosen.get(key);
    if (!prev || id < prev.id) chosen.set(key, { id, name: o.name });
  }

  const entries = [...chosen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const brand = key.split(":")[0];
      return { key, value: `https://${domains[brand]}/aff_c?offer_id=${v.id}&aff_id=${AFF_ID}` };
    });
  // Carry forward non-generated keys (partner _defaults for other networks, e.g. asi).
  for (const e of cur) if (e.key.endsWith(":_default")) entries.push(e);
  const curMap = new Map(cur.map((e) => [e.key, e.value]));
  const genMap = new Map(entries.map((e) => [e.key, e.value]));
  const oid = (v?: string) => (v?.match(/offer_id=(\d+)/) || [])[1] ?? v;

  const added = [...genMap].filter(([k]) => !curMap.has(k));
  const removed = [...curMap].filter(([k]) => !genMap.has(k));
  const changed = [...genMap].filter(([k, v]) => curMap.has(k) && curMap.get(k) !== v);

  console.log(`generated ${entries.length} keys | current ${cur.length} keys`);
  console.log(`DriversEd offers skipped (all drivers-ed, not traffic school): ${driversedTS}`);
  console.log(`non-traffic-school offers excluded (homepage/homeschool/etc.): ${excluded}`);
  console.log(`traffic-school offers for states we don't place (off-coverage): ${offCoverage}\n`);
  console.log(`=== DIFF (generated vs committed) ===`);
  console.log(`changed (${changed.length}):`); changed.forEach(([k, v]) => console.log(`  ~ ${k}: ${oid(curMap.get(k))} -> ${oid(v)}`));
  console.log(`added (${added.length}):`); added.forEach(([k, v]) => console.log(`  + ${k}: offer ${oid(v)}`));
  console.log(`removed (${removed.length}):`); removed.forEach(([k, v]) => console.log(`  - ${k}: offer ${oid(v)}`));
  if (!changed.length && !added.length && !removed.length) console.log("  (identical — API generation reproduces the committed map ✓)");

  if (WRITE) {
    writeFileSync(join(process.cwd(), "tracker", "seed", "map.json"), JSON.stringify(entries, null, 2) + "\n");
    console.log("\nWROTE tracker/seed/map.json — review, then `cd tracker && npm run seed` to push to KV.");
  } else {
    console.log("\nDRY RUN — re-run with --write to update tracker/seed/map.json.");
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
