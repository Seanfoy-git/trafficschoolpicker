# "When a lawyer beats traffic school" — review before ship

**Status: BUILT, NOT LIVE.** Everything below is on branch `feat/lawyer-block`. Nothing
is written to Notion and nothing is deployed. Per the brief: *"Nothing in this brief
should ship before Sean reviews the copy below — these are researched candidates, not
confirmed relationships. No affiliate deal, no referral fee, no reciprocal link
requirement. This is one-way: TSP links out, nothing is asked in return."*

This is the Play A (attorney-referral) prerequisite. Sean's sign-off is the gate.

---

## What's built (code, on the branch)

| Piece | File | Notes |
|---|---|---|
| Types | `lib/types.ts` | `LawyerFirm`, `LawyerBlock`; `StateInfo.lawyerBlock: LawyerBlock \| null` |
| Parser | `lib/notion.ts` | `parseLawyerBlock()` reads the `Lawyer Block` rich_text field (JSON, `lawyerblock:` prefix, mirrors the State FAQ pattern). Returns `null` on empty/malformed/no-valid-firm input |
| Component | `components/LawyerBlock.tsx` | Heading "When a lawyer beats traffic school", disqualifier intro, firm cards, generic closing sentence, standing no-affiliate/not-legal-advice disclosure |
| Render wiring | `app/[state]/page.tsx` | Renders **between the eligibility context and the comparison table**, exactly per the brief. Only renders when `stateInfo.lawyerBlock` is non-null |
| Click tracking | `components/LawyerBlock.tsx` | Each outbound link fires `track("lawyer_click", { firm, state })` — same Vercel Analytics mechanism as `affiliate_click` |

