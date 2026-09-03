# Crawl-paths package — findings (Sep 2026)

Branch: `feat/crawl-paths` (renumbered off the P15/P16 collision, scope unchanged).

## Headline

**Linking is not the constraint. The crawl paths already exist as server-rendered
`<a href>` anchors, and every one of the package's link requirements already passed
in production before this package started.** The mechanical proof: a BFS crawl-path
guard reaches **all 142 sitemap URLs from `/` in ≤ 2 clicks, zero orphans.**

This is the outcome the brief named as "the single most useful finding this package
can produce": it means the 83 "Discovered – currently not indexed" URLs are a **crawl
budget / off-site authority** problem, not a routing bug. The outreach lane is the
lever. Linking changes will not move it, because the links are already there.

Two durable guards were still built (they didn't exist and are the package's lasting
value): a **sitemap-200 guard** and the **crawl-path BFS guard**. Both are wired into
`postbuild` and fail the deploy. One real gap was closed: the homepage had no blog
links (now has a "From our blog" section).

---

## Task 1 — Florida 404 + sitemap-200 guard

### 1a. Root cause — already resolved in production

`https://www.trafficschoolpicker.com/florida/how-long-does-traffic-school-take`
**returns 200 in production now.** So do all nine siblings, and so do all 142 sitemap
URLs (full sweep, Googlebot UA, zero non-200s).

Root cause of the original 404: the topic route (`app/[state]/[question]/page.tsx`)
uses `dynamicParams = false` with `generateStaticParams()` fed by `getQuestionPages()`
(Content Status = Complete rows). The page then **fail-closes to `notFound()`** at
build time if `getQuestionPage()` returns null (zero matches OR a duplicate — it
requires exactly one) or if the body is empty (`keyFacts.length === 0 &&
body.length === 0`). Either is a **data condition**, not a code bug:

- The sitemap's question URLs come from the *same* `getQuestionPages()`, so a row can
  be Complete-enough to enter the sitemap while still resolving to a build-time 404 —
  a URL in the sitemap serving a 404. That is exactly what shipped.
- Live data today is healthy: the Florida row is a single Complete match with a
  populated body (keyFacts=3, body=4, sources=1), no duplicates across all 60 Complete
  rows. A deploy since the GSC snapshot picked up the corrected data.

**Siblings one edit from the same break:** yes — structurally. Any Question Pages row
flipped to Content Status = Complete before its body is written, or duplicated, will
sitemap-enter and 404 the same way. That class of failure is what the new guard
catches deterministically.

### 1b. Sitemap-200 guard — `scripts/verify-sitemap-200.ts`

Postbuild, no network. Reads the generated `sitemap.xml.body`, maps each `<loc>` to
its prerender artifact under `.next/server/app`, and **fails the build** if the `.html`
is missing or the `.meta` sidecar carries `status >= 400` (a build-time `notFound()`
writes `"status": 404` into that `.meta` — the exact Florida soft-404 signal).

- Real sitemap: `✅ all 142 sitemap URLs prerendered 200` (exit 0).
- Planted bad URL: `❌ MISSING … route would 404` (exit 1). Verified both directions.

Wired into `package.json` `postbuild` beside the leak and contradiction guards.

---

## Task 2 — Nav crawl-path diagnosis (raw HTML, Googlebot UA, no JS)

The working hypothesis (links not present as server-rendered anchors) is **killed by
direct evidence.** All six answers:

| # | Question | Answer |
|---|---|---|
| 1 | `/schools` & `/reviews` as server-rendered `<a href>` on indexed pages? | **Yes.** Present in raw HTML on `/`, `/california`, `/texas` — 2× each (header + footer). |
| 2 | Any `rel="nofollow"`? | **No.** Zero nofollow into `/reviews` or `/schools` (checked `/california`). |
| 3 | `<a>` elements, or buttons/divs? | **Real `<a>` elements.** No button/div click-handler nav for these. |
| 4 | `robots.txt` disallow `/reviews`, `/schools`, `/blog`? | **No.** Only `/api/` and `/_next/` are disallowed. |
| 5 | Ten review pages as anchors on `/reviews`, raw HTML? | **Yes, all ten** (each linked 2×, count 20). |
| 6 | Topic pages as anchors on their state hub, raw HTML? | **Yes** — all 6 per state, anchor text names the state ("How Long Is Traffic School in California?"). |

**Conclusion: the links were already fine.** Nothing was broken to fix in Task 2. Per
the brief, that is real information: linking is not the constraint; off-site authority
is the whole answer.

