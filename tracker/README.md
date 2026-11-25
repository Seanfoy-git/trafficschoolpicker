# tsp-tracker — affiliate click tracker

Cloudflare Worker on `track.trafficschoolpicker.com`. Logs each outbound
affiliate click (first-party) and 302-redirects to the correct network offer.

## Why Cloudflare Worker (not a Vercel edge route)

- The `track` subdomain is already on **Cloudflare DNS** — a Worker binds to it with
  zero extra infra. A Vercel route would require pointing the subdomain at Vercel and
  coupling the redirector to the app's deploy cycle.
- **Workers KV** gives an edge-replicated map (fast 302s worldwide) and a click log
  that updates with a one-line `kv put` — no redeploy to add a school/state.
- Keeping the redirector off the main app means a frontend deploy can never take the
  money path down, and vice-versa.

## The contract (verified against `lib/affiliate.ts`)

The frontend (`buildDirectLink`) emits:

```
https://track.trafficschoolpicker.com/c/{partnerSlug}?s={STATE}&p={sourcePageId}
```

| part | meaning | example |
|------|---------|---------|
| `/c/{partnerSlug}` | partner slug in the **path** | `/c/idrivesafely` |
| `s` | **2-letter UPPERCASE** state code | `NY` |
| `p` | Notion source-page id (UUID) — logged, **not** the state | `1a2b…` |
| `src` | reserved paid-vs-organic flag (frontend does not send yet) | — |

Map lookup key: **`{slug}:{STATE}`**, falling back to **`{slug}:_default`**.

> Two frontend prerequisites for clicks to actually arrive here:
> 1. `NEXT_PUBLIC_TRACKER_HOST=https://track.trafficschoolpicker.com` set in Vercel
>    (Production) — otherwise the frontend silently uses the bare network URL.
> 2. The school's Notion row has `Tracking Method = direct` and `Partner Slug` set.

## The offer map

`seed/map.json` is the source of truth for seeding. Each entry:

```json
{ "key": "idrivesafely:NY", "value": "https://go.idrivesafely.com/aff_c?offer_id=25&aff_id=6858" }
```

- `key` = `{partnerSlug}:{STATE}` (state UPPERCASE) or `{partnerSlug}:_default`.
- `value` = the destination offer URL. The Worker appends `aff_sub=tsp-{STATE}`,
  `aff_sub3={clickId}`, and (when present) `aff_sub2={src}` — it does **not** touch
  the offer's own `offer_id` / `aff_id`.

**Add a school/state — one line, no redeploy:**

```bash
wrangler kv key put --binding=MAP "idrivesafely:TX" \
  "https://go.idrivesafely.com/aff_c?offer_id=30&aff_id=6858" --remote
```

Or edit `seed/map.json` and re-run `npm run seed` (bulk upsert).

> **`--remote` is required.** Wrangler 4.x defaults every `kv` command to a
> LOCAL miniflare store; without `--remote` you edit nothing in production and it
> still prints `Success!`. `npm run seed` now includes `--remote`; use
> `npm run seed:local` for local `wrangler dev`.

## First-time deploy

```bash
cd tracker
npm install
wrangler login                              # one-time, opens browser

# 1. Create the two KV namespaces, paste the printed ids into wrangler.toml
wrangler kv namespace create MAP
wrangler kv namespace create CLICKS

# 2. Seed the offer map
npm run seed                                # = wrangler kv bulk put --binding=MAP seed/map.json

# 3. Add the DNS record (Cloudflare dashboard → DNS):
#    Type CNAME (or A), Name "track", Target any placeholder (e.g. the apex or
#    192.0.2.1), Proxy status PROXIED (orange cloud). The route in wrangler.toml
#    binds the Worker in front of it.

# 4. Deploy
npm run deploy                              # = wrangler deploy
```

## Bots

`src/classify.ts` decides, per `/c/` request, whether it goes on to the offer.
Bots get a `204` with no `Location`, are logged under `bot:` (90-day TTL) with a
`reason`, and never reach the network or the school.

| Rule (first match wins) | Result |
|---|---|
| `Referer` is the tracker's own host | blocked (`tracker-referrer`) |
| Assistant fetching for a person (`ChatGPT-User`, `Perplexity-User`, `Claude-User`, `MistralAI-User`) | redirected, `class: ai-user` |
| Search-engine crawler (Googlebot, bingbot, Applebot, DuckDuckBot…) | redirected, `class: search-crawler` |
| Declared crawler, scraper or HTTP library (`…bot/1.0`, `meta-externalagent`, `curl`, `python-requests`, `HeadlessChrome`…) | blocked (`declared-bot`) |
| Known spoofed browser string (iPhone iOS 13_2_3 + Safari 13.0.3) | blocked (`spoofed-ua`) |
| Anything else | redirected, `class: browser` |

Search engines are deliberately redirected like people: they must see what
people see. Keep them off `/c/` with robots.txt, not with a different response.

Tests (no deploy, no network), from the repo root:

```bash
npx tsx tracker/test/bot-filter.ts   # every state offer: people land on the exact offer URL, bots get 204
npx tsx tracker/test/smoke.ts        # original map/fallback behaviour
```

## Acceptance tests

`curl`'s own user agent is a bot to the tracker (it gets a `204`), so send a
browser user agent when checking the redirect by hand.

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"

# Mapped NY → offer 25
curl -sI -A "$UA" "https://track.trafficschoolpicker.com/c/idrivesafely?s=NY&p=demo" | grep -i location
#   location: https://go.idrivesafely.com/aff_c?offer_id=25&aff_id=6858&aff_sub=tsp-NY&aff_sub3=...

# Mapped GA → offer 21
curl -sI -A "$UA" "https://track.trafficschoolpicker.com/c/idrivesafely?s=GA&p=demo" | grep -i location

# Unmapped state → partner default, logged as a miss (mapped=false)
curl -sI -A "$UA" "https://track.trafficschoolpicker.com/c/idrivesafely?s=ZZ&p=demo" | grep -i location

# Every redirect must be 302 + no-store
curl -sI -A "$UA" "https://track.trafficschoolpicker.com/c/idrivesafely?s=NY" | grep -iE "HTTP/|cache-control"

# A bot gets 204, no location
curl -sI "https://track.trafficschoolpicker.com/c/idrivesafely?s=NY" | grep -iE "HTTP/|location"
```

## Reading the click log

```bash
wrangler kv key list --binding=CLICKS --prefix "click:" | head
wrangler kv key get  --binding=CLICKS "click:<paste-a-key>"
```

Each record: `{ clickId, ts, slug, state, sourcePageId, destination, mapped,
fellBackToSite, referrer, ua, country, class }`. `mapped:false` rows are state coverage
gaps to fill; `fellBackToSite:true` rows are partners with no map entry at all.
`class` is `browser`, `ai-user` or `search-crawler` (records before Nov 2026 have none).

Blocked bots: `wrangler kv key list --binding=CLICKS --prefix "bot:" --remote`. Each
record: `{ ts, slug, state, sourcePageId, source, reason, method, referrer, ua, country }`.

> KV is fine for launch volume. If you later want SQL queries over clicks
> (top states, conversion joins), swap `CLICKS` for a **D1** table — the Worker
> change is a one-line `INSERT` in place of the `KV.put`. Out of scope for now.
