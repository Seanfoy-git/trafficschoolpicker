# Package 17: comparison first, every row priced (progress, 24 September 2026)

Autonomous run of the P17 brief. Branch `p17-comparison-first`. **PR 1 covers the
four-state rollout only (California, Texas, Florida, Arizona).** The layout is gated
by `P17_LAYOUT_STATES` in `lib/comparison.ts`. The other card states keep the pre-P17
order until Sean reviews these four (the brief requires that).

Every price below was read from the school's own page on 24 September 2026. Each
has its URL and a verbatim quote in `research/p17-price-data.json`, and was written
to Notion through `scripts/apply-comparison-data.ts` (dry run first, read back
after writing). Nothing was hand-edited in built HTML.

## Task 1: price data

**Fields.** P11's equivalent already existed, so no parallel fields were created.
The per-school, per-state price record is the **School Pricing DB** row (P11's
verified-price pull lands there, and the render waterfall reads it). I added
**Price Source URL**, **Price Checked** and **Price Includes Fees** to that row
rather than duplicating `Price` on the Variants DB. Variants DB got the per-school
*facts* (Timers, Final Exam source, Completion Reporting, each with a source URL).
Tier 2 rows live on the **School Directory DB** (Display Name, Price, Price Source
URL, Price Checked, Price Note, Price Includes Fees, plus the same facts).

**Syncs keep provenance fresh.** `sync-xgrit-prices.ts` (IDS, Aceable, daily) and
`sync-jsonld-prices.ts` (Improv, weekly) now stamp Price Source URL and Price Checked
on every read. The xgrit sync was written today: 50 rows stamped.

**Two xgrit prices corrected from the school's own checkout** (a new dated
`CHECKOUT_ADJUST` map in `scripts/lib/ids-pricing.ts`, so the daily sync keeps them):
- **Aceable FL: $5.94 → $34.95.** The $5.94 on the page applies only if you enrol
  in an auto-renewing Allstate Roadside subscription ($5 a month after the first
  month). The course-only checkout total is $34.95.
- **I Drive Safely TX: $25 → $28 (all-in).** Checkout adds a mandatory "Texas
  Required Admin Fee $3.00".

**Texas floor (1d).** No Texas row is under $25.00, and the guard enforces it. One
Texas site (aaddisondrivingschool.com, $24.99, "Coming Soon") was not published.

**Unpriced tier-1 rows (1c).** See `research/p17-unpriced.md`: DriveSafe Online CA
(no CA ticket course), DriversEd.com FL (no FL BDI of its own), DriveSafe Online TX
(its own page contradicts itself on the $3 fee).

**Priced but deliberately not published (accuracy over coverage):**
- **FastOneDay (CA):** its own site shows $21.90, $23.90 and $25.90.
- **Harker Heights (TX):** a scheduled live class booked by phone, not self-paced.
- **Driving Zone (TX):** the site header carries injected spam links.
- **Five AZ sites on one shared platform, plus Drop The Ticket:** the fee table
  doesn't say whether it's the online or the classroom price.
- **NiSE (AZ):** its checkout is headed with another school's name.
- **County-restricted FL providers (15):** a statewide table shouldn't send, say, a
  Tampa driver to a school approved only for Orange/Osceola citations. They stay in
  the directory without a price.

## Task 2: the table

The page order follows 2a exactly on the four states:
1. H1 (the question).
2. Generated subhead.
3. Method statement.
4. Compact Key Facts strip (same P10 values, no heading).
5. P12 disclosure (only when a monetized link is on the page, so not on Arizona).
6. **H2 Compare N ...**: a real `<table>` with `<thead>` and `scope="col"`.
7. **H2 Reviewed in detail**: the P12 cards, unchanged order and content.
8. Everything else, moved down unchanged.

On mobile the table scrolls sideways inside a focusable region with the School
column pinned, so it is still a table at 320px (the page itself stays 320px wide).

On comparison pages, a card whose price has no recorded source now shows the same
no-price label as its table row, so the card and table can never disagree. The
"Lowest price" badge follows the data. (It moved in FL because Aceable's price
changed; see Task 1.)

| State | Rows | Tier 1 (priced) | Tier 2 | Priced share | Range |
|---|---|---|---|---|---|
| California | 25 | 5 (4) | 20 | 96% | $5.00 to $29.00 |
| Texas | 27 | 7 (6) | 20 | 96% | $25.00 to $34.00 |
| Florida | 26 | 6 (5) | 20 | 96% | $7.00 to $34.95 |
| Arizona | 13 | 0 (No Partner Offer: no cards) | 13 | 100% | $30.99 to $51.90 |

