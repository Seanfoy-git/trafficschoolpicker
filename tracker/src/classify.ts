/**
 * Decides whether a /c/ request goes on to the offer or is stopped as a bot.
 *
 * Evidence (click log + HasOffers Sub ID 3 join, 17-23 Nov 2026): 401 HasOffers
 * clicks, 0 conversions, 398 outside the US. 350 came from one scraper that sends
 * ordinary browser user agents through residential proxies but always sets
 * `Referer: https://track.trafficschoolpicker.com`. A real click cannot carry that
 * header: site links are rel="noreferrer" and the tracker serves no pages, so no
 * person is ever on a tracker page when they click. 29 more came from
 * meta-externalagent. See claude/tracker-bot-audit-2026-11-23.md in the project.
 *
 * Rules, first match wins:
 *   1. Referer host is the tracker's own host          -> block (tracker-referrer)
 *   2. Assistant fetching for a person (ChatGPT-User…)  -> pass  (ai-user)
 *   3. Search-engine crawler (Googlebot, bingbot…)      -> pass  (search-crawler)
 *      Search engines must see what people see (Google's cloaking and sneaky
 *      redirect policies). robots.txt on the tracker host is the way to keep them
 *      off /c/, not a different response.
 *   4. Declared crawler, scraper or HTTP library         -> block (declared-bot)
 *   5. Known spoofed browser string                     -> block (spoofed-ua)
 *   6. Anything else, including a missing user agent    -> pass  (browser)
 */

export type Verdict =
  | { block: false; label: "browser" | "ai-user" | "search-crawler" }
  | { block: true; reason: "tracker-referrer" | "declared-bot" | "spoofed-ua" };

// Fetches an assistant makes because a person asked it to open the link.
const AI_USER = /\b(?:ChatGPT-User|Perplexity-User|Claude-User|MistralAI-User)\b/i;

// Search-engine crawlers. Matched by name only, as today: a scraper claiming to be
// Googlebot still gets the redirect, which is no change from current behaviour.
const SEARCH_CRAWLER =
  /\b(?:Googlebot|Google-InspectionTool|GoogleOther|Storebot-Google|AdsBot-Google|bingbot|Applebot|DuckDuckBot|YandexBot|Baiduspider)\b/i;

// Declared crawlers and tools. Kept narrow so no person's browser can match:
//  - a product token ending in bot/crawler/spider/agent/indexer with a version
//    ("KakaoBot/1.0", "meta-externalagent/1.1", "MJ12bot/v1.4.8"); a phone model
//    such as "CUBOT X70" has no "/version" and does not match;
//  - crawlers that announce themselves without a version (Bytespider…);
//  - a contact URL or email in the user agent, which browsers never send;
//  - HTTP libraries and headless browsers, matched at the start of the string or
//    by their own token.
const DECLARED_BOT: RegExp[] = [
  /[\w.-]*(?:bot|crawler|spider|externalagent|webindexer)\/v?\d/i,
  /\b(?:Bytespider|facebookexternalhit|Slurp|ia_archiver)\b/i,
  /\+?https?:\/\/|[\w.-]+@[\w-]+\.[a-z]{2,}/i,
  /^(?:curl|wget|python-requests|python-urllib|python-httpx|aiohttp|Go-http-client|node-fetch|undici|axios|okhttp|Java|libwww-perl|Scrapy|PostmanRuntime|HTTPie)[\/\s]/i,
  /\b(?:HeadlessChrome|PhantomJS)\b/i,
];

// Browser strings that only automation sends. iOS 13.2.3 with Safari 13.0.3 is a
// 2019 emulation preset; in the log it came from Tencent Cloud (AS132203).
const SPOOFED_UA: RegExp[] = [/CPU iPhone OS 13_2_3 like Mac OS X.*Version\/13\.0\.3/];

export function classify(input: { userAgent: string | null; referer: string | null; host: string }): Verdict {
  const ua = input.userAgent || "";

  if (input.referer) {
    try {
      if (new URL(input.referer).hostname.toLowerCase() === input.host.toLowerCase()) {
        return { block: true, reason: "tracker-referrer" };
      }
    } catch {
      // Unparseable Referer: ignore it and classify on the user agent.
    }
  }

  if (AI_USER.test(ua)) return { block: false, label: "ai-user" };
  if (SEARCH_CRAWLER.test(ua)) return { block: false, label: "search-crawler" };
  if (DECLARED_BOT.some((re) => re.test(ua))) return { block: true, reason: "declared-bot" };
  if (SPOOFED_UA.some((re) => re.test(ua))) return { block: true, reason: "spoofed-ua" };
  return { block: false, label: "browser" };
}
