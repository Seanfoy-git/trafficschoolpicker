# TrafficSchoolPicker.com — Complete Technical Documentation

Last updated: April 7, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Architecture](#4-database-architecture)
5. [Data Flow](#5-data-flow)
6. [Page Structure](#6-page-structure)
7. [Components](#7-components)
8. [SEO Implementation](#8-seo-implementation)
9. [LLM Optimization](#9-llm-optimization)
10. [FAQ System](#10-faq-system)
11. [Blog System](#11-blog-system)
12. [Scraper Pipeline](#12-scraper-pipeline)
13. [Review Aggregation](#13-review-aggregation)
14. [Pricing System](#14-pricing-system)
15. [Affiliate Link Handling](#15-affiliate-link-handling)
16. [Admin Dashboard](#16-admin-dashboard)
17. [Issue Tracking](#17-issue-tracking)
18. [Environment Variables](#18-environment-variables)
19. [Deployment](#19-deployment)
20. [Admin Guide — Day-to-Day Operations](#20-admin-guide)
21. [Maintenance Checklists](#21-maintenance-checklists)

---

## 1. Project Overview

TrafficSchoolPicker.com is a comparison site that helps US drivers find court-approved online traffic schools. It compares schools by price, ratings, and features across all 50 states.

**Revenue model:** Affiliate commissions from school enrollments, with transparent disclosure.

**Key metrics:**
- 50 state pages (each with unique SEO-optimized content)
- 12 curated Tier 1/2 schools with multi-platform ratings
- 2,000+ DMV-scraped directory schools across 18 states
- 9 blog posts optimized for search and AI citation
- 27 states with verified FAQ facts (137 facts total)
- Automated monthly data refresh pipeline with issue tracking

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16.2.2 (App Router) | Server-rendered React with ISR |
| Language | TypeScript (strict mode) | Type safety across the codebase |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Database | Notion API (6 databases) | Headless CMS — no admin panel to build |
| Blog | MDX files in repo | Static blog content with React components |
| Scraping | Playwright | Browser automation for DMV sites, pricing pages |
| AI | Claude Sonnet 4.6 (Anthropic API) | Review synthesis from Trustpilot snippets |
| Reviews | Trustpilot, Google Places, BBB, App Store, Play Store | Multi-platform rating aggregation |
| Hosting | Vercel | Automatic deploys, ISR, edge functions |
| DNS/CDN | Cloudflare | DNS, SSL, redirect rules (non-www → www) |
| CI/CD | GitHub Actions | Monthly automated scraping pipeline |
| Icons | Lucide React | Consistent SVG icon set |
| Images | Sharp | Image optimization |

---

## 3. Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                    NOTION (6 Databases)                        │
│                                                               │
│  Traffic Schools    School Directory    States                │
│  (12 curated)      (2,000+ scraped)    (50 rows)            │
│                                                               │
│  School Pricing    State FAQs          Issues                │
│  (school×state)    (137 verified)      (scraper tracking)    │
└────────────┬──────────────────────────────────┬───────────────┘
             │ Notion API (lib/notion.ts)       │
             ▼                                  ▼
┌───────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP                                │
│                                                               │
│  50 State Pages (ISR 24h)  │  9 Blog Posts (MDX, static)    │
│  12 Review Pages (ISR 24h) │  Homepage (ISR 24h)            │
│  Admin Dashboard (dynamic) │  API Routes (click tracking)   │
│                                                               │
│  SEO: JSON-LD schema, OG tags, canonical URLs, sitemap.xml  │
│  LLM: llms.txt, llms-full.txt (auto-generated)              │
└───────────────────────────────────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────────────────────────┐
│  AUTOMATED PIPELINE (Monthly GitHub Actions)                  │
│                                                               │
│  1. Scrape 18 state DMV sources → Notion Directory           │
│     (8 dedicated scripts + 1 generic config-driven scraper)  │
│  2. Scrape Trustpilot/BBB/App Store/Play Store → Schools DB  │
│  3. Scrape school pricing pages → Pricing DB                 │
│  4. Enrich directory via Google Places API                    │
│  5. Log failures to Issues DB                                │
│  6. Trigger Vercel redeploy                                  │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. Database Architecture

### 4.1 Traffic Schools DB (NOTION_SCHOOLS_DB)

The editorial database for curated schools. You manage this manually in Notion.

| Field | Type | Purpose |
|-------|------|---------|
| School Name | title | Display name |
| Slug | text | URL slug (e.g. "idrivesafely") |
| Tier | select | "1 - Featured" or "2 - Listed" |
| Status | select | "Active" / "Needs Research" / "Inactive" |
| Show On Site | checkbox | Must be true to appear on the site |
| Badge | select | "Best Value" / "Top Rated" / "Editors Choice" / "Fastest" |
| Website | url | School's official website |
| Affiliate URL | url | Default affiliate tracking link |
| State Codes | text | "all" or "CA,TX,FL" (comma-separated) |
| Price | number | Generic/default price (fallback when no state-specific price) |
| Rating | number | Trustpilot star rating |
| Review Count | number | Trustpilot review count |
| Google Rating | number | Google Places rating |
| Google Review Count | number | Google review count |
| Google Place ID | text | Stored for reliable lookups |
| Google Place Confidence | select | "Verified" / "Auto-matched" / "Wrong match" |
| BBB Grade | select | "A+" through "F" or "NR" |
| App Store Rating | number | iOS App Store rating |
| Play Store Rating | number | Google Play rating |
| Review Highlights Good | text | Claude-synthesized positive summary |
| Review Highlights Bad | text | Claude-synthesized negative summary |
| One Liner | text | Provider's own description (shown in quotes as "In their own words") |
| Pros | text | Manual editorial pros (one per line) |
| Cons | text | Manual editorial cons (one per line) |
| Pros {STATE} | text | State-specific pros (e.g. "Pros GA") — optional, falls back to generic |
| Cons {STATE} | text | State-specific cons (e.g. "Cons GA") — optional, falls back to generic |
| Best For | text | "Budget-conscious drivers in CA/FL" |
| Completion Time (hrs) | number | Course duration |
| Mobile App | checkbox | Has dedicated mobile app |
| Money Back Guarantee | checkbox | Offers guarantee |
| Founded | number | Year established |

**Trend fields** (Trustpilot Trend, Google Trend, App Store Trend, Play Store Trend):
- "↑ Improving" / "= Stable" / "↓ Declining"
- Calculated by the review scraper each run

**State-specific Pros/Cons:**
- Add fields like "Pros GA", "Cons OH" to the Notion schema as needed
- The code reads `Pros {STATE_CODE}` for all 29 active states
- Fallback: if no state-specific field exists or is empty, generic Pros/Cons renders
- Example: "Cons GA" can contain "Not accepted for DDS 6-hour point reduction"

### 4.2 School Directory DB (NOTION_DIRECTORY_DB)

DMV-scraped official school listings. Populated entirely by scrapers across 18 states.

| Field | Type | Purpose |
|-------|------|---------|
| School Name | title | Official DMV name |
| License Number | text | State license ID (e.g. "E1988", "DI200066") |
| State | select | "California" / "Texas" / "Georgia" etc. |
| Phone | text | Contact number |
| Address | text | Physical address or delivery method |
| Website | url | Enriched via Google Places |
| Online Available | checkbox | Offers online courses |
| Source | select | "CA DMV" / "TX TDLR" / "GA DDS" / "OH DPS" etc. |
| Date Scraped | date | Last scrape timestamp |
| Notes | text | Additional info (e.g. county restrictions) |

**Current directory coverage (2,023 schools):**

| State | Schools | Source | Scraper |
|---|---|---|---|
| TX | 829 | TX TDLR | `scrape-tx-tdlr.ts` (CSV) |
| AZ | 527 | AZ Courts | `scrape-az-courts.ts` (dropdown extraction) |
| CA | 204 | CA DMV | `scrape-ca-dmv.ts` (Playwright/Salesforce) |
| GA | 100 | GA DDS | `scrape-ga-dds.ts` (Playwright/form) |
| NE | 89 | NE DMV | `scrape-states.ts` (generic) |
| NJ | 86 | NJ MVC | `scrape-states.ts` (generic) |
| TN | 25 | TN Safety | `scrape-states.ts` (generic) |
| OH | 25 | OH DPS | `scrape-oh-dps.ts` (Playwright/dropdown) |
| NV | 25 | NV DMV | `scrape-states.ts` (generic) |
| NY | 24 | NY DMV | `scrape-ny-dmv.ts` (Playwright/tables) |
| CT | 22 | CT DMV | `scrape-states.ts` (generic) |
| FL | 19 | FL DHSMV | `scrape-fl-dhsmv.ts` (Playwright/table) |
| OR | 11 | OR ODOT | `scrape-states.ts` (generic) |
| MD | 10 | MD MVA | `scrape-states.ts` (generic) |
| VA | 10 | VA DMV | `scrape-va-dmv.ts` (Playwright/Drupal) |
| WA | 9 | WA DOL | `scrape-states.ts` (generic) |
| ND | 7 | ND HP | `scrape-states.ts` (generic) |
| SC | 1 | SC DMV | `scrape-states.ts` (generic) |

### 4.3 States DB (NOTION_STATES_DB)

One row per state (50 rows). Populated manually.

| Field | Type | Purpose |
|-------|------|---------|
| State Name | title | "California" |
| Abbreviation | text | "CA" (the join key used everywhere) |
| Online Allowed | checkbox | Can you do traffic school online? |
| Online Dismisses Ticket | checkbox | Does online school dismiss the ticket? |
| Insurance Discount Available | checkbox | Available for insurance discount? |
| DMV URL | url | Link to state DMV traffic school page |
| Minimum Hours | number | State-mandated minimum course length |
| Certificate Submission | select | "Electronic" / "Mail to Court" / "Driver Submits" |
| Eligibility Requirements | text | Who qualifies |
| Court Acceptance Notes | text | Which courts accept online |
| Research Notes | text | Internal editorial notes |
| Status | select | "Research Complete" / "In Progress" / "Not Started" |

**Online status derivation logic:**
```
If Online Allowed AND Online Dismisses Ticket → "Online — ticket dismissal"
If Online Allowed AND Insurance Discount → "Online — insurance discount only"
If NOT Online Allowed → "In-person only"
Otherwise → "Unknown"
```

### 4.4 School Pricing DB (NOTION_PRICING_DB)

One row per school×state combination. Created by the price scraper.

| Field | Type | Purpose |
|-------|------|---------|
| Label | title | "{slug}-{state}" e.g. "idrivesafely-CA" |
| School | relation | Links to Traffic Schools DB |
| State Code | text | "CA", "TX" etc. |
| Price | number | Current price in dollars |
| Original Price | number | Pre-discount price (for strikethrough) |
| Approved | checkbox | Manually verified as court-approved |
| Affiliate URL | url | State-specific affiliate link override |
| Price Note | text | "Includes state fee" etc. |
| Price Scrape Status | select | "OK" / "Changed" / "Failed" / "Blocked" |
| Last Scraped | date | Timestamp |

### 4.5 State FAQs DB (NOTION_FAQ_DB_ID)

Per-state FAQ facts. Populated manually, rendered on state pages.

| Field | Type | Purpose |
|-------|------|---------|
| Name | title | "California — Course Length" (human label) |
| State | text | "California" |
| State Code | text | "california" (matches URL slug) |
| Question | text | The FAQ question |
| Answer | text | The full answer |
| Key Fact | text | One-line summary (used in llms-full.txt) |
| Status | select | "Verified" / "Needs Review" / "Outdated" / "Needs Research" |
| Source URL | url | Official DMV/court source |

**Only rows with Status = "Verified" appear on the live site.**

### 4.6 Issues DB (NOTION_ISSUES_DB) — Optional

Tracks scraper problems for triage. Created automatically by scraper runs.

| Field | Type | Purpose |
|-------|------|---------|
| Title | title | "Trustpilot blocked for iDriveSafely" |
| Source | select | "Trustpilot" / "Google" / "BBB" / "App Store" / "Play Store" / "Price Scraper" / "DMV Scraper" |
| Severity | select | "Critical" / "Warning" / "Info" |
| School | text | School name or slug |
| Status | select | "Open" / "In Progress" / "Resolved" / "Won't Fix" |
| Details | text | Full error message or context |
| First Seen | date | When the issue first appeared |
| Last Seen | date | Updated each time the issue recurs |
| Occurrences | number | How many times this has happened |

If `NOTION_ISSUES_DB` is not set, issues log to console only — no crash.

---

## 5. Data Flow

### How data gets to the site

```
18 State DMV websites ──→ 8 dedicated + 1 generic scraper ──→ Notion Directory DB
Trustpilot/BBB/etc ─────→ Review scraper (Playwright) ──────→ Notion Schools DB
School pricing pages ───→ Price scraper (Playwright) ────────→ Notion Pricing DB
Manual research ────────→ Admin edits in Notion ─────────────→ States DB + FAQs DB
Scraper failures ───────→ Issue tracker ─────────────────────→ Issues DB
```

### How a state page loads

1. User visits `/california`
2. Next.js checks ISR cache (valid for 24h)
3. If stale, fetches in parallel:
   - `getSchoolPricingForState("CA")` → Schools DB + Pricing DB
   - `getStateInfo("CA")` → States DB
   - `getDirectoryForState("California")` → Directory DB
   - `getNotionStateFaqs("california")` → FAQs DB
4. Renders page with state-specific data
5. Caches result for next 24h

### Price display fallback chain

1. State-specific price from Pricing DB (e.g. `idrivesafely-CA: $29`)
2. Generic Price from Traffic Schools DB (e.g. `$24.95`)
3. "Check website" — only if both are null

### Pros/Cons fallback chain

1. State-specific field (e.g. `Pros GA`) if populated in Notion
2. Generic `Pros` field
3. Synthesized "What reviewers say" block (from Claude) if available

### How data stays fresh

- **ISR**: Pages auto-refresh every 24 hours
- **Monthly pipeline**: GitHub Actions runs all scrapers on the 1st
- **Manual deploy**: Admin clicks "Trigger Redeploy" at `/admin`
- **Notion edit**: Change a field in Notion → visible within 24h (or immediate after redeploy)
- **Preserve-previous-score**: If a source fails, previous data stays — never overwritten with null

---

## 6. Page Structure

### Homepage (`/`)
- Hero with state selector dropdown
- "How It Works" 3-step section
- Top Tier 1 school picks
- "Why Trust Us" editorial block
- 50-state clickable grid
- FAQ accordion with JSON-LD

### State Pages (`/[state]`)
Content varies by online status:

**"Online — ticket dismissal"** (CA, TX, FL, NY, AZ, GA, OH, etc.):
1. Hero with school count
2. Georgia-specific callout (if `/georgia` — DDS point reduction limitation)
3. Tier 1 comparison cards (full detail, multi-platform ratings, state-specific pros/cons, price, CTA)
4. Tier 2 "More options" compact rows
5. State rules & requirements (eligibility, court process, DMV link)
6. FAQ accordion with JSON-LD
7. Full directory table (searchable, all DMV-licensed schools)

**"Online — insurance discount only"** (WA):
- Same as above but with amber warning banner

**"In-person only"** (MA, OR, WY):
- Message: "Online traffic school isn't available"
- Link to state DMV
- Directory table still shows (physical schools)

**"Unknown"** (remaining states):
- Neutral holding page
- Suggests contacting court directly

### Review Pages (`/reviews/[slug]`)
- Header: name, badge, multi-platform ratings with trends
- Quick summary: best for, pros/cons or synthesized highlights
- Pricing: "Varies by state" (no hardcoded price — directs to state page)
- Feature comparison table vs competitors
- Verdict + CTA
- Sidebar: sticky enroll button, ratings, features

### Blog (`/blog` and `/blog/[slug]`)
- Listing page: all published posts sorted by date
- Post pages: MDX content with QuickAnswer block, JSON-LD Article schema
- Custom components: QuickAnswer (styled answer box), styled tables/headings

### Admin (`/admin`)
- School counts (total, tier 1, tier 2, missing affiliates)
- Directory counts by state
- Environment variable health checks
- "Trigger Redeploy" button
- "Open Notion" link

---

## 7. Components

| Component | Type | Purpose |
|-----------|------|---------|
| `SchoolCard` | Server | Full comparison card with ratings, state-specific price/pros/cons, "In their own words" tagline |
| `ComparisonTable` | Client | Sortable comparison table (by price, rating, time) |
| `MultiRating` | Server | Shows Trustpilot + Google + App Store + Play Store + BBB badges with trend arrows |
| `MultiRatingCompact` | Server | Condensed version for table rows |
| `ReviewSynthesis` | Server | "What reviewers say" good/bad block (Claude-generated) |
| `AffiliateButton` | Client | Enroll Now / Visit Website CTA (priority: state URL > default > website) |
| `StateSelector` | Client | Dropdown of 50 states, navigates on change |
| `DirectoryTable` | Client | Searchable table of DMV-licensed schools |
| `FaqSection` | Server | Accordion FAQ with JSON-LD schema (Notion-powered) |
| `SchoolFAQ` | Server | Legacy FAQ component (static fallback) |
| `Badge` | Server | "Best Value" / "Top Rated" etc. colored badges |
| `RatingStars` | Server | 5-star visual rating with count |
| `TrustBar` | Server | Trust indicators strip |
| `Header` | Server | Nav bar with logo, links, state selector |
| `Footer` | Server | Links, popular states, legal disclosure |
| `BlogMdxComponents` | Server | Custom MDX components (QuickAnswer, tables, links) |

---

## 8. SEO Implementation

### Centralised SEO Config (`lib/seo-config.ts`)

Every page's metadata is defined in one file:
- `STATE_SEO`: 24 states with custom titles, descriptions, H1s, primary keywords
- `HOME_SEO`: Homepage metadata
- `BLOG_SEO`: 9 blog posts with SEO metadata
- States without custom SEO get a dynamic fallback

### Rules enforced:
- One primary keyword per page (never duplicated)
- Title max 60 characters, description max 155
- Layout template auto-appends "| TrafficSchoolPicker"
- Canonical URLs use `www.trafficschoolpicker.com`
- Every page has OG + Twitter card tags
- Exactly one H1 per page (from seo-config, not hardcoded)
- `validateSeoConfig()` warns in dev if limits exceeded

### JSON-LD Schema:
- **FAQPage** on state pages (from Notion or static fallback)
- **Article** on blog posts
- **Review** on school review pages

### Sitemap (`/sitemap.xml`)
Auto-generated from:
- All 50 state slugs
- All blog posts in `BLOG_SEO`
- Static pages (homepage, about, blog index)

### Robots (`/robots.txt`)
- Allow all
- Disallow `/api/` and `/_next/`
- Points to sitemap

---

## 9. LLM Optimization

### `public/llms.txt`
Static file describing the site for AI crawlers:
- What the site covers
- Links to all state pages, blog posts, school reviews
- Key facts for AI responses (course lengths, dismissal mechanisms, prices)

### `public/llms-full.txt`
Auto-generated at build time from Notion FAQ database:
- Per-state structured facts (question, answer, key fact)
- 27 states, 137 verified facts (regenerated every deploy)
- Regenerated on every `npm run build` via prebuild script

### Blog posts
- Every post starts with a `<QuickAnswer>` block — a concise 1-2 sentence answer
- Styled distinctly for visual + machine readability
- Tables with structured data for extraction
- Definitive factual statements (no hedging)

---

## 10. FAQ System

### Two-layer approach:
1. **Notion FAQs** (primary): Fetched live from `NOTION_FAQ_DB_ID`, filtered by State Code + Status = "Verified"
2. **Static fallback** (`lib/state-faqs.ts`): Hardcoded FAQs for CA, TX, FL + generic defaults

### On each state page:
- Notion FAQs attempted first
- If none returned (DB not configured, state not populated), falls back to static
- FAQs rendered as accessible `<details>` accordion
- JSON-LD FAQPage schema injected for Google featured snippets

### Managing FAQs:
- Add/edit rows in Notion FAQ database
- Set Status = "Verified" to publish
- Set Status = "Needs Review" to hide from site
- State Code must match URL slug exactly (lowercase, hyphenated)

---

## 11. Blog System

### Content storage:
- 9 MDX files in `content/blog/`
- Each has frontmatter: title, description, publishedAt, updatedAt, slug, primaryKeyword, published
- Content is React-compatible Markdown with custom components

### Custom components (via BlogMdxComponents):
- `<QuickAnswer>`: Styled answer block at top of every post
- Custom `<a>`: Internal links use Next.js `<Link>`, external links open in new tab
- Styled tables, headings (h2, h3)

### Publishing a new post:
1. Create `content/blog/[slug].mdx` with `published: true`
2. Add SEO entry to `BLOG_SEO` in `lib/seo-config.ts`
3. Add URL to `public/llms.txt`
4. Commit and deploy

---

## 12. Scraper Pipeline

### Config-driven architecture

All state scrapers are registered in `scripts/config/state-sources.ts`. Each entry defines:
- State code, name, source label
- Method: `playwright`, `csv`, `static-html`, or `manual`
- URL and enabled flag
- Notes for documentation

To add a new state scraper: add an entry to `state-sources.ts`, set `enabled: true`. For simple static-HTML pages, no new script file is needed — the generic scraper handles it.

### Dedicated scrapers (8 scripts)

| Script | State | Method | Schools |
|--------|-------|--------|---------|
| `scrape-ca-dmv.ts` | CA | Playwright (Salesforce Lightning) | 204 |
| `scrape-tx-tdlr.ts` | TX | CSV download | 829 |
| `scrape-fl-dhsmv.ts` | FL | Playwright (static table) | 19 |
| `scrape-ny-dmv.ts` | NY | Playwright (tables, needs User-Agent) | 24 |
| `scrape-az-courts.ts` | AZ | Playwright (dropdown extraction) | 527 |
| `scrape-va-dmv.ts` | VA | Playwright (Drupal paginated) | 10 |
| `scrape-oh-dps.ts` | OH | Playwright (DataTables dropdown) | 25 |
| `scrape-ga-dds.ts` | GA | Playwright (form, text parsing) | 100 |

### Generic scraper (`scrape-states.ts`)

Handles all enabled `static-html` states automatically:
- NV (25), NJ (86), WA (9), NE (89), CT (22), ND (7), MD (10), OR (11), TN (25), SC (1)

Run specific states: `npx tsx scripts/scrape-states.ts NV NJ WA`

### States not yet automated

| Status | States |
|--------|--------|
| PDF-only (manual entry) | IL, OK, MN, ID, NC, WY, RI |
| WAF blocked | IL (Akamai) |
| No public list | CO, PA, MI, MO, LA, WI, KS, IN, DE, NM, KY, AL, AR, HI, IA, MS, MT, SD, WV |

### Monthly workflow (`.github/workflows/monthly-update.yml`)
Runs on the 1st of every month at 9am UTC (or manual trigger).

| Step | Command | What it does |
|------|---------|-------------|
| 1 | `scrape:dmv` | All 8 dedicated scripts + generic scraper |
| 2 | `scrape:reviews` | Trustpilot (Playwright), Google, BBB, App Store, Play Store |
| 3 | `scrape:prices` | State-specific pricing pages |
| 4 | `enrich:places` | Google Places API enrichment |
| 5 | Deploy | Trigger Vercel redeploy |

### Shared infrastructure

| File | Purpose |
|------|---------|
| `scripts/lib/scraper-utils.ts` | `syncToNotion()` — common write pattern for all scrapers |
| `scripts/lib/issues.ts` | Issue tracker — logs failures to Notion Issues DB |
| `scripts/config/state-sources.ts` | State source registry (32 states configured) |
| `scripts/config/price-sources.ts` | Price scraping targets (school × state URLs) |

### Rate limits respected:
- Notion: 350ms between writes (3 req/sec)
- Trustpilot: 2s between page loads (Playwright)
- Google Places: 150ms between lookups
- Playwright scraping: natural page load delays + 1s between states

### Data preservation rule:
**Never overwrite a value with null.** If a source fails, the previous score/grade/rating stays in Notion. Failures are logged to the Issues DB for triage.

---

## 13. Review Aggregation

### Sources (5 platforms):

| Platform | Method | Cost | Data |
|----------|--------|------|------|
| Trustpilot | Playwright browser | Free | Rating, count, review snippets |
| Google Places | Places API (New) | ~$0.017/lookup | Rating, count, Maps URL |
| BBB | HTTP scrape | Free | Letter grade (A+ to F) |
| App Store | iTunes Lookup API | Free | Rating, count |
| Play Store | google-play-scraper | Free | Rating, count |

### Google Place ID confidence:
- **Verified**: Human confirmed correct match → ratings shown
- **Auto-matched**: Scraper guessed → ratings shown, flagged for review
- **Wrong match**: Human marked incorrect → ratings hidden, scraper skips

### Review synthesis:
- Extracts 10+ review snippets from Trustpilot via Playwright
- Sends to Claude Sonnet 4.6 via Anthropic API
- Returns one-sentence good + bad summary
- Written to "Review Highlights Good/Bad" fields in Notion
- Displayed on school cards as "What reviewers say" block

### Trend calculation:
- Compares current rating to previous run's rating
- ≥0.1 increase → "↑ Improving"
- ≤0.1 decrease → "↓ Declining"
- Otherwise → "= Stable"
- 0 rating with 0 reviews → treated as "not found" (not a real score)

---

## 14. Pricing System

### Architecture:
- Prices live in the **School Pricing DB** (one row per school×state)
- Generic Price field on Traffic Schools DB is used as fallback
- Price scraper reads targets from `scripts/config/price-sources.ts`

### Price display priority:
1. State-specific price from Pricing DB (e.g. `idrivesafely-CA: $29`)
2. Generic Price from Traffic Schools DB (e.g. `$24.95`)
3. "Check website" — only if both are null
4. Schools with no price sort to bottom of comparison tables

### Price scraper logic:
- Fixed prices (e.g. $5 Dollar Traffic School) → never scraped
- DOM prices → Playwright visits state-specific URL, extracts smallest $X.XX value
- Detects bot blocking (captcha, 403, Cloudflare) → marks as "Blocked"
- Failed extractions → marks as "Failed" (set price manually in Notion)

---

## 15. Affiliate Link Handling

### Priority order:
1. **State-specific affiliate URL** (from Pricing DB `Affiliate URL` field)
2. **School default affiliate URL** (from Schools DB)
3. **School website** (fallback, not an affiliate link)

### Link attributes:
- Affiliate links: `target="_blank" rel="noopener noreferrer nofollow sponsored"`
- Non-affiliate links: `target="_blank" rel="noopener noreferrer"`
- Button label: "Enroll Now" (affiliate) or "Visit Website" (non-affiliate)

### Click tracking:
- `POST /api/click` logs: school, state, source, timestamp
- Stored in `data/clicks.json` (local, git-ignored)
- Silent failures (never blocks user navigation)

---

## 16. Admin Dashboard

### URL: `/admin`

**Not an admin panel** — Notion is the admin. This page is a read-only health check.

### What it shows:
- Total schools visible on site
- Tier 1 / Tier 2 breakdown
- Schools missing affiliate links (need attention)
- Directory school counts (CA, TX, FL)
- Environment variable status (set or missing)
- Latest verification date

### Actions:
- **Trigger Redeploy**: POSTs to Vercel deploy hook for immediate update
- **Open Notion**: Direct link to workspace

---

## 17. Issue Tracking

### Purpose:
Tracks scraper failures so data source changes are caught and triaged, not silently lost.

### How it works:
1. Every scraper calls `logIssue()` when a source fails
2. Issues are buffered during the run
3. At the end, `flushIssues()` writes them all to the Notion Issues DB
4. Recurring issues bump the Occurrences count + Last Seen date (no duplicates)
5. Severity levels: Critical (all sources failed), Warning (one source failed), Info (minor)

### If NOTION_ISSUES_DB is not configured:
Issues log to console only. The scraper still runs — no crash.

### Workflow:
1. Monthly scraper runs
2. Issues appear in Notion with "Open" status
3. Admin reviews and either fixes the source, marks "Resolved", or "Won't Fix"
4. Next run updates Last Seen and Occurrences for recurring issues

---

## 18. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NOTION_TOKEN` | Yes | Notion internal integration token |
| `NOTION_SCHOOLS_DB` | Yes | Traffic Schools database ID |
| `NOTION_DIRECTORY_DB` | Yes | School Directory database ID |
| `NOTION_STATES_DB` | Yes | States database ID |
| `NOTION_PRICING_DB` | Yes | School Pricing database ID |
| `NOTION_FAQ_DB_ID` | Yes | State FAQs database ID |
| `NOTION_ISSUES_DB` | Optional | Issues tracking database ID |
| `GOOGLE_PLACES_API_KEY` | For enrichment | Google Places API (New) key |
| `VERCEL_DEPLOY_HOOK` | For auto-deploy | Vercel deploy hook URL |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site URL |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics ID |

Set in both `.env.local` (local dev) and Vercel project settings (production).

---

## 19. Deployment

### Automatic:
- Push to `main` → Vercel builds and deploys
- `prebuild` script generates `llms-full.txt` from Notion FAQs
- ISR pages serve cached content, refresh in background after 24h

### Manual:
- `/admin` → "Trigger Redeploy" button
- Or: Vercel dashboard → Deployments → Redeploy

### Monthly pipeline:
- GitHub Actions runs all scrapers → updates Notion → triggers Vercel deploy
- Can also be triggered manually from GitHub Actions UI

### Domain:
- Canonical domain: `www.trafficschoolpicker.com`
- Cloudflare redirect rule: non-www → www (301)

---

## 20. Admin Guide — Day-to-Day Operations

### To update a school's price:
1. Open School Pricing DB in Notion
2. Find the row (e.g. "idrivesafely-CA")
3. Change the Price field
4. Wait 24h or trigger redeploy

### To add a new curated school:
1. Add row to Traffic Schools DB
2. Fill in: School Name, Slug, Tier, Status = Active, Show On Site = true
3. Set State Codes ("all" or "CA,TX,FL,AZ,GA,OH,IL")
4. Set Price (generic fallback) and Affiliate URL if available
5. Trigger redeploy

### To hide a school:
1. Uncheck "Show On Site" in Notion
2. Trigger redeploy

### To add an affiliate link:
1. Paste URL into "Affiliate URL" field
2. For state-specific links, add to School Pricing DB row
3. Trigger redeploy — CTA switches from "Visit Website" to "Enroll Now"

### To update a state's rules:
1. Edit the state's row in States DB
2. Update eligibility, court notes, DMV URL as needed
3. Wait 24h or trigger redeploy

### To add/edit FAQs:
1. Add or edit rows in State FAQs DB
2. Set Status = "Verified" to publish
3. State Code must match URL slug (lowercase, hyphenated)
4. Wait 24h or trigger redeploy

### To publish a blog post:
1. Create `content/blog/[slug].mdx` with frontmatter
2. Add to `BLOG_SEO` in `lib/seo-config.ts`
3. Add URL to `public/llms.txt`
4. Commit to git and push

### To mark a Google Place ID as wrong:
1. In Traffic Schools DB, find the school
2. Set "Google Place Confidence" to "Wrong match"
3. The Google rating disappears from the site
4. Paste the correct Place ID if known, set confidence to "Verified"

### To add state-specific pros/cons:
1. Add "Pros GA" (text field) to Traffic Schools DB in Notion
2. Fill it in for schools with state-specific points
3. Schools without the field populated → generic Pros shows
4. Trigger redeploy

### To add a new state scraper:
1. Add entry to `scripts/config/state-sources.ts`
2. For simple HTML pages: set method to "static-html", set enabled: true — done
3. For complex pages: create a dedicated script, reference it in notes
4. Add the script to `scrape:dmv` in package.json
5. Run and verify

### To triage scraper issues:
1. Check the Issues DB in Notion (if configured)
2. Filter by Status = "Open"
3. Investigate: has the source URL changed? Is the site blocking us?
4. Fix the scraper or mark "Won't Fix" with explanation
5. Set Status = "Resolved" when done

---

## 21. Maintenance Checklists

### Daily (5 minutes)
- [ ] Check `/admin` — any schools missing affiliate links?
- [ ] Check Vercel dashboard — any failed deploys?

### Weekly (15 minutes)
- [ ] Review any schools with "Price Scrape Status = Failed" in Notion
- [ ] Check for price changes flagged as "Changed" in Pricing DB
- [ ] Spot-check a few state pages to ensure data renders correctly
- [ ] Review Google Search Console for crawl errors
- [ ] Check Issues DB for new open issues (if configured)

### Monthly (1 hour)
- [ ] Verify GitHub Actions monthly workflow ran successfully
- [ ] Review new schools added to directory (check Directory DB for recent Date Scraped)
- [ ] Review Trustpilot ratings — any significant changes?
- [ ] Check "Google Place Confidence = Auto-matched" entries — verify or mark wrong
- [ ] Update any states still marked "Unknown" in States DB
- [ ] Check FAQ status — any marked "Needs Review" or "Outdated"?
- [ ] Run `npm run scrape:reviews` manually if ratings seem stale
- [ ] Run `npm run scrape:dmv` to refresh directory data
- [ ] Resolve or close open issues in Issues DB

### Quarterly (2 hours)
- [ ] Full audit of all curated school prices vs actual websites
- [ ] Verify affiliate links still work (click each, confirm tracking)
- [ ] Check BBB grades — any downgrades?
- [ ] Review blog posts — any outdated information?
- [ ] Update `llms.txt` key facts if any state rules changed
- [ ] Check Google Search Console performance — any pages dropping?
- [ ] Review Vercel Analytics for traffic patterns
- [ ] Update copyright year in Footer if needed
- [ ] Check if any new states have published official provider lists

### Annual
- [ ] Update year references in seo-config.ts titles (e.g. 2026 → 2027)
- [ ] Update blog post titles with new year
- [ ] Full review of all state rules (some states change laws annually)
- [ ] Rotate Notion token and Google API key
- [ ] Review and update the llms.txt file structure

---

## Appendix: File Map

```
trafficschoolpicker/
├── app/
│   ├── layout.tsx              # Root layout (Header + Footer + global meta + SEO validation)
│   ├── page.tsx                # Homepage (ISR 24h)
│   ├── globals.css             # Tailwind imports + custom CSS vars
│   ├── sitemap.ts              # Auto-generated XML sitemap from seo-config.ts
│   ├── robots.ts               # robots.txt (allow all, disallow /api/)
│   ├── [state]/
│   │   └── page.tsx            # Dynamic state pages (50 states, ISR 24h)
│   ├── blog/
│   │   ├── page.tsx            # Blog listing
│   │   └── [slug]/
│   │       └── page.tsx        # Individual blog post (MDX)
│   ├── reviews/
│   │   └── [school-slug]/
│   │       └── page.tsx        # School review pages (ISR 24h)
│   ├── about/
│   │   └── page.tsx            # Methodology page
│   ├── admin/
│   │   ├── page.tsx            # System status dashboard (dynamic, no cache)
│   │   └── AdminActions.tsx    # Deploy button (client component)
│   └── api/
│       ├── click/
│       │   └── route.ts        # Click tracking endpoint
│       └── admin/
│           └── deploy/
│               └── route.ts    # Vercel deploy hook trigger
├── components/
│   ├── SchoolCard.tsx          # School comparison card (state-aware pricing + pros/cons)
│   ├── ComparisonTable.tsx     # Sortable comparison table
│   ├── MultiRating.tsx         # Multi-platform rating badges + ReviewSynthesis
│   ├── AffiliateButton.tsx     # Enroll Now / Visit Website CTA
│   ├── StateSelector.tsx       # State dropdown
│   ├── DirectoryTable.tsx      # Searchable DMV school directory
│   ├── FaqSection.tsx          # FAQ accordion + JSON-LD (Notion-powered)
│   ├── SchoolFAQ.tsx           # Legacy FAQ component (static fallback)
│   ├── Badge.tsx               # School badges
│   ├── RatingStars.tsx         # Star rating visual
│   ├── TrustBar.tsx            # Trust indicators
│   ├── Header.tsx              # Navigation
│   ├── Footer.tsx              # Footer
│   └── BlogMdxComponents.tsx   # MDX overrides (QuickAnswer, tables, links)
├── content/
│   └── blog/                   # 9 MDX blog posts
├── lib/
│   ├── notion.ts               # Notion API client — all DB queries, helpers, price/pros resolvers
│   ├── notion-faqs.ts          # FAQ fetching from Notion FAQ DB
│   ├── types.ts                # All TypeScript types (School, SchoolWithPrice, StateInfo, etc.)
│   ├── seo-config.ts           # Centralised SEO metadata (24 states, 9 blogs, homepage)
│   ├── state-utils.ts          # State slug/code/name mapping (50 states)
│   ├── state-faqs.ts           # Static fallback FAQs (CA, TX, FL + generic)
│   ├── blog.ts                 # MDX frontmatter reader (gray-matter)
│   ├── affiliate.ts            # Affiliate URL builder (legacy)
│   ├── schools.ts              # Hardcoded school data (legacy fallback)
│   └── states.ts               # Hardcoded state data (legacy fallback)
├── scripts/
│   ├── scrape-ca-dmv.ts        # CA DMV directory scraper (Playwright/Salesforce)
│   ├── scrape-tx-tdlr.ts       # TX TDLR CSV scraper
│   ├── scrape-fl-dhsmv.ts      # FL DHSMV BDI scraper (Playwright)
│   ├── scrape-ny-dmv.ts        # NY DMV PIRP scraper (Playwright + User-Agent)
│   ├── scrape-az-courts.ts     # AZ Courts dropdown scraper (Playwright)
│   ├── scrape-va-dmv.ts        # VA DMV online clinics (Playwright/Drupal)
│   ├── scrape-oh-dps.ts        # OH DPS school scraper (Playwright/DataTables)
│   ├── scrape-ga-dds.ts        # GA DDS clinics scraper (Playwright/form)
│   ├── scrape-states.ts        # Generic config-driven scraper (NV, NJ, WA, NE, CT, etc.)
│   ├── scrape-reviews.ts       # Multi-platform review scraper (Playwright + APIs + Claude)
│   ├── scrape-prices.ts        # School pricing scraper (Playwright)
│   ├── enrich-places.ts        # Google Places enrichment
│   ├── generate-llms-full.ts   # Auto-generates llms-full.txt from Notion FAQs
│   ├── config/
│   │   ├── state-sources.ts    # State source registry (32 states configured)
│   │   └── price-sources.ts    # Price scraping target config
│   └── lib/
│       ├── scraper-utils.ts    # Shared Notion write utilities for all scrapers
│       └── issues.ts           # Issue tracker (logs failures to Notion Issues DB)
├── public/
│   ├── llms.txt                # AI discoverability file (static)
│   └── llms-full.txt           # Auto-generated state facts (prebuild)
├── .github/
│   └── workflows/
│       └── monthly-update.yml  # Monthly scraping pipeline
├── next.config.ts              # MDX support, page extensions
├── vercel.json                 # Security headers (X-Frame-Options, X-Content-Type-Options)
├── mdx-components.tsx          # MDX component provider
├── package.json                # 20+ npm scripts + dependencies
├── tsconfig.json               # TypeScript config (strict mode)
├── DOCUMENTATION.md            # This file
└── .env.local.example          # Environment variable template
```
