export type PageSeoConfig = {
  title: string;          // <title> tag — max 60 chars
  description: string;    // meta description — max 155 chars
  h1: string;             // Page H1
  primaryKeyword: string; // The single keyword this page targets
  canonicalPath: string;  // e.g. "/california" — no trailing slash
};

// ─── State Pages ──────────────────────────────────────────────

export const STATE_SEO: Record<string, PageSeoConfig> = {
  california: {
    title: "Best Online Traffic School in California (2026)",
    description: "Compare California DMV-approved online traffic schools. Find the lowest price, read real reviews, and enroll today. Court-approved for ticket dismissal.",
    h1: "The Best Online Traffic Schools in California (2026)",
    primaryKeyword: "online traffic school California",
    canonicalPath: "/california",
  },
  texas: {
    title: "Best Online Defensive Driving Texas (2026)",
    description: "Compare TDLR-approved online defensive driving courses in Texas. Dismiss your ticket with a state-approved driving safety course. Lowest prices, verified reviews.",
    h1: "The Best Online Defensive Driving Courses in Texas (2026)",
    primaryKeyword: "online defensive driving Texas",
    canonicalPath: "/texas",
  },
  florida: {
    title: "Best Online Traffic School Florida (2026)",
    description: "Compare DHSMV-approved Basic Driver Improvement (BDI) courses in Florida. Lowest prices, honest reviews, and court-accepted online options.",
    h1: "The Best Online Traffic Schools in Florida (2026)",
    primaryKeyword: "online traffic school Florida",
    canonicalPath: "/florida",
  },
  "new-york": {
    title: "Best NY Defensive Driving Course Online (2026)",
    description: "Compare NY DMV-approved PIRP courses online. Reduce up to 4 points and earn a 10% insurance discount. Lowest prices, no hidden fees.",
    h1: "The Best Online Defensive Driving Courses in New York (2026)",
    primaryKeyword: "New York defensive driving online",
    canonicalPath: "/new-york",
  },
  arizona: {
    title: "Arizona Defensive Driving & Ticket Dismissal (2026)",
    description: "Arizona's Supreme Court-approved Defensive Driving School (DDS) dismisses an eligible ticket and keeps points off your record. How it works and what it costs.",
    h1: "Arizona Defensive Driving & Ticket Dismissal (2026)",
    primaryKeyword: "Arizona defensive driving school",
    canonicalPath: "/arizona",
  },
  georgia: {
    title: "Best Online Defensive Driving Georgia (2026)",
    description: "Compare Georgia DDS-approved online defensive driving courses. Reduce up to 7 points. Lowest prices and verified reviews.",
    h1: "The Best Online Defensive Driving Courses in Georgia (2026)",
    primaryKeyword: "Georgia defensive driving online",
    canonicalPath: "/georgia",
  },
  ohio: {
    title: "Best Online Traffic School Ohio (2026)",
    description: "Compare Ohio BMV-approved Driver Safety Program courses. Reduce 2 points on your record. Lowest prices, verified reviews.",
    h1: "The Best Online Traffic Schools in Ohio (2026)",
    primaryKeyword: "Ohio traffic school online",
    canonicalPath: "/ohio",
  },
  illinois: {
    title: "Illinois Traffic Ticket Court Supervision (2026)",
    description: "Illinois has no course that reduces license points. Court supervision keeps a conviction off your record; your court sets any traffic-school requirement.",
    h1: "Illinois Traffic Tickets & Court Supervision (2026)",
    primaryKeyword: "Illinois court supervision traffic ticket",
    canonicalPath: "/illinois",
  },
  virginia: {
    title: "Best Online Driver Improvement Virginia (2026)",
    description: "Compare Virginia DMV-approved Driver Improvement Clinics online. Reduce 5 demerit points and earn an insurance discount.",
    h1: "The Best Online Driver Improvement Clinics in Virginia (2026)",
    primaryKeyword: "Virginia driver improvement online",
    canonicalPath: "/virginia",
  },
  washington: {
    title: "Washington Traffic Tickets & Deferred Findings (2026)",
    description: "Washington keeps no point system. A ticket can be cleared through a court-granted deferred finding, once every 7 years; the court sets the conditions, which many courts satisfy with a traffic safety course. Here's how it works.",
    h1: "Washington Traffic Tickets & Deferred Findings (2026)",
    primaryKeyword: "Washington deferred finding traffic ticket",
    canonicalPath: "/washington",
  },
  "washington-dc": {
    title: "Washington DC Online Traffic School & Points (2026)",
    description: "The DC DMV runs an official online traffic school: with a hearing examiner's approval it removes points, it does not dismiss your ticket. Here's how it works and who qualifies.",
    h1: "Washington DC Online Traffic School: Points, Not Dismissal (2026)",
    primaryKeyword: "Washington DC online traffic school points",
    canonicalPath: "/washington-dc",
  },
  colorado: {
    title: "Best Online Traffic School Colorado (2026)",
    description: "Compare court-approved online traffic school courses in Colorado. Mask your ticket from your public record. Lowest prices.",
    h1: "The Best Online Traffic Schools in Colorado (2026)",
    primaryKeyword: "Colorado traffic school online",
    canonicalPath: "/colorado",
  },
  nevada: {
    title: "Best Online Traffic School Nevada (2026)",
    description: "Compare Nevada DMV-approved traffic safety schools. Remove 3 demerit points from your record. Lowest prices and verified reviews.",
    h1: "The Best Online Traffic Schools in Nevada (2026)",
    primaryKeyword: "Nevada traffic school online",
    canonicalPath: "/nevada",
  },
  michigan: {
    title: "Best Online Driver Improvement Michigan (2026)",
    description: "Compare Michigan-approved online Driver Improvement courses. Avoid future points and earn an insurance discount. Lowest prices.",
    h1: "The Best Online Driver Improvement Courses in Michigan (2026)",
    primaryKeyword: "Michigan driver improvement online",
    canonicalPath: "/michigan",
  },
  missouri: {
    title: "Best Online Driver Improvement Missouri (2026)",
    description: "Compare Missouri-approved online Driver Improvement Program courses. Reduce points with court approval, once every 3 years. Lowest prices.",
    h1: "The Best Online Driver Improvement Programs in Missouri (2026)",
    primaryKeyword: "Missouri driver improvement online",
    canonicalPath: "/missouri",
  },
  tennessee: {
    title: "Best Online Traffic School Tennessee (2026)",
    description: "Compare Tennessee-approved online traffic school courses. Remove points from your record, once every 4 years. Lowest prices.",
    h1: "The Best Online Traffic Schools in Tennessee (2026)",
    primaryKeyword: "Tennessee traffic school online",
    canonicalPath: "/tennessee",
  },
  wisconsin: {
    title: "Best Online Traffic School Wisconsin (2026)",
    description: "Compare Wisconsin DMV-approved online traffic school courses. Protect your insurance rate. Lowest prices.",
    h1: "The Best Online Traffic Schools in Wisconsin (2026)",
    primaryKeyword: "Wisconsin traffic school online",
    canonicalPath: "/wisconsin",
  },
  indiana: {
    title: "Best Online Driver Safety Program Indiana (2026)",
    description: "Compare Indiana BMV-approved Driver Safety Program courses online. Earn a 4-point credit on your record. Lowest prices.",
    h1: "The Best Online Driver Safety Programs in Indiana (2026)",
    primaryKeyword: "Indiana driver safety program online",
    canonicalPath: "/indiana",
  },
  kansas: {
    title: "Kansas Traffic Ticket Diversion & Courses (2026)",
    description: "Kansas has no point system. Ticket dismissal is court-by-court through diversion; an approved course earns a required insurance discount. Compare courses.",
    h1: "Kansas Defensive Driving & Ticket Diversion (2026)",
    primaryKeyword: "Kansas defensive driving diversion",
    canonicalPath: "/kansas",
  },
  louisiana: {
    title: "Best Online Defensive Driving Louisiana (2026)",
    description: "Compare Louisiana-approved online defensive driving courses. Dismiss a first-offense misdemeanor ticket statewide, once every 2 years (art. 892.1), or earn a 10% insurance discount.",
    h1: "The Best Online Defensive Driving Courses in Louisiana (2026)",
    primaryKeyword: "Louisiana defensive driving online",
    canonicalPath: "/louisiana",
  },
  oklahoma: {
    title: "Best Online Defensive Driving Oklahoma (2026)",
    description: "Oklahoma's 2-point credit requires an in-person classroom course, not online; any ticket dismissal is up to the court on your citation. Here's what qualifies.",
    h1: "The Best Online Defensive Driving Courses in Oklahoma (2026)",
    primaryKeyword: "Oklahoma defensive driving online",
    canonicalPath: "/oklahoma",
  },
  "new-mexico": {
    title: "Best Online Defensive Driving New Mexico (2026)",
    description: "New Mexico has no statewide MVD program to remove points; dismissal is up to the court on your citation, which may accept a course as a deferral so no points are assessed. Here's what actually helps.",
    h1: "The Best Online Defensive Driving Courses in New Mexico (2026)",
    primaryKeyword: "New Mexico defensive driving online",
    canonicalPath: "/new-mexico",
  },
  mississippi: {
    title: "Best Online Defensive Driving Mississippi (2026)",
    description: "Compare Mississippi-approved online defensive driving courses. Keep the conviction off your record via nonadjudication, once every 3 years. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Mississippi (2026)",
    primaryKeyword: "Mississippi defensive driving online",
    canonicalPath: "/mississippi",
  },
  nebraska: {
    title: "Best Online Defensive Driving Nebraska (2026)",
    description: "Compare Nebraska DMV-certified online defensive driving courses. Earn a 2-point credit on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Nebraska (2026)",
    primaryKeyword: "Nebraska defensive driving online",
    canonicalPath: "/nebraska",
  },
  wyoming: {
    title: "Wyoming Traffic Tickets & Defensive Driving (2026)",
    description: "Wyoming has no point system. Whether a defensive driving course helps dismiss a ticket is decided court by court. Compare Wyoming courses and prices.",
    h1: "Wyoming Defensive Driving & Traffic Tickets (2026)",
    primaryKeyword: "Wyoming defensive driving",
    canonicalPath: "/wyoming",
  },
  alabama: {
    title: "Alabama Traffic Tickets & Defensive Driving (2026)",
    description: "Alabama has no statewide course that dismisses a ticket; dismissal is court-by-court. Drivers 55+ get a mandated insurance discount for an approved course. Here's what helps.",
    h1: "Alabama Traffic Tickets & Defensive Driving (2026)",
    primaryKeyword: "Alabama defensive driving ticket",
    canonicalPath: "/alabama",
  },
  alaska: {
    title: "Alaska Traffic Tickets & Point Reduction (2026)",
    description: "Alaska's DMV benefit is a point reduction: an approved defensive driving course reduces points once a year, not a ticket dismissal. Compare approved courses and prices.",
    h1: "Alaska Defensive Driving & Point Reduction (2026)",
    primaryKeyword: "Alaska defensive driving point reduction",
    canonicalPath: "/alaska",
  },
  arkansas: {
    title: "Arkansas Traffic Tickets & Defensive Driving (2026)",
    description: "Arkansas has no statewide course that dismisses a ticket; that's court-by-court. Drivers 55+ get a 3-year insurance discount for an approved classroom course. Here's what helps.",
    h1: "Arkansas Traffic Tickets & Defensive Driving (2026)",
    primaryKeyword: "Arkansas defensive driving ticket",
    canonicalPath: "/arkansas",
  },
  connecticut: {
    title: "Connecticut Traffic Tickets & Defensive Driving (2026)",
    description: "Connecticut has no statewide course that dismisses a ticket or removes points. Drivers 60+ get a mandated insurance discount for an approved course. Here's what actually helps.",
    h1: "Connecticut Traffic Tickets & Defensive Driving (2026)",
    primaryKeyword: "Connecticut defensive driving insurance discount",
    canonicalPath: "/connecticut",
  },
  delaware: {
    title: "Best Online Defensive Driving Delaware (2026)",
    description: "Compare Delaware-approved online defensive driving courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Delaware (2026)",
    primaryKeyword: "Delaware defensive driving online",
    canonicalPath: "/delaware",
  },
  hawaii: {
    title: "Best Online Traffic School Hawaii (2026)",
    description: "Compare Hawaii-approved online traffic school courses. Dismiss your ticket. Lowest prices and verified reviews.",
    h1: "The Best Online Traffic Schools in Hawaii (2026)",
    primaryKeyword: "Hawaii traffic school online",
    canonicalPath: "/hawaii",
  },
  idaho: {
    title: "Best Online Defensive Driving Idaho (2026)",
    description: "Compare Idaho-approved online defensive driving courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Idaho (2026)",
    primaryKeyword: "Idaho defensive driving online",
    canonicalPath: "/idaho",
  },
  iowa: {
    title: "Best Online Defensive Driving Iowa (2026)",
    description: "Compare Iowa-approved online defensive driving courses. Dismiss your traffic ticket. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Iowa (2026)",
    primaryKeyword: "Iowa defensive driving online",
    canonicalPath: "/iowa",
  },
  kentucky: {
    title: "Kentucky State Traffic School & Tickets (2026)",
    description: "Kentucky State Traffic School is court-referral only. It keeps points off your record but is not a dismissal. What it is, how referral works, what it costs.",
    h1: "Kentucky Traffic Tickets & State Traffic School (2026)",
    primaryKeyword: "Kentucky State Traffic School",
    canonicalPath: "/kentucky",
  },
  maine: {
    title: "Maine Traffic Tickets & Driving Dynamics (2026)",
    description: "Maine approves no online defensive driving course. The state's classroom Driving Dynamics course earns a three-point record credit. Here's what actually helps.",
    h1: "Maine Traffic Tickets & Driving Dynamics (2026)",
    primaryKeyword: "Maine Driving Dynamics",
    canonicalPath: "/maine",
  },
  maryland: {
    title: "Maryland Traffic Tickets & Driver Improvement (2026)",
    description: "Maryland has no voluntary course that dismisses a ticket or removes points. The MVA Driver Improvement Program is assigned/remedial. Here's what actually applies.",
    h1: "Maryland Traffic Tickets & Driver Improvement (2026)",
    primaryKeyword: "Maryland driver improvement program",
    canonicalPath: "/maryland",
  },
  massachusetts: {
    title: "Traffic School in Massachusetts (2026)",
    description: "Massachusetts requires in-person traffic school. Find approved classroom courses and understand your options for ticket dismissal.",
    h1: "Traffic School in Massachusetts: What You Need to Know (2026)",
    primaryKeyword: "Massachusetts traffic school",
    canonicalPath: "/massachusetts",
  },
  minnesota: {
    title: "Minnesota Traffic Tickets & Defensive Driving (2026)",
    description: "Minnesota has no point system and no course that dismisses a ticket. Drivers 55+ get a mandated 10% insurance discount for three years. Here's what actually helps.",
    h1: "Minnesota Traffic Tickets & Defensive Driving (2026)",
    primaryKeyword: "Minnesota defensive driving insurance discount",
    canonicalPath: "/minnesota",
  },
  montana: {
    title: "Best Online Defensive Driving Montana (2026)",
    description: "Compare Montana-approved online defensive driving courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Montana (2026)",
    primaryKeyword: "Montana defensive driving online",
    canonicalPath: "/montana",
  },
  "new-hampshire": {
    title: "Best Online Defensive Driving New Hampshire (2026)",
    description: "Compare New Hampshire-approved online defensive driving courses. Earn an insurance discount. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in New Hampshire (2026)",
    primaryKeyword: "New Hampshire defensive driving online",
    canonicalPath: "/new-hampshire",
  },
  "new-jersey": {
    title: "Best Online Defensive Driving New Jersey (2026)",
    description: "Compare NJ MVC-approved online defensive driving courses. Reduce up to 2 points and lower insurance. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in New Jersey (2026)",
    primaryKeyword: "New Jersey defensive driving online",
    canonicalPath: "/new-jersey",
  },
  "north-carolina": {
    title: "Best Online Defensive Driving North Carolina (2026)",
    description: "Compare North Carolina-approved online defensive driving courses. Dismiss your traffic ticket. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in North Carolina (2026)",
    primaryKeyword: "North Carolina defensive driving online",
    canonicalPath: "/north-carolina",
  },
  "north-dakota": {
    title: "Best Online Defensive Driving North Dakota (2026)",
    description: "Compare North Dakota-approved online defensive driving courses. Earn an insurance premium reduction. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in North Dakota (2026)",
    primaryKeyword: "North Dakota defensive driving online",
    canonicalPath: "/north-dakota",
  },
  oregon: {
    title: "Traffic School in Oregon (2026)",
    description: "Oregon has no statewide diversion program. With the court's approval, an approved traffic-safety course (online or classroom) may dismiss a minor violation. Here's what actually helps.",
    h1: "Traffic School in Oregon: What You Need to Know (2026)",
    primaryKeyword: "Oregon traffic school",
    canonicalPath: "/oregon",
  },
  pennsylvania: {
    title: "Pennsylvania Traffic Tickets & Driver Improvement (2026)",
    description: "Pennsylvania has no voluntary course that dismisses a ticket or removes points. PennDOT assigns a mandatory Driver Improvement School at 6+ points. Here's what to know.",
    h1: "Pennsylvania Traffic Tickets & Driver Improvement (2026)",
    primaryKeyword: "Pennsylvania driver improvement school",
    canonicalPath: "/pennsylvania",
  },
  "rhode-island": {
    title: "Best Online Defensive Driving Rhode Island (2026)",
    description: "Compare Rhode Island-approved online defensive driving courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Rhode Island (2026)",
    primaryKeyword: "Rhode Island defensive driving online",
    canonicalPath: "/rhode-island",
  },
  "south-carolina": {
    title: "South Carolina Traffic Tickets & Point Reduction (2026)",
    description: "South Carolina removes 4 points only for the National Safety Council 8-hour course, in a classroom or NSC virtual, not general online courses. Here's what actually qualifies.",
    h1: "South Carolina Traffic Tickets & Point Reduction (2026)",
    primaryKeyword: "South Carolina point reduction course",
    canonicalPath: "/south-carolina",
  },
  "south-dakota": {
    title: "South Dakota Traffic Tickets & Defensive Driving (2026)",
    description: "South Dakota has no course that dismisses a ticket or removes points; points fall off only with time. Any dismissal is up to the court, and uncommon. Here's what to know.",
    h1: "South Dakota Traffic Tickets & Defensive Driving (2026)",
    primaryKeyword: "South Dakota traffic ticket defensive driving",
    canonicalPath: "/south-dakota",
  },
  utah: {
    title: "Best Online Defensive Driving Utah (2026)",
    description: "Compare Utah DLD-approved online defensive driving courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Utah (2026)",
    primaryKeyword: "Utah defensive driving online",
    canonicalPath: "/utah",
  },
  vermont: {
    title: "Vermont Traffic Tickets: No Online Course (2026)",
    description: "Vermont approves no online defensive driving course for dismissal, points, or an insurance discount. Here's what a Vermont driver can actually do.",
    h1: "Vermont Traffic Tickets: Why There's No Online Course (2026)",
    primaryKeyword: "Vermont traffic ticket",
    canonicalPath: "/vermont",
  },
  "west-virginia": {
    title: "Best Online Defensive Driving West Virginia (2026)",
    description: "Compare West Virginia-approved online defensive driving courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in West Virginia (2026)",
    primaryKeyword: "West Virginia defensive driving online",
    canonicalPath: "/west-virginia",
  },
};

