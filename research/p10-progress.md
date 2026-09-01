# Package 10 — progress + handoff note (as of 2026-09-01)

Handoff insurance for continuing P10 in a fresh session. Read this + the P10 brief.

## Status summary

- **Phase 1 (renderer core): DONE + DEPLOYED + verified live.** PR #55, squash-merged to `main`.
- **Task 2c + NM pins (the approved 6-agent fan-out): DONE — records written to Notion, NOT yet deployed.**
- **Everything else: NOT STARTED** — Task 6 guard, Task 2a/2b/2d batches, prose/FAQ/meta alignment, Task 1 finish (banner authority + meta generator), Task 4 card gating, Task 5 regeneration.

## IMPORTANT: Notion is ahead of the deployed site

The six pin corrections below are written to the States DB but the site still serves the pre-P10 prose for them. Their **record + Court Notes + Eligibility** were corrected (drives the first screen), but their **Intro / FAQ / meta prose was NOT yet aligned**. So a build right now would ship corrected Key Facts against stale FAQ/Intro text = a fresh contradiction.

**=> Build the Task 6 contradiction guard BEFORE any Task 2a batch or deploy** (Sean's reorder). The guard turns "new Key Facts vs old FAQ" from a silent regression into a failed deploy.

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