Tier 2 rows stored but not shown (over the 20-row cap, or excluded above) stay on
their Directory rows and fill in automatically if a shown row drops out.

## Task 3: JSON-LD

The ItemList follows table order. A priced row is a Product whose Offer.price equals
the table cell. An unpriced row is a plain named ListItem, so no Product ships
without an Offer. There is no aggregateRating on tier 2 (or anywhere), and no
merchant-listing fields. The approval claim is suppressed on court-discretion
states, as before.

## Task 4: title, H1, meta

Everything is generated from the table data:
- Title: "Which online {noun} should I use in {State}? N schools compared (2026)",
  with the site suffix from the layout template.
- og:title is the H1.
- The meta is capped at 160 characters. It drops the benefit phrase first, then
  shortens step by step (every current meta drops the benefit phrase).

The program noun and benefit come from the States DB **Program Name** and **Benefit
Summary** (existing, previously empty fields). Breadcrumbs, the sitemap and the
state picker are untouched. The blog and review titles are untouched.

## Task 5: counts and Florida

- **5a.** The hero "from N" and the directory "All N" now both print
  `directory.length`. They are marked `data-count="directory"` and the guard checks
  them on all 51 + DC. The old hero added the tier-1 count, which was the source of
  216 vs 211.
- **5b.** Florida's 12 non-school rows are archived to Notion trash (restorable).
  The glued-on delivery-method suffixes are cleaned, CyberAcitve is now Cyberactive,
  and the FL-BDI placeholders are emptied (FLHSMV publishes no provider numbers).
  The 44 official Internet BDI providers missing from our rows were added from the
  FLHSMV list. Florida now lists 51.

## Task 6: consistency

- **6a (rule chosen): "from $X" = the minimum of all priced table rows.** It appears
  in the Key Facts "Typical cost", the meta range, the JSON-LD Offers and llms.txt.
  It is documented on /methodology ("How we check prices"). It is the only rule
  under which llms.txt, the page and the JSON-LD can all agree, since the JSON-LD
  now lists every priced row. California: $5.00 on all three (was "from $5" in
  llms.txt vs "from $29" on the page).
- **6b.** The estimate label is now in the sentence that states the surcharge: in
  the study stat on every state page (generator), in the True Cost prose of CA,
  TX, FL and AZ (Notion field), and in llms-full.txt.

## Task 7: guard

`scripts/verify-comparison-first.ts` runs in postbuild and checks (a) through (f).
Proof: I planted `data-price="19.95"` in the built Texas page and the guard failed
with exit 1 ("Texas row 'I Drive Safely' priced $19.95, below the $25.00 floor").
I restored the file and it passed with exit 0.

## Verification (local production build)

- All prebuild and postbuild guards are green, the new one included.
- Axe on /california, /texas, /florida, /arizona, /ohio, /new-york, /methodology
  and a question page, at 1280px and 320px, reports **0** violations for the six
  P9 rules. No page scrolls sideways at 320px.
- The brief's verify script, run against the local build:
  - The H1 begins "Which online".
  - The first H2 is "Compare N ...".
  - "Check website" appears 0 times.
  - Each page has a day-level "Prices verified 24 September 2026".
  - Offer prices are present.
  - The Texas minimum is $25.00.
  - The Florida junk strings appear 0 times.
  - The counts are equal.
  - The California minimum is the same in llms.txt, the page and the JSON-LD.
  - "not a state figure" is present.

## Rendered tables (from the built HTML, 24 September 2026)

`*` = the all-in total the school's own page states. Tier 1 = reviewed cards (tracker-linked); tier 2 = directory schools (direct links).

### california (25 rows)

