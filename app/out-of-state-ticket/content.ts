/* Verbatim body markup for /out-of-state-ticket, ported from the authored source
 * (out-of-state-ticket_1.html) with only three mechanical changes, no content edits:
 *   1. The <link> to Google Fonts and the <style> block are dropped (fonts come
 *      from next/font; styles live in out-of-state.css, scoped under .oost).
 *   2. The ten outbound state-card links are made root-relative (site convention)
 *      and Georgia's — which the source misplaced inside .sources after the stamp —
 *      is restored to the end of the Georgia card, matching the other nine.
 *   3. The <form> request block is NOT here; it renders as <StateRequestForm/> so
 *      the submit can be progressively enhanced. Everything else is byte-for-byte
 *      the author's text: every statute citation and the "Last verified" stamp
 *      included. Rendered via dangerouslySetInnerHTML precisely to avoid any drift.
 *
 * BODY_TOP = <header> through the "Three things we could not settle" section.
 * BODY_SOURCES = the closing Sources + stamp block. The form sits between them.
 */

export const BODY_TOP = `
<header class="top">
  <p class="brow">Multi-state reference</p>
  <h1>You got a ticket in a state you're not licensed in</h1>
  <p class="dek">The standard advice is to take traffic school. For a driver licensed somewhere else that advice is usually wrong, and in Texas you are not allowed to take the course at all.</p>
  <p class="byline">
    Covers Arizona, California, Florida, Georgia, New Jersey, New York, North Carolina, Ohio, Texas, Virginia.<br>
    Every claim below carries a statute or agency source. Last verified August 2026.
  </p>
</header>

<div class="kf">
  <h2>Key facts</h2>
  <dl>
    <div class="row">
      <dt>What a course has to do to help you</dt>
      <dd>Stop a conviction being entered in the state that issued the ticket. A course that only credits points moves points on a record you do not have.</dd>
    </div>
    <div class="row">
      <dt>States where the course prevents a conviction</dt>
      <dd>Arizona (dismissal), Florida (adjudication withheld), Texas (dismissal), North Carolina (prayer for judgment continued, no judgment entered)</dd>
    </div>
    <div class="row">
      <dt>States where it only credits points</dt>
      <dd>Ohio, New York, New Jersey, Virginia, Georgia. None of these help a licence issued in another state.</dd>
    </div>
    <div class="row">
      <dt>Hard statutory bar</dt>
      <dd>Texas. The course requires a Texas licence or permit, with a carve-out for active-duty military and their families.</dd>
    </div>
    <div class="row">
      <dt>Open to any valid licence</dt>
      <dd>Arizona, California, Florida</dd>
    </div>
    <div class="row">
      <dt>Home states that assess no points on out-of-state convictions</dt>
      <dd>North Carolina, New York (except Canada), Ohio, Texas (no point system at all)</dd>
    </div>
    <div class="row">
      <dt>Not members of the Driver License Compact</dt>
      <dd>Georgia, Michigan, Wisconsin. Three, not five. <span class="cite">AAMVA roster, revised April 2026</span></dd>
    </div>
    <div class="row">
      <dt>Questions we could not settle</dt>
      <dd>Three. Listed in full at the bottom rather than guessed at.</dd>
    </div>
  </dl>
</div>

<section>
  <h2>Two questions decide the whole thing</h2>

  <p class="lede">Everything else is detail. If you only read one part of this page, read this part, then call the clerk of the court printed on your citation.</p>

  <div class="path">
    <div class="step">
      <span class="n">QUESTION 1</span>
      <span class="q">Can you even take the course?</span>
      <p>Texas says no to you outright. The driving safety course requires a Texas licence or permit, with a carve-out for active-duty military and their families, and a judge cannot waive that part. Georgia is a softer version of the same dead end: you can sit a Georgia course, but the point reduction is administered for licensed Georgia residents, and a non-resident has no Georgia points for it to work on.</p>
    </div>
    <div class="step">
      <span class="n">QUESTION 2</span>
      <span class="q">Does it stop a conviction being entered?</span>
      <p>If the court dismisses the charge or withholds adjudication, there is no conviction to send to your home state. If the course instead credits points, it is crediting points against a driving record in a state where you do not hold a licence. That does nothing for you.</p>
    </div>
  </div>

  <p>Nearly every page you will find on this subject skips question one and gets question two backwards. The reason is that they are written for residents, and for a resident the two kinds of course feel about the same. They are not the same at all once a state line is involved.</p>
</section>

<section>
  <h2>How a ticket finds its way home</h2>

  <p>Most states belong to the Driver License Compact, an agreement to report convictions of visiting drivers back to whichever state issued the licence. Get a speeding ticket in Virginia on a New Jersey licence, and Virginia tells New Jersey.</p>

  <p>What the home state then does with it is the home state's business. The compact says so directly. The receiving state gives the conduct whatever effect its own law gives it, which is why the same ticket lands very differently depending on where your licence came from.</p>

  <div class="box red">
    <span class="lb">Correcting a number that is everywhere</span>
    <p>Almost every published list names five states outside the compact: Georgia, Massachusetts, Michigan, Tennessee and Wisconsin. AAMVA's current roster, revised April 2026, shows 48 member jurisdictions and three non-members. Georgia, Michigan and Wisconsin. Tennessee joined in July 2020, which matches its own code at § 55-50-902, and Massachusetts joined in May 2023.</p>
    <p>Ballotpedia still carries the old five and flags its own source as out of date, which is a reasonable guess at where most of the copies came from.</p>
  </div>

  <p>Georgia not being a member matters more than it sounds. A routine Georgia speeding ticket against an out-of-state driver has no compact route home. It is not on the federal Problem Driver Pointer System either, because that system carries licence withdrawals and a short list of serious offences, not ordinary speeding. <span class="cite">49 U.S.C. § 30304</span></p>

  <p>Two things still reach you from Georgia. Anything serious enough to suspend or revoke a licence goes into the federal pointer system and surfaces the next time you renew. And if you ignore the ticket entirely, Georgia is a member of the separate Non-Resident Violator Compact, which lets it ask your home state to suspend you for failing to appear. So "Georgia doesn't report it" is true of a paid speeding fine and false of everything else.</p>
</section>

<section>
  <h2>Taking the course where you got the ticket</h2>

  <p>This is the table that matters if you are the visiting driver. The question is not whether the course is good. It is whether the court ends up entering a conviction.</p>

  <div class="tw">
    <table>
      <caption>Ticketing state: what the course does, and whether you qualify</caption>
      <thead>
        <tr><th scope="col">State</th><th scope="col">Programme</th><th scope="col">What it does</th><th scope="col">Non-resident eligible</th><th scope="col">Helps a licence from elsewhere</th></tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Arizona</th>
          <td>Defensive driving school, 240 to 270 minutes</td>
          <td>Court dismisses the citation, no MVD record</td>
          <td><span class="tag y">Yes</span></td>
          <td><span class="tag y">Yes</span></td>
        </tr>
        <tr>
          <th scope="row">Florida</th>
          <td>Basic Driver Improvement, 4 hours</td>
          <td>Adjudication withheld, no points, fine cut 18%</td>
          <td><span class="tag y">Yes</span></td>
          <td><span class="tag y">Yes</span></td>
        </tr>
        <tr>
          <th scope="row">North Carolina</th>
          <td>Prayer for judgment continued (a court disposition, not a course)</td>
          <td>Guilt acknowledged, no judgment entered</td>
          <td><span class="tag y">Yes</span></td>
          <td><span class="tag q">Probably</span></td>
        </tr>
        <tr>
          <th scope="row">Texas</th>
          <td>Driving safety course, 6 hours</td>
          <td>Charge dismissed and cannot be used for any purpose</td>
          <td><span class="tag x">No</span></td>
          <td><span class="tag x">You can't take it</span></td>
        </tr>
        <tr>
          <th scope="row">California</th>
          <td>Traffic violator school, 340 min plus test</td>
          <td>Conviction entered but held confidential</td>
          <td><span class="tag y">Yes</span></td>
          <td><span class="tag q">Unresolved</span></td>
        </tr>
        <tr>
          <th scope="row">Georgia</th>
          <td>Driver improvement, 6 hours</td>
          <td>Reduces points by up to 7</td>
          <td><span class="tag n">No GA points to cut</span></td>
          <td><span class="tag n">No</span></td>
        </tr>
        <tr>
          <th scope="row">Ohio</th>
          <td>Remedial driving course, 8 hours</td>
          <td>Credits 2 points</td>
          <td><span class="tag n">Own licensees</span></td>
          <td><span class="tag n">No</span></td>
        </tr>
        <tr>
          <th scope="row">New York</th>
          <td>PIRP, 320 minutes</td>
          <td>Subtracts up to 4 points for suspension maths only</td>
          <td><span class="tag n">Own licensees</span></td>
          <td><span class="tag n">No</span></td>
        </tr>
        <tr>
          <th scope="row">New Jersey</th>
          <td>Defensive driving course, 6 hours</td>
          <td>Credits 2 points</td>
          <td><span class="tag n">Own licensees</span></td>
          <td><span class="tag n">No</span></td>
        </tr>
        <tr>
          <th scope="row">Virginia</th>
          <td>Driver improvement clinic, 8 hours</td>
          <td>Subtracts 5 demerit points, or awards safe driving points if you have fewer than 5</td>
          <td><span class="tag n">VA-licensed drivers</span></td>
          <td><span class="tag n">No</span></td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="tnote">The point-credit programmes work by adjusting that state's own driving record. Some of them have no written residency bar at all, and Virginia expressly admits any resident or non-resident holding a valid Virginia licence. It makes no difference. If your licence came from elsewhere there is no record there for the credit to touch.</p>

  <div class="box">
    <span class="lb">The Texas trap</span>
    <p>Texas is where this goes wrong most often, because Texas has the best outcome of the ten and the hardest door. The course dismisses the charge outright, and the statute says a dismissed charge "may not be part of a person's driving record or used for any purpose." Then the eligibility rule requires a Texas licence or permit. A student from New Jersey at UT Austin reads the court paperwork, sees the dismissal option, and cannot use it.</p>
    <p>Worth heading off the obvious counterargument. A Texas judge does have discretion under art. 45A.352(c) to grant a course request before final disposition, and that discretion reaches the once-in-12-months rule and the filing deadline. It does not reach the licence requirement. That one holds. <span class="cite">Tex. Code Crim. Proc. arts. 45A.352, 45A.357</span></p>
  </div>
</section>

<section>
  <h2>What your home state does with it</h2>

  <p>Now flip it. The ticket has been reported back. Whether it costs you anything depends entirely on the state that issued your licence, and the spread here is wider than most people expect.</p>

  <div class="tw">
    <table>
      <caption>Home state: points on a conviction that happened elsewhere</caption>
      <thead>
        <tr><th scope="col">Your licence</th><th scope="col">Points on out-of-state convictions</th><th scope="col">Detail</th><th scope="col">Source</th></tr>
      </thead>
      <tbody>
        <tr><th scope="row">New Jersey</th><td><span class="tag x">Yes, flat 2</span></td><td>Two points for any out-of-state moving violation, whatever the offence was and whatever New Jersey would charge for the same thing at home</td><td class="cite">N.J.A.C. 13:19-10.1, item 55</td></tr>
        <tr><th scope="row">Virginia</th><td><span class="tag x">Yes</span></td><td>Points assigned to convictions received from any other state, and from Canada and its provinces, if the offence would be reportable in Virginia</td><td class="cite">Va. Code § 46.2-492(B)</td></tr>
        <tr><th scope="row">California</th><td><span class="tag x">Yes</span></td><td>Negligent operator points for convictions in other states, DC, Puerto Rico and Canada</td><td class="cite">CA DMV, negligent operator</td></tr>
        <tr><th scope="row">Florida</th><td><span class="tag x">Yes</span></td><td>The statute is permissive. An out-of-state conviction may be recorded against the Florida record and pointed if the offence is point-assessable</td><td class="cite">Fla. Stat. § 322.27(3)(e)</td></tr>
        <tr><th scope="row">Georgia</th><td><span class="tag x">Yes</span></td><td>Assessed where the offence would be grounds for assessment if committed in Georgia. Georgia is inconsistent about receiving the data, being outside the compact</td><td class="cite">O.C.G.A. § 40-5-57(b)</td></tr>
        <tr><th scope="row">New York</th><td><span class="tag y">No, except Canada</span></td><td>DMV states points are not added for convictions in another state or country unless the violation happened in Canada, under a reciprocal agreement</td><td class="cite">NY DMV point system</td></tr>
        <tr><th scope="row">North Carolina</th><td><span class="tag y">No</span></td><td>The point provisions apply only to violations and convictions that take place within North Carolina. Suspension for a serious out-of-state offence is still possible</td><td class="cite">N.C.G.S. § 20-16(c), 20-16(a)(7)</td></tr>
        <tr><th scope="row">Ohio</th><td><span class="tag y">No points</span></td><td>Points are assessed by the sentencing court and only Ohio courts feed that chain. Read from the statute's structure rather than from any published BMV position</td><td class="cite">O.R.C. §§ 4510.036(B), 4510.61</td></tr>
        <tr><th scope="row">Texas</th><td><span class="tag y">No system</span></td><td>Texas repealed the Driver Responsibility Program in 2019 and has no points. Out-of-state convictions still count toward habitual violator suspension</td><td class="cite">Tex. Transp. Code § 521.292</td></tr>
        <tr><th scope="row">Arizona</th><td><span class="tag q">Unresolved</span></td><td>Nothing in the rule excludes out-of-state convictions, and unlike Ohio it is the Department that assigns Arizona points. Whether it assigns them here is not published anywhere we could find</td><td class="cite">See open questions</td></tr>
      </tbody>
    </table>
  </div>
  <p class="tnote">Insurance runs on a separate track from all of this. Insurers pull their own motor vehicle reports and use their own rating rules, so a state assessing no points does not mean your premium is safe.</p>

  <p>Put the two tables together and some combinations get strange. A New York licensee ticketed in Ohio takes nothing home, because New York does not point out-of-state convictions. An Ohio licensee ticketed in New York also takes nothing home, for a completely different reason, which is that Ohio points come from Ohio courts. Same two states, opposite mechanisms, same result.</p>

  <p>New Jersey is the one to watch. Two points for anything, anywhere, no matter how minor. By the way, that cuts the other way too, which is worth knowing if you are a New Jersey licensee who did pick up points from a trip. The New Jersey defensive driving course credits two points against your New Jersey record, and those imported points are on that record like any others.</p>
</section>

<section>
  <h2>The ten states in detail</h2>

  <div class="states">

    <div class="st">
      <div class="st-hd"><h3 id="arizona">Arizona</h3><span class="tag y">Dismissal</span></div>
      <dl>
        <dt>Programme</dt><dd>Defensive driving school, run under Arizona Supreme Court authority</dd>
        <dt>Length</dt><dd>240 to 270 minutes including testing</dd>
        <dt>Effect</dt><dd>The court dismisses the citation and MVD keeps no record of it</dd>
        <dt>How often</dt><dd>Once in 12 months, measured from the date of the last violation</dd>
        <dt>Who is barred</dt><dd>Anyone whose violation caused death or serious physical injury. Commercial vehicle operators. CDL holders may attend if they were driving a class D or M vehicle not being used commercially</dd>
        <dt>Speed</dt><dd>No hard cutoff, but the court only "may" allow the school for an excessive speed citation under § 28-701.02, where for ordinary civil moving violations it must</dd>
        <dt>Suspension</dt><dd>8 to 12 points in 12 months brings traffic survival school or suspension. 13 to 17 is three months, 18 to 23 is six, and 24 or more in 36 months is a year</dd>
        <dt>Cost</dt><dd>A $45 statutory surcharge, plus a diversion fee each court sets itself, plus school tuition</dd>
        <dt>Citations</dt><dd class="cite">A.R.S. §§ 28-3392 to 28-3396; A.A.C. R17-4-404; ACJA § 7-205</dd>
      </dl>
      <p>The strongest option on this list for a visiting driver. No residency requirement and a genuine dismissal, with no MVD record kept. Note the frequency clock runs from the date of the violation rather than from when you finish the course, which catches out anyone who enrolled late.</p>
      <p class="more"><a href="/arizona/does-traffic-school-remove-points">Arizona in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="florida">Florida</h3><span class="tag y">Adjudication withheld</span></div>
      <dl>
        <dt>Programme</dt><dd>Basic Driver Improvement (BDI)</dd>
        <dt>Length</dt><dd>4 hours minimum of course content</dd>
        <dt>Effect</dt><dd>Adjudication withheld, no points assessed, civil penalty reduced by 18 per cent</dd>
        <dt>How often</dt><dd>Once in 12 months, and eight times in a lifetime</dd>
        <dt>Who is barred</dt><dd>CDL and commercial learner permit holders, anyone cited in a commercial vehicle, and speeds 30 mph or more over the limit</dd>
        <dt>Deadline</dt><dd>You must elect within 30 days of the citation</dd>
        <dt>Citations</dt><dd class="cite">Fla. Stat. § 318.14(9); Fla. Admin. Code R. 15A-8.006</dd>
      </dl>
      <p>The cleanest option of the ten for a visiting driver. Adjudication withheld means there is no conviction for Florida to report anywhere, the fine drops 18 per cent, and Florida law bars your insurer from raising your premium or cancelling over the infraction. The 30-day election window is short and it starts from the citation, not from your court date.</p>
      <p class="more"><a href="/florida/does-traffic-school-remove-points">Florida in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="texas">Texas</h3><span class="tag x">Texas licence required</span></div>
      <dl>
        <dt>Programme</dt><dd>Driving safety course approved by TDLR</dd>
        <dt>Length</dt><dd>6 hours</dd>
        <dt>Effect</dt><dd>Charge dismissed, and a dismissed charge may not be part of a driving record or used for any purpose. Insurers may not raise premiums or cancel over it</dd>
        <dt>How often</dt><dd>Once in 12 months</dd>
        <dt>Who is barred</dt><dd>Anyone without a Texas licence or permit, except active-duty military and their spouses and dependent children. CDL holders, including in a personal vehicle. Speeds of 95 mph or more, or 25 mph over</dd>
        <dt>Cost</dt><dd>Court reimbursement fee capped at $10, plus a records fee, plus course tuition</dd>
        <dt>Citations</dt><dd class="cite">Tex. Code Crim. Proc. arts. 45A.351 to 45A.359</dd>
      </dl>
      <p>Cite Chapter 45A, not article 45.0511. Texas recodified Chapter 45 on 1 January 2025 and the old article number is repealed, which means a lot of pages and even some court handouts are pointing at law that no longer exists.</p>
      <p>Senate Bill 296 then changed things again from 1 September 2025. You can now make the written request by email or through a court's own online portal, and where several charges came out of the same incident, each of them is eligible for dismissal on a single course. The court may also charge the $10 fee per eligible offence rather than once.</p>
      <p class="more"><a href="/texas/does-traffic-school-remove-points">Texas in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="california">California</h3><span class="tag q">Masked, effect elsewhere unknown</span></div>
      <dl>
        <dt>Programme</dt><dd>Traffic violator school</dd>
        <dt>Length</dt><dd>340 minutes of instruction plus 60 minutes of testing. Online courses are measured by word count instead, at a minimum of 42,500 words</dd>
        <dt>Effect</dt><dd>The conviction is entered and reported to DMV, then held confidential so no point is assessed and insurers cannot see it</dd>
        <dt>How often</dt><dd>Once in 18 months, and the bar attaches when you elect, not only when you finish</dd>
        <dt>Who is barred</dt><dd>Misdemeanours, alcohol and drug violations, commercial vehicles, speeds more than 25 mph over, and anything carrying more than one point</dd>
        <dt>Licence needed</dt><dd>A valid driver licence. Rule 4.104 does not say a California one, though § 42005 frames the court's power around California class designations, so treat this as probable rather than settled</dd>
        <dt>Citations</dt><dd class="cite">Cal. Veh. Code §§ 1803.5, 1808.7, 42005; Cal. Rule of Court 4.104; 13 CCR § 345.30</dd>
      </dl>
      <p>Since 2011 California traffic school has not been a dismissal. The court still reports the conviction to DMV and DMV still records it, then marks the record confidential. That distinction is the reason we cannot tell you what it does for an out-of-state licence, and it is question three at the bottom of this page.</p>
      <p class="more"><a href="/california/does-traffic-school-remove-points">California in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="north-carolina">North Carolina</h3><span class="tag q">No judgment entered</span></div>
      <dl>
        <dt>Mechanism</dt><dd>Prayer for judgment continued, a court disposition rather than a course. North Carolina also runs a driver improvement clinic, which is the separate point-credit route</dd>
        <dt>Clinic length</dt><dd>Not fixed by rule. The administrative code specifies the course content, not a number of hours</dd>
        <dt>PJC effect</dt><dd>Guilt is acknowledged and no judgment is entered, so for most drivers it is not a conviction under North Carolina law</dd>
        <dt>PJC limits</dt><dd>A third or subsequent PJC in five years counts as a conviction, as does any PJC for a CDL holder or in a commercial vehicle</dd>
        <dt>Clinic credit</dt><dd>Three points deducted, once in five years, and only for a licensee who has already reached seven points, or four after a reinstatement</dd>
        <dt>Clinic fee</dt><dd>Fixed by statute at $83.50</dd>
        <dt>Suspension</dt><dd>12 or more points in three years, or eight in the three years after a reinstatement</dd>
        <dt>Citations</dt><dd class="cite">N.C.G.S. §§ 20-16(c), 20-16(e), 20-4.01(4a), 20-24(b)(5); 19A NCAC 03G .0400</dd>
      </dl>
      <p>North Carolina courts are required to report a PJC to NCDMV. Whether NCDMV then passes it to your home state, and whether your home state treats it as a conviction anyway, is question four at the bottom. North Carolina also wrote its own condensed version of the compact in 1993 rather than adopting the standard text, so the broad definition of conviction that other states use does not appear in its statute.</p>
      <p class="more"><a href="/north-carolina/does-traffic-school-remove-points">North Carolina in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="ohio">Ohio</h3><span class="tag n">Point credit only</span></div>
      <dl>
        <dt>Programme</dt><dd>Course of remedial driving instruction, usually sold as the adult remedial or two-point course</dd>
        <dt>Length</dt><dd>Minimum 8 hours</dd>
        <dt>Effect</dt><dd>Two points credited. The conviction is untouched</dd>
        <dt>How often</dt><dd>Once in three years, five times in a lifetime</dd>
        <dt>Eligibility</dt><dd>You need at least 2 and fewer than 12 points on the record to apply</dd>
        <dt>Suspension</dt><dd>12 or more points in two years. A warning letter goes out at six points in a two-year period</dd>
        <dt>Citations</dt><dd class="cite">O.R.C. §§ 4510.036, 4510.037, 4510.61; O.A.C. Ch. 4501-21</dd>
      </dl>
      <p>Useless to a visiting driver, and unusually useful to an Ohio licensee who got a ticket somewhere else. Ohio points are assessed by the sentencing court rather than by the BMV, and every entry in the point schedule is keyed to a Revised Code section or a municipal ordinance, so there is no point value for a foreign conviction to carry.</p>
      <p>Be clear about what that is. It is a reading of how the statute is built, corroborated by Ohio practitioners, and the BMV has published no position on it either way. It is firmer than our Arizona answer and softer than a rule you could quote back to a hearing officer.</p>
      <p class="more"><a href="/ohio/does-traffic-school-remove-points">Ohio in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="new-york">New York</h3><span class="tag n">Point credit only</span></div>
      <dl>
        <dt>Programme</dt><dd>Point and Insurance Reduction Program (PIRP), online version I-PIRP</dd>
        <dt>Length</dt><dd>320 minutes, classroom and online alike. Classroom delivery sits under Part 138 and the internet version under Part 141</dd>
        <dt>Effect</dt><dd>Up to 4 points subtracted for suspension maths. DMV states plainly that it does not remove the violation, the conviction, or the points from the record</dd>
        <dt>Insurance</dt><dd>Insurers must cut base premiums 10 per cent a year for three years</dd>
        <dt>How often</dt><dd>Point reduction once in 18 months. Retake every 36 months to keep the insurance cut</dd>
        <dt>Suspension</dt><dd>11 points in 24 months</dd>
        <dt>Citations</dt><dd class="cite">15 NYCRR Parts 138 and 141</dd>
      </dl>
      <p>New York changed its point system on 16 February 2026. The look-back went from 18 months to 24, driving while intoxicated went from 0 points to 11, aggravated unlicensed operation under VTL § 511 also went to 11, and passing a stopped school bus went from 5 to 8. Ordinary unlicensed operation under § 509 stays at zero, which is a distinction several summaries of the change have already flattened.</p>
      <p>Points count from the date of the violation, so anything on or before 15 February 2026 uses the old values. Any page written before that date has the wrong numbers on it.</p>
      <p class="more"><a href="/new-york/does-traffic-school-remove-points">New York in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="new-jersey">New Jersey</h3><span class="tag n">Point credit only</span></div>
      <dl>
        <dt>Programmes</dt><dd>Three separate ones. The voluntary Defensive Driving Course, the Driver Improvement Program triggered by point accumulation, and the Probationary Driver Program. MVC states that defensive driving is not a substitute for driver improvement</dd>
        <dt>Length</dt><dd>Defensive driving is at least six hours, of which at least four must be classroom</dd>
        <dt>Effect</dt><dd>Defensive driving credits 2 points, once in five years, and only if points are actually on the record. Driver improvement credits up to 3</dd>
        <dt>Suspension</dt><dd>12 points, on a graduated schedule from 30 days upward</dd>
        <dt>Cost</dt><dd>The driver improvement programme carries a $75 administrative fee to MVC on top of provider fees</dd>
        <dt>Citations</dt><dd class="cite">N.J.A.C. 13:21-24.2, 13:21-24.5, 13:19-10.1, 13:19-10.2</dd>
      </dl>
      <p>New Jersey is the harshest home state in this group and the reason is the flat rate. Two points for an out-of-state moving violation regardless of severity, which means a minor infraction in a state you were driving through costs the same as one that would have been minor at home.</p>
      <p class="more"><a href="/new-jersey/does-traffic-school-remove-points">New Jersey in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="virginia">Virginia</h3><span class="tag n">Point credit only</span></div>
      <dl>
        <dt>Programme</dt><dd>Driver improvement clinic. CDL holders have a separate commercial programme</dd>
        <dt>Length</dt><dd>8 hours</dd>
        <dt>Effect</dt><dd>Five demerit points subtracted. If you have fewer than five demerits, you get a reduction and safe driving points instead, capped at five</dd>
        <dt>The trade-off</dt><dd>Safe driving points or the statutory insurance premium reduction, either one but not both, once in two years</dd>
        <dt>If a court sends you</dt><dd>The court decides whether you get safe driving points, and without that notification the Department awards none</dd>
        <dt>Who can attend</dt><dd>Any resident or non-resident holding a valid licence to drive in Virginia may attend voluntarily, with or without accumulated demerits</dd>
        <dt>Cost</dt><dd>Capped. The clinic may charge no more than $100</dd>
        <dt>Suspension</dt><dd>18 points in 12 months or 24 in 24 months for drivers 18 and over</dd>
        <dt>Citations</dt><dd class="cite">Va. Code §§ 46.2-492, 46.2-498, 46.2-505, 46.2-506, 38.2-2217</dd>
      </dl>
      <p>Virginia is the state most likely to turn a routine trip into a criminal matter. Reckless driving is a Class 1 misdemeanour, and it does not take much speed to get there. For an international student with no baseline for how American traffic law works, that is the single most important thing on this page.</p>
      <p class="more"><a href="/virginia/does-traffic-school-remove-points">Virginia in more depth: does traffic school remove points there</a></p>
    </div>

    <div class="st">
      <div class="st-hd"><h3 id="georgia">Georgia</h3><span class="tag n">Nothing to reduce</span></div>
      <dl>
        <dt>Programme</dt><dd>Driver improvement, which DDS also calls defensive driving</dd>
        <dt>Length</dt><dd>6 hours</dd>
        <dt>Effect</dt><dd>Up to 7 points removed, to not less than zero</dd>
        <dt>How often</dt><dd>Once in five years</dd>
        <dt>Eligibility</dt><dd>The statute names no residency condition, but DDS administers the reduction for licensed Georgia residents. The course must be taken at a DDS-certified school or it will not be accepted</dd>
        <dt>Suspension</dt><dd>15 or more points in any 24 months</dd>
        <dt>Citations</dt><dd class="cite">O.C.G.A. §§ 40-5-86, 40-5-57</dd>
      </dl>
      <p>Georgia is the odd one out twice over. It is one of three states outside the compact, and the point reduction is a dead end for a visiting driver for a reason that is almost funny. DDS says non-Georgia residents do not receive Georgia points in the first place. Nothing to reduce, so nothing for the course to do.</p>
      <p class="more"><a href="/georgia/does-traffic-school-remove-points">Georgia in more depth: does traffic school remove points there</a></p>
    </div>

  </div>
</section>

<section>
  <h2>Three things we could not settle</h2>

  <p class="lede">These are open. We are not going to guess, because a wrong answer here costs someone real money. Each one names the office to call and the question to ask.</p>

  <div class="oqwrap">

    <div class="oq">
      <h3>1. Does Arizona point out-of-state convictions?</h3>
      <p>Nothing in Arizona's rule excludes an out-of-state conviction, and three features point toward points being assigned. The Department assigns Arizona points rather than the court, which is the opposite of Ohio. The point table carries a jurisdiction-neutral two-point catch-all for "any other traffic regulation that governs a vehicle moving under its own power." And the statutory definition of conviction has no in-state limit.</p>
      <p>None of that is a finding. It is an absence of exclusion, and no Arizona source says one way or the other.</p>
      <p class="ask">ADOT MVD, 602-255-0072, ask for Driver Improvement or Records Services.<br>Ask: when MVD receives an out-of-state moving violation on an Arizona licensee through the compact and posts it under an ACD code, does the Department assign a point value under A.A.C. R17-4-404, including the Table 1 catch-all entry?</p>
    </div>

    <div class="oq">
      <h3>2. Does California's masking stop the report to your home state?</h3>
      <p>This is the most consequential gap on the page. California is a compact member, and the compact provision requires reporting each conviction of a driver from another party state. California's masking statute says the record is confidential and shall not be disclosed to any person except a court. Both are mandatory. Neither mentions the other.</p>
      <p>The masking statute does lift confidentiality for out-of-state commercial licence holders specifically, which suggests the legislature had out-of-state drivers in mind. That is an argument, not a finding. No agency, court, attorney general opinion or Judicial Council document we found addresses it.</p>
      <p>What we can say: masking is documented to protect the California record and the California point count. Its effect on a record in another state is unestablished. Do not assume it works.</p>
      <p class="ask">California DMV, 1-800-777-0133. A public records request is more reliable than a phone call here.<br>Ask for: any written policy or business rule governing whether the Department transmits to another state a conviction recorded as confidential under Veh. Code § 1808.7 for a driver licensed in another compact state.</p>
    </div>

    <div class="oq">
      <h3>3. Does a North Carolina prayer for judgment follow you home?</h3>
      <p>North Carolina courts must report a PJC to NCDMV. For most drivers it is not a conviction under North Carolina's own definition, so North Carolina's mandatory reporting duty to other states does not obviously reach it. Whether NCDMV forwards it anyway through routine interstate messaging is not published.</p>
      <p>The receiving end is open too. Virginia assigns points to convictions received from other states by statute, and has published nothing on how it treats a PJC or any other deferred disposition. We found no documented case either way.</p>
      <p class="ask">NCDMV, 919-715-7000, Driver License Section.<br>Ask: when a North Carolina court enters a PJC for a driver licensed in another state and reports it under G.S. 20-24(b)(5), does the Division transmit that record to the home state, and is it flagged as a conviction or as a PJC?</p>
    </div>

  </div>

  <div class="box red">
    <span class="lb">What to actually do</span>
    <p>Call the clerk of the court printed on your citation before you pay anything and before you enrol in anything. Ask two questions. Whether the court offers a disposition that avoids a conviction, and whether you qualify for it holding an out-of-state licence. Those two answers settle your case, and no page on the internet can settle it for you.</p>
  </div>
</section>
`;

