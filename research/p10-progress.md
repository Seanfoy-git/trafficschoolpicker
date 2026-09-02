# Package 10 — progress + handoff note (as of 2026-09-01)

Handoff insurance for continuing P10 in a fresh session. Read this + the P10 brief.

## Status summary

- **Phase 1 (renderer core): DONE + DEPLOYED + verified live.** PR #55, squash-merged to `main`.
- **Task 2c + NM pins (the approved 6-agent fan-out): DONE — records written to Notion, NOT yet deployed.**
- **Everything else: NOT STARTED** — Task 6 guard, Task 2a/2b/2d batches, prose/FAQ/meta alignment, Task 1 finish (banner authority + meta generator), Task 4 card gating, Task 5 regeneration.

## State of play (updated)

- The **six pin states (LA/OK/OR/TX/VA/NM) are now FULLY reconciled** end-to-end: record + Eligibility + Court Notes + Intro + FAQ + meta all aligned to the corrected framing. A build (commit d779129) is deploying them consistently. This happened because pushing this very note triggered a build with Notion ahead of prose (exactly the risk Sean warned about) — caught and closed manually. LA was the worst: old prose had court-by-court (vs statewide statutory), a submitter double-answer, and a length double-answer; all fixed.
- **Every OTHER state's prose is still un-audited.** So the "new Key Facts vs old FAQ" risk is live for all Task 2a/2b/2d states the moment their records change.

