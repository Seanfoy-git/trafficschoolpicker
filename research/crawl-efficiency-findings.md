# Crawl-efficiency package — findings (Sep 2026)

Branch `feat/crawl-efficiency` → merged as #57. Follows P15 (crawl-paths).
Measurement-first, per the brief. Numbers below are from production, Googlebot UA.

## Headline

**The 738ms GSC "average response time" is not our pages.** Cache-HIT TTFB on all
seven page types is **150–220ms** — already under 300ms. The 738ms average is what
Googlebot pays on the things that are *not* the page: uncached 404s (1.7s), apex
redirects (30% of requests), and post-deploy / ISR-revalidation misses. This confirms
the brief's own stated hypothesis. Fixes target those, in measured-impact order.

## Task 2a — TTFB + cache (production, 3× each, warm)

| Page type | TTFB (warm HIT) | x-vercel-cache |
|---|---|---|
| `/` (home) | 0.15–0.20s | HIT |
| `/california` (state hub) | 0.15–0.20s (1× 0.48 on revalidate) | HIT |
| `/california/is-traffic-school-worth-it` (topic) | 0.15–0.21s **/ 1.24s at age=0** | HIT / BYPASS |
| `/reviews` | 0.17s | HIT |
| `/reviews/aceable` | 0.15–0.17s | HIT |
| `/schools` | 0.15–0.22s | HIT |
| `/blog/traffic-school-vs-paying-ticket` | 0.14–0.19s | HIT |

HTML `cache-control: max-age=0, must-revalidate` (Next default; Vercel's edge does the
real caching via `x-vercel-cache`). The one slow HTML reading (1.24s) was a cache
`BYPASS` at `age=0` — an ISR revalidation / post-deploy cold entry, not steady state.

## Task 2b — the five hypotheses

| H | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| **H4** | Dynamically-rendered 404s | **CONFIRMED — biggest lever** | 404 = **1.73s cold / 0.83s warm**, `x-vercel-cache: MISS`, `max-age=0` (uncached), 31KB. `[state]` route had no `dynamicParams=false`, so `/foo` rendered the route dynamically — SSR-ing the layout's Footer Notion fetch — just to `notFound()`. |
| **H3** | Apex redirect tax | **CONFIRMED (external cause)** | apex→www 308 adds ~210ms; followed 0.526s vs 0.315s direct. 182 requests (30%). But **zero internal apex refs** exist (see 4b) — the apex crawl is external/historical, not something CC references. |
| **H2** | Edge cache purged by deploys | **CONFIRMED (process lever)** | Post-deploy pages show `BYPASS`/`age=0` and 1.24s first-hit, then fast HITs. Near-daily deploys through P9–P12 kept resetting the edge. Lever = fewer deploys now that big packages are closed. |
| **H1** | On-demand image optimization | **Mostly RULED OUT (minor)** | Flags are tiny (4.6KB, ~200–280ms cold, then HIT). Not the 1–3s feared. But optimizer emitted `max-age=0` → Googlebot Image (16%) re-fetched. Minor win: `minimumCacheTTL`. |
| **H5** | Request-time data fetching | **RULED OUT** | Warm cache HITs are 150ms — no per-request work on hits. The slow misses are ISR regeneration (H2), not per-hit fetching. |

## Fixes shipped (measured-impact order)

1. **H4 — `dynamicParams = false` on `app/[state]/page.tsx`.** `generateStaticParams`
   already returns *all* state slugs, so this is safe: unknown single-segment paths now
   resolve to the **static** not-found at the routing layer instead of a dynamic
   SSR-then-`notFound()`. **Local: unknown paths 404 in ~8ms (was 1.7s in prod).** This
   also removes the Footer Notion fetch from the 404 path. Mirrors the `[question]` route.
2. **H1 — `next.config.ts images.minimumCacheTTL = 31536000`.** Optimized flags now
   carry a 1-year cache-control instead of `max-age=0`, so Googlebot Image stops
   re-fetching immutable variants. (Changes re-fetch *frequency*, not per-page bytes.)
3. **H2 — process, not code.** Deploy less often now that P9–P16 are closing. Each
   deploy resets the edge and inflates refresh demand; this is the standing lever.

## Task 3 — lastmod discipline

