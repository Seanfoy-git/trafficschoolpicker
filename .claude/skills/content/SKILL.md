---
name: content
description: Write or review TrafficSchoolPicker site content (blog posts, the out-of-state guide, question/state pages) to the site's sourcing, honesty, and state-specificity standard. Use when drafting, editing, fact-checking, or pre-publish reviewing any page or post — anything with factual claims about traffic school, tickets, points, statutes, or fees.
---

# Content (TrafficSchoolPicker)

The canonical standard is [docs/content-standards.md](../../../docs/content-standards.md)
(committed, version-controlled). Read it if you need the full detail. This skill is
the procedure that applies it. The site's edge is being **sourced, honest, and
state-specific** where competitors guess — every claim must earn its place.

## When drafting

1. **Pin the subject and the state(s).** Almost every answer varies by state — decide
   up front whether this needs a per-state layer, and derive from data we already hold
   (States DB, question pages, ticket-cost study) before re-researching.
2. **Source as you write.** For each factual claim, attach a citation *now*, not later.
   Prefer the **primary source** — statute / regulation / DMV / agency page — over
   law-firm blogs or aggregators (see the "where to find primary sources" table in the
   standards doc). Cite by name: `Va. Code § 46.2-862`, `49 CFR § 384.226`.
3. **Numbers get sources or hedges.** Any fee, threshold, point value, date, or percent
   needs a citation, ideally two. A single shaky source → label it a range ("reported at
   roughly $X–$Y, varies by market") or cut it. Never a precise unsourced number.
4. **Say what you can't settle.** Where the answer is genuinely open, name it and say who
   to ask — the out-of-state guide's "Three things we could not settle" is the model. An
   honest gap beats a confident guess.
5. **Stay balanced.** Don't oversell what we monetise. Make the fair case even when a
   one-sided one would flatter the product — it's more useful and more defensible.
6. **Close state advice with the local check** — "call the clerk of the court printed on
   your citation" — since practice varies county to county.
7. **Commercial hygiene.** Reference/outreach content (`/out-of-state-ticket`, question
   pages) carries **no affiliate / course / tracker / ad links**. Keep disclosure accurate
   on the page it appears on.
8. **Stamp freshness.** "Last verified <Month Year>"; note any changed-law effective dates.

## When reviewing (or before publishing)

Run the pre-publish checklist from [docs/content-standards.md](../../../docs/content-standards.md) §6:

- Every fact cited (≥1 credible; 2 on contestable/load-bearing claims)
- Citations primary where possible, by name; secondaries only corroborate
- No unsourced numbers
- Uncertainty stated, not papered over
- Balanced, not self-serving
- State-specific where the answer varies; ends with the local-authority check
- Reference content affiliate/tracker/ad-clean; disclosure accurate on-page
- "Last verified" stamp present; changed-law dates noted
- Internal links + SEO config + sitemap updated for new routes
- Build passes; route guard green

Report each fact that fails, with the specific fix (which source to add, what to hedge,
what to cut). Don't pass content that states a number with no source.

## Wiring reference (where things live)

- Blog posts: `content/blog/*.mdx` (frontmatter + `<QuickAnswer>` + GFM tables); register
  the slug in `BLOG_SEO` (`lib/seo-config.ts`) so it enters the sitemap.
- Question pages / state data: **Notion (Pellucid CMS workspace)** — edit the `…e794-4352…`
  pages, not the archived old-workspace copies. See `DOCUMENTATION.md` §4, §7.1.
- Statutes/agencies for primary sourcing: standards doc §1 table.