| # | Tier | School | Price | Course length | Timers | Final exam | Reporting | TSP | Source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Aceable | $29.00 | Not stated | No | Yes | School reports | 4.7 | https://www.aceable.com/traffic-school/california/ (checked 24 Sep 2026) |
| 2 | 1 | DriveSafe Online | Price not published on site | Not stated | Not stated | Yes | School reports | 4.6 | https://www.drivesafeonline.org/california/defensive-driving-course/ () |
| 3 | 1 | DriversEd.com | $21.95 | Not stated | Not stated | Yes | School reports | 4.3 | https://www.driversed.com/california/traffic-school/ (checked 24 Sep 2026) |
| 4 | 1 | Traffic School Online | $22.47* | Not stated | Not stated | Yes | School reports | 4.2 | https://www.trafficschoolonline.com/state/california-traffic-school/ (checked 24 Sep 2026) |
| 5 | 1 | GoToTrafficSchool | $23.90 | Not stated | Not stated | Yes | School reports | 3.0 | https://www.gototrafficschool.com/state/california-online-traffic-school (checked 24 Sep 2026) |
| 6 | 2 | $5 Bucks Traffic School | $5.00 | Not stated | No | Yes | School reports |  | https://www.5buckstrafficschool.com/ (checked 24 Sep 2026) |
| 7 | 2 | $5 Dollar Traffic School | $5.00 | Not stated | No | Yes | School reports |  | https://www.5dollartrafficschool.com/California/Traffic-School-Course/home.php (checked 24 Sep 2026) |
| 8 | 2 | Ticket Toaster | $14.95* | Not stated | Not stated | Yes | School reports |  | https://tickettoaster.com/ (checked 24 Sep 2026) |
| 9 | 2 | Urban Traffic School | $14.99 | Not stated | No | Yes | School reports |  | https://www.urbantrafficschool.com/ca-traffic-school-price (checked 24 Sep 2026) |
| 10 | 2 | Daily Traffic School | $19.95 | Not stated | No | Yes | School reports |  | https://cacourseprovider.com/payments/cp/register.php?aid=MzYw&amp;cid=internet (checked 24 Sep 2026) |
| 11 | 2 | Easy Traffic School | $19.95* | Not stated | No | Yes | School reports |  | https://www.easytrafficschool.com/ (checked 24 Sep 2026) |
| 12 | 2 | EasyTrafficOnline.com | $19.95* | Not stated | No | Yes | School reports |  | https://www.easytrafficonline.com/ (checked 24 Sep 2026) |
| 13 | 2 | Rapid Traffic School | $19.95* | Not stated | Not stated | Yes | School reports |  | https://www.rapidtrafficschool.com/ (checked 24 Sep 2026) |
| 14 | 2 | Cheap and Speedy Traffic School | $23.90 | Not stated | Not stated | Yes | School reports |  | https://www.cheapandspeedytrafficschool.com/ (checked 24 Sep 2026) |
| 15 | 2 | EasyToFinish.com | $23.90 | Not stated | Not stated | Yes | School reports |  | https://www.easytofinish.com/ (checked 24 Sep 2026) |
| 16 | 2 | Cheap Fast Course | $24.95 | Not stated | No | Yes | School reports |  | https://cheapfastcourse.com/ (checked 24 Sep 2026) |
| 17 | 2 | Cheap Quick Course | $24.95 | Not stated | No | Yes | School reports |  | https://cheapquickcourse.com/ (checked 24 Sep 2026) |
| 18 | 2 | Easy Fast Course | $24.95 | Not stated | No | Yes | School reports |  | https://easyfastcourse.com/ (checked 24 Sep 2026) |
| 19 | 2 | IMPROV Traffic School | $24.95 | Not stated | No | Yes | School reports |  | https://www.myimprov.com/traffic-school/california/ (checked 24 Sep 2026) |
| 20 | 2 | Quick Traffic Course | $24.95 | Not stated | No | Yes | School reports |  | https://quicktrafficcourse.com/ (checked 24 Sep 2026) |
| 21 | 2 | Safe2Drive | $24.95* | Not stated | No | Yes | School reports |  | https://www.safe2drive.com/california-traffic-school.aspx (checked 24 Sep 2026) |
| 22 | 2 | Simple Traffic Course | $24.95 | Not stated | No | Yes | School reports |  | https://simpletrafficcourse.com/ (checked 24 Sep 2026) |
| 23 | 2 | Super Quick Course | $24.95 | Not stated | No | Yes | School reports |  | https://superquickcourse.com/ (checked 24 Sep 2026) |
| 24 | 2 | TrafficSchool.com | $24.95 | Not stated | No | Yes | School reports |  | https://www.trafficschool.com/CA-California/DMV-approved-online-traffic-school/ (checked 24 Sep 2026) |
| 25 | 2 | Best Online Traffic School | $27.99* | Not stated | Not stated | Yes | School reports |  | https://start.bestonlinetrafficschool.co/sign-up (checked 24 Sep 2026) |

