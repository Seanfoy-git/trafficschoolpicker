# Package 12 — ordering, badges, quotes, disclosure (2026-09-02)

Autonomous run of cc-brief-p12-ordering-disclosure-2026-09.md. Two Sean-signed
decisions applied: cards order by TSP Score; the 500k claim is removed. Same rules /
stop conditions as P10/P11. No task changed a price/record/Key Facts/FAQ (P10/P11 own
those). Guards green; TypeScript compiles.

## Task 1 — Order by TSP Score (Sean-signed)
Added a shared comparator `bySchoolRank` in lib/notion.ts: TSP Score DESCENDING, schools
with no score last, tie-break price ASCENDING (nulls last). Wired into the state grid
(getSchoolPricingForState, within tier) and the home Top Picks. Removed the old
ascending-price + live-offer-float sort.
- **Before / after — /california:** GoToTrafficSchool (TSP 3.0), DriveSafe (4.6),
  Aceable (4.7), TSO (4.2), DriversEd (4.3)  ->  Aceable 4.7, DriveSafe 4.6,
  DriversEd 4.3, TSO 4.2, GoTo 3.0.  (The site's lowest-scored school no longer leads.)
- **Before / after — home Top Picks:** DriveSafe, Aceable, Highway  ->  Aceable 4.7,
  DriveSafe 4.6, Highway.
- /methodology gained an explicit ordering sentence (score desc, price tie-break;
  "Ordering updated September 2026").

## Task 2 — Coherent badges (generator-enforced)
Badges are now COMPUTED per page, not read from the static Notion "Badge" field:
"Top Rated" on the single highest-scored card, "Lowest price" on the single cheapest.
A card can carry both. Badge.tsx reduced to those two (dropped Best Value / Editor's
Choice / Fastest / Budget Pick). Nulled `school.badge` in mapSchool so the stale field
(e.g. GoTo's "Best Value") can't leak into the client payload.
- **Before:** /california rendered 3 "Top Rated" badges + 1 "Best Value" (incoherent).
- **After:** exactly 1 "Top Rated" (Aceable) + 1 "Lowest price" per page; "Best Value"
  badge gone sitewide (the one remaining string is the AZ directory business name
  "Best Value Traffic School" — P8 directory data, not a badge).

## Task 3 — "In their own words" -> "Our take"
Relabeled the card quote block "Our take" and stripped the quotation marks + italics so
our editorial one-liner is no longer dressed as the school's own words under its name.
(Sitewide em-dash purge stays P9; the block label/styling is the P12 fix.)

## Task 4 — Disclosure placement + privacy
- A visible FTC line now renders ABOVE the first monetized CTA in DOM order on every
  card page: state pages (above the tier-1 stack), home (above Top Picks), and the
  /reviews/<slug> pages (above the Visit button): "We may earn a commission if you
  enroll through our links. It never changes a school's score or rank." The long-form
  paragraph stays below the stack. (/schools is not monetized, so no change.)
- Privacy policy now discloses the per-click identifier: a random UUID generated per
  click, passed to the affiliate network as a tracking sub-ID for commission
  attribution, logged with the click metadata in a store that auto-expires after a
  limited retention period. Matches what the tracker actually stores (tracker/src:
  crypto.randomUUID -> aff_sub3, CLICKS KV with expirationTtl).

## Task 5 — 500k claim removed (Sean-signed)
TrustBar "Trusted by 500,000+ drivers" -> "Every claim sourced to the statute or
regulator" (alongside "All 50 states and DC covered" and "Last verified"). "500,000"
appears nowhere in built output.

## Not touched
Tracker links, offers, which schools render, card COUNT (unchanged — only order,
badges, labels, disclosure). Directories (P8), sitewide voice/em-dash purge (P9).
