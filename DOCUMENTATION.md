# trafficschoolpicker.com — System Documentation

> **Last updated**: 2026-05-01
> **Live site**: https://www.trafficschoolpicker.com
> **Repo**: https://github.com/Seanfoy-git/trafficschoolpicker

This is the comprehensive reference for the codebase, data model, content
pipeline, and operational practices behind trafficschoolpicker.com. It covers
*how* the system works **and the design decisions behind it** — both are
important when deciding how to extend or modify it.

---

## Table of Contents

1. [What this site is](#1-what-this-site-is)
2. [Tech stack](#2-tech-stack)
3. [Repository structure](#3-repository-structure)
4. [Data architecture — the eight Notion databases](#4-data-architecture--the-eight-notion-databases)
5. [Three-layer state-aware rendering](#5-three-layer-state-aware-rendering)
6. [The affiliate gate and tracking method system](#6-the-affiliate-gate-and-tracking-method-system)
7. [Frontend pages and routing](#7-frontend-pages-and-routing)
8. [Components reference](#8-components-reference)
9. [The scraping pipeline](#9-the-scraping-pipeline)
10. [Multi-source review aggregation](#10-multi-source-review-aggregation)
11. [Bayesian normalized rating](#11-bayesian-normalized-rating)
12. [AI editorial generation](#12-ai-editorial-generation)
13. [Video embeds](#13-video-embeds)
14. [SEO and AI discoverability](#14-seo-and-ai-discoverability)
15. [Build and deploy](#15-build-and-deploy)
16. [GitHub Actions monthly refresh](#16-github-actions-monthly-refresh)
17. [Environment variables](#17-environment-variables)
18. [Maintenance playbook](#18-maintenance-playbook)
19. [Design and operating decisions](#19-design-and-operating-decisions)
20. [Known issues and future work](#20-known-issues-and-future-work)

---

## 1. What this site is

**trafficschoolpicker.com** is a comparison and affiliate review site for online
traffic schools across all 50 US states. The product is editorial: we research
each school, gather independent ratings from multiple platforms, write
state-specific pros/cons, and earn affiliate revenue when a visitor enrolls
through our links.

### Business model

- Affiliate commissions paid by traffic school operators when a referred user
  enrolls. Networks include CJ, Impact, ShareASale, and direct relationships.
- Some schools route through a **direct tracking host** (`track.trafficschoolpicker.com`)
  rather than a network — see [§6](#6-the-affiliate-gate-and-tracking-method-system).

### Target visitor

A driver who just got a ticket. They are stressed, time-pressured, and
comparison-shopping under a court deadline. The site is built around their
mental model: "what state am I in, what are my options, what's the cheapest
legitimate option, and how do I enroll?"

### Content tiers

Every school has a **Tier**:
- **Tier 1 (Featured)** — appears as a comparison card on the relevant state
  page. We have an active or in-progress affiliate relationship and editorial
  endorsement. State pages render Tier 1 only.
- **Tier 2 (Listed)** — appears in [/schools](https://www.trafficschoolpicker.com/schools)
  and on individual `/reviews/[slug]` detail pages. Not surfaced on state
  comparison grids. Still subject to the affiliate gate (must have a monetizable
  network field).

A school that fails the affiliate gate (Network = Unknown or empty) is not
rendered anywhere on the site.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.2.2 App Router | ISR with 24h revalidation on most pages |
| Language | TypeScript (strict) | All app, lib, and scripts code |
| Styling | Tailwind CSS v4 | Custom design tokens via `globals.css` |
| Hosting | Vercel | Auto-deploy on push to `main` |
| CMS | Notion API v2 (`@notionhq/client@^2.3.0`) | 8 databases (see §4) |
| Editorial AI | Claude Sonnet 4.6 (`@anthropic-ai/sdk`) | Per-school×state variant generation |
| Scraping | Playwright | Headless Chromium for DMV/review/price scrapes |
| PDF parsing | `pdf-parse@1.1.1` | OK / MN / WY / RI directory PDFs |
| Google Places | Places API (New) | School website enrichment + ratings |
| App store data | iTunes Lookup API + `google-play-scraper` | Mobile app ratings |
| Blog | MDX via `@next/mdx` | 9 long-form posts in `content/blog/` |
| Analytics | Google Tag (gtag.js, `AW-18090793804`) | Loaded `afterInteractive` from layout |
| Verification | Impact site verification meta tag | For Impact affiliate network |

### Why Next.js 16 + ISR

Each state page is heavy to render (multiple parallel Notion queries, state
variants, reviews, FAQs, directory). Server-render at build time + revalidate
every 24h gives instant page loads and fresh data without per-request latency.

### Why Notion as CMS

Sean (editorial owner) maintains content directly in Notion. The alternative
was Postgres + an admin panel, which is meaningfully more code for a one-person
editorial team. The tradeoff: Notion API is slow (~500ms per query) so we batch
fetches in `Promise.all` and cache via ISR, and joins happen in application
code rather than SQL.

---

## 3. Repository structure

```
.
├── app/                          # Next.js App Router pages
│   ├── [state]/page.tsx          # Dynamic state page (50 routes)
│   ├── reviews/[school-slug]/    # School detail pages
│   ├── blog/[slug]/              # MDX blog posts
│   ├── schools/page.tsx          # Full schools directory
│   ├── about/page.tsx            # Methodology page
│   ├── admin/page.tsx            # Internal admin dashboard
│   ├── api/                      # Click tracking, deploy hook
│   ├── layout.tsx                # Root layout with Header/Footer/gtag
│   ├── page.tsx                  # Homepage
│   ├── sitemap.ts                # Generated XML sitemap
│   └── robots.ts                 # robots.txt
│
├── components/                   # React components (server + client)
│   ├── SchoolCard.tsx            # Tier 1 comparison card
│   ├── SchoolsDirectoryTable.tsx # /schools sortable table (client)
│   ├── AffiliateButton.tsx       # CTA, uses buildAffiliateLink
│   ├── CouponCode.tsx            # Coupon-code chip with copy-to-clipboard
│   ├── MultiRating.tsx           # Multi-platform rating badges + ReviewSynthesis
│   ├── DirectoryTable.tsx        # DMV-scraped school listing per state
│   ├── FaqSection.tsx            # FAQ accordion (also emits JSON-LD)
│   ├── BlogMdxComponents.tsx     # MDX renderer overrides
│   ├── ComparisonTable.tsx, RatingStars.tsx, Badge.tsx, etc.
│   ├── StateSelector.tsx         # Header dropdown
│   ├── TrustBar.tsx              # "Trusted by" bar under heroes
│   ├── Header.tsx, Footer.tsx
│
├── lib/
│   ├── notion.ts                 # Single data layer for all Notion DBs
│   ├── types.ts                  # All TypeScript types
│   ├── affiliate.ts              # buildAffiliateLink (tracking method branches)
│   ├── seo-config.ts             # Per-page SEO metadata (50 states + 9 posts)
│   ├── state-utils.ts            # Slug / code / name utilities
│   ├── state-faqs.ts             # Static fallback FAQs per state
│   ├── notion-faqs.ts            # Notion FAQ DB query
│   └── blog.ts                   # MDX frontmatter reader
│
├── content/
│   └── blog/*.mdx                # 9 blog posts with MDX + QuickAnswer
│
├── scripts/
│   ├── lib/                      # Shared scraper utils + issue tracking
│   ├── scrape-*.ts               # 10 DMV scrapers (per-state + generic)
│   ├── scrape-pdf-states.ts      # PDF parsers for OK/MN/WY/RI
│   ├── scrape-reviews.ts         # Multi-source review aggregator
│   ├── scrape-prices.ts          # Per-school×state price scraping
│   ├── enrich-places.ts          # Google Places enrichment
│   ├── generate-state-variants.ts # Claude editorial generation
│   ├── populate-state-requirements.ts # Seed State Requirements DB
│   ├── seed-safe2drive-ca.ts     # Locked variant seed
│   ├── normalize-ratings.py      # Bayesian normalized rating
│   ├── generate-llms-full.ts     # Auto-generates llms-full.txt
│   ├── compare-and-diff.ts       # Diff helper
│   └── config/                   # State source registry + price source config
│
├── public/
│   ├── flags/*.png               # 50 US state flags
│   ├── icon.svg, logo.svg
│   ├── llms.txt                  # AI discoverability (manual)
│   └── llms-full.txt             # Auto-generated from Notion FAQs
│
├── .github/workflows/
│   └── monthly-update.yml        # Monthly scrape + redeploy
│
├── DOCUMENTATION.md              # This file
├── README.md, AGENTS.md, CLAUDE.md
├── package.json
├── tsconfig.json
├── next.config.ts
└── .env.local.example
```

---

## 4. Data architecture — the eight Notion databases

The site has **eight Notion databases**, each with a clear single
responsibility. Database IDs are stored in env vars; the frontend reads
them at module-init time (see [lib/notion.ts](lib/notion.ts)).

### 4.1 Traffic Schools DB
Env: `NOTION_SCHOOLS_DB`

The editorial spine. One row per school we review.

Key fields:
- **School Name** (title)
- **Slug** (rich text) — URL identifier, e.g. `safe2drive`
- **Tier** (select) — `1 - Featured` or `2 - Listed`
- **Badge** (select) — `Top Rated`, `Editors Choice`, `Best Value`, `Fastest`, `Budget Pick`
- **State Codes** (rich text) — comma-separated, or `all`. Empty = no state coverage.
- **Show On Site** (checkbox) — manual kill switch
- **Status** (select) — `Active` etc.
- **Affiliate Network** (select) — `CJ`, `Impact`, `ShareASale`, `Direct`, `Pending`, `Unknown`. Used by the affiliate gate.
- **Affiliate URL** (URL) — network deep link
- **Tracking Method** (select) — `network` (default), `direct`, or `coupon_code`. Routes outbound links via `buildAffiliateLink`.
- **Partner Slug** (rich text) — used when Tracking Method = `direct`
- **Coupon Code** (rich text) — used when Tracking Method = `coupon_code`
- **Pros**, **Cons**, **Pros CA**, **Cons GA**, ... — pipe- or newline-delimited
- **Best For**, **Not For**, **One Liner** — editorial copy
- **Rating**, **Review Count**, **Review Source** — aggregated
- **Trustpilot/Google/App Store/Play Store** rating columns + trends + previous ratings
- **BBB Grade**, **BBB URL**
- **Review Highlights Good**, **Review Highlights Bad** — synthesized via Claude
- **Mobile App**, **Money Back Guarantee**, **Certificate Delivery**, **Court Acceptance**, **Completion Time (hrs)**, **Founded**
- **Price** — generic fallback. Per-state columns: `Price CA`, `Price TX`, `Price FL`, `Price NY`, `Price AZ`, `Price OH`, `Price VA`, `Price NJ`, `Price MI`, `Price WA`, `Price NC`
- **Last Verified** (date)
- **Normalized Rating** (number) — Bayesian-corrected score for ranking

Volume: 12-20 schools (curated).

### 4.2 School Pricing DB
Env: `NOTION_PRICING_DB`

Per-school × per-state pricing rows. One row per (school, state) combination
where price differs from the global default. Each row has:
- **Label** (title) — e.g. `safe2drive-CA`
- **School** (relation → Traffic Schools DB)
- **State Code** (rich text)
- **Price**, **Original Price** (numbers)
- **Affiliate URL** (state-specific override of network URL)
- **Price Note** (e.g. "$24.95 with code")
- **Approved** (checkbox) — gate

The price waterfall in the resolver is:
`variant.priceOverride → pricing DB → school.statePrices[STATE] → school.genericPrice → null`

### 4.3 School Directory DB
Env: `NOTION_DIRECTORY_DB`

DMV-scraped third-party schools (not curated; used for the directory tables on
state pages and for trust signals like "from 200+ approved schools"). One row
per school-state combination. Populated by the DMV scrapers monthly.

Fields: School Name, License Number, Phone, Address, Website, Online Available,
Source, State, Date Scraped.

Volume: ~2,200 schools across 22 states.

### 4.4 States DB
Env: `NOTION_STATES_DB`

One row per state (25 covered, expanding). Holds operational facts:
- **State Name**, **Abbreviation**
- **Online Allowed**, **Online Dismisses Ticket**, **Insurance Discount Available** — three checkboxes that combine into the rendered `OnlineStatus`
- **Eligibility Requirements**, **Court Acceptance Notes**, **Certificate Submission**, **Minimum Hours**
- **DMV URL**, **Research Notes**, **Fun Fact**

Used for the "State Rules & Requirements" section on each state page.

### 4.5 State Requirements DB
Env: `NOTION_STATE_REQUIREMENTS_DB`

Regulatory facts per state, separate from the operational States DB.
**Authoritative for variant generation** — the AI reads from here to know what
the official course term is, whether there's an exam, etc.

Fields: Official Term, Approval Body, Approval Body Short, Mandated Hours, Has
Final Exam, Exam Is Open Book, Exam Attempts Allowed, Has Lesson Timers, Ticket
Outcome, Ticket Outcome Note, Eligibility Window Months, Certificate Delivery,
Court Fee Required, Court Fee Note, DMV License Required, License Format,
Terminology Notes, Source URL, Last Verified.

Currently populated for 11 states (CA, TX, FL, AZ, OH, VA, NY, NC, NJ, WA, MI).

### 4.6 School State Variants DB
Env: `NOTION_SCHOOL_VARIANTS_DB`

Per-school × per-state editorial overrides. AI-generated by
[scripts/generate-state-variants.ts](scripts/generate-state-variants.ts), human-lockable.

Each row has a `Name` field that is the lookup key: `{slug}:{STATE}` — e.g.
`safe2drive:CA`, `idrivesafely:TX`.

Fields: School Slug, State Code, Generation Status (`Generated` | `Locked` |
`Needs Review`), Lock Reason, One Liner, Pros (pipe-delimited), Cons
(pipe-delimited), Best For, Not For, Price Override, Has Final Exam Override,
Generation Notes, Last Generated.

**Critical rule**: `Locked` rows are sacred. The generator will never overwrite
a Locked row; it logs and skips. This lets a human verify a card and trust it
will remain stable.

Volume: 98 variants (10 schools × 11 states, plus the seeded `safe2drive:CA`
locked row).

### 4.7 State FAQs DB
Env: `NOTION_FAQ_DB_ID`

Per-state FAQ content with a Status (`Verified` is required for rendering).
~250 verified facts across 50 states. Surfaces on each state page in the FAQ
section, also feeds `public/llms-full.txt`.

### 4.8 Issues DB
Env: `NOTION_ISSUES_DB` (optional)

Scraper failure tracking. The scraping infrastructure logs to this DB instead
of failing silently or breaking the build. Each issue has Title, Source,
Severity, School relation, Details, Occurrences, First Seen, Last Seen.
Recurring issues bump Occurrences rather than creating duplicates.

### Data flow summary

```
                    ┌──────────────────────┐
                    │  Traffic Schools DB  │ ← editorial baseline
                    │  (12-20 schools)     │
                    └──────────┬───────────┘
                               │
    ┌──────────────────┬───────┴────────┬────────────────────┐
    │                  │                │                    │
┌───▼─────┐    ┌───────▼──────┐  ┌──────▼──────┐   ┌────────▼────────┐
│ Pricing │    │ State Reqs   │  │ Variants    │   │ State FAQs      │
│ DB      │    │ DB           │  │ DB          │   │ DB              │
└─────────┘    └──────────────┘  └─────────────┘   └─────────────────┘
                                       │
                                       ▼
                          resolveStateContent() [lib/notion.ts]
                          ↓
                          SchoolCard renders ResolvedSchoolContent
```

---

## 5. Three-layer state-aware rendering

The single most important design pattern in this codebase.

### The problem

Traffic school is a state-regulated product. The same school operates
differently across states — different prices, different course structures,
different regulatory bodies, different correct terminology. Rendering a single
school record verbatim on every state page produces factually wrong claims
("no final exam" might be true in AZ but false in CA for the same school).

### The solution — a resolution waterfall

For every render of a school card on a state page, three data sources are
combined into a single `ResolvedSchoolContent` object:

```
                                   resolveStateContent(school, stateCode, ...)
                                          │
              ┌───────────────────────────┼──────────────────────────┐
              ▼                           ▼                          ▼
    School State Variant          Traffic Schools DB         State Requirements DB
    (per school × state)          (school defaults)          (regulatory facts)

    EDITORIAL fields:             Fallback for editorial      STRUCTURAL facts:
    - oneLiner                    fields if variant blank.    - officialTerm
    - pros / cons (pipe)                                      - approvalBody
    - bestFor / notFor                                        - mandatedHours
    - priceOverride                                           - hasFinalExam
    - hasFinalExamOverride                                    - examAttemptsAllowed
                                                              - examIsOpenBook
                                                              - hasLessonTimers
                                                              - ticketOutcome
                                                              - ticketOutcomeNote
                                                              - eligibilityWindowMonths
                                                              - courtFeeRequired
                                                              - courtFeeNote
```

### Resolution rules (`lib/notion.ts:resolveStateContent`)

#### Editorial fields
```
variant?.<field>  →  school.<field>  →  null
```
A blank variant field falls back to the school default. If both are blank,
the field is null and the component renders nothing.

#### Price waterfall
```
variant.priceOverride
  →  school.statePrices[stateCode]    (Price CA, Price TX, ... columns)
  →  (school as SchoolWithPrice).price (from Pricing DB, joined separately)
  →  school.genericPrice               (Traffic Schools DB "Price" field)
  →  null  →  rendered as "Check website"
```

#### `hasFinalExam`
```
variant.hasFinalExamOverride === 'Yes'  →  true
variant.hasFinalExamOverride === 'No'   →  false
otherwise                               →  state.hasFinalExam
default                                 →  true (conservative — never falsely promise no exam)
```

#### Structural facts
Only flow from State Requirements. There is no per-variant override path
(except `hasFinalExam`) because these describe state law, not school behaviour.
If a school genuinely differs from the state norm, add a new override field to
the Variants schema rather than hardcoding in components.

#### Defaults when State Requirements is missing
| Field | Default |
|---|---|
| officialTerm | `'Traffic School'` |
| approvalBody / approvalBodyShort | `'State Approved'` |
| mandatedHours | school's `completionHours`, or null |
| hasFinalExam | `true` |
| examIsOpenBook | `false` |
| hasLessonTimers | `false` |
| ticketOutcome | `'Varies'` |
| ticketOutcomeNote | `null` |
| courtFeeRequired | `false` |
| courtFeeNote | `null` |

### Homepage and `/schools` resolution

The homepage and `/schools` directory pages call `resolveStateContent` with
`stateCode = null`. In that path, the variant lookup is skipped, all editorial
falls back to school defaults, and structural facts use the hardcoded defaults
above. This avoids any state-specific claim leaking into a non-state context.

### The `null`-handling guarantee

`resolveStateContent` never throws. All map lookups are optional-chained, all
fallbacks are explicit. Components can safely access any `resolved.*` field
without guarding.

### Component contract

[components/SchoolCard.tsx](components/SchoolCard.tsx) reads exclusively from
`resolved.*` for editorial, regulatory, and price fields. It never reads
`school.tagline`, `school.pros`, `school.price` directly. This is enforced by
the type signature: `SchoolCard` requires a `resolved: ResolvedSchoolContent`
prop. Add new state-aware fields by:

1. Add to `ResolvedSchoolContent` interface in [lib/types.ts](lib/types.ts)
2. Populate in `resolveStateContent`
3. Source from a database (variant, school, or state requirement) or hardcode default
4. Read from `resolved` in the component

---

## 6. The affiliate gate and tracking method system

Two-layer gating system that controls *which* schools render and *how* their
outbound links are built.

### Layer 1: Affiliate gate (`getAllSchools` in `lib/notion.ts`)

A school surfaces on the site only if **both** conditions hold:

```typescript
function isEligibleToShow(school: School): boolean {
  if (!school.showOnSite) return false;
  if (!MONETIZABLE_NETWORKS.includes(school.affiliateNetwork ?? "")) return false;
  return true;
}
```

`MONETIZABLE_NETWORKS = ['CJ', 'Impact', 'ShareASale', 'Direct', 'Pending']`

`Pending` is included so we can list a school whose paperwork is mid-flight.
`Unknown` and `null` are blocked — no relationship, no listing.

**Adding a new network**: update `MONETIZABLE_NETWORKS` in `lib/notion.ts` AND
add the option to the Notion `Affiliate Network` select. Both steps are
required — a network in Notion but not the array silently blocks those schools.

### Layer 2: Tracking method (link routing)

Implemented in [lib/affiliate.ts](lib/affiliate.ts) as `buildAffiliateLink`.
Three branches:

#### `network` (default, null-treated)
Pass through `affiliateProgram.networkUrl` unchanged. Falls back to
`destinationUrl` if missing, then to `#`. Always logs warnings on fallback.
This is what every school does today.

#### `direct`
Build a tracker URL:
```
{NEXT_PUBLIC_TRACKER_HOST}/c/{partnerSlug}?s={stateCode}&p={sourcePageId}
```

If the env var is unset OR `partnerSlug` is missing, fail safe to network
behavior with a warning. The user-facing link **never breaks**, even if
configuration is incomplete.

#### `coupon_code`
Return `destinationUrl` (typically the school's enrollment page) plus
`couponCode` for separate display. The CouponCode component renders an
amber-accented chip with click-to-copy.

### Activation (per school, in Notion)

To switch a school to direct tracking:
1. Set `Tracking Method = direct`
2. Fill `Partner Slug` matching the slug on the tracker
3. Ensure `NEXT_PUBLIC_TRACKER_HOST` is set in Vercel

To switch to coupon-code:
1. Set `Tracking Method = coupon_code`
2. Fill `Coupon Code`
3. Leave `Affiliate URL` as the school's enrollment page

### Invariants

- `rel = "sponsored nofollow"` on every affiliate link
- `target = "_blank"` always
- `buildAffiliateLink` never throws — it runs inside render paths

---

## 7. Frontend pages and routing

| Route | File | Purpose | ISR |
|---|---|---|---|
| `/` | [app/page.tsx](app/page.tsx) | Homepage with top 3 Tier 1 schools | 24h |
| `/[state]` | [app/[state]/page.tsx](app/[state]/page.tsx) | 50 dynamic state pages | 24h |
| `/schools` | [app/schools/page.tsx](app/schools/page.tsx) | Full schools directory (sortable, filterable) | 24h |
| `/reviews/[school-slug]` | [app/reviews/[school-slug]/page.tsx](app/reviews/[school-slug]/page.tsx) | School detail / review pages | 24h |
| `/blog` | [app/blog/page.tsx](app/blog/page.tsx) | Blog index | 24h |
| `/blog/[slug]` | [app/blog/[slug]/page.tsx](app/blog/[slug]/page.tsx) | MDX blog posts (9 posts) | 24h |
| `/about` | [app/about/page.tsx](app/about/page.tsx) | Methodology + affiliate disclosure | static |
| `/admin` | [app/admin/page.tsx](app/admin/page.tsx) | Internal dashboard (env checks, school counts) | dynamic |
| `/api/click` | route handler | Click tracking endpoint | dynamic |
| `/api/admin/deploy` | route handler | Manual deploy hook trigger | dynamic |

### State page (`app/[state]/page.tsx`)

The most complex page. Flow:

1. `generateStaticParams()` returns all 50 state slugs (from `lib/state-utils.ts`)
2. `generateMetadata()` reads from `STATE_SEO` map, falls back to a generic title
3. Page fetches **6 things in parallel** (`Promise.all`):
   - Schools with state-specific pricing (filtered by state code in app code)
   - State info (online status, eligibility, court notes)
   - Directory schools (DMV-scraped, per state)
   - Notion FAQs (verified entries for this state)
   - State Requirements (all states, used by resolver)
   - School State Variants (filtered by state code in Notion query)
4. Branches on `onlineStatus`:
   - **`Online — ticket dismissal`**: full Tier 1 grid + state info + FAQs + directory
   - **`Online — insurance discount only`**: amber banner + reduced grid
   - **`In-person only`**: no schools, just a "find local" CTA
   - **`Unknown`**: research-in-progress notice
5. Georgia-specific callout banner (DDS quirks)
6. Hero with state flag (desktop only — `hidden md:block`)
7. YouTube video embed if `STATE_VIDEOS[stateSlug]` is configured
8. Each school card receives `resolved` prop (computed by `resolveStateContent`)

### Schools directory (`/schools`)

Server component fetches all schools that pass the gate; client component
([components/SchoolsDirectoryTable.tsx](components/SchoolsDirectoryTable.tsx))
provides sort (name/rating/reviews/price/hours) and filter (by state, by name
search). This is the home for Tier 2 schools — they are not on state pages.

### School detail page (`/reviews/[school-slug]`)

`generateStaticParams` builds one route per school. Renders ratings,
synthesized review highlights, pros/cons (school defaults, not state-specific),
a feature comparison table against 3 competitors, and a sidebar CTA. Includes
JSON-LD `Review` schema.

### Blog

MDX with frontmatter (`title`, `description`, `date`, `published`, `category`).
Each post can use a `<QuickAnswer>` component for above-the-fold direct answers.
9 long-form posts; index page sorts by date.

---

## 8. Components reference

### Hero / state cards

| Component | Notes |
|---|---|
| `SchoolCard` | Tier 1 card. Reads from `resolved`. Renders one-liner, pros/cons, best-for, price, AffiliateButton, optional CouponCode, link to `/reviews/[slug]`. |
| `SchoolsDirectoryTable` | `/schools` table. Client. Sortable, filterable. |
| `DirectoryTable` | DMV-scraped school list per state. |
| `MultiRating` + `ReviewSynthesis` | Multi-platform rating badges (Trustpilot, Google, App Store, Play Store, BBB). Color-coded by platform. ReviewSynthesis renders the "What reviewers say" good/bad block on detail pages only. |
| `RatingStars` | Single-source fallback rating display. |
| `Badge` | Top Rated / Editors Choice / Best Value / etc. |
| `AffiliateButton` | CTA. Calls `buildAffiliateLink`. Always `target="_blank"`. `rel="sponsored nofollow"` for affiliate, `noopener noreferrer` otherwise. |
| `CouponCode` | Amber chip with click-to-copy. Renders only when `trackingMethod === 'coupon_code'`. |

### Layout / nav

| Component | Notes |
|---|---|
| `Header` | Logo, nav (All Schools / How We Rank / Blog), state selector. |
| `Footer` | Links, affiliate disclosure, copyright. |
| `TrustBar` | "Trusted by N drivers" strip under heroes. |
| `StateSelector` | Dropdown — drives the state-page navigation. |

### FAQ / blog

| Component | Notes |
|---|---|
| `FaqSection` | Accordion + JSON-LD `FAQPage` schema. |
| `SchoolFAQ` | Per-school FAQ + JSON-LD on detail pages. |
| `BlogMdxComponents` | Custom MDX renderers (headings, links, callouts). |

---

## 9. The scraping pipeline

Three categories: **directory scrapers** (DMV-approved school lists),
**review scrapers** (multi-source aggregator), and **price scrapers**
(per-school × per-state).

### 9.1 DMV directory scrapers

Each US state DMV/court site has a different format. We have **22 states
covered** as of May 2026. Scrapers fall into 4 method buckets:

| Method | Tools | States |
|---|---|---|
| Playwright (interactive) | `scripts/scrape-{ca,tx,fl,oh,ga,ny,az,va}-*.ts` | CA, TX, FL, OH, GA, NY, AZ, VA |
| Static HTML (config-driven) | `scripts/scrape-states.ts` reading `scripts/config/state-sources.ts` | NV, IL, IN, KS, MO, NE, NM, ND, SC, ... |
| PDF parsing | `scripts/scrape-pdf-states.ts` (`pdf-parse@1.1.1`) | OK, MN, WY, RI |
| Manual | (no scraper) | tail states with no machine-readable source |

**Architecture**: each scraper uses [scripts/lib/scraper-utils.ts](scripts/lib/scraper-utils.ts):
- `getExistingSchools(stateName)` — returns Map<name, pageId> for dedup
- `syncToNotion(scraped[], stateName, source, stateCode)` — upsert pattern, matches by name (case-insensitive). Returns `{created, updated}`.

Failures are logged to the **Issues DB** via `scripts/lib/issues.ts`. The
scraper continues; one site being down doesn't fail the whole pipeline.

### 9.2 Review scraper — `scripts/scrape-reviews.ts`

Multi-source aggregator (~500 lines). For each Tier 1/2 school:

1. **Trustpilot** — Playwright scrapes the review page (HTTP requests are
   blocked). Pulls rating + count.
2. **Google Places** — Places API (New). Place ID confidence is verified each
   run (Verified / Auto-matched / Wrong match). "Wrong match" Place IDs are
   ignored on read in `lib/notion.ts:buildPlatformRatings`.
3. **BBB** — HTTP fetch + parse for grade letter and URL.
4. **App Store** — iTunes Lookup API.
5. **Play Store** — `google-play-scraper` npm package.

Then **Claude Sonnet** synthesizes "Review Highlights Good" and "Review
Highlights Bad" from the raw review text.

#### Preserve-previous-score pattern

Critical invariant: the scraper **never overwrites a populated rating with
null**. If Trustpilot is down on a given run, the previous rating stays in
Notion. An issue is logged for triage. This prevents transient outages from
emptying card content.

#### Trend calculation

`Previous Rating` is updated only when a new run produces a different rating.
The select fields `Trustpilot Trend`, `Google Trend`, etc. are ↑ / ↓ / —
based on a ≥0.1 delta.

### 9.3 Price scraper — `scripts/scrape-prices.ts`

Reads [scripts/config/price-sources.ts](scripts/config/price-sources.ts) — a
list of `{schoolSlug, stateCode, method: 'dom' | 'fixed', url, selector}`.
Writes to the **School Pricing DB** keyed by `{slug}-{stateCode}`. Updates
existing rows in place via the School relation.

DriversEd.com and other JS-heavy storefronts often fail DOM scraping; those
are set with `method: 'fixed'` and updated manually.

### 9.4 Google Places enrichment — `scripts/enrich-places.ts`

For DMV-scraped schools without a website, query Places API to find their
official site. Updates the `Website` field on the Directory DB row.

### 9.5 Configuration files

- [scripts/config/state-sources.ts](scripts/config/state-sources.ts) — registry of state DMV sources, method, URL, enabled flag. Adding a new state = adding one entry.
- [scripts/config/price-sources.ts](scripts/config/price-sources.ts) — 18+ school×state price targets. Method: `dom` (live scrape) or `fixed` (hardcoded).

---

## 10. Multi-source review aggregation

Each school accumulates ratings from up to 4 platforms plus BBB. The schema
is intentionally additive: if a school has no Play Store presence, the
`Play Store Rating` field is null and the platform doesn't appear in the
`MultiRating` badge row.

### Why multiple sources

A single 4.5-star Trustpilot rating is noisier than Trustpilot + Google +
App Store agreeing on 4.7. Diversity also catches review-pumping — a school
with 4.9 on Trustpilot but 3.8 on Google is flagged by the difference.

### Display logic

[components/MultiRating.tsx](components/MultiRating.tsx) renders one chip per
platform with a brand color and a trend arrow. BBB renders as a separate
letter-grade chip with grade-based coloring (A+ green, F red).

### Google Place ID confidence system

The Google Places API can return wrong businesses (especially for schools
with generic names). Each match is human-reviewed once and tagged with a
confidence:

- `Verified` — manually confirmed correct
- `Auto-matched` — name match, not yet reviewed
- `Wrong match` — manually flagged; rating is hidden on the frontend

`buildPlatformRatings` in `lib/notion.ts` skips Google ratings when
confidence is `Wrong match`. The data stays in Notion for audit but never
renders.

---

## 11. Bayesian normalized rating

[scripts/normalize-ratings.py](scripts/normalize-ratings.py) (Python) writes a
**Normalized Rating** to each Traffic Schools row.

### The formula

```
normalized = (n × r + C × m) / (n + C)
```

Where:
- `n` = review count (highest count across platforms for that school)
- `r` = raw rating (from that platform)
- `C = 50` — prior weight
- `m = 4.0` — prior mean

### Why

A school with 5.0 stars from 8 reviews shouldn't outrank a school with 4.7
stars from 30,000 reviews. Bayesian smoothing pulls thinly-reviewed schools
toward the prior mean (4.0) until they have enough data to earn their
position.

### Operational notes

- Picks the highest-review-count source per school (typically Trustpilot or
  App Store)
- Skips schools with no review data
- 400ms delay between writes; 3-retry backoff on Notion connection resets
- Skip-if-unchanged: re-running is idempotent
- **Pagination bug history**: an earlier version was missing
  `has_more`/`next_cursor` handling and looped on the first page indefinitely.
  Fixed; never revert.

---

## 12. AI editorial generation

[scripts/generate-state-variants.ts](scripts/generate-state-variants.ts)
generates state-specific editorial copy per school × state using Claude.

### Inputs

For each (school, state) combination:
- School data from Traffic Schools DB (name, ratings, completion time, etc.)
- State Requirements DB row (regulatory facts)
- Existing variant row (if any) — for skip detection

### System prompt

Detailed instructions to:
- Only claim "no final exam" if `Has Final Exam = false` for that state
- Reference the correct approval body (CA DMV, TDLR, AZ Supreme Court, ...)
- Use state-specific terminology ("mask" for CA, "dismiss" for AZ/TX, etc.)
- Never include price in oneLiner (rendered separately)
- Pros/cons must be factually grounded; no marketing fluff

### Output format

JSON with `oneLiner`, `pros` (pipe-delimited), `cons`, `bestFor`, `notFor`,
`generationNotes`. Retried once on JSON parse failure; second failure produces
a `Needs Review` row with a parse-failed note.

### Critical rules

- **Never overwrite Locked rows**. Generation Status = `Locked` is sacred.
- **Idempotent runs**. `Generated` rows are overwritten; `Locked` rows are
  skipped silently.
- **Name format**: `{slug}:{STATE}` always (e.g. `safe2drive:CA`).
- **Rate limit**: 500ms between writes.

### Filters

- `--school <slug>` — generate only for one school
- `--state <CODE>` — generate only for one state
- `--dry-run` — preview without writing

### Volume

Currently 98 variants (10 schools × 11 states with State Requirements rows).
Adding a state's Requirements row + running the generator produces ~10 new
variants for that state.

### Editorial correction example

In April 2026 a fabricated "24-month eligibility window" claim appeared in
multiple AZ variants (the actual AZ rule is 12 months). The fix required:
1. Correcting the State Requirements DB row
2. Auditing all AZ variants for the stale phrase
3. Targeted text replacement in `Cons` and `Not For` fields
4. Token replacement in `Generation Notes` + appended correction note
5. Validation: zero occurrences of stale phrase across all 6 text fields

This pattern (audit → correct → validate) is the standard for any factual
correction.

---

## 13. Video embeds

[app/[state]/page.tsx](app/[state]/page.tsx) has a `STATE_VIDEOS` map at the
top of the file:

```typescript
const STATE_VIDEOS: Record<string, string> = {
  "texas": "jAH-kz9dhF0",
  "california": "kx_B0jgBjW4",
  "florida": "1zM7hwLvWPc",
  // ...
};
```

When a state has an entry, the page renders a 16:9 responsive iframe with
modest branding and `rel=0` (related videos restricted to the channel).
Embedded between the trust bar and Tier 1 cards for above-fold visibility.

Adding a new state video is a one-line change: paste the `youtu.be/XXXX` ID
into the map.

---

## 14. SEO and AI discoverability

### `lib/seo-config.ts`

Centralised metadata: `STATE_SEO` (50 entries), `BLOG_SEO` (9 posts),
`HOME_SEO`. Each entry has title (≤60 chars), description (≤155 chars), h1,
primaryKeyword, canonicalPath. `validateSeoConfig()` warns in dev on overlong
strings.

### Sitemap (`app/sitemap.ts`)

Generates entries for: homepage, /schools, /about, /blog, all 50 state pages,
all 9 blog posts. Priorities: home 1.0, state pages 0.9, /schools 0.9, blog
0.7-0.8, about 0.5.

### JSON-LD

- `FAQPage` on every state page (via `FAQJsonLd` component)
- `Review` on each `/reviews/[slug]` page
- `Article` on each blog post

### LLM discoverability

- `public/llms.txt` — static, hand-curated (50 states + 9 posts + 6 reviews + 12 key facts)
- `public/llms-full.txt` — auto-generated by `scripts/generate-llms-full.ts` at prebuild from Notion FAQ DB. Currently 51 entries × ~250 verified facts.

This is run by the `prebuild` npm hook so every Vercel build gets fresh content.

### Analytics

Google Tag (gtag) loaded in `app/layout.tsx` via `next/script` with
`strategy="afterInteractive"` so it doesn't block first paint. Conversion ID:
`AW-18090793804`.

---

## 15. Build and deploy

### Vercel

- Auto-deploys on push to `main`
- Production branch: `main`
- Build command: `npm run build` (which runs `prebuild` → `generate-llms` first)
- ISR pages revalidate every 86400s (24h); deploys force a rebuild

### Cloudflare DNS

- `trafficschoolpicker.com` → 301 redirect to `www.trafficschoolpicker.com`
  (canonical)
- All `<link rel="canonical">` use the `www.` form

### Build hook

[app/api/admin/deploy/route.ts](app/api/admin/deploy/route.ts) wraps the
`VERCEL_DEPLOY_HOOK` env var. Used by the GitHub Actions workflow after a
data refresh, and available as a manual trigger from `/admin`.

---

## 16. GitHub Actions monthly refresh

[.github/workflows/monthly-update.yml](.github/workflows/monthly-update.yml)

### Schedule

`0 9 1 * *` — first of every month at 09:00 UTC. Plus `workflow_dispatch`
for manual triggers.

### Steps

1. Checkout (`actions/checkout@v5`)
2. Setup Node 22 LTS (`actions/setup-node@v5`)
3. Verify required secrets are present (preflight, fails fast with clear error)
4. `npm ci`
5. `npx playwright install chromium --with-deps`
6. `npm run scrape:dmv` — runs all 10 DMV scrapers sequentially
7. `npm run scrape:reviews`
8. `npm run scrape:prices`
9. `npm run enrich:places`
10. POST to `VERCEL_DEPLOY_HOOK` to trigger redeploy

### Required secrets

`NOTION_TOKEN`, `NOTION_SCHOOLS_DB`, `NOTION_DIRECTORY_DB`, `NOTION_STATES_DB`,
`NOTION_PRICING_DB`, `NOTION_FAQ_DB_ID`, `NOTION_STATE_REQUIREMENTS_DB`,
`NOTION_SCHOOL_VARIANTS_DB`, `GOOGLE_PLACES_API_KEY`. Optional:
`NOTION_ISSUES_DB`, `VERCEL_DEPLOY_HOOK`.

---

## 17. Environment variables

Single source of truth: [.env.local.example](.env.local.example)

| Variable | Purpose | Required? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical base URL | yes |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | optional |
| `NOTION_TOKEN` | Notion integration token | yes |
| `NOTION_SCHOOLS_DB` | Traffic Schools DB ID | yes |
| `NOTION_DIRECTORY_DB` | Directory DB ID | yes |
| `NOTION_STATES_DB` | States DB ID | yes |
| `NOTION_PRICING_DB` | School Pricing DB ID | yes |
| `NOTION_FAQ_DB_ID` | State FAQs DB ID | yes |
| `NOTION_STATE_REQUIREMENTS_DB` | State Requirements DB ID | yes (else state regulatory facts default) |
| `NOTION_SCHOOL_VARIANTS_DB` | School State Variants DB ID | yes (else editorial falls back to school defaults) |
| `NOTION_ISSUES_DB` | scraper issue tracker | optional |
| `GOOGLE_PLACES_API_KEY` | Places API (New) | yes for review/enrich scripts |
| `ANTHROPIC_API_KEY` | Claude API key | yes for `generate:variants` script only |
| `NEXT_PUBLIC_TRACKER_HOST` | direct affiliate tracker base URL | optional — fallback to network URL when unset |
| `VERCEL_DEPLOY_HOOK` | Vercel build trigger URL | optional |

The Notion integration must be **connected to each database** (not just the
workspace) — Share → Connections → Traffic School. A common failure mode is
adding a DB ID to env but forgetting to share the DB with the integration; the
API returns `404 object_not_found`.

---

## 18. Maintenance playbook

### Add a new state video

Edit `STATE_VIDEOS` in [app/[state]/page.tsx](app/[state]/page.tsx). One-line
change. Commit and push. Vercel auto-deploys within ~3 minutes.

### Promote a school from Tier 2 to Tier 1

In Notion Traffic Schools row:
- Set `Tier = 1 - Featured`
- Confirm `State Codes` is non-empty (which states it serves)
- Confirm `Affiliate Network` is monetizable (`CJ`, `Impact`, `ShareASale`,
  `Direct`, or `Pending`)

State pages will show the school after the next ISR revalidation (≤24h) or a
forced redeploy.

### Demote a school (declined affiliate)

Mirror of promotion:
- `Tier = 2 - Listed`
- Clear `State Codes` if you want to remove it from state pages entirely
- Optionally update Affiliate Programs DB Status

The school remains accessible at `/reviews/[slug]` and on `/schools`. The
empty `stateCodes` array filters it out of every state grid via
`stateCodes.includes(stateCode)` returning `false`.

### Activate a direct tracking partnership

1. Add `NEXT_PUBLIC_TRACKER_HOST` to Vercel env vars
2. In Notion: `Tracking Method = direct` and fill `Partner Slug`
3. Trigger a Vercel rebuild

The school's outbound link will route through the tracker. If anything's
misconfigured (host unset, slug missing), `buildAffiliateLink` falls back to
the network URL and logs a warning. **Links never break for the user.**

### Add a coupon code deal

1. In Notion: `Tracking Method = coupon_code` and fill `Coupon Code`
2. Leave `Affiliate URL` as the school's enrollment page (used as destination)
3. The CouponCode component renders an amber chip with copy-to-clipboard

### Add a new state requirement

1. In Notion State Requirements DB, add a row with the state's regulatory
   facts. Reference: `scripts/populate-state-requirements.ts` for the seed
   format.
2. Run `npm run generate:variants -- --state CODE` to generate variants for
   schools that cover that state
3. Spot-check a few variants in Notion before deploying

### Correct a fabricated AI fact

Pattern (from the April 2026 AZ "24-month" correction):

1. Audit: query all variants for the state, search for the stale phrase across
   all text fields
2. Targeted replacement: write a script that uses both exact-pattern matching
   for known phrases and token replacement for free-form text
3. Update Generation Notes with a correction provenance note
4. Validate: re-run audit, confirm zero occurrences
5. Check codebase for any hardcoded mentions (`grep -r "24-month" content/`)

Locked variants are flagged `Needs Review` rather than overwritten.

---

## 19. Design and operating decisions

### Why Notion instead of Postgres + admin panel

Editorial workflow is one human (Sean). Notion has comments, mentions, undo,
revision history, and zero ops. A custom admin panel would have been ~3000
LOC for the CMS alone. The cost: slow queries (~500ms), no JOINs (we
application-join in TS), and integration setup friction (must connect each
DB to the integration). Net: solid trade for a small editorial team.

### Why eight Notion DBs instead of one big one

Each DB has a single responsibility. State Requirements is shared across all
schools; baking it into each school row would mean updating 20 records to
correct one fact. Pricing is per-school × per-state; folding it into the
school row would require dozens of columns and break with new states.

### Why ISR with 24h revalidation

Most content updates are batched (monthly scrapes, weekly editorial). A
24-hour ISR window gives near-instant page loads and a fresh-enough data
guarantee. Editorial changes that need to ship faster can force a rebuild via
the deploy hook.

### Why the affiliate gate is a defensive double-check

Sean controls Notion. A school could accidentally be flipped to `Show On Site
= __YES__` without an active affiliate program, exposing us to listings we
don't earn from. The `MONETIZABLE_NETWORKS` check is a programmatic
guarantee: no monetization, no listing, regardless of Notion state.

### Why Tier 2 schools moved off state pages

Originally state pages had a "More approved options" section listing Tier 2
schools. As the directory grew, this section bloated and diluted the
comparison. Moving Tier 2 to a dedicated `/schools` page (with sort and
filter) keeps state pages focused on the curated comparison and gives Tier 2
schools a permanent home — they don't disappear, they just live in a more
appropriate context.

### Why state grids only show Tier 1

Three reasons:
1. **Editorial focus**: a stressed driver with 6 cards is making a faster
   decision than one with 12. Curation > exhaustiveness.
2. **Affiliate strength**: Tier 1 schools have active relationships and
   higher commission rates. Surfacing them on state pages aligns
   monetization and editorial.
3. **Defensive against demotion accidents**: a Tier 2 school with populated
   `State Codes` (forgotten from a prior promotion) won't accidentally leak
   onto state grids.

### Why three layers (variant → school → state requirement) instead of two

Two layers (variant + school) wouldn't accommodate the structural facts
that are *purely* state-driven (approval body, mandated hours, ticket
outcome). A school's pros could correctly differ across states (Variant
covers that), but the regulatory facts shouldn't have a per-school
override path — they describe state law. Three layers cleanly separates
"editorial truth" from "regulatory truth".

### Why pipe-delimited pros/cons in variants but newline-delimited in school defaults

Historical: school defaults predate variants. Newlines worked when authors
typed pros directly. Variants are AI-generated and pipe is more compact and
JSON-friendly. `parseLines` in `lib/notion.ts` handles both: splits on
newlines first, then on pipes if a single line contains them. Either format
in either field is safe.

### Why preserve-previous-score on review scrapes

Trustpilot occasionally returns 0/0 or fails entirely. Without preservation,
the next render would show empty ratings — visually worse than slightly
stale ratings. The cost is detection: a permanently-broken source needs to
be flagged via the Issues DB, not by users seeing empty cards.

### Why Bayesian normalization instead of raw ratings for ranking

Already covered in §11. Short version: 5.0 from 8 reviews shouldn't beat 4.7
from 30,000.

### Why no automated tests

Considered. Dropped because:
- The codebase is largely composition (Notion → resolver → component) where
  unit tests of pure functions are mostly trivial assertions
- Manual verification scripts (e.g. the `verify-affiliate-links.ts` we wrote
  for the tracking-method work) cover the high-leverage logic
- A test framework adds CI complexity for a one-developer project

This decision should be revisited if the team grows or the link-building or
resolution logic becomes more complex.

### Why YouTube embeds instead of self-hosted video

YouTube embeds are free (no bandwidth), come with built-in CDN and adaptive
bitrate, and view metrics count toward the channel. The cost is the
uneliminable "Watch on YouTube" link in the corner. Self-hosting would be
~$5/mo bandwidth + worse playback quality + zero discovery upside.

### Why the deploy hook lives in `/api/admin/deploy` instead of being public

The deploy hook URL is a secret (anyone who has it can trigger builds).
Routing it through an authenticated server endpoint adds a permission gate;
in practice it's used internally and from the admin page only.

### Why three GitHub Actions secrets are optional

`NOTION_ISSUES_DB` — issue tracking is nice-to-have; if missing, scrapers
just `console.warn` instead.

`VERCEL_DEPLOY_HOOK` — if missing, the workflow finishes successfully but
the site won't redeploy until the next manual push.

`NEXT_PUBLIC_TRACKER_HOST` — direct-method schools fall back to network
URLs when unset. The site keeps working.

The pattern: optional means "missing = degraded but functional, never broken".

### Why scrapers run sequentially, not in parallel

Notion's API rate limit is ~3 req/sec sustained. Running CA + TX + FL in
parallel quickly trips the limit and produces 429 errors. Sequential keeps
us well under the ceiling and the total runtime is acceptable (~5 min for
the full DMV pass).

---

## 20. Known issues and future work

### Known issues

- **TN scraper**: `ERR_CONNECTION_RESET` from the state site intermittently.
  Previous data preserved; transient.
- **UT scraper**: times out. Needs investigation.
- **VA scraper pagination**: only fetches first page (10 clinics). Selector
  needs fixing.
- **IL**: blocked by Akamai WAF. Would need a residential proxy or manual
  curation.
- **ID and NC PDF URLs**: 404 — need alternative sources.
- **DriversEd.com price scraping**: JS-heavy storefront. All states fail. Set
  to `method: 'fixed'` and updated manually.
- **RI PDF parser**: only extracts 1 school. Regex needs improvement.
- **Aceable FL** and **TicketSchool CA** price scraping: both fail; manual
  fallback in place.

### Future work

- **Build the direct tracker** (`track.trafficschoolpicker.com`) — the
  `buildAffiliateLink` direct branch is plumbed but the receiving end isn't
  live yet. See the companion brief.
- **`/schools` directory enhancements** — facets for "no final exam",
  "money-back guarantee", "mobile app", etc.
- **Automated AZ-style fact-correction guard** — build-time check that
  flags variant copy containing time-period tokens that contradict state
  Eligibility Requirements. Spec in §12 ("Editorial correction example") and
  Work Item 3 of the AZ correction brief.
- **NJ / VA / NC variant audit pass** — those states had regulatory
  corrections in April 2026 that the variants haven't been re-checked
  against.
- **Vitest setup** — add a minimal test framework so `buildAffiliateLink`,
  `resolveStateContent`, and `parseLines` have proper assertions instead of
  ad-hoc verification scripts.
- **Move `buildAffiliateLink` warnings** from `console.warn` to a real
  observability target (e.g. Sentry breadcrumbs, or a Notion Issues row).
- **Per-school×network branding** — some networks (CJ, Impact) require
  specific link parameters. Currently we pass through whatever's in the
  Affiliate URL field; a structured per-network builder would make
  parameter additions safer.

---

## Appendix A — Glossary

| Term | Meaning |
|---|---|
| **Tier 1 / Tier 2** | Editorial tier in Traffic Schools DB. Tier 1 = featured, on state pages; Tier 2 = listed, on `/schools` only. |
| **Affiliate gate** | Two-condition filter (`showOnSite && monetizable network`) applied in `getAllSchools`. |
| **Tracking method** | `network` / `direct` / `coupon_code`. Determines how `buildAffiliateLink` builds outbound URLs. |
| **State Requirement** | A regulatory fact about a state (mandated hours, exam policy, etc.) — sourced from the State Requirements DB. |
| **Variant** | A school×state editorial override row in the School State Variants DB. Keyed by `{slug}:{STATE}`. |
| **Resolver / `resolveStateContent`** | The pure function in `lib/notion.ts` that combines variant + school + state requirement into a single `ResolvedSchoolContent` for rendering. |
| **Locked** | A variant Generation Status meaning "human-verified, never overwrite". |
| **ISR** | Incremental Static Regeneration. Pages are static but rebuild on a schedule. |
| **DMV directory** | The DMV-scraped third-party schools listed in the Directory DB. Distinct from the curated Traffic Schools DB. |
| **Bayesian normalized rating** | `(n × r + 50 × 4.0) / (n + 50)` — smoothed rating used for ranking. |

---

## Appendix B — Common commands

```bash
# Local dev
npm run dev

# Build (runs prebuild → generate-llms first)
npm run build

# Scraping (need .env.local with all required vars)
npm run scrape:ca           # one state
npm run scrape:dmv          # all DMV scrapers in sequence
npm run scrape:reviews      # multi-source review aggregation
npm run scrape:prices       # per-school × state prices
npm run enrich:places       # Google Places enrichment
npm run scrape:all          # full monthly pass

# Editorial AI generation
npm run generate:variants                       # all schools × states
npm run generate:variants -- --state CA          # one state
npm run generate:variants -- --school safe2drive # one school
npm run generate:variants -- --dry-run          # preview only

# Seed scripts (one-time)
npm run populate:state-reqs                # populate State Requirements DB
npm run populate:state-reqs -- CA TX        # specific states only
npm run seed:safe2drive-ca                 # locked safe2drive:CA test variant

# Bayesian rating
NOTION_TOKEN=$(grep NOTION_TOKEN .env.local | cut -d= -f2) python3 scripts/normalize-ratings.py
```

---

*If you change anything covered by this document, update it. Documentation
that drifts is documentation that misleads.*
