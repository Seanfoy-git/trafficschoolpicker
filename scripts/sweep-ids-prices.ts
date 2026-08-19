/**
 * Dry-run price sweep for I Drive Safely, targeted by the Tune API.
 *
 * The API gives each state offer's authoritative landing page (preview_url); we
 * scrape its JSON-LD Offer price — the reliable STRUCTURED price, not the headline
 * / compare-at figure the page shows in prose. Reports candidate per-state prices
 * so we can decide what to write to the Pricing DB. READ-ONLY (no writes).
 *
 *   npx tsx scripts/sweep-ids-prices.ts            # sample of states
 *   npx tsx scripts/sweep-ids-prices.ts --all      # every IDS state offer
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { STATE_LIST } from "../lib/state-utils";

const NET = process.env.TUNE_NETWORK_ID!, KEY = process.env.TUNE_API_KEY!;
const ALL = process.argv.includes("--all");
const SAMPLE = new Set(["OH", "CO", "MI", "WY", "VA", "HI", "NJ", "AL", "NY", "GA", "TX"]); // last 3 = verified, to compare

/* eslint-disable @typescript-eslint/no-explicit-any */
async function tune(target: string, method: string, params: Array<[string, string]>) {
  const u = new URL(`https://${NET}.api.hasoffers.com/Apiv3/json`);
  u.searchParams.set("NetworkId", NET); u.searchParams.set("api_key", KEY);
  u.searchParams.set("Target", target); u.searchParams.set("Method", method);
  for (const [k, v] of params) u.searchParams.append(k, v);
  const j: any = await (await fetch(u)).json();
  if (j?.response?.status !== 1) throw new Error(JSON.stringify(j?.response?.errors ?? j).slice(0, 200));
  return j.response.data;
}
const STATES = [...STATE_LIST].sort((a, b) => b.name.length - a.name.length);
function stateOf(name: string): string | null {
  const n = name.toLowerCase();
  if (/washington,?\s*d\.?c\.?|district of columbia/.test(n)) return "DC";
  for (const s of STATES) if (s.code !== "DC" && n.includes(s.name.toLowerCase())) return s.code;
  return null;
}
const KEEP = /defensive driving|traffic school|driver improvement|reduction|\bpirp\b|\bbdi\b|\badi\b|ticket/i;
const EXCLUDE = /homepage|homeschool|drivers? ?ed|driver'?s ed|\bteen\b|adult drivers|pre-licens|instructor led|\bmature\b|aarp|permit|packet|real estate|mortgage|all vertical|abbreviated/i;

async function main() {
  // IDS state traffic-school offers → { state: preview_url }.
  const all: any[] = [];
  let page = 1;
  for (;;) {
    const d = await tune("Affiliate_Offer", "findAll", [["fields[]","id"],["fields[]","name"],["fields[]","preview_url"],["fields[]","status"],["limit","1000"],["page",String(page)]]);
    for (const r of Object.values(d.data) as any[]) all.push(r.Offer ?? r);
    if (page >= (Number(d.pageCount)||1)) break; page++;
  }
  const targets: Array<{ code: string; url: string }> = [];
  const seen = new Set<string>();
  for (const o of all) {
    if (o.status !== "active" || !/i drive safely/i.test(o.name)) continue;
    if (EXCLUDE.test(o.name) || !KEEP.test(o.name)) continue;
    const code = stateOf(o.name);
    if (!code || seen.has(code) || !o.preview_url) continue;
    if (!ALL && !SAMPLE.has(code)) continue;
    seen.add(code);
    targets.push({ code, url: o.preview_url });
  }
  targets.sort((a, b) => a.code.localeCompare(b.code));
  console.log(`Sweeping ${targets.length} IDS landing pages (JSON-LD prices)…\n`);

  const browser = await chromium.launch({ headless: true });
  const pg = await browser.newPage();
  await pg.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  for (const { code, url } of targets) {
    try {
      await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      const prices: number[] = await pg.evaluate(() => {
        const out: number[] = [];
        const stack: unknown[] = [];
        document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
          try { stack.push(JSON.parse(s.textContent || "")); } catch {}
        });
        while (stack.length) {
          const o = stack.pop();
          if (!o || typeof o !== "object") continue;
          const rec = o as Record<string, unknown>;
          const raw = (rec.price ?? rec.lowPrice) as unknown;
          if (raw != null && (rec["@type"] === "Offer" || rec["@type"] === "AggregateOffer" || "priceCurrency" in rec)) {
            const n = parseFloat(String(raw));
            if (!Number.isNaN(n) && n >= 3 && n <= 200) out.push(n);
          }
          for (const k in rec) stack.push(rec[k]);
        }
        return out;
      });
      const uniq = [...new Set(prices)].sort((a, b) => a - b);
      const candidate = uniq.length ? uniq[0] : null; // base tier = min
      console.log(`  ${code}: candidate ${candidate != null ? "$" + candidate.toFixed(2) : "(no JSON-LD price)"}   json-ld=[${uniq.join(", ")}]  ${url}`);
    } catch (e: any) {
      console.log(`  ${code}: ERROR ${e.message.slice(0, 60)}  ${url}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  await browser.close();
  console.log("\nDRY RUN — no Pricing DB writes. Review candidates before we persist them.");
}
main().catch((e) => { console.error(e.message); process.exit(1); });