**=> Build the Task 6 contradiction guard BEFORE any Task 2a batch** (Sean's reorder). The guard turns "new Key Facts vs old FAQ" from a silent regression into a failed deploy. The manual LA scramble above is the proof of why.

## Phase 1 — what shipped (live on prod)

`components/StateKeyFacts.tsx`, `lib/types.ts`, `lib/notion.ts`:
- Ticket dismissal row names the mechanism from the model instead of omitting / bare Yes: court-discretion → "Court-by-court", court-program → "Via a court program, not a retail course", point-reduction → "No, point credit instead". New per-state **`Dismissal Answer`** override (States DB rich_text field, added) renders verbatim when set (for masking / withheld-adjudication states).
- Fixed the truncated eligibility cells (CT/KS/MN/MS/NE/SC): old `firstSentence()` broke on the period inside abbreviated cites ("Conn.", "K.S.A."); now renders the full sentence with its cite, dropping only the trailing "Last checked …" stamp (`eligibilitySummary()`).
- Wired `dismissalAnswer` + `administeringBody` into `StateInfo` (read from Notion). `administeringBody` is read but **not yet used** — it's for the Task 1 eligibility-banner authority + meta generator (still to do).

Verified live: CT/MN/MS/NE/SC full cites render; trackers aceable:CA + idrivesafely:KS intact.

## Task 2c + NM — six pins resolved (records written, page IDs + deciding source)

All URLs resolved and supported the claim; nothing was unpinnable.

1. **Louisiana** (`8b69e794435283f796c581668bea840c`) — La. C.Cr.P. art. 892.1.
   - Frequency **once within any 2-year period** (NOT 12 months): E(4) "…does not indicate successful completion…within the **two years** immediately preceding".
   - Submitter **driver → court** (court then reports to OMV): H(1) certificate "**accepted by the court**"; H(2) "**the court shall report**…to the Department".
   - **Statewide statutory** dismissal, first offense only, excludes 25+ over: H(1) "the court **shall** set the conviction aside".
   - Written: model=dismissal (Online Dismisses=YES), Cert=Driver Submits, Admin=Court, Dismissal Answer="Yes, first offense, once per 2 years", Program Source=art. 892.1, Eligibility+Court Notes rewritten. Source URL: https://codes.findlaw.com/la/code-of-criminal-procedure/la-code-crim-proc-tit-xxx-art-892-1/ (Justia 403s automated fetches; FindLaw + legis.la.gov corroborate).

2. **Oklahoma** (`d5e9e7944352834cb2ca01766bdf9529`) — Service Oklahoma.
   - 2-point credit is **classroom-only**, online refuted; once/24mo: "State Statute requires a **class room course** of instruction, **cannot be done online**." URL: https://intercom.help/service-oklahoma/en/articles/8369984
   - Written: model=Court discretion, Online Dismisses=NO, Online Removes Points=NO, Dismissal Answer="Court-by-court", Program Source="Service Oklahoma point credit (classroom only); 47 O.S. § 6-206.1", Eligibility+Court Notes rewritten.
   - **Task 4 (Sean's adjustment #1):** the online cards on /oklahoma must NOT claim the 2-point credit — scope their claims to court-discretion dismissal only, same pattern as MI/MN. Add OK to the Task 4 gating list.

3. **Oregon** (`3e19e794435283fb8761012d599dc263`) — courts.oregon.gov + ODOT.
   - **Court-by-court** (court approval required), and where accepted the course may be **online or classroom** — the old "in-person only" note is wrong. ODOT: "A course may be either in the classroom **or online**"; Union County: "**court approval MUST be obtained**".
   - Written: model=Court discretion, Online Dismisses=NO, Admin=Court, Dismissal Answer="Court-by-court", Program Source set, Eligibility+Court Notes rewritten.

4. **Texas** — art. 45A.356. **Key Facts "Driver Submits" is CORRECT** (no record change needed). 45A.356(a): defendant must "**present to the court**…a uniform certificate". **To fix in Task 4:** the card line "same-day court reporting" is wrong — the driver submits the certificate to the court by deadline; the court then reports to DPS. Also delete the "shortest state-mandated course length in the country" superlative (our own TN/UT pages say 4 hours).

5. **Virginia** (`f079e79443528278b41d816bfdbead30`) — dmv.virginia.gov/licenses-ids/improvement/di-reason.
   - Submitter = **School Submits** (clinic reports electronically to DMV): "clinics are required to **electronically report** clinic completion information to DMV within **24 hours**." (Driver may separately submit to court/insurer.)
   - Written: Certificate Submission="School Submits". NOTE: VA's OTHER P10 items (one-benefit-story: 5 points OR discount mutually exclusive, once/24mo; stray cite 46.2-499→46.2-489/498; FAQ "12 months"/"both benefits" dedup) are Task 2b/2d — NOT done yet.

6. **New Mexico** (`d179e794435283dfbbdf0102d14522ea`) — 18.19.5 NMAC / § 66-5-30 NMSA + MVD Dismissals page.
   - **No statewide MVD point-credit program exists** — a course is only a post-suspension reinstatement condition; points expire 12mo. Dismissal is court/DA-discretionary deferral. Deleted "accepted statewide for point reduction".
   - Written: model=Court discretion, Online Dismisses=NO, Online Removes Points=NO, Admin=Court, Dismissal Answer="Court-by-court", Program Source set, Eligibility+Court Notes rewritten.

## Architectural notes for whoever continues

- **The renderer is status-driven, not program-field-driven.** P6 wrote Program Name/Administering Body/Program Type/Entry Path/Benefit Summary/Program Source to Notion but the SITE never read them. Phase 1 started reading `administeringBody` + `dismissalAnswer`. The "bare Ticket dismissal: Yes" bug = wrong `onlineStatus`/`Online Model` records, not a renderer bug. So Task 2 record corrections fix most of it; the renderer already handles the rest.
- **`Online Model` select** drives `deriveOnlineStatus` (lib/notion.ts): "Court discretion" / "Court program only" / "Point reduction" override the checkboxes; empty + Dismisses=YES → "Online — ticket dismissal". To make a state court-discretion, set Online Model="Court discretion" + Online Dismisses Ticket=NO.
- **Deploy resilience is now in main** (`lib/notion-retry-fetch.ts`): 429-aware retry so builds survive Notion rate limits. Builds no longer need cooldown-redeploys. Still, avoid running local builds concurrently with a Vercel deploy (same token).
- **Meta generator (Task 1):** the States DB already has `SEO Title` + `SEO Description` text fields — the metas can be generated into those from the model, or seo-config STATE_SEO can read the model. Metas are currently hardcoded in `lib/seo-config.ts`.
- **FAQ integrity guard already exists** (`scripts/verify-faq-integrity.ts`, in prebuild) — it fails on duplicate/contradictory dismissal answers within a state's State FAQ JSON. The Task 6 guard is broader (checks BUILT HTML + FAQPage JSON-LD for dismissal/length/frequency/submitter double-answers + the P13 join patterns).

## Next steps, in order (Sean's sequence)

1. **Task 6 guard first.** Post-build check (add to `postbuild` in package.json) that fails when a state page's rendered HTML or FAQPage JSON-LD contains: (a) both affirmative + negative dismissal answers; (b) two course-length values outside a labeled secondary program; (c) two frequency windows; (d) both "Driver Submits" and a school-reports phrase. Also grep the P13 join patterns `[a-z]but your license` and `[a-z]Traffic School Rules`. Plant one violation, prove it fails, remove the plant.
2. **Task 2a batch: CO, IA, HI, MT, NC** (fabrication deletions; brief table has the values + URLs — check-then-write, don't re-research). Then run the guard.
3. Continue: 2b reframes (MI, OH, NY, WV, WI, VA, CA, FL, WA, MS, NH, RI), 2d small fixes (AZ, SC, PA, MO, DE, IN, GA-labels), aligning each state's Intro/FAQ/meta as you go so the guard passes.
4. Task 4 card gating (DC decision = present DC DMV's two approved providers + demote national cards + drop their Product JSON-LD; MI/MN/OK; systemic "state-approved" Product template).
5. Task 3 FAQ dedup audit (51 states) + Task 5 regenerate FAQPage/metas/llms.
6. Full verify set (brief's grep block) + deploy.

## Flag
- No corrected state so far had its last Key Facts row stripped by an omission (NM/OR/OK still render availability + dismissal(Court-by-court) + eligibility rows).

---

## 2026-09-01 — Task 6 guard SHIPPED (autonomous continuation)

**Note on authority:** the standalone brief file `cc-brief-p10-keyfacts-2026-09` is
NOT in the repo — only this progress doc + `research/hours-to-verify.md`. Task 2 is
therefore run against hours-to-verify.md (its primary-source research basis) plus
first-party source verification per docs/content-standards.md, with omitted-beats-
guessed applied. Deletion-class fixes (overstated "Yes" -> court-by-court) are
corroborated by each state's *own already-correct FAQ prose* + hours-to-verify.md.

**Built `scripts/verify-page-contradictions.ts`** and wired it into `postbuild`
(after verify-no-internal-leaks). It reads each built state page's Key Facts `<dl>`
+ FAQPage JSON-LD and fails the build on: (a) dismissal polarity double-answer
(Key Facts value vs the answers to *dismissal questions* only — an "erase" or
"can I take it online" answer is a different question and never counts; a
"Court-by-court" Key Facts value is neutral); (b) a "how long" answer whose hour
value differs from Key Facts course length, outside a labeled secondary program;
(c) Key Facts eligibility frequency window vs a different FAQ window; (d) Key Facts
submitter vs the opposite party in the FAQ (a page that names *both* parties =
court-dependent nuance, passes; a downstream "court reports to DMV" is not a
submitter answer). Plus greps the two P13 join signatures.

**Calibration mattered:** naive matching over the whole page gave 30 findings, ~half
false positives (CA "masks not erases", NJ multi-benefit windows, OK "within 24
hours" deadline read as course length, LA "provider … and submit it yourself" read
as school-submits). Tuned to the four structured surfaces above -> **zero false
positives**, 13 real findings. **Proven:** planted `Ticket dismissal: Yes` onto
Kansas (FAQ says no-statewide) -> guard exits 1 with the right message; clean
fixture passes; plant removed.

**The 13 findings = the live Task 2/3 worklist** (stale local build, so LA/NM here
are pre-deploy artifacts that a fresh build clears):
- **Genuine 2a (overstated dismissal -> court-by-court):** colorado, hawaii, iowa,
  montana, north-dakota. (KF "Yes" vs each page's own FAQ "no statewide / court
  discretion".)
- **Genuine 2b:** michigan (KF "Yes" but point-reduction BDIC; phantom 8-hr
  "Driver Improvement Program" vs BDIC 4-hr; KF "Driver Submits" but provider
  notifies SOS -> should be School Submits); wisconsin (KF "Yes" but court-by-court);
  virginia (eligibility 24mo vs FAQ 12mo).
- **Task 3 wording (monetized, keep product story):** georgia — FAQ "Georgia
  defensive driving … does not dismiss" (about the DDS classroom point-reduction)
  reads as contradicting KF "Yes" (the online court-dismissal courses). Align the
  FAQ wording to the existing amber callout; do NOT change GA's product story.
- **Stale-build artifacts (already reconciled in Notion, redeploy clears):**
  louisiana, new-mexico.

**Deploy-gating reordering:** because the guard is now in `postbuild`, a Vercel
deploy fails until these are cleared. So the "deploy after each batch" cadence
becomes "clear the guard, then deploy green" — safer given Sean's records-ahead-of-
prose concern. Guard commit is on main but **push is held until the build is
guard-green** (else main's HEAD deploy would red-fail on the 13 known contradictions).

## 2026-09-01 (cont.) — Task 2a/2b batch: 8 states reconciled, guard down to 1 (GA)

All changes are Notion writes (States DB); staged behind the guard (no deploy yet —
GA still blocks a green build, see Flag). Fresh-cache validation build confirms each
fix cleared its guard finding with no new contradiction. Method: verify against a
first-party source, then set the record to match the state's own already-sourced
prose (conservative deletion of an overstated claim).

**2a — no statewide program -> Court discretion** (Online Model="Court discretion",
Online Dismisses Ticket=false, Dismissal Answer="Court-by-court"; KF renders
"Court-by-court"):
- **CO** (id 8469…05c8). Scoped to the DISMISSAL overstatement only. Source note:
  CO has no statewide *dismissal* program (court-by-court); its own intro already
  says so. **Left its point story alone and FLAGGED it** — HB24-1250 (signed
  2024-06-04, eff. 2024-08-07, Chapter 391) created a statutory driving-improvement
  *points-waiver* framework with specifics left to DOR rulemaking, so the record's
  "reduce 4 points/12mo" claim and the intro's "no points program" line are now BOTH
  possibly stale and need the DOR rule to pin. Not touched (product-story + unpinnable).
  Source: leg.colorado.gov/bills/hb24-1250.
- **HI** (4369…bb9a), **IA** (9cb9…81b1), **MT** (73f9…cd38). Each intro/court-notes
  already state court-discretion / no statewide dismissal; hours-to-verify.md classes
  all three NO_STATEWIDE_PROGRAM. Clean overstatement deletions.

**2b — statewide point-reduction -> Point reduction** (Online Model="Point reduction",
Online Dismisses Ticket=false; KF renders "No, point credit instead"):
- **ND** (6239…feda). Source: dot.nd.gov — reduce total points by 3, once/12mo; also
  "in lieu of points" for some ≤5-point violations. Dismissal is court-by-court.
- **WI** (89c9…d931). Source: docs.legis.wisconsin.gov Trans 101.07 — reduce demerit
  points by 3, once every 3 years; no statewide dismissal (some courts defer). Its own
  intro already cited Trans 101.07.
- **MI** (fd29…cb0a). Point-reduction reframe + two more fixes, all matching MI's own
  FAQ: Certificate Submission "Driver Submits"->"School Submits" (FAQ: "the school
  handles state reporting"); corrected the phantom FAQ answer "Driver Improvement
  Program requires 8 hours" -> BDIC 4 hours (MCL 257.320d; matches KF + FAQ items 4/6).
  **MI Task 4 still open:** BDIC is invitation-only (SOS mails eligibility) — whether
  to demote retail cards / go informational is the Task 4 decision (kept cards for now;
  did not remove monetization).

**2d — frequency dedup:**
- **VA** (f079…dead30; note's id had a typo — last segment is `816bfdbead30`).
  FAQ said "Once every 12 months"; record eligibility + Va. Code § 46.2-498 + VA DMV
  say **once every 24 months** (5 safe-driving points, only once per 2 years). Fixed the
  FAQ answer to 24 months + added the § 46.2-498 cite. Point/dismissal framing untouched.

**Guard now: 1 finding — georgia only.** => ready for a green build the moment GA is
resolved.

## FLAGS for Sean / claude-5d (do NOT let me guess these)

1. **GA (BLOCKS the green deploy).** Guard: KF "Ticket dismissal: Yes" vs FAQ "Georgia
   defensive driving … does not dismiss … reduces active points by up to 7." GA has two
   tracks (online course -> court nol pros dismissal = the monetized product; DDS 6-hr
   classroom/Zoom -> point reduction, not online). The honest fix depends on GA's
   *product story*: is online->dismissal a statewide "Yes" or really court-by-court
   (the amber callout says "accepted by MANY GA courts … check with your court" — that
   reads court-by-court)? GA is monetized and NOT in the Task 2 list, so per the STOP
   rule I did not touch it. **Decision needed:** keep KF "Yes" and relabel the DDS
   "does not dismiss" content under a non-"dismiss" question, OR move GA to court-
   discretion. Either changes/【clarifies】the product story -> claude-5d.
2. **CO point story (HB24-1250).** See 2a above — needs the DOR points-waiver rule to
   state specifics; intro + Court Notes + Fun Fact are internally inconsistent post-2024.
3. **Brief absence.** `cc-brief-p10-keyfacts-2026-09` is not in the repo, so this whole
   continuation ran off hours-to-verify.md + first-party verification, not the brief's
   pinned URLs/values. If the brief exists, reconcile my 8 records against it before
   deploy. NC (in the 2a list) did NOT fire the guard and has a real PJC + DMV point-
   reduction story — left untouched pending the brief.

## 2026-09-01 (cont. 2) — claude-5d decisions applied; brief reconciled; 9 states SHIPPING green

Brief is now in-repo (`research/cc-brief-p10-keyfacts-2026-09.md`). Reconciled the 8
staged records + GA against it. **Fresh-cache validation build: page-contradiction
guard GREEN across all 51 states.** Built-HTML grep checks pass: no bare "Ticket
dismissal: Yes" on the 9; `reduce points by 4`=0; `accepted statewide` on GA=0;
`Iowa DOT-approved`=0; GA Product schema still present (offer 21 intact); freshness
stamps present.

**GA (decision #1 applied):** Online Model="Court discretion" (KF renders
"Court-by-court"), cards STAY, banner carries the confirm-with-court line. FAQ split:
the dismissal Q now answers "Sometimes. Georgia has no statewide dismissal law…confirm
with your court first"; the points/length/online Qs scope to the DDS 6-hour classroom
course (O.C.G.A. § 40-5-86, classroom or live online, self-paced online does not
qualify). Court Notes reworded off "accepted statewide". Meta (seo-config) stops
promising statewide dismissal / points-via-online.

**CO (decision #2 applied):** deleted the "4 points/12mo", "accepted statewide",
"approved by CO DMV", 18-month + 8-hour FAQ answers. NO point-waiver specifics render.
One body sentence added (Court Notes): HB24-1250 (Ch. 391) directs a course-based
points waiver, specifics by DOR rulemaking, "Last checked September 2026". Intro/Fun
Fact/eligibility de-conflicted. Online Removes Points=false.

**Reconciliation notes (where I differed from the brief, primary source won):**
- **WI:** I had staged Point reduction; the brief (2b) + WisDOT show **no online path**
  for the 3-point reduction (it runs through technical-college classroom courses,
  Trans 101.07), so the online product is **court-discretion dismissal**. Corrected
  Model to "Court discretion"; scoped the point-reduction to classroom; unified the
  split cite (body § 343.32 → Trans 101.07/WisDOT).
- **ND:** not in the brief at all. Kept my source-verified change (dot.nd.gov: 3-point
  reduction once/12mo) → Point reduction. Flag if the brief author intended otherwise.
- **VA:** cert was already "School Submits" (the stale-build "Driver Submits" was old).
  Applied the mutually-exclusive benefit (points OR discount) to FAQ item 0; True Cost
  cite § 46.2-499 → §§ 46.2-489/498 and "18 to 24" → 24 months.
- **HI/IA/MT:** brief 2a deletions applied (HI: unsourced 8hr gone; IA: all "Iowa
  DOT-approved online" + 6hr/$20 gone, reframed to no-statewide + the 8hr classroom
  DIP; MT: dismissal-only fix, matches brief). Metas honestied in seo-config.
- **MI:** brief 2b applied (dismissal No via point-credit, cert School Submits, phantom
  8hr FAQ → 4hr BDIC). **MI Task 4 still open:** invitation-only card gating
  (informational / KY pattern) deferred to Task 4 per claude-5d "don't hold the 9
  hostage" — MI still shows cards under Point reduction for now.

All meta descriptions for the 9 rewritten in `lib/seo-config.ts` (the live source;
Notion SEO fields don't render yet — Task 5). SEO "2025" in Notion SEO Title fields is
cosmetic until Task 5 regenerates metas from the model.

## Remaining P10 work (unchanged, still open)
- Task 2 remainder: OH, NY, WV, CA, FL, WA, MS, NH, RI (2b) and AZ, SC, PA, MO, DE, IN
  (2d) — none currently fire the guard, but their prose is still un-audited.
- Task 4 card gating (DC two approved providers; MI informational; MN 55+ scope; OK
  dismissal-only + "DPS"->Service Oklahoma + em-dash; TX card submitter line; the
  "state-approved" Product template).
- Task 3 FAQ dedup (51; GA is the first real one) + Task 5 regenerate metas/llms + full
  verify script + the SEO "2025"->2026 titles noticed on CO/HI/IA/MT.
