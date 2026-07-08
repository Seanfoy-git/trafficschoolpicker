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
  "https://go.idrivesafely.com/aff_c?offer_id=30&aff_id=6858"
```

Or edit `seed/map.json` and re-run `npm run seed` (bulk upsert).

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

## Acceptance tests

```bash
# Mapped NY → offer 25
curl -sI "https://track.trafficschoolpicker.com/c/idrivesafely?s=NY&p=demo" | grep -i location
#   location: https://go.idrivesafely.com/aff_c?offer_id=25&aff_id=6858&aff_sub=tsp-NY&aff_sub3=...

# Mapped GA → offer 21
curl -sI "https://track.trafficschoolpicker.com/c/idrivesafely?s=GA&p=demo" | grep -i location

# Unmapped TX → partner default (offer 19), logged as a miss (mapped=false)
curl -sI "https://track.trafficschoolpicker.com/c/idrivesafely?s=TX&p=demo" | grep -i location

# Every response must be 302 + no-store
curl -sI "https://track.trafficschoolpicker.com/c/idrivesafely?s=NY" | grep -iE "HTTP/|cache-control"
```

## Reading the click log

```bash
wrangler kv key list --binding=CLICKS --prefix "click:" | head
wrangler kv key get  --binding=CLICKS "click:<paste-a-key>"
```

Each record: `{ clickId, ts, slug, state, sourcePageId, destination, mapped,
fellBackToSite, referrer, ua, country }`. `mapped:false` rows are state coverage
gaps to fill; `fellBackToSite:true` rows are partners with no map entry at all.

> KV is fine for launch volume. If you later want SQL queries over clicks
> (top states, conversion joins), swap `CLICKS` for a **D1** table — the Worker
> change is a one-line `INSERT` in place of the `KV.put`. Out of scope for now.
