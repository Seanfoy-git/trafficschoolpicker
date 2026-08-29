# Course-hours research queue

**The rule (Package 4):** course length is a property of the *state's* requirement,
never of the school. There is no per-school hours field. A state renders a
course-length claim (Key Facts, card chip, JSON-LD, /schools, reviews, llms) **only**
when its States DB `Hours Source` is set. An unsourced value renders nowhere.

To turn a state's hours on: set `Hours Source` (statute/regulator), `Course Hours`
(display value), and `Hours Verified`. **Never source a value while the page's program
framing is wrong** — a correct number next to a false "Ticket dismissal: Yes" just makes
the false page look authoritative. Fix the framing first (that is the Package 6 work
below), then fill the value.

_Last updated 2026-08-29. 34 jurisdictions researched from primary sources (companion
research doc); CA/FL/TX/AZ/NY/OH/OK/MI/KY/GA verified in Packages 2–3._

## Sourced — rendering hours (12)

| State | Course Hours | Source |
|---|---|---|
| California | 8 hours | DMV Traffic Violator School program |
| Florida | 4 hours (BDI) | Fla. Stat. § 318.14(9) / FLHSMV |
| Texas | 6 hours | CCP art. 45A.352 / TDLR |
| Arizona | 4 to 4.5 hours | ACJA § 7-205(E)(1)(k) |
| New York | 320 minutes (5h20m) | dmv.ny.gov PIRP |
| Ohio | 8 hours | Ohio Adm. Code 4501-21-06 |
| Oklahoma | 6 hours | 47 O.S. § 6-206.1 / Service Oklahoma |
| Michigan | 4 hours (BDIC) | MCL 257.320d / Michigan SOS (invitation-only) |
| Kentucky | 4 hours | 601 KAR 13:025 / drive.ky.gov |
| Georgia | 6 hours (classroom) | dds.georgia.gov DDS Driver Improvement |
| New Jersey | 6 hours | N.J.A.C. 13:21-24.5 (page already frames it as point-reduction + insurance, no dismissal) |
| Virginia | 8 hours | Va. Code § 46.2-490.2 / DMV Driver Improvement Clinic (page frames it as insurance/clinic, not dismissal) |

## Verified value ready — BLOCKED on Package 6 framing reconciliation (12)

The hours are verified against a primary source, but the page describes the **wrong
program** (usually "Ticket dismissal: Yes" on a course that only reduces points, or a
mature-driver/mandatory course misapplied). Do **not** set `Hours Source` until Package 6
corrects the page's program framing; then paste the value below.

| State | Ready value | Source | Framing blocker |
|---|---|---|---|
| Delaware | 6 hours (basic); 3 hr refresher | 2 DE Admin Code 2224 § 4.2.1.2.2 | Page says "Ticket dismissal: Yes" + 8 hours; program is a voluntary point-credit + insurance-discount course, not dismissal |
| Idaho | 6 hours | IDAPA 39.02.71 | Value belongs to the point-reduction program; page cites the wrong rule (39.02.72 = DUI ALS hearings) |
| Indiana | 4 hours | IC 9-30-3-12 / 140 IAC (BMV DSP) | Page Key Facts "6 hours" + "Ticket dismissal: Yes"; program is a 4-point credit, no dismissal |
| Maryland | 4 to 8 hours | MVA Driver Improvement Program | DIP is assigned/remedial, not voluntary dismissal or point-removal; flat 8 hours overstates |
| Mississippi | 4 hours | Miss. Code § 63-9-11 | Dismissal framing is right, but page says "once per lifetime" (should be once/3 yrs) and still says "parish" (Louisiana leftover) |
| Missouri | 8 hours | RSMo § 302.302 (NSC 8-hr DDC standard) | Page "Ticket dismissal: Yes"; program stays points, does not dismiss |
| Nebraska | 4 hours | Neb. Rev. Stat. § 60-4,188 | Body cites wrong statute (§60-4,182); "8 hours" contradicts statute + page's own body; 2-point credit not dismissal |
| Nevada | 5 hours (8 if 3+ violations) | Nevada DMV Traffic Safety Schools / NAC 483.787 | Flat "8 hours" + "Ticket dismissal: Yes" wrong; standard course is 5 hrs, program is a 3-point removal |
| Pennsylvania | 6 hours | PennDOT DIS Fact Sheet (FS-DIS) | 6 hrs belongs only to the mandatory Driver Improvement School (6+ pts / 31+ mph), not a voluntary dismissal course |
| South Carolina | 8 hours | S.C. Code § 56-1-770 / SCDMV | 4-point reduction via NSC 8-hr course; not dismissal, and classroom/NSC-virtual only (affiliate "SCDMV-approved online" framing is wrong) |
| Tennessee | 4 hours | TN Dept. of Safety, points-removal traffic school | Key Facts "8 hours" is the wrong program (12+-point DIP referral); page says once/5 yrs (should be 4) |
| Utah | 4 hours | Utah DLD Points System (DDC) | Page "8 hours"; program is a point-reduction DDC, dismissal is separate plea-in-abeyance |

