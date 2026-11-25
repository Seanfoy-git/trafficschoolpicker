# Content standards — TrafficSchoolPicker

The site's whole differentiation is being **sourced, honest, and state-specific**
where competitors guess. These are the rules every page and post must meet before
it ships. The `content` skill (`.claude/skills/content/`) operationalises this doc
as a checklist; this file is the canonical version.

---

## 0. Write for the 95th percentile

This isn't a legal site. It's meant to help someone holding a ticket. Solve for the
typical reader and disclaim the edge case quietly. Sourcing (§1) decides what's true;
this section decides what the reader sees first. When the two pull against each
other, the facts stay and the noise goes.

- **The first two sentences answer the typical reader**: a holder of that state's
  licence with an ordinary speeding ticket. Not page metadata, not a notice, not a
  definition.
- **One total.** Give the reader one number for what they'll pay, with the breakdown
  underneath. One savings figure per page, taken from `lib/ticket-cost-study.ts`.
- **Edge cases get one line each, below the answer**: CDL, the speed cut-off,
  out-of-state licences, military, repeat use. Never woven into the main answer.
- **Citations live in the Sources list.** Inline statute numbers only where someone
  might argue the point (a fee cap, the CDL rule, an insurer protection). Two or three
  per page is plenty. A sourced fact is still a sourced fact when its citation sits in
  the list.
- **One disclosure line and one "check with your court" line per page.** Not per
  section, not per card. The surcharge estimate gets a short label ("an estimate;
  your insurer's figure will differ"), with the full method on the study page.
- **Plain words first.** Spell out an acronym once, then use it. Say "no contest", not
  "nolo contendere"; "a short signed statement", not "an affidavit", unless the court's
  form uses the word.
- **Every rule here removes something.** Before adding a caveat, ask whether the typical
  reader would act differently because of it. If not, it goes in the Sources list or
  nowhere.

---

## 1. Sourcing — every fact is cited

- **Every factual claim carries at least one credible citation, ideally two.**
- **Prefer primary sources** — the actual statute, regulation, or agency/DMV page —
  over secondary commentary (law-firm marketing blogs, aggregators, listicles). Use
  a secondary source only to *corroborate* a primary one, never in place of it.
- **Cite by name.** "Va. Code § 46.2-862", "49 CFR § 384.226", "O.C.G.A. § 40-6-189"
  — not "studies show" or "according to experts".
- **Numbers need sources.** Fees, thresholds, points, dollar figures, dates,
  percentages. If only one shaky source exists, hedge it as a clearly-labelled
  range ("reported at roughly $X–$Y, varies by market") or cut it. Never state a
  precise unsourced number.
- **Two sources on anything contestable or load-bearing** — a claim the reader will
  act on, or that a competitor/critic could challenge.

### Where to find primary sources
| Kind | Go to |
|---|---|
| State statutes | The state legislature's own site (e.g. `leginfo.legislature.ca.gov`, `law.lis.virginia.gov`, `statutes.capitol.texas.gov`, `casetext`/official code portals) |
| Federal regulations | e-CFR / Cornell LII (`law.cornell.edu/cfr`) |
| Traffic school rules, points, eligibility | The state **DMV / DPS / court** page, not a school's marketing page |
| Compact membership, ACD codes | AAMVA |
| CDL / commercial rules | FMCSA (`fmcsa.dot.gov`) |
| Course mechanics we sell against | The state's own approved-provider / program page |

---

## 2. Honesty & balance

- **Match the tool to the situation.** Don't oversell traffic school (or anything
  we monetise) as the answer when it isn't. Credibility is the asset.
- **State what you couldn't settle.** The out-of-state guide's *"Three things we
  could not settle"* section is the gold standard — an open, sourced "we don't know,
  here's who to ask" beats a confident guess. A wrong answer costs a reader real
  money.
- **No false certainty.** If practice varies (county to county, court to court), say
  so and point the reader to the authority (usually the clerk of their court).