export const BODY_SOURCES = `
<div class="sources">
  <h2>Sources</h2>
  <ul>
    <li>AAMVA, Driver License Compact and Non-Resident Violator Compact joinder dates, revised April 2026</li>
    <li>49 U.S.C. § 30304, National Driver Register reporting requirements</li>
    <li>23 C.F.R. Part 1327, Problem Driver Pointer System</li>
    <li>Tex. Code Crim. Proc. arts. 45A.351 to 45A.359; Tex. Transp. Code § 521.292; HB 4504 (2023) recodification; SB 296 (2025); TDLR curriculum standards</li>
    <li>Fla. Stat. §§ 318.14(9), 322.27(3)(e); Fla. Admin. Code R. 15A-8.006; FLHSMV driver improvement schools and traffic citations pages</li>
    <li>15 NYCRR Parts 138 and 141; NY DMV Point and Insurance Reduction Program; NY DMV point system; DMV Commissioner's notice of 30 January 2026</li>
    <li>N.J.A.C. 13:21-24.2, 13:21-24.5, 13:19-10.1, 13:19-10.2; NJ MVC driver programs and point schedule</li>
    <li>O.R.C. §§ 4510.036, 4510.037, 4510.61; O.A.C. Ch. 4501-21; Ohio BMV materials</li>
    <li>O.C.G.A. §§ 40-5-57, 40-5-86; Georgia DDS points and points reduction, driver improvement programme</li>
    <li>N.C.G.S. §§ 20-4.01(4a), 20-4.24, 20-16, 20-24; 19A NCAC 03G .0400; UNC School of Government benchbook; NCDMV</li>
    <li>Va. Code §§ 38.2-2217, 46.2-492(B), 46.2-498, 46.2-505, 46.2-506; Virginia DMV driver improvement, clinics, and point assessment pages</li>
    <li>A.R.S. §§ 28-101, 28-701.02, 28-1852, 28-3392 to 28-3396; A.A.C. R17-4-404 and Table 1; ACJA § 7-205; Arizona Supreme Court defensive driving school instructions</li>
    <li>Cal. Veh. Code §§ 470, 1803.5, 1808.7, 15022, 42005; Cal. Rule of Court 4.104; 13 CCR § 345.30; California DMV negligent operator pages; Judicial Council invitation to comment SP11-01</li>
  </ul>
  <p class="stamp">
    Last verified August 2026. Written and checked by TrafficSchoolPicker.<br>
    No affiliate links appear on this page, and none will be added to it.<br>
    This is a reference, not legal advice. Where it matters, the clerk of your court is the authority, not us.
  </p>
</div>
`;