**Graceful degradation (brief requirement #2):** a state with no populated/valid firms
renders **nothing** — no empty block on the other 41 states. This is enforced twice: the
parser returns `null` when there are zero firms with a valid `http(s)` URL, and the page
only mounts the component when `lawyerBlock` is non-null.

**The URL is the safety gate.** A firm with an empty or non-URL `url` is silently dropped
by the parser. The draft copy ships with **every `url` blank**, so even if the data is
written to Notion today, the block stays dark until Sean pastes verified URLs. No verified
URL, no outbound link, no render.

---

## Data model

One `Lawyer Block` rich_text property on the States DB (the brief's option A — single field,
no new DB). Value is a JSON string, `lawyerblock:` prefix:

```json
lawyerblock:{
  "disqualifier": "intro sentence — the scenario where a lawyer beats the course",
  "firms": [
    { "name": "Firm Name", "url": "https://…", "note": "one-line credibility note" }
  ],
  "lastReviewed": null
}
```

`lastReviewed` powers the **90-day re-verify cadence** (law firms merge/close more often than
DMV statutes change). Null = not yet reviewed. It's internal — not shown on the page.

---

## Per-state copy to review

For each firm: **approve or swap**, then **paste a verified live URL** (confirm the site is up
and the firm still practices traffic law). Disqualifier sentences were rewritten em-dash-free
to match house style; wording is otherwise faithful to the brief.

### Texas
> If your ticket was 25 or more mph over the limit, you hold a CDL, or this is a second eligible ticket inside the same 12-month window, a Texas court will not accept a driving safety course election. In those cases a lawyer is the better move.
- **Jack Byno & Associates** — 20+ years, former municipal judge, DFW to Hunt County reach — URL: ☐
- **Joyner + Joyner** — statewide reach; focus on CDL, no-license, and failure-to-appear cases — URL: ☐

### California
> If you have taken traffic school in the past 18 months, your ticket was more than 25 mph over the limit, it was alcohol or drug related, or you were driving a commercial vehicle, the Vehicle Code section 1808.7(b) masking does not reach it. A lawyer is the better option there.
- **Ticket Crushers, A Law Corporation** — statewide CA reach, 75+ years combined experience — URL: ☐
- **FYourTicket** — LA-based, statewide CA focus, 10,000+ tickets since 2014 — URL: ☐

### Florida
> If you already used a Basic Driver Improvement election in the past 12 months for the same ticket type, you are past the 5-election lifetime cap, or you missed the 30-day election window from the citation date, the course is off the table. A lawyer can still help.
- **The Ticket Clinic** — largest traffic ticket firm in the US, FL statewide — URL: ☐
- **Fight Your Ticket** — statewide FL; offices in Sarasota, Tampa, Clearwater, and Orlando — URL: ☐

### New York
> If you already have 4 or more points from the same violation type this cycle, or your ticket is not PIRP-eligible in the first place, the Point and Insurance Reduction Program will not help. A lawyer can look at the other options.
- **TicketHelp.com** — statewide attorney network, Manhattan to the Canadian border — URL: ☐
- **trafficticketlawyernewyork.com** — statewide court coverage: Buffalo, Rochester, Syracuse, and downstate — URL: ☐

### Georgia
> If you already used the 7-point reduction within the past 5 years (O.C.G.A. section 40-5-86), or your violation is not the kind the DDS course covers, the course will not help you. A lawyer is the better call.
- **Kohn & Yager (Bubba Head)** — statewide GA network built for out-of-metro cases — URL: ☐
- **Scott Fortas** — coverage across most courts in the state of Georgia — URL: ☐

### Ohio — ⚠ NEEDS SEAN SIGN-OFF (framing differs)
Ohio's program is entirely court-discretion (States DB: *"eligibility and benefit depends on
the court's ruling for your specific case"* — no statewide statute, no hard mph/CDL cutoff).
The honest disqualifier isn't "you don't qualify," it's "the court has discretion and might
say no regardless" — which is arguably a *stronger* case for a lawyer. Suggested copy:
> Ohio leaves traffic school acceptance up to the individual court. If your court is a hard no, or you are not sure, a lawyer who knows that specific courtroom is worth more than the course.
- **The Ticket Clinic (Ohio)** — national firm's Ohio arm — URL: ☐
- **Bartell, Georgalas & Juarez** — three Ohio offices: Independence, Columbus, Oxford — URL: ☐

### North Carolina
> North Carolina does not dismiss a ticket automatically; it needs prior court permission on a per-case basis. The DMV point reduction needs 7 or more points and cannot be used more than once every 5 years, and many drivers use a Prayer for Judgment Continued instead, capped once every 3 years per household. A lawyer is the one who knows whether the course, the reduction, or a PJC is the right play for your ticket.
- **iTicket.law** — proprietary statewide court-record lookup, works in any NC county — URL: ☐
- **The Ticket Clinic (NC)** — national firm's North Carolina arm — URL: ☐

### Virginia
> If your ticket was 20 or more mph over the limit, or over 85 mph regardless of the limit, Virginia charges it as reckless driving, a Class 1 misdemeanor on a different track from ordinary demerit-point speeding. A course will not touch it, so you want a lawyer.
- **SRIS, P.C.** — statewide VA defense, former state trooper on staff — URL: ☐
- **Riley & Wells** — statewide; US News Best Law Firm, 1,500+ reviews — URL: ☐

### New Jersey
> New Jersey only offers a 2-point reduction once every 5 years and never a dismissal. If your real goal is keeping the ticket off your record entirely, you need a lawyer, not a course.
- **Rosenblum Law** — large, well-known NJ traffic firm — URL: ☐
- **Michael L. Nichnowitz** — statewide NJ municipal court representation, CDL focus — URL: ☐

### Arizona
> If you have taken Defensive Driving School within the past 24 months, or you hold a CDL and were cited in a commercial vehicle (the rule since September 1, 2019), you do not qualify for defensive driving school. A lawyer can help in those cases.
- **Law Offices of Brandon White** — statewide reach (Phoenix, Gilbert, Chandler, Mesa, Yuma, Tucson), former AZ trooper — URL: ☐
- **Arizona Defense Network** — broad AZ traffic ticket presence — URL: ☐

---

## Flags

1. **Ohio** — sign off on the court-discretion framing before it ships (above).
2. **Firm URLs** — none are filled. Each needs a verified live URL and a confirm-still-practicing
   check. This is deliberate: the block cannot render until you add them.
3. **Firm vetting** — these are researched candidates, not vetted relationships. Approve or swap.
4. **90-day cadence** — set `lastReviewed` when you verify; re-check every 90 days.
5. **Link rel** — outbound links use `rel="noopener noreferrer"` (followed). If you'd rather not
   pass link equity to unvetted firms, say so and I'll add `nofollow`. (Play A is about *giving*
   firms a real link, so followed is the default; your call.)

---

## How to take it live (after your review)

1. Paste approved firms + **verified URLs** into the `BLOCKS` table in
   `scripts/populate-lawyer-block.ts` (sign off on Ohio while you're there).
2. Dry-run: `npx tsx scripts/populate-lawyer-block.ts` (writes nothing; shows which states are
   still INERT for missing URLs).
3. Write it: `npx tsx scripts/populate-lawyer-block.ts --apply --stamp-reviewed`
   (creates the `Lawyer Block` property if needed, writes the 10 states, stamps `lastReviewed`).
4. Merge `feat/lawyer-block` to `main` → Vercel deploys. The block renders only on states with
   verified-URL firms.