- **Be balanced even when it's tempting not to.** A one-sided take that happens to
  favour our product reads as self-serving and gets picked apart; the fair version
  is both more useful and more defensible.

---

## 3. State-specificity

- **Data *and* advice vary by state — default to a per-state layer.** The same fact
  (is a course a dismissal? is 20-over criminal? are out-of-state convictions
  pointed?) flips across states. National one-size answers are the competitor's
  mistake.
- Where we hold per-state data already (States DB, question pages, ticket-cost
  study), derive the per-state answer from it rather than re-researching.
- **Close state-specific advice with the local check** — "call the clerk of the
  court printed on your citation" — because prosecutorial practice is the one thing
  no article can settle.

---

## 4. Commercial hygiene

- **Reference / outreach content carries zero affiliate, course-provider, tracker,
  or ad links** (e.g. `/out-of-state-ticket`, the question pages). Keep the honest,
  citable content clean and separate from the monetised comparison surfaces
  (state hubs, review pages). See `DOCUMENTATION.md` §6 and §7.1.
- Disclosure must be *accurate on the page it appears on* — don't assert "we earn
  commissions" on a page that carries none (see `FooterAffiliateNote`).
- Never let monetisation bend a factual claim. Price/rating markup must mirror
  exactly what the page visibly shows (`DOCUMENTATION.md` §6).

---

## 5. Freshness

- Stamp reference content with **"Last verified <Month Year>"**.
- When a law changed, give the **effective date** and flag pages written before it
  (e.g. Texas recodified Ch. 45 → 45A on 2025-01-01; NY point values changed
  2026-02-16). "Same rules, new number / new values" saves the reader.
- `lastmod` / `dateModified` reflect the real last content edit, never the build
  date (`DOCUMENTATION.md` sitemap discipline).

---

## 6. Pre-publish checklist

Run this before shipping any page or post:

- [ ] **95th percentile (§0):** the first two sentences answer the typical reader; one total cost; edge cases one line each below the answer; inline statute numbers only where contestable; one disclosure and one local-check line.
- [ ] **Every fact** has ≥1 credible citation; contestable/load-bearing facts have 2.
- [ ] Citations are **primary** where possible, cited **by name**; secondaries only corroborate.
- [ ] **No unsourced numbers** — every fee/threshold/point/date/percent is sourced or hedged as a labelled range.
- [ ] **Uncertainty is stated**, not papered over; open questions named with who to ask.
- [ ] **Balanced** — no self-serving overstatement; the honest case is made.
- [ ] **State-specific** where the answer varies; ends with the local-authority check.
- [ ] **Commercial hygiene** — reference content is affiliate/tracker/ad-clean; disclosure accurate on-page.
- [ ] **"Last verified" stamp** present; changed-law effective dates noted.
- [ ] Internal links wired (guide ↔ state pages ↔ related posts); SEO config + sitemap updated for new routes.
- [ ] Build passes; route guard green.

---

## 7. What's enforced automatically

A prebuild gate — `scripts/verify-content-standards.ts` — **hard-fails the build** on
the structural invariants this standard requires (same philosophy as the Notion
boundary + route guards: assert the expected so drift goes red):

- Every published blog post has a `BLOG_SEO` entry (else it's missing from the sitemap).
- The out-of-state reference guide carries **no** affiliate/course/tracker/Notion link.
- The reference guide carries a "Last verified" stamp.
- Every **new** published blog post shows sources/citations. Legacy posts that predate
  this standard are grandfathered in `LEGACY_UNSOURCED` and printed as debt — retrofit
  them and shrink the set; when it's empty, every post is gated.

**Best-intent, not proof.** The gate verifies the author *did the sourcing work*, not
that a fact is *true* — nothing automated can. Truth, primary-vs-secondary quality,
balance, and "did you state what you couldn't settle" stay with the checklist above,
the `content` skill, and human review.