## No statewide length — intentionally hour-less (27)

No statewide course length exists or none is published. These stay hour-less; do not add
a value. Several also carry program-framing errors flagged for Package 6 (see below).

- **Confirmed in Packages 2–3 (7):** Kansas, West Virginia, North Carolina, Vermont, Maine, Wyoming, Illinois.
- **A program exists but no primary source publishes a length — OMIT (8):** Alabama, Alaska, Arkansas, Connecticut, Louisiana, North Dakota, Washington DC, Wisconsin.
- **No statewide program to attach hours to — NO_STATEWIDE_PROGRAM (12):** Colorado, Hawaii, Iowa, Massachusetts, Minnesota, Montana, New Hampshire, New Mexico, Oregon, Rhode Island, South Dakota, Washington.

## Package 6 queue — fabrication-class page findings (from this research)

These are program-framing errors of the Package-2 class, surfaced by the hours research.
**Not fixed here** — queue for the reconciliation package.

1. **Washington DC — backwards.** Page says online traffic school isn't available while pricing online providers. DC DMV runs an official ONLINE traffic school (point removal, hearing-examiner approval, 30-day window, two approved providers). Rewrite is the opposite of the current page.
2. **Connecticut — wrong program.** Only DD discount statute (CGS §38a-683) is age-60+, min 4 hrs, min 5% for 24+ mo. Page claims 8 hrs, 3-yr discount for all drivers, plus a point reduction CT doesn't have.
3. **Minnesota — wrong audience.** Minn. Stat. §65B.28 accident-prevention discount is 55+ only, ≥10%, 4-hr course. Page presents an all-driver 8-hr program.
4. **Alabama / Arkansas — mature-driver statutes misapplied.** The 6-hr figures trace only to the 55+ insurance-course statutes (Ala. §27-13-121; Ark. §27-19-608); pages attach them to court-by-court dismissal.
5. **South Dakota — fabricated "DPS-approved course."** No statute/rule/DPS page supports any point-reduction or approved-school program.
6. **Washington — invented framework.** "Level 1 4-hr / Level 2 8-hr" matches no state source; RCW 46.63.070(5) deferral (once/7 yrs) requires no course.
7. **Alaska — wrong statute.** AS 28.15.111 is license-issuance/anatomical-gift, not the point-reduction authority.
8. **Nebraska — wrong statute number.** Body cites §60-4,182; the point-credit statute is §60-4,188.

Also for reconciliation (same passes): PA's 6-hr belongs only to the mandatory DIS, not a
voluntary dismissal course PennDOT doesn't recognize; SC's reduction accepts only the NSC
8-hr course, not online except NSC virtual (affiliate "SCDMV-approved online" is wrong);
TN is once per **4** years (page says 5); NV plea-bargain courses earn no point credit;
MD's DIP is assigned, not elected; MS is once per **3 years**, not once per lifetime, and
still says "parish" (Louisiana leftover).
