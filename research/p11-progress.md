# Package 11 — propagation progress (2026-09-01)

Autonomous run of `research/cc-brief-p11-propagation-2026-09.md`. Same rules/stop
conditions as P10. No P11 task conflicted with a live P10 value (checked each).

## Task 1 — Florida topic pages (Notion Questions DB blocks) — DONE
- **florida/is-traffic-school-worth-it** (id 2e09…d276): five→**eight** lifetime
  elections (s. 318.14(9), amended 2025); the stale **$930** exposure → the study's
  **$3,966** three-year surcharge; recomputed the return (~65 to 100x, not 15-20x);
  rewrote the "most modest return of the big states" verdict to a strong-return
  framing; rewrote the rationing paragraph off the corrected number; Meta Description
  + Sources + Last-verified all updated. Deciding source: TrafficSchoolPicker
  true-cost study FL row (surcharge $3,966) + s. 318.14(9) as amended by ch. 2025-77.
- **florida/can-you-take-traffic-school-online** (cb49…02eb4): "five-per-lifetime" →
  "eight-per-lifetime" (+ cite) in body + Meta Description; stamps refreshed.
- **florida/how-long-does-traffic-school-take** (77f9…dd07): "five-per-lifetime"
  rationing → eight (+ cite); course length (4h BDI) already correct, left as is.

## Task 2 — Blog MDX — DONE
- **does-traffic-school-remove-points.mdx**: Illinois out of point-reduction (court
  supervision defers judgment, no point reduction — matches /illinois); Kansas out of
  "full dismissal" into a court-by-court group (OK/NM moved with it); Wisconsin from
  "masking" to 3-demerit-point reduction (once/3yr, WisDOT, Trans 101.07); Michigan
  row = invitation-only BDIC, points withheld, no dismissal (MCL 257.320d); Texas
  mechanism relabeled the DSC dismissal (art. 45A.352), never "deferred disposition".
  Em dashes removed from rewritten rows; IL/WI/MI sources added; Sept stamp.
  **Beyond the 5 named** (same tables, direct P10 contradictions I corrected): CO row
  "masks ticket" → "no statewide program, court-by-court"; WA row invented "Level 1/2"
  → court-granted deferred finding once/7yr. **Flag:** Tennessee remains in the masking
  list (not a P10 parent I touched; TN is a driver-improvement point-removal state per
  hours-to-verify) — left for a later pass.
- **texas-deferred-disposition.mdx**: rewrote around the split — DSC dismissal right
  (art. 45A.352, once/12mo, the body's actual subject) vs deferred disposition
  (arts. 45A.301–.307, judge-granted, up to 180 days, may include a course). Fixed the
  45A.353 miscite → 45A.301–.307 (verified on statutes.capitol.texas.gov: 45A.302 is
  deferred disposition; 45A.352 is the DSC dismissal). Cost table reconciled to the TX
  study value (~$4,824 surcharge; course from $25). Title/desc/QuickAnswer reframed.
- **traffic-school-vs-paying-ticket.mdx**: the study-attributed CA/TX/FL/NY figures were
  ~¼ of the study; reconciled the table to the study (CA $234/$5,385/$5,619; TX
  $223/$4,824/$5,047; FL $204/$3,966/$4,170; NY $183/$2,370/$2,553); QuickAnswer and
  bottom-line reframed off the study range; Sept stamp.

## Task 3 — GA worth-it + NY how-long (Notion blocks) — DONE
- **georgia/is-traffic-school-worth-it** (5b09…ed55): "Georgia mandates no insurance
  discount" was false and contradicted the P10 parent — O.C.G.A. § 33-9-42 mandates a
  reduction of at least 10 percent for qualifying completion. Verdict/body/Key-Facts/
  Meta/Sources aligned to the parent; cite added.
- **new-york/how-long-does-traffic-school-take** (a309…4980): "6 hours" → **320 minutes
  (5h20m)** per the PIRP program (matches the parent); body, Key Facts, and Meta all
  updated; noted providers often schedule a 6-hour session that includes breaks.

## Task 4 — Price floors — FLAGGED (not executed autonomously)
The "from $19.95" floor on ~40 parent pages is a **national-base fallback** shown when a
school has no confirmed state-specific price; it undercuts confirmed state prices. The
TX Pricing DB rows are already correct (IDS $25, Aceable $29, others $25/$28.95 — all at
or above the DSC statutory $25 floor), but a school with a null TX price falls back to a
$19.95 base, so the parent shows "from $19.95" in violation of the $25 floor. The cost
post and texas-deferred post already use $25 for TX (fixed in Task 2). Fixing the parent
floor correctly requires either per-school state prices I cannot confirm (the brief
forbids inventing) or a change to the price-resolution fallback logic on a monetized
surface — both belong in the pricing pipeline / Scraper-Rules "Verified Price" workflow
(see memory: method-first pricing, daily xgrit sync would overwrite an ad-hoc edit).
**Recommend:** route the one dated price pull + the TX floor through that workflow.
