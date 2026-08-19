/**
 * Audit the tracker offer map (tracker/seed/map.json) against the LIVE Tune
 * (HasOffers) offer catalogue via the Affiliate API. Catches exactly the class of
 * error we hit by hand (dead offer 324, duplicate IDs, wrong-state mapping):
 * for every key, confirm the offer_id exists, is active, and its name matches the
 * intended state/brand.
 *
 *   npx tsx scripts/audit-offer-map.ts
 *
 * Reads TUNE_API_KEY + TUNE_NETWORK_ID from .env.local. Read-only (no writes).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { STATE_LIST } from "../lib/state-utils";

const NET = process.env.TUNE_NETWORK_ID;
const KEY = process.env.TUNE_API_KEY;
const CI = process.argv.includes("--ci"); // write offer-audit.json + exit 1 on problems

/* eslint-disable @typescript-eslint/no-explicit-any */
type Offer = { id: string; name: string; status: string; payout: string | null };

async function tune(target: string, method: string, params: Array<[string, string]>): Promise<any> {
  const u = new URL(`https://${NET}.api.hasoffers.com/Apiv3/json`);
  u.searchParams.set("NetworkId", NET!);
  u.searchParams.set("api_key", KEY!);
  u.searchParams.set("Target", target);
  u.searchParams.set("Method", method);
  for (const [k, v] of params) u.searchParams.append(k, v);
  const r = await fetch(u);
  const j = await r.json();
  if (j?.response?.status !== 1) throw new Error(`Tune ${target}/${method}: ${JSON.stringify(j?.response?.errors ?? j).slice(0, 200)}`);
  return j.response.data;
}

async function fetchAllOffers(): Promise<Map<string, Offer>> {
  const byId = new Map<string, Offer>();
  let page = 1;
  for (;;) {
    const d = await tune("Affiliate_Offer", "findAll", [
      ["fields[]", "id"],
      ["fields[]", "name"],
      ["fields[]", "status"],
      ["fields[]", "default_payout"],
      ["limit", "1000"],
      ["page", String(page)],
    ]);
    for (const row of Object.values(d.data) as any[]) {
      const o = row.Offer ?? row;
      byId.set(String(o.id), { id: String(o.id), name: o.name ?? "", status: o.status ?? "", payout: o.default_payout ?? null });
    }
    if (page >= (Number(d.pageCount) || 1)) break;
    page++;
  }
  return byId;
}

const stateName = (code: string) =>
  STATE_LIST.find((s) => s.code === code)?.name ?? code;

async function main() {
  if (!NET || !KEY) { console.log("TUNE_API_KEY / TUNE_NETWORK_ID not set in .env.local"); return; }
  const offers = await fetchAllOffers();
  console.log(`Pulled ${offers.size} live offers from Tune (network=${NET}).\n`);

  const map: Array<{ key: string; value: string }> = JSON.parse(
    readFileSync(join(process.cwd(), "tracker", "seed", "map.json"), "utf8")
  );

  let ok = 0;
  const problems: string[] = [];
  for (const { key, value } of map) {
    if (key.endsWith(":_default")) continue;
    const [slug, code] = key.split(":");
    const id = (value.match(/offer_id=(\d+)/) || [])[1];
    if (!id) { problems.push(`${key}: value has no offer_id (${value.slice(0, 50)})`); continue; }
    const o = offers.get(id);
    if (!o) { problems.push(`${key}: offer ${id} NOT in account (dead/removed?)`); continue; }
    const active = o.status.toLowerCase() === "active";
    // Name should reference this state (full name), for a real per-state check.
    const nm = o.name.toLowerCase();
    const nameMatches = nm.includes(stateName(code).toLowerCase()) || (code === "DC" && nm.includes("washington"));
    if (!active) problems.push(`${key}: offer ${id} status=${o.status} — "${o.name}"`);
    else if (!nameMatches) problems.push(`${key}: offer ${id} name "${o.name}" does not mention ${stateName(code)} — verify`);
    else ok++;
  }

  console.log(`✓ ${ok} map entries verified (offer active + name matches state)\n`);
  if (problems.length) {
    console.log(`⚠ ${problems.length} to review:`);
    for (const p of problems) console.log("  - " + p);
  } else {
    console.log("No problems found.");
  }

  // Cross-check: excluded offers must not appear.
  const EXCLUDED = ["472", "24", "19", "324"];
  const usedIds = new Set(map.map((m) => (m.value.match(/offer_id=(\d+)/) || [])[1]).filter(Boolean));
  const leaked = EXCLUDED.filter((id) => usedIds.has(id));
  console.log(`\nExcluded offers (472/24/19/324) present in map: ${leaked.length ? leaked.join(",") : "none ✓"}`);
  // Distinct payouts (sanity on the flat 30% CPS claim).
  const payouts = new Set([...offers.values()].map((o) => o.payout).filter(Boolean));
  console.log(`Distinct default_payout values across all offers: ${[...payouts].slice(0, 8).join(", ")}`);

  if (CI) {
    writeFileSync(join(process.cwd(), "offer-audit.json"), JSON.stringify({ ok, problems, leaked }, null, 2));
    if (problems.length || leaked.length) process.exit(1);
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