"Not stated" cells: Aceable: Course length; DriveSafe Online: Course length, Timers; DriversEd.com: Course length, Timers; Traffic School Online: Course length, Timers; GoToTrafficSchool: Course length, Timers; $5 Bucks Traffic School: Course length; $5 Dollar Traffic School: Course length; Ticket Toaster: Course length, Timers; Urban Traffic School: Course length; Daily Traffic School: Course length; Easy Traffic School: Course length; EasyTrafficOnline.com: Course length; Rapid Traffic School: Course length, Timers; Cheap and Speedy Traffic School: Course length, Timers; EasyToFinish.com: Course length, Timers; Cheap Fast Course: Course length; Cheap Quick Course: Course length; Easy Fast Course: Course length; IMPROV Traffic School: Course length; Quick Traffic Course: Course length; Safe2Drive: Course length; Simple Traffic Course: Course length; Super Quick Course: Course length; TrafficSchool.com: Course length; Best Online Traffic School: Course length, Timers

### texas (27 rows)

| # | Tier | School | Price | Course length | Timers | Final exam | Reporting | TSP | Source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Aceable | $29.00 | 6 hours | Yes | No | Driver submits | 4.7 | https://www.aceable.com/defensive-driving/texas/ (checked 24 Sep 2026) |
| 2 | 1 | DriveSafe Online | See price on site | 6 hours | Yes | No | Driver submits | 4.6 | https://www.drivesafeonline.org () |
| 3 | 1 | Highway Traffic School | $25.00* | 6 hours | Yes | No | Driver submits | 4.3 | https://www.highwaytrafficschool.com/Texas/Defensive-Driving-Safety-Course-Online.aspx (checked 24 Sep 2026) |
| 4 | 1 | DriversEd.com | $34.00 | 6 hours | Yes | No | Driver submits | 4.3 | https://www.driversed.com/texas/defensive-driving/ (checked 24 Sep 2026) |
| 5 | 1 | Traffic School Online | $25.00 | 6 hours | Yes | No | Driver submits | 4.2 | https://www.trafficschoolonline.com/state/texas-defensive-driving-course/ (checked 24 Sep 2026) |
| 6 | 1 | I Drive Safely | $28.00* | 6 hours | Yes | No | Driver submits | 4.0 | https://www.idrivesafely.com/defensive-driving/texas/ (checked 24 Sep 2026) |
| 7 | 1 | GoToTrafficSchool | $25.00 | 6 hours | Yes | Not stated | Driver submits | 3.0 | https://www.gototrafficschool.com/state/texas-online-defensive-driving (checked 24 Sep 2026) |
| 8 | 2 | 25 Texas Defensive Driving | $25.00* | 6 hours | No | No | Driver submits |  | https://www.25texasdefensivedriving.com/pricing (checked 24 Sep 2026) |
| 9 | 2 | A+ Defensive Driving | $25.00 | 6 hours | Yes | Not stated | Driver submits |  | http://www.aplusdd.com/ (checked 24 Sep 2026) |
| 10 | 2 | Access Driving School | $25.00* | 6 hours | Yes | Not stated | Driver submits |  | https://accessdrivingschooltx.com/ (checked 24 Sep 2026) |
| 11 | 2 | Alo Driving School | $25.00 | 6 hours | Yes | Not stated | Driver submits |  | https://alodrivingschool.com/texas-defensive-driving (checked 24 Sep 2026) |
| 12 | 2 | Asian Driving School | $25.00 | 6 hours | Yes | No | Driver submits |  | https://asiandrivingschool.us/defensive-driving-course (checked 24 Sep 2026) |
| 13 | 2 | DefensiveDriving.com | $25.00 | 6 hours | Yes | Yes | Driver submits |  | https://www.defensivedriving.com/texas/course-details/ (checked 24 Sep 2026) |
| 14 | 2 | Drive Safe Driving School | $25.00 | 6 hours | Yes | No | Driver submits |  | https://drivesafedrivingschool.com/defensive-driving (checked 24 Sep 2026) |
| 15 | 2 | DrivingQuest | $25.00 | 6 hours | Yes | Not stated | Driver submits |  | https://drivingquest.com/defensive-driving/ (checked 24 Sep 2026) |
| 16 | 2 | Free Meal Defensive Driving | $25.00* | 6 hours | Yes | No | Driver submits |  | https://www.freemealdefensivedriving.com/faq/ (checked 24 Sep 2026) |
| 17 | 2 | One Way Driver Training School | $25.00 | 6 hours | Yes | Not stated | Driver submits |  | http://www.onewaydrivingschool.com/ (checked 24 Sep 2026) |
| 18 | 2 | SafeMotorist.com | $25.00* | 6 hours | Yes | Yes | Driver submits |  | https://www.safemotorist.com/texas/defensive-driving/ (checked 24 Sep 2026) |
| 19 | 2 | TexDDS | $25.00* | 6 hours | Yes | No | Driver submits |  | https://www.texdds.com/texas-defensive-driving/ (checked 24 Sep 2026) |
| 20 | 2 | TicketSchool.com | $25.00* | 6 hours | Yes | No | Driver submits |  | https://ticketschool.com/courses/texas-defensive-driving-course (checked 24 Sep 2026) |
| 21 | 2 | Traffic Safety Institute | $25.00* | 6 hours | Yes | No | Driver submits |  | https://www.trafficsafetyinstitute.com/defensive-driving/texas/cost/ (checked 24 Sep 2026) |
| 22 | 2 | Urban Traffic School | $25.00* | 6 hours | Yes | Not stated | Driver submits |  | https://www.urbantrafficschool.com/pricing (checked 24 Sep 2026) |
| 23 | 2 | Comedy Driving | $27.00* | 6 hours | Yes | No | Driver submits |  | https://www.comedydriving.com/defensive-driving-texas-pricing/ (checked 24 Sep 2026) |
| 24 | 2 | Safe2Drive | $28.00* | 6 hours | Yes | No | Driver submits |  | https://www.safe2drive.com/texas-defensive-driving.aspx (checked 24 Sep 2026) |
| 25 | 2 | TrafficSchool.com | $28.00* | 6 hours | Yes | Not stated | Driver submits |  | https://www.trafficschool.com/TX-Texas/ (checked 24 Sep 2026) |
| 26 | 2 | DefensiveDrivingCourse.com | $28.95 | 6 hours | Yes | No | Driver submits |  | https://defensivedrivingcourse.com/texas/online-course/ (checked 24 Sep 2026) |
| 27 | 2 | IMPROV Traffic School | $28.95* | 6 hours | No | No | Driver submits |  | https://www.myimprov.com/defensive-driving/texas/tx-online-course/ (checked 24 Sep 2026) |