Why the pages still show "never crawled" despite good links: the topic pages and the
reviews cluster are new URLs (topic pages shipped 2026-08-25, PR #21) on a low-authority
domain. New URLs commonly sit in "Discovered – currently not indexed" for weeks; Google
allocates crawl budget by site authority, and the paths existing doesn't force a crawl.

---

## Tasks 3, 4, 5 — link surfaces (already present; one gap closed)

- **Task 3 (state hub → own topic pages):** already live. `components/StateQuestions.tsx`
  ("Common {state} traffic school questions") shipped 2026-08-25, renders server-side
  anchors to the state's Complete topic pages, descriptive state-named anchor text,
  underlined links, placed below the comparison cards. All 10 money-state hubs render
  6 topic-page anchors in raw HTML. **No change needed.**
- **Task 4 (reviews/schools):** already present. `/reviews` linked from home + every
  state page (nav, 2×); all ten review pages are anchors on `/reviews`; `/schools`
  reachable from home; **reciprocal** links from each review page back to `/reviews`
  (2×) and `/schools` (2×) already exist. No nofollow. **No change needed.**
- **Task 5 (blog):** `/blog` already links all 11 posts as raw-HTML anchors, and
  state pages already carry contextual posts (e.g. `/texas` → `/blog/texas-deferred-
  disposition`). **The one real gap:** the homepage had **zero** blog links. Closed by
  adding a server-rendered "From our blog" section (`app/page.tsx`) linking two
  decision-stage posts named in the brief (`traffic-school-vs-paying-ticket`,
  `how-to-dismiss-traffic-ticket-online`) plus the best-of roundup, sourced from MDX
  frontmatter (no hardcoded titles). This moves those posts from depth 2 to depth 1.

No other links were manufactured — the brief forbids inventing links to justify a
task, and the paths already satisfy every acceptance criterion.

---

## Task 6 — the one crawled-and-rejected page

`/texas/how-long-does-traffic-school-take` (crawled Aug 29, not indexed) vs indexed
sibling `/texas/how-much-does-traffic-school-cost`, same template:

| Signal | how-long (rejected) | how-much (indexed) |
|---|---|---|
| Canonical | self-referential ✓ | self-referential ✓ |
| Meta description | unique ✓ | unique ✓ |
| Article JSON-LD | present + valid ✓ | present + valid ✓ |
| BreadcrumbList JSON-LD | present + valid ✓ | present + valid ✓ |
| FAQPage JSON-LD | none (no Q&A section) | none |
| Rendered word count | **668** | **890** |

**No technical defect** — canonical, meta, and structured data are correct and identical
in kind to the indexed sibling, so there is nothing for this package to fix (the brief
scopes canonical/JSON-LD fixes here; none are needed). The only meaningful difference is
**content thinness**: the rejected page is the shortest in its cluster (668 words), and
its topic ("how long") carries the least state-specific substance in Texas (a single
6-hour statutory fact), so it reads as the most boilerplate-heavy. That is a content
judgment for the content owners (P8/P14), reported not rewritten per the brief.

---

## Task 7 — crawl-path guard — `scripts/verify-crawl-paths.ts`

Postbuild, no network. BFS from `/` over server-rendered `<a href>` anchors in the
prerendered HTML; compares reachable set to the sitemap set; prints click-depth for
every URL; flags depth > 3; **fails the build on any orphan.**

Current build result:

```
Reachable 142/142 | depth histogram: d0:1 d1:62 d2:79
✅ crawl-path guard OK — all 142 sitemap URLs reachable from / (≤ 3 clicks: 142)
```

- **Zero orphans.** The reviews cluster, `/schools`, blog posts, and all 38 topic
  pages are reachable. Nothing sits deeper than **2 clicks** from the homepage.
- Depth 1 (62): all state hubs, `/reviews`, `/schools`, `/blog`, legal, three review
  pages linked from home.
- Depth 2 (79): topic pages, blog posts, most review pages, out-of-state-ticket.
- Planted-orphan test (a sitemap URL with an artifact but no inbound anchor):
  `❌ ORPHAN` → exit 1. Verified.

This is the guard that would have caught the reviews cluster shipping orphaned, had it
ever been orphaned — and it confirms, mechanically, that it is not now.

---

## Invariants

- New prose ("From our blog", "Read all articles"): zero em dashes, descriptive
  accessible names, `/blog` in-text link underlined. Heading order valid (h2 → h3),
  one `<main>` (layout), no `<aside>`.
- Card order, badges, FTC disclosure position untouched (no card/offer code changed).
- Full 142-page axe sweep + guard status: see the deploy section of the report.

## Files changed

- `scripts/verify-sitemap-200.ts` (new) — sitemap-200 postbuild guard.
- `scripts/verify-crawl-paths.ts` (new) — crawl-path BFS postbuild guard.
- `package.json` — both guards wired into `postbuild`.
- `app/page.tsx` — homepage "From our blog" section (the one link gap).

No Notion fields changed. No content, facts, tracker offers, card order, or sitemap URL
set changed (page count holds at 142).
