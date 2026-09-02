# Package 9 — accessibility + voice (2026-09-02)

Autonomous run of cc-brief-p9-a11y-voice-2026-09.md. Contrast tokens, semantics, and
template/generator voice only. No fact, price, card order, badge, or disclosure position
changed (P12 verified intact: /california order 4.7 4.6 4.3 4.2 3.0, one Top Rated + one
Lowest price, disclosure above first CTA). Guards green; TypeScript compiles.

## Part A1 — Contrast tokens (computed WCAG ratios, sRGB)

| Token | Before | After | Ratio (after) | Where |
|---|---|---|---|---|
| `--color-accent` (text links + bg-accent CTA + white) | #16A34A | **#15803d** (green-700) | **5.02:1** on white (was 3.30:1) | globals.css; fixes text-accent links, icons, and the enroll button |
| `--color-accent-dark` (hover) | #15803d | #166534 (green-800) | 7.13:1 | hover state |
| amber CTA + white | bg-amber-600 (3.19:1) | **bg-amber-700** (hover amber-800) | **5.02:1** | OutOfStateCallout (the one amber/out-of-state button) |
| small `text-slate-400` on light | #94a3b8 (2.56:1) | **text-slate-600** #475569 | **7.58:1** white / **7.24:1** slate-50 | 12 files (metadata, "Last verified", Trustpilot labels, card icons); Footer keeps slate-400 (dark bg, light-on-dark) |

## Part A2 — Semantics (template-level)
1. State-picker `<select>` gets `aria-label="Choose your state"`.
2. Footer section headings h4 -> h2 (were skipping the outline; peers now, no h2->h4 skip).
3. Topic-page inner `<main>` -> `<div>` (was nested inside the layout's `<main className="flex-1">` on all 60 topic pages; exactly one main landmark per page now, verified 1 on the CA worth-it page).
4. Legal in-text links (/terms, /privacy, /disclaimer): `hover:underline` -> `underline` (always underlined; link-in-text-block).
5. /schools empty Review column header gets `<span class="sr-only">Review</span>`.
6. Directory "Visit" links get `aria-label={`Visit ${school.name}`}` (template-level; row data stays P8).

## Part B1 — Em-dash generator inventory (which generators wrote them)
- **Key Facts value template** (StateKeyFacts): "Yes — for ticket dismissal" / "Yes — but court acceptance varies" / "Yes — for point reduction" / "No — insurance discount only" -> commas.
- **onlineStatus enum** rendered in the Rules & Requirements card: display now swaps " — " for ", " (the enum keeps its em dash for internal matching so the contradiction guard and banners are untouched).
- **Video section H2** template ("{State} Traffic School — Video Guide" -> "… Video Guide").
- **Card price disclaimer** (state page) and **footer disclaimer** (Footer.tsx, two em dashes) rewritten as plain sentences.
- **SchoolCard TSP tooltip** title attribute.
- **Card generators = Schools-DB pros/cons/one-liner/Best-for/Not-for data** (B1 + B2 combined): 126 fields rewritten across base schools + all per-state variants; 391 em dashes -> commas (the consistent "claim, elaboration" bullet pattern; a comma is grammatically natural, verified on an 8-sample dry run and on the built CA cards, e.g. "Open-book final exam with 2 attempts, low pressure").
- Result: /california dropped from ~39 em-dash contexts to 6, of which 3 are P8 directory rows (license/name separators, DATA, stay) and 3 are CA FAQ answers (see flag).

## Part B2 — Banned words (Schools-DB before/after)
- DriversEd: "Comprehensive course content with strong state-specific material" -> "Covers the full state curriculum with strong state-specific material"; "Straightforward online format" -> "Simple online course".
- `straightforward` x20 (safe2drive one-liner/Best-for, ticketschool Best-for, and per-state variants) -> "simple" (special-cased "simple and straightforward" -> "simple" to avoid "simple and simple").
- `seamless` x1 (GoTo TX Not-for) -> "smooth". `comprehensive` x1 handled above. `genuinely`/`honestly`/"isn't just" x0 in card fields.
- Built grep: "Comprehensive course content" 0, "Straightforward online format" 0, seamless 0, honestly 0 in reader prose. The one remaining "straightforward" in built output is a directory link URL (straightforwarddriving.com — P8 business domain, not prose).

## Part B3 — Named stragglers
1. GoTo tagline: already reads "approved in 46 states" (factual); the slop "approved in almost every state" is nowhere. No change needed.
2. Review-page verdict lowercasing: `bestFor.toLowerCase()` -> lowercase first letter only, so state abbreviations (AZ, FL, MI, TX, PA) stay capitalized.
3. `genuinely` in body prose: /methodology (x2), /out-of-state (x1, also fixed its em dash), two blog posts (x1 each, em dash fixed), and NJ's True Cost record (x1) -> removed; each sentence stands without the adverb, claim unchanged.
4. British spellings (licence/programme/colour/…): grep-zero, confirmed.

## Flagged, not changed (P9 do-not: FAQ answers / program records)
The 3 remaining CA em dashes are inside CA FAQ answers (e.g. "erase my ticket? No — California traffic school masks…") and a few state-record prose fields carry em dashes too. P9's do-not protects FAQ answers and program records, so these were NOT swept here. **Recommend:** a P10/P11 no-em-dash data pass over State FAQ + record prose (meaning-preserving em-dash -> comma) to reach a full sitewide zero. Directory rows keep their "—" separators (P8 DATA).
