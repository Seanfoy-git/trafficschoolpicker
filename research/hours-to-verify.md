# Course-hours research queue

**The rule (Package 4):** course length is a property of the *state's* requirement,
never of the school. There is no per-school hours field anywhere. A state renders a
course-length claim (Key Facts row, card chip, JSON-LD, /schools, reviews, llms)
**only** when its States DB `Hours Source` is set. An unsourced value renders nowhere.

To turn a state's hours back on: add a primary-source `Hours Source` (statute or
regulator URL) and a `Course Hours` display value to its States DB row, and set
`Hours Verified`. Never re-render an unsourced number.

_Last updated 2026-08-29._

## Sourced — rendering hours (10)

These carry a `Hours Source` and render a course-length value.

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

## Confirmed no statewide length — intentionally hour-less (7)

No statewide course length exists or none is published (established in Packages 2–3).
These should stay hour-less; do not add a value.

Kansas, West Virginia, North Carolina, Vermont, Maine, Wyoming, Illinois.

## Needs verification — hour-less until sourced (34)

Each of these previously rendered the unverified value below (never pinned to a
primary source; some predate the Task-0 incident and are visibly suspect). The value
is un-rendered now. Verify against the state statute/regulator, then set `Hours Source`
+ `Course Hours` to turn it back on — or confirm no statewide length and move the state
to the section above.

| State | Old (unverified) value | Verified? | Source to find |
|---|---|---|---|
| Alaska | 8 hours | ☐ | |
| Alabama | 6 hours | ☐ | |
| Arkansas | 6 hours | ☐ | |
| Colorado | 4 hours | ☐ | |
| Connecticut | 8 hours | ☐ | |
| Washington DC | 6 hours | ☐ | |
| Delaware | 8 hours | ☐ | |
| Hawaii | 8 hours | ☐ | |
| Iowa | 6 hours | ☐ | |
| Idaho | 6 hours | ☐ | |
| Indiana | 6 hours | ☐ | |
| Louisiana | 6 hours | ☐ | |
| Massachusetts | (none) | ☐ | (in-person only per P2 context — confirm) |
| Maryland | 8 hours | ☐ | |
| Minnesota | 8 hours | ☐ | |
| Missouri | 8 hours | ☐ | |
| Mississippi | 6 hours | ☐ | |
| Montana | 6 hours | ☐ | |
| North Dakota | 6 hours | ☐ | |
| Nebraska | 8 hours | ☐ | |
| New Hampshire | (none) | ☐ | (no online option per P2 context — confirm) |
| New Jersey | 6 hours | ☐ | |
| New Mexico | 6 hours | ☐ | |
| Nevada | 8 hours | ☐ | |
| Oregon | 6 hours | ☐ | |
| Pennsylvania | 6 hours | ☐ | |
| Rhode Island | 6 hours | ☐ | |
| South Carolina | 8 hours | ☐ | |
| South Dakota | 6 hours | ☐ | |
| Tennessee | 8 hours | ☐ | |
| Utah | 8 hours | ☐ | |
| Virginia | 8 hours | ☐ | |
| Washington | 8 hours | ☐ | |
| Wisconsin | (none) | ☐ | |