"Not stated" cells: GoToTrafficSchool: Final exam; A+ Defensive Driving: Final exam; Access Driving School: Final exam; Alo Driving School: Final exam; DrivingQuest: Final exam; One Way Driver Training School: Final exam; Urban Traffic School: Final exam; TrafficSchool.com: Final exam

### florida (26 rows)

| # | Tier | School | Price | Course length | Timers | Final exam | Reporting | TSP | Source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Aceable | $34.95 | 4 hours (BDI) | Not stated | Yes | School reports | 4.7 | https://www.aceable.com/driver-improvement/florida/ (checked 24 Sep 2026) |
| 2 | 1 | DriveSafe Online | $24.95 | 4 hours (BDI) | Not stated | Yes | School reports | 4.6 | https://www.drivesafeonline.org/florida/basic-driver-improvement/ (checked 24 Sep 2026) |
| 3 | 1 | Highway Traffic School | $24.99* | 4 hours (BDI) | Not stated | Yes | School reports | 4.3 | https://www.highwaytrafficschool.com/Florida/Basic-Driver-Improvement-Traffic-School.aspx (checked 24 Sep 2026) |
| 4 | 1 | DriversEd.com | Price not published on site | 4 hours (BDI) | Not stated | Not stated | School reports | 4.3 | https://www.driversed.com/florida/ () |
| 5 | 1 | Traffic School Online | $29.97* | 4 hours (BDI) | No | Yes | School reports | 4.2 | https://www.trafficschoolonline.com/state/florida-traffic-school/ (checked 24 Sep 2026) |
| 6 | 1 | GoToTrafficSchool | $9.95 | 4 hours (BDI) | Not stated | Not stated | School reports | 3.0 | https://www.gototrafficschool.com/state/florida-online-traffic-school (checked 24 Sep 2026) |
| 7 | 2 | $4 Driver Improvement by NiSE | $7.00* | 4 hours (BDI) | Not stated | Not stated | Driver submits |  | https://lms.ntsi.com/registration/NiSE-FLOL-BDI (checked 24 Sep 2026) |
| 8 | 2 | American Roadways | $8.50* | 4 hours (BDI) | Not stated | Not stated | School reports |  | https://florida.americanroadways.org/ (checked 24 Sep 2026) |
| 9 | 2 | Florida Fun Traffic School | $14.95* | 4 hours (BDI) | Yes | Yes | School reports |  | https://cart.floridafuntrafficschool.com/cart/?productId=b9e7cf2f-5685-4abf-e556-08dbbf5f0502&amp;coupon=dd10 (checked 24 Sep 2026) |
| 10 | 2 | Cheap Easy Fast FL | $15.90* | 4 hours (BDI) | Not stated | Not stated | School reports |  | https://www.cheapeasyfastfl.com/sign-up-florida?servicecodeid=112001101&amp;countycourtid=11200016&amp;statecountyid=11200016 (checked 24 Sep 2026) |
| 11 | 2 | Cheaper Faster Easier FL | $15.90* | 4 hours (BDI) | Yes | Yes | School reports |  | https://www.cheaperfastereasierfl.com/sign-up-florida?servicecodeid=112001101&amp;countycourtid=11200016&amp;statecountyid=11200016 (checked 24 Sep 2026) |
| 12 | 2 | Florida Educational Driving School | $18.00* | 4 hours (BDI) | Not stated | Not stated | School reports |  | https://www.fedsafe.com/ (checked 24 Sep 2026) |
| 13 | 2 | American Safety Institute | $18.95* | 4 hours (BDI) | Not stated | Not stated | School reports |  | https://americansafetyinstitute.com/4-hour-basic-driver-improvement/ (checked 24 Sep 2026) |
| 14 | 2 | Florida Online Traffic School | $18.95* | 4 hours (BDI) | Not stated | Not stated | School reports |  | https://www.floridaonlinetrafficschool.com/ (checked 24 Sep 2026) |
| 15 | 2 | Gold Traffic School | $19.94* | 4 hours (BDI) | Not stated | Not stated | School reports |  | https://www.goldtrafficschool.com/pricing (checked 24 Sep 2026) |
| 16 | 2 | NHSA | $19.95* | 4 hours (BDI) | Not stated | Yes | Driver submits |  | https://nhsa.com/en/florida-basic-driver-improvement-course (checked 24 Sep 2026) |
| 17 | 2 | IMPROV Traffic School | $23.95* | 4 hours (BDI) | No | Not stated | School reports |  | https://www.myimprov.com/traffic-school/florida/ (checked 24 Sep 2026) |
| 18 | 2 | Funny in Florida | $24.00 | 4 hours (BDI) | No | Yes | School reports |  | http://www.funnyinflorida.com/ (checked 24 Sep 2026) |
| 19 | 2 | Comedy Defensive Driving | $24.95* | 4 hours (BDI) | Not stated | Not stated | Driver submits |  | https://comedydefensivedriving.com/florida-traffic-school/ (checked 24 Sep 2026) |
| 20 | 2 | DriveSafe | $24.95* | 4 hours (BDI) | Not stated | Yes | School reports |  | https://drivesafe.us/florida/basic-driver-improvement.html (checked 24 Sep 2026) |
| 21 | 2 | NTSI | $24.95* | 4 hours (BDI) | Not stated | Yes | School reports |  | https://ntsi.com/florida/bdi/ (checked 24 Sep 2026) |
| 22 | 2 | TicketSchool.com | $24.95* | 4 hours (BDI) | Not stated | Not stated | School reports |  | https://ticketschool.com/courses/florida-basic-driver-improvement-bdi (checked 24 Sep 2026) |
| 23 | 2 | Comedy Driving Traffic School | $25.00* | 4 hours (BDI) | Not stated | Not stated | Driver submits |  | https://signup.comedydrivingtrafficschool.com/fl/signup-step1-new.php (checked 24 Sep 2026) |
| 24 | 2 | DriveSafeToday | $26.95* | 4 hours (BDI) | Not stated | Yes | Driver submits |  | https://www.drivesafetoday.com/courses/florida/basic-driver-improvement-course (checked 24 Sep 2026) |
| 25 | 2 | Safe2Drive | $26.95* | 4 hours (BDI) | Yes | Yes | Driver submits |  | https://www.safe2drive.com/florida-traffic-school.aspx (checked 24 Sep 2026) |
| 26 | 2 | Online Traffic Education | $28.00 | 4 hours (BDI) | Not stated | Not stated | School reports |  | https://onlinetrafficeducation.com/Florida.php (checked 24 Sep 2026) |

