# Package 15 — em-dash data pass (State FAQ + program-record prose) — 2026-09-02

Data-only. The two content fields P9's do-not carved out. No template, component, or
render-logic change. Only Notion fields edited; the sole git change is the regenerated
llms-full.txt.

## Inventory (before)
Grepped em dashes (U+2014) across all 51 states in the fields the P10 renderer reads:
- **State FAQ**: 23 em dashes across 11 states (WI, WY, NY, MT, MI, ME, KY, KS, IL, CO, CA).
  CA had the 3 P9 stragglers; the full grep found 20 more.
- **Program-record prose** (Intro Paragraph, True Cost of a Ticket, Eligibility
  Requirements, Court Acceptance Notes, Research Notes, Dismissal Answer, Approval
  Label, Course Hours): 43 em dashes across 19 states.
- Total 66. (Fun Fact and other non-rendered fields excluded — not read by the renderer.)

## Rule applied (meaning-preserving, per-occurrence reviewed)
Each of the 66 was classified in context:
- **Period + capitalize** where an independent clause follows (the majority), to avoid
  comma splices: e.g. "does not use a driver point system. The Wyoming Department…",
  "the conviction still stands. It is not a dismissal.", "a true point removal. The
  conviction remains…".
- **Comma** for fragments, appositives, and coordinating conjunctions: e.g. "N/A, no
  online option…", "ONCE IN A LIFETIME, not on a periodic cooldown cycle", "for 3
  years, but the underlying ticket remains", "PIRP program, point reduction and
  insurance discount".
- **Comma-bracketed** for parenthetical asides (both dashes -> commas): IL "and, when
  the court orders it, completion of…"; IL "the format, including whether an online
  option is offered, is set by the county"; IL "complete supervision, which often
  includes a traffic safety course when the court orders one, keep the ticket off…";
  VA "clinic attendance, required for drivers who accumulate excessive demerit points
  or as part of sentencing, must be completed…".
17 comma/parenthetical cases were applied as explicit find/replace; the rest took the
period-and-capitalize default.

## Guard + verification
- FAQ-integrity guard run after the batch: GREEN. Each rewritten State FAQ was
  JSON.parse-validated before writing (no broken JSON-LD, no duplicated answers).
- Page-contradiction guard (fresh build): GREEN (the comma/period swaps don't change
  dismissal/frequency/submitter polarity).
- Re-inventory after apply: **State FAQ em dashes = 0, program-record prose = 0.**
- /california built output: 3 em dashes remain, all P8 directory rows (license/name
  separators — out of scope); the 3 FAQ stragglers are gone.
- Spot-checked CA, IL, MI, KY, WY: all read naturally, not mechanically.

## Acceptance
- Em-dash count across 51 State FAQ fields: **0** ✓
- Em-dash count across program-record prose fields: **0** ✓
- FAQ-integrity guard green after final batch ✓
- 5-state natural-reading spot-check (incl. CA) ✓
- No field outside State FAQ + program-record prose changed (22 states, those fields
  only) ✓

Out of scope, untouched: directory row separators (P8), the axe sweep (claude-5d's P9
verification), everything else.