// ─── Homepage ─────────────────────────────────────────────────

export const HOME_SEO: PageSeoConfig = {
  title: "Best Online Traffic School — Compare & Save (2026)",
  description: "Compare online traffic school and defensive driving options for all 50 states and DC. Find the lowest price, read real reviews, and enroll in minutes.",
  h1: "Find the Best Online Traffic School in Your State",
  primaryKeyword: "best online traffic school",
  canonicalPath: "/",
};

// ─── Blog Posts ───────────────────────────────────────────────

export const BLOG_SEO: Record<string, PageSeoConfig> = {
  "true-cost-of-a-traffic-ticket": {
    title: "The True Cost of a Traffic Ticket by State (2026)",
    description:
      "A speeding ticket's real cost is the 3-year insurance surcharge, not the fine. Our 51-state analysis of all-in costs and where traffic school saves most.",
    h1: "The True Cost of a Traffic Ticket in Every State (2026)",
    primaryKeyword: "true cost of a traffic ticket",
    canonicalPath: "/blog/true-cost-of-a-traffic-ticket",
  },
  "how-to-dismiss-traffic-ticket-online": {
    title: "How to Dismiss a Traffic Ticket Online (2026)",
    description: "Step-by-step guide to dismissing your traffic ticket through online traffic school. Eligibility, enrollment, and certificate submission.",
    h1: "How to Dismiss a Traffic Ticket Online: A Complete 2026 Guide",
    primaryKeyword: "how to dismiss a traffic ticket",
    canonicalPath: "/blog/how-to-dismiss-traffic-ticket-online",
  },
  "traffic-school-vs-paying-ticket": {
    title: "Traffic School vs Paying the Ticket: Which Saves More?",
    description: "A detailed cost comparison showing why traffic school almost always saves you money over just paying your fine. Real numbers, all states.",
    h1: "Traffic School vs Paying the Ticket: The Real Cost Comparison",
    primaryKeyword: "traffic school vs paying ticket",
    canonicalPath: "/blog/traffic-school-vs-paying-ticket",
  },
  "best-online-traffic-schools-2026": {
    title: "Best Online Traffic Schools in 2026: Expert Rankings",
    description: "Our editorial team reviewed and ranked the top online traffic schools based on price, quality, user experience, and court acceptance across all states.",
    h1: "The 5 Best Online Traffic Schools in 2026 (Independently Reviewed)",
    primaryKeyword: "best online traffic school 2026",
    canonicalPath: "/blog/best-online-traffic-schools-2026",
  },
  "does-traffic-school-remove-points": {
    title: "Does Traffic School Remove Points? (State Guide)",
    description: "Not every state removes points. Some mask, some reduce, some dismiss. This state-by-state guide explains what happens to your record.",
    h1: "Does Traffic School Remove Points From Your Record?",
    primaryKeyword: "does traffic school remove points from record",
    canonicalPath: "/blog/does-traffic-school-remove-points",
  },
  "do-you-need-a-lawyer-for-a-traffic-ticket": {
    title: "Do You Need a Lawyer for a Traffic Ticket? (2026)",
    description:
      "For most routine tickets, traffic school beats a lawyer on cost. A reckless charge, a CDL, or a looming suspension flips it. A state-by-state guide.",
    h1: "Do You Need a Lawyer for a Traffic Ticket?",
    primaryKeyword: "do you need a lawyer for a traffic ticket",
    canonicalPath: "/blog/do-you-need-a-lawyer-for-a-traffic-ticket",
  },
  "how-long-does-online-traffic-school-take": {
    title: "How Long Does Online Traffic School Take? (By State)",
    description: "California requires 8 hours. Texas requires 6. Florida requires 4. This guide covers every state so you know before you enroll.",
    h1: "How Long Does Online Traffic School Take to Complete?",
    primaryKeyword: "how long does online traffic school take",
    canonicalPath: "/blog/how-long-does-online-traffic-school-take",
  },
  "idrivesafely-vs-aceable": {
    title: "iDriveSafely vs Aceable (2026): Which Is Better?",
    description: "An honest comparison of iDriveSafely and Aceable — price, state availability, course experience, certificate speed, and customer reviews.",
    h1: "iDriveSafely vs Aceable: Honest 2026 Comparison",
    primaryKeyword: "iDriveSafely vs Aceable",
    canonicalPath: "/blog/idrivesafely-vs-aceable",
  },
  "how-to-dismiss-traffic-ticket-california": {
    title: "How to Dismiss a Traffic Ticket in California (2026)",
    description: "Step-by-step: how to get court approval, choose a DMV-licensed school, complete the course, and submit your certificate in California.",
    h1: "How to Dismiss a Traffic Ticket in California: 2026 Guide",
    primaryKeyword: "how to dismiss traffic ticket California",
    canonicalPath: "/blog/how-to-dismiss-traffic-ticket-california",
  },
  "texas-deferred-disposition": {
    title: "Texas Deferred Disposition: Complete Driver Guide (2026)",
    description: "Everything Texas drivers need to know about deferred disposition — how to request it, what course to take, and how to submit proof.",
    h1: "Texas Deferred Disposition Explained: Complete 2026 Guide",
    primaryKeyword: "Texas deferred disposition explained",
    canonicalPath: "/blog/texas-deferred-disposition",
  },
  "florida-bdi-vs-adi": {
    title: "Florida BDI vs ADI: Which Traffic School Do You Need?",
    description: "BDI is 4 hours for first-time violations. ADI is 8 or 12 hours for repeat offenders. This guide explains which one applies to you.",
    h1: "Florida BDI vs ADI: Which Course Do You Actually Need?",
    primaryKeyword: "Florida BDI vs ADI",
    canonicalPath: "/blog/florida-bdi-vs-adi",
  },
};

// ─── Validation ───────────────────────────────────────────────

export function validateSeoConfig(): void {
  if (process.env.NODE_ENV !== "development") return;

  const allConfigs = [
    HOME_SEO,
    ...Object.values(STATE_SEO),
    ...Object.values(BLOG_SEO),
  ];

  for (const config of allConfigs) {
    if (config.title.length > 60) {
      console.warn(
        `SEO title too long (${config.title.length} chars): ${config.title}`
      );
    }
    if (config.description.length > 155) {
      console.warn(
        `SEO description too long (${config.description.length} chars): ${config.description}`
      );
    }
  }
}