"Not stated" cells: Aceable: Timers; DriveSafe Online: Timers; Highway Traffic School: Timers; DriversEd.com: Timers, Final exam; GoToTrafficSchool: Timers, Final exam; $4 Driver Improvement by NiSE: Timers, Final exam; American Roadways: Timers, Final exam; Cheap Easy Fast FL: Timers, Final exam; Florida Educational Driving School: Timers, Final exam; American Safety Institute: Timers, Final exam; Florida Online Traffic School: Timers, Final exam; Gold Traffic School: Timers, Final exam; NHSA: Timers; IMPROV Traffic School: Final exam; Comedy Defensive Driving: Timers, Final exam; DriveSafe: Timers; NTSI: Timers; TicketSchool.com: Timers, Final exam; Comedy Driving Traffic School: Timers, Final exam; DriveSafeToday: Timers; Online Traffic Education: Timers, Final exam

### arizona (13 rows)

| # | Tier | School | Price | Course length | Timers | Final exam | Reporting | TSP | Source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | Express Ticket Dismissal | $30.99* | 4 to 4.5 hours | Yes | No | School reports |  | https://expressticketdismissal.com/ (checked 24 Sep 2026) |
| 2 | 2 | 123 AZ Online Driving School | $32.00* | 4 to 4.5 hours | Not stated | Not stated | School reports |  | https://123azol.com/ (checked 24 Sep 2026) |
| 3 | 2 | AZDriverSafety.com | $37.95 | 4 to 4.5 hours | Yes | No | School reports |  | https://www.azdriversafety.com/course-price.html (checked 24 Sep 2026) |
| 4 | 2 | NTSI | $38.00 | 4 to 4.5 hours | Not stated | Not stated | School reports |  | https://ntsi.com/arizona/ (checked 24 Sep 2026) |
| 5 | 2 | IMPROV | $38.95 | 4 to 4.5 hours | Yes | No | School reports |  | https://www.myimprov.com/defensive-driving/arizona/ (checked 24 Sep 2026) |
| 6 | 2 | TrafficSchool.com | $38.95 | 4 to 4.5 hours | Not stated | Not stated | School reports |  | https://www.trafficschool.com/AZ-Arizona/azdrive-defensive-driving/ (checked 24 Sep 2026) |
| 7 | 2 | Safe2Drive | $39.90* | 4 to 4.5 hours | Yes | No | School reports |  | https://www.safe2drive.com/arizona_defensive_driving.aspx (checked 24 Sep 2026) |
| 8 | 2 | AZ Fast 4 Hour Defensive Driving Online | $39.95 | 4 to 4.5 hours | Not stated | Not stated | School reports |  | https://az4hourddonline.com/ (checked 24 Sep 2026) |
| 9 | 2 | West Valley PHX Defensive Driving School | $41.00 | 4 to 4.5 hours | Not stated | Not stated | School reports |  | https://www.phxdds.com/ (checked 24 Sep 2026) |
| 10 | 2 | Stop & Go Driving School | $44.00 | 4 to 4.5 hours | Not stated | Not stated | School reports |  | https://stopandgo1.com/Courses/Defensive-Driving (checked 24 Sep 2026) |
| 11 | 2 | 2pass Defensive Driving | $47.95 | 4 to 4.5 hours | Not stated | Not stated | School reports |  | https://2passdd.com/Arizona-Defensive-Driving-School/ (checked 24 Sep 2026) |
| 12 | 2 | Arizona Traffic Schools | $48.00 | 4 to 4.5 hours | Yes | No | School reports |  | https://www.aztrafficschools.com/ (checked 24 Sep 2026) |
| 13 | 2 | EZ AZ Traffic Schools | $51.90* | 4 to 4.5 hours | Not stated | Not stated | School reports |  | https://ezazlms.com/ (checked 24 Sep 2026) |

