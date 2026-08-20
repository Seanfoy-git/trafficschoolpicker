/**
 * READ-ONLY discovery/report for I Drive Safely prices. Calls IDS's own pricing
 * API per state (see scripts/lib/ids-pricing.ts) and prints the resolved card
 * price + how it was resolved. No Notion writes — use sync-ids-prices.ts to write.
 *
 *   npx tsx scripts/discover-ids-prices.ts            # all IDS states
 *   npx tsx scripts/discover-ids-prices.ts --validate # only human-verified states, PASS/FAIL
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { writeFileSync } from "fs";
import { join } from "path";
import { resolveIdsTargets, fetchStatePrices, resolvePrice, withBrowser } from "./lib/ids-pricing";

const VALIDATE = process.argv.includes("--validate");
const KNOWN: Record<string, number> = { TX: 25, IN: 49, WA: 49, MO: 19.95, OR: 39.95, PA: 24.95, WI: 29, NC: 59, DE: 16 };

async function main() {
  const targets = await resolveIdsTargets();
  const codes = [...targets.keys()].filter((c) => (VALIDATE ? c in KNOWN : true)).sort();
  const rows: any[] = [];
  await withBrowser(async (pg) => {
    console.log(VALIDATE ? "state | resolved | status | known | result" : "state | current | regular | status | note");
    for (const code of codes) {
      const products = await fetchStatePrices(pg, targets.get(code)!);
      const r = resolvePrice("idrivesafely", code, products);
      rows.push({ code, url: targets.get(code), ...r });
      if (VALIDATE) {
        const known = KNOWN[code];
        const ok = r.current != null && Math.abs(r.current - known) < 0.5;
        const present = r.options.some((o) => Math.abs(o.current - known) < 0.5);
        console.log(`${code} | ${r.current ?? "[" + r.options.map((o) => o.current).join(",") + "]"} | ${r.status} | ${known} | ${ok ? "PASS ✓" : present ? "option present (needs pin)" : "MISS"}`);
      } else {
        console.log(`${code} | ${r.current ?? "[" + r.options.map((o) => "$" + o.current).join(",") + "]"} | ${r.current != null ? "$" + r.regular : "-"} | ${r.status} | ${r.note ?? ""}${(r as any).drift ? " ⚠ " + (r as any).drift : ""}`);
      }
      await new Promise((res) => setTimeout(res, 400));
    }
  });
  writeFileSync(join(process.cwd(), "ids-price-discovery.json"), JSON.stringify(rows, null, 2));
  const by = (s: string) => rows.filter((r) => r.status === s).length;
  console.log(`\n${rows.length} states | ${by("auto")} auto | ${by("pinned")} pinned | ${by("multi-unpinned")} need pin | ${by("pin-missing")} pin-missing | ${by("none")} no price`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
