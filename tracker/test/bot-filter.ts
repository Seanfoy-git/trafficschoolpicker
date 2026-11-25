/**
 * Money-path and bot-filter tests for the tracker Worker. No deploy, no network.
 * Mocks KV and drives the fetch handler for EVERY state offer in seed/map.json.
 *
 *   npx tsx tracker/test/bot-filter.ts        (from the repo root)
 *
 * Part 1 (money path): a person's browser, and the visitor types we pass on
 * deliberately (search-engine crawlers, assistants fetching for a person), must
 * land on exactly the mapped HasOffers URL for every state offer: same host,
 * same path, the offer's own offer_id and aff_id untouched, plus
 * aff_sub=tsp-{STATE} and an aff_sub3 click id, and nothing else.
 *
 * Part 2 (bot filter): bots must NOT be redirected for any state offer: no 3xx,
 * no Location header, nothing written under click:, one record under bot:.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import worker, { type Env } from "../src/index";

type Put = { key: string; value: string; opts?: unknown };

function makeKV(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  const puts: Put[] = [];
  const kv = {
    get: async (k: string) => (store.has(k) ? store.get(k)! : null),
    put: async (key: string, value: string, opts?: unknown) => {
      puts.push({ key, value, opts });
      store.set(key, value);
    },
  };
  return { kv: kv as unknown as KVNamespace, puts };
}

const seed: Array<{ key: string; value: string }> = JSON.parse(
  readFileSync(join(__dirname, "..", "seed", "map.json"), "utf8")
);
const MAP = Object.fromEntries(seed.map((e) => [e.key, e.value]));
const STATE_OFFERS = seed.filter((e) => !e.key.endsWith(":_default"));

let failures = 0;
let passes = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passes++;
    return;
  }
  failures++;
  console.log(`  [FAIL] ${name}${detail ? ` | ${detail}` : ""}`);
}

async function hit(path: string, headers: Record<string, string>) {
  const map = makeKV(MAP);
  const clicks = makeKV();
  const env: Env = { MAP: map.kv, CLICKS: clicks.kv, SITE_URL: "https://www.trafficschoolpicker.com" };
  const res = await worker.fetch(new Request(`https://track.trafficschoolpicker.com${path}`, { headers }), env);
  return { res, puts: clicks.puts };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The exact URL a person must land on: the mapped offer URL plus our two subids, nothing else. */
function assertOfferRedirect(label: string, res: Response, puts: Put[], mapped: string, state: string) {
  check(`${label}: 302`, res.status === 302, `got ${res.status}`);
  const loc = res.headers.get("location") || "";
  let got: URL | null = null;
  try {
    got = new URL(loc);
  } catch {
    check(`${label}: Location is a URL`, false, loc);
    return;
  }
  const want = new URL(mapped);
  check(`${label}: same host and path`, got.origin + got.pathname === want.origin + want.pathname, loc);
  for (const [k, v] of want.searchParams) {
    check(`${label}: ${k} unchanged`, got.searchParams.get(k) === v, `want ${v}, got ${got.searchParams.get(k)}`);
  }
  check(`${label}: aff_sub=tsp-${state}`, got.searchParams.get("aff_sub") === `tsp-${state}`);
  check(`${label}: aff_sub3 is a click id`, UUID.test(got.searchParams.get("aff_sub3") || ""));
  const extra = [...got.searchParams.keys()].filter((k) => !want.searchParams.has(k) && k !== "aff_sub" && k !== "aff_sub3");
  check(`${label}: no other params`, extra.length === 0, extra.join(","));
  check(`${label}: no-store`, res.headers.get("cache-control") === "no-store");
  const clickPut = puts.find((p) => p.key.startsWith("click:"));
  check(`${label}: click logged`, !!clickPut);
  if (clickPut) {
    const rec = JSON.parse(clickPut.value);
    check(`${label}: logged click id matches aff_sub3`, rec.clickId === got.searchParams.get("aff_sub3"));
    check(`${label}: logged mapped=true`, rec.mapped === true);
  }
  check(`${label}: no bot record`, !puts.some((p) => p.key.startsWith("bot:")));
}