"Not stated" cells: 123 AZ Online Driving School: Timers, Final exam; NTSI: Timers, Final exam; TrafficSchool.com: Timers, Final exam; AZ Fast 4 Hour Defensive Driving Online: Timers, Final exam; West Valley PHX Defensive Driving School: Timers, Final exam; Stop & Go Driving School: Timers, Final exam; 2pass Defensive Driving: Timers, Final exam; EZ AZ Traffic Schools: Timers, Final exam

## Flags for Sean

**Decisions made in this PR**
1. **Minimum-price rule (6a):** "from $X" = the minimum of *all* priced table rows,
   not just tier 1. So California reads "from $5.00" ($5 Dollar / $5 Bucks
   Traffic School), not Aceable's $29.
2. **Arizona renders a table with no reviewed cards.** "No Partner Offer" still
   suppresses the cards and every affiliate link. The table is the 13 priced
   directory schools with plain nofollow links, and it has no disclosure line
   (nothing on the page is monetized).
3. **Tier 1 price storage:** kept on the existing Pricing DB rather than new
   Variants fields (P11's equivalent, as the brief allows).
4. **Florida directory:** besides the 5b cleanup, the 44 official Internet BDI
   providers missing from our rows were added from the FLHSMV list. This goes
   slightly beyond 5b; P8 may want to own the dataset from here.
5. **County-restricted FL providers** are listed in the directory but excluded from
   the statewide table.

**Things P17 surfaced that belong to P10/P12 (not changed here; the brief forbids it)**
1. **DriveSafe Online has a California card but sells no California ticket
   course.** Its CA page offers insurance-discount courses only. It also says it is
   not approved for Arizona ticket dismissal. Consider removing CA from its State
   Codes (it is "all").
2. **Florida BDI list (FLHSMV):**
   - **Aceable** is listed as "Miami-Dade county citations only".
   - **Cyberactive (GoToTrafficSchool)** is listed as "Miami-Dade citations only".
   - **DriversEd.com** is not on the list at all, and its site sends FL ticket
     buyers to I Drive Safely.
   - Aceable's own FAQ says the FL course is delivered by I Drive Safely, which is
     approved statewide but excluded from our FL cards.

   Worth an editorial look at the FL cards.
3. **California "Course length: 8 hours"** conflicts with DMV form OL 613: online
   TVS is measured by word count (42,500 words) plus 60 minutes for the test, not
   by hours. Our own blog post already says CA sets no 8-hour minimum. The table's
   CA course-length cell reads "Not stated" rather than cite a source that
   contradicts it. The static llms.txt line "California traffic school requires 8
   hours minimum" has the same issue.
4. **Texas "Has Final Exam = true"** conflicts with 16 TAC § 84.505(e)(3) (unit
   exams may replace a final) and with most TX schools' own pages ("No final
   exam"). The TX table shows each school's own statement. The state-rule
   fallback is not used.
5. **Florida reporting:** Fla. Stat. § 318.1451(6)(f) (2024) has schools report to
   FLHSMV and e-file with the clerk ("School reports"). Several FL schools' pages
   still tell drivers to take the certificate to the clerk. The table shows each
   school's own statement. The FLHSMV page stored as the FL source also says court
   reporting is "the driver's responsibility", which lags the statute.
6. **All four stored State Requirements source URLs fail:** CA DMV and TDLR return
   404, the AZ one is a generic landing page, and the FL one lags the statute. The
   new per-fact source URLs were added alongside; the stored `Source URL` values
   were not changed.

**Operational**
1. **Notion responses are cached across builds.** Next's data cache
   (`.next/cache/fetch-cache`) stored the Notion API responses for 24 hours, because
   the state route sets `revalidate = 86400`. A local rebuild then rendered data
   from before today's writes. If Vercel restores that cache between deploys, a
   Notion edit can take up to a day to show after a redeploy. It is not fixed here:
   `cache: "no-store"` on the Notion fetch would switch the static pages to dynamic
   rendering. Recommend a follow-up (for example a `next: { tags }` +
   revalidateTag purge in the deploy hook).
2. **Scraper Rules DB is not shared with the local `tsp-site-cms` token**, so the
   brief's "Scraper Rules DB path" could not be used locally. Prices came from the
   schools' own pages via the research pass plus the xgrit/JSON-LD syncs. If
   Scraper Rules holds an Aceable FL rule with a Verified Price, the daily scraper
   pins that price every run and could fight the xgrit sync's $34.95. Worth a check
   in Notion.
3. **Tier 2 re-checks:** tier 2 prices were checked once, today. There is no
   scheduled re-check yet. `apply-comparison-data.ts` plus a weekly re-read of each
   Price Source URL is the obvious next step before the sitewide PR.
4. **Directory data outside P17 scope (P8):**
   - Arizona's directory has duplicate rows and Google-Translate language names as
     "schools" (528 rows, about 40 real sites).
   - Texas's directory is TDLR driving-school licences, not DSC course providers.
   - The directory heading says "DMV-licensed" on TX, FL and AZ.