Investigated first: **every lastmod was already content-derived** (a Notion "Last
Verified" date, a post's frontmatter date, or a hand-bumped constant) — never build
time. The real determinism gap was **order**: `getAllSchools` sorts by Rating (ties
break in Notion's order) and `getQuestionPages` is unsorted, so a no-change rebuild
could reorder the sitemap. **Fix: sort the sitemap by URL** (`app/sitemap.ts`).

- **Acceptance met:** two no-change rebuilds → **byte-identical `sitemap.xml`** (same
  md5 `c58eb4ed…`, 24828 bytes, 142 loc / 142 lastmod). Google ignores URL order.
- Single-record edit: a state's date edit moves that state's lastmod. The two index
  pages (`/`, `/schools`) track the site's freshest-content date by design — itself
  content-derived, not a build event — so they move only if that edit sets a new max.

## Task 4 — reclaim the wasted 21%

- **4a — 404s + 410.** Removed the dead `/reviews/5dollartrafficschool` link from
  `public/llms.txt` (its only internal reference). Added `middleware.ts` returning **410**
  for permanently-gone paths, scoped by an exact `matcher` so it is **inert on all 142
  live pages** (zero added latency). Seeded with that one URL; extend from access logs.
  **The full 404 list needs the hosting access logs / GSC crawl-stats drilldown — I
  can't read those; Sean has access.** Known contributors: the now-fixed Florida route
  (200), and the 5dollartrafficschool llms link (removed + 410'd).
- **4b — apex host.** `grep` for `https://trafficschoolpicker.com` (bare apex) in source
  returns **zero**; production sitemap / llms.txt / llms-full.txt / robots / canonicals
  all use `www` (0 apex refs). **Nothing internal to change** — the 182 apex requests are
  external/historical and will decay as Google learns the 308. Reported, not "fixed".
- **4c — images.** Bytes per page type: home 0, state hub ~261KB (6 imgs), topic ~68KB
  (1), `/reviews` 0, review page ~53KB (1), `/schools` 0, blog 0. Modest — not a
  crawl-weight problem, and bytes are unchanged (the lever is re-fetch frequency, not
  size). **Cache headers:** measured that `minimumCacheTTL` alone does NOT fix the
  client-facing header — Vercel serves `max-age=0, must-revalidate` on `/_next/image`
  *and* on raw static assets regardless, so Googlebot Image kept re-fetching. Fixed with
  a `headers()` rule giving the immutable static originals (`/flags/*`, `/images/*` — the
  latter are the 40–67KB OG cards) `Cache-Control: public, max-age=31536000, immutable`.
  Verified. (The `/_next/image` client max-age stays 0 — a Vercel platform behavior — but
  the edge caches it via `x-vercel-cache: HIT`, so no re-transcode.) No oversized
  originals reachable on-page.
- **4d — AdsBot 21% (report only).** Explained: an **active Google Ads account**
  (`AW-18090793804` gtag in `app/layout.tsx`) → AdsBot crawls landing pages for policy /
  quality. Expected. **Do not block** (blocking AdsBot disables ad serving). Sean's call.

## Task 5 — standing crawl-health check

`scripts/crawl-health.ts`, wired as the trailing `postbuild` step (informational, never
fails the build). Prints per deploy: sitemap URLs 200 at the canonical host, bare-apex
refs in generated output, lastmod summary, and a live TTFB sample of the 7 page types.

## Invariants held

- P15's two guards stay green (sitemap-200, crawl-path 142/142 ≤2 clicks).
- Route / leak / contradiction guards green. Full 142-page axe sweep **CLEAN** (0
  violations, 6 systemic rules).
- No content, facts, tracker offers, card order, or disclosure changed. No URLs added
  (142 holds). One sanctioned content edit: the dead llms.txt link. Zero em dashes added.

## Files changed

`app/[state]/page.tsx` (dynamicParams=false), `app/sitemap.ts` (URL sort),
`next.config.ts` (image cache), `middleware.ts` (410, new), `scripts/crawl-health.ts`
(new), `package.json` (postbuild wiring), `public/llms.txt` (dead link removed).

## Not CC work
Off-site authority (the 607 ceiling) · Sean's URL Inspection submissions · thin-page
substance (P8/P14) · the full 404 list from Vercel logs. Re-read Crawl Stats + Pages in
14 days: success = response time falling toward ~300ms and discovery share rising above 11%.