// Visitors that must reach the offer exactly as today.
const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.2 Mobile/15E148 Safari/604.1";
const PASS: Array<[string, Record<string, string>]> = [
  ["Chrome, no referrer", { "user-agent": CHROME_WIN }],
  ["Chrome, site referrer", { "user-agent": CHROME_WIN, referer: "https://www.trafficschoolpicker.com/" }],
  ["iPhone Safari, no referrer", { "user-agent": SAFARI_IPHONE }],
  // Phone brand with "BOT" in its name must not read as a bot.
  ["Android phone named CUBOT", { "user-agent": "Mozilla/5.0 (Linux; Android 13; CUBOT X70 Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36" }],
  // Search engines see what people see (Google spam policy on cloaking); robots.txt keeps them off /c/.
  ["Googlebot", { "user-agent": "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.8103.78 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }],
  ["bingbot", { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36" }],
  // An assistant opening the link because a person asked it to.
  ["ChatGPT-User", { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot" }],
  ["Perplexity-User", { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)" }],
  ["Claude-User", { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +https://www.anthropic.com)" }],
];

// Visitors that must NOT reach the offer. Strings are copied from the 17-23 Nov 2026 click log.
const BLOCK: Array<[string, Record<string, string>]> = [
  ["tracker-host referrer (main scraper)", { "user-agent": CHROME_WIN, referer: "https://track.trafficschoolpicker.com" }],
  ["tracker-host referrer with path", { "user-agent": CHROME_WIN, referer: "https://track.trafficschoolpicker.com/" }],
  ["tracker-host referrer behind a Googlebot UA", { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", referer: "https://track.trafficschoolpicker.com" }],
  ["meta-externalagent", { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 (compatible; meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler))" }],
  ["KakaoBot", { "user-agent": "Mozilla/5.0 (compatible; KakaoBot/1.0; +https://cs.kakao.com/helps_html/1073213012)" }],
  ["CrolBot", { "user-agent": "Mozilla/5.0 (compatible; CrolBot/0.1; +https://cloro.dev)" }],
  ["RiverBot", { "user-agent": "RiverBot/1.0 (+https://river.ai/bot)" }],
  ["MJ12bot", { "user-agent": "Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)" }],
  ["Bytespider", { "user-agent": "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)" }],
  ["GPTBot", { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)" }],
  ["curl", { "user-agent": "curl/8.5.0" }],
  ["python-requests", { "user-agent": "python-requests/2.32.3" }],
  ["HeadlessChrome", { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" }],
  ["spoofed iPhone iOS 13.2.3", { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1" }],
];

async function main() {
  console.log(`Offer map: ${STATE_OFFERS.length} state offers from seed/map.json\n`);

  console.log(`Part 1: people and pass-through visitors land on the right offer (${PASS.length} visitor types x ${STATE_OFFERS.length} offers)`);
  const before1 = failures;
  for (const { key, value } of STATE_OFFERS) {
    const [slug, state] = key.split(":");
    for (const [label, headers] of PASS) {
      const { res, puts } = await hit(`/c/${slug}?s=${state}&p=page-uuid`, headers);
      assertOfferRedirect(`${key} / ${label}`, res, puts, value, state);
    }
  }
  console.log(failures === before1 ? "  all pass" : `  ${failures - before1} failure(s)`);

  console.log(`\nPart 2: bots are not redirected (${BLOCK.length} bot types x ${STATE_OFFERS.length} offers)`);
  const before2 = failures;
  for (const { key } of STATE_OFFERS) {
    const [slug, state] = key.split(":");
    for (const [label, headers] of BLOCK) {
      const { res, puts } = await hit(`/c/${slug}?s=${state}&p=page-uuid`, headers);
      const l = `${key} / ${label}`;
      check(`${l}: not a redirect`, res.status < 300 || res.status >= 400, `got ${res.status}`);
      check(`${l}: no Location`, res.headers.get("location") === null, res.headers.get("location") || "");
      check(`${l}: nothing under click:`, !puts.some((p) => p.key.startsWith("click:")));
      const botPut = puts.find((p) => p.key.startsWith("bot:"));
      check(`${l}: logged under bot:`, !!botPut);
      if (botPut) {
        const rec = JSON.parse(botPut.value);
        check(`${l}: bot record has slug and state`, rec.slug === slug && rec.state === state);
        check(`${l}: bot record has a reason`, typeof rec.reason === "string" && rec.reason.length > 0);
      }
    }
  }
  console.log(failures === before2 ? "  all pass" : `  ${failures - before2} failure(s)`);

  console.log(`\n${passes} checks passed, ${failures} failed`);
  if (failures > 0) process.exit(1);
  console.log("ALL PASS");
}

main();
