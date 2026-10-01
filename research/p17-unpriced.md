# P17 — tier-1 rows we could not price (for Sean to fill by hand)

Checked 24 September 2026 against each school's own state page, in the four
rollout states (California, Texas, Florida, Arizona). Arizona renders no tier-1
cards (No Partner Offer), so it has no tier-1 rows. Every other tier-1 row in the
four states is priced from the school's own page with a source URL and a date.

| School | State | URL checked | Why there is no price | What the row shows |
|---|---|---|---|---|
| DriveSafe Online | CA | https://www.drivesafeonline.org/california/defensive-driving-course/ | The site sells no California traffic violator school (ticket) course. Its California page offers insurance-discount courses only. | "Price not published on site" (Pricing row records the check, no price) |
| DriversEd.com | FL | https://www.driversed.com/florida/ | The site sells no Florida BDI course of its own. Its Florida page sends ticket customers to partner I Drive Safely, and `/florida/traffic-school/` returns 404. | "Price not published on site" (Pricing row records the check, no price) |
| DriveSafe Online | TX | https://www.drivesafeonline.org/texas/defensive-driving-course/ | The page contradicts itself. The English line says "$25 ... plus a $3 state-required administrative fee" ($28 all-in), and the Spanish line says the $25 includes the $3 fee. The checkout total needs an account. Omitted rather than guessed. | "See price on site" (no Pricing row written) |

## To fill by hand

- **DriveSafe Online TX:** open a checkout and record the all-in total. Then set
  `Price`, `Price Source URL`, `Price Checked` and `Price Includes Fees` on a
  `drivesafeonline-TX` Pricing row (Approved).
- **DriveSafe Online CA and DriversEd.com FL:** these are not pricing gaps. The
  schools do not sell that state's ticket course, so whether they should render a
  card there is an editorial question (see the P17 report).

## Remaining states (second PR)

Task 1b's pricing pass for the other 45 card states has not run yet. It runs with the
second PR, after the four-state PR is reviewed. Until then, those states keep the
pre-P17 layout, and their cards show "See price on site" where no confirmed price
exists (the old "Check website" label is retired sitewide).

## Sitewide PR (1 October 2026): unpriced tier-1 rows

Checked on each school's own page (28 September, re-verified 1 October 2026).
Evidence: `research/p17b/result-tier1.json`.

| School | State | URL checked | Why there is no price | Row shows |
|---|---|---|---|---|
| DriversEd.com | DE, ID, MO, NV, NJ, VA | driversed.com/<state>/ | Sells no course of its own in these states. Every state page sends ticket buyers to partner I Drive Safely ("Provided by our partner company I Drive Safely"). | Price not published on site |
| DriveSafe Online | NJ | drivesafeonline.org/new-jersey/defensive-driving-course/ | The page contradicts itself ($34.95 three times vs "all for just $28.95"), and the checkout total needs an account. | See price on site |
| GoToTrafficSchool | NJ | registration.gototrafficschool.com/course-selection/?st=NJ | The only NJ checkout course ($19.95 + $5 mail) is described as for drivers "ordered by a court". We can't confirm it is the MVC-approved Defensive Driving Program that earns the 2-point reduction. | See price on site |

### To fill by hand
- **DriveSafe Online NJ:** check out and record the all-in total.
- **GoToTrafficSchool NJ:** confirm with the school whether the $19.95 course is the MVC point-reduction program. If yes, record $24.95 all-in ($19.95 + $5 cheapest delivery).
- **DriversEd.com:** not a pricing gap. It sells no course of its own in these six states, so whether it should keep a card there is an editorial question for P12.
