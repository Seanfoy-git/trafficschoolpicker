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
    description: "Compare TDLR-approved online defensive driving courses in Texas. Dismiss your ticket via deferred disposition. Lowest prices, verified reviews.",
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
    title: "Best Online Defensive Driving Arizona (2026)",
    description: "Compare Arizona Supreme Court-approved online defensive driving courses. Dismiss your ticket entirely. Lowest prices, verified reviews.",
    h1: "The Best Online Defensive Driving Courses in Arizona (2026)",
    primaryKeyword: "Arizona defensive driving online",
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
    title: "Best Online Traffic School Illinois (2026)",
    description: "Compare Illinois Secretary of State-approved IDSS courses online. Reduce up to 3 points. Lowest prices and verified reviews.",
    h1: "The Best Online Traffic Schools in Illinois (2026)",
    primaryKeyword: "Illinois traffic school online",
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
    title: "Best Online Traffic Safety School Washington (2026)",
    description: "Compare Washington State DOL-approved traffic safety school courses. Defer your ticket conviction. Lowest prices and verified reviews.",
    h1: "The Best Online Traffic Safety Schools in Washington (2026)",
    primaryKeyword: "Washington traffic safety school online",
    canonicalPath: "/washington",
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
    description: "Compare Nevada DMV-approved online traffic schools. Mask your ticket and protect your insurance rate. Lowest prices.",
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
    description: "Compare Missouri-approved online Driver Improvement Program courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Driver Improvement Programs in Missouri (2026)",
    primaryKeyword: "Missouri driver improvement online",
    canonicalPath: "/missouri",
  },
  tennessee: {
    title: "Best Online Traffic School Tennessee (2026)",
    description: "Compare Tennessee-approved online traffic school courses. Keep your ticket off your public record. Lowest prices.",
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
    title: "Best Online Defensive Driving Kansas (2026)",
    description: "Compare Kansas-approved online defensive driving courses. Dismiss your traffic ticket. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Kansas (2026)",
    primaryKeyword: "Kansas defensive driving online",
    canonicalPath: "/kansas",
  },
  louisiana: {
    title: "Best Online Defensive Driving Louisiana (2026)",
    description: "Compare Louisiana-approved online defensive driving courses. Dismiss your ticket in most parish courts. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Louisiana (2026)",
    primaryKeyword: "Louisiana defensive driving online",
    canonicalPath: "/louisiana",
  },
  oklahoma: {
    title: "Best Online Defensive Driving Oklahoma (2026)",
    description: "Compare Oklahoma-approved online defensive driving courses. Dismiss your traffic ticket. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Oklahoma (2026)",
    primaryKeyword: "Oklahoma defensive driving online",
    canonicalPath: "/oklahoma",
  },
  "new-mexico": {
    title: "Best Online Defensive Driving New Mexico (2026)",
    description: "Compare New Mexico DMV-approved online defensive driving courses. Dismiss your ticket. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in New Mexico (2026)",
    primaryKeyword: "New Mexico defensive driving online",
    canonicalPath: "/new-mexico",
  },
  mississippi: {
    title: "Best Online Defensive Driving Mississippi (2026)",
    description: "Compare Mississippi-approved online defensive driving courses. Dismiss your ticket if ticket-free for 3 years. Lowest prices.",
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
    title: "Best Online Defensive Driving Wyoming (2026)",
    description: "Compare Wyoming-approved online defensive driving courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Wyoming (2026)",
    primaryKeyword: "Wyoming defensive driving online",
    canonicalPath: "/wyoming",
  },
  alabama: {
    title: "Best Online Defensive Driving Alabama (2026)",
    description: "Compare Alabama-approved online defensive driving courses. Dismiss your ticket and protect your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Alabama (2026)",
    primaryKeyword: "Alabama defensive driving online",
    canonicalPath: "/alabama",
  },
  alaska: {
    title: "Best Online Defensive Driving Alaska (2026)",
    description: "Compare Alaska-approved online defensive driving courses. Earn an insurance discount. Lowest prices and verified reviews.",
    h1: "The Best Online Defensive Driving Courses in Alaska (2026)",
    primaryKeyword: "Alaska defensive driving online",
    canonicalPath: "/alaska",
  },
  arkansas: {
    title: "Best Online Defensive Driving Arkansas (2026)",
    description: "Compare Arkansas-approved online defensive driving courses. Dismiss your traffic ticket. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Arkansas (2026)",
    primaryKeyword: "Arkansas defensive driving online",
    canonicalPath: "/arkansas",
  },
  connecticut: {
    title: "Best Online Defensive Driving Connecticut (2026)",
    description: "Compare Connecticut DMV-approved online defensive driving courses. Earn an insurance discount. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Connecticut (2026)",
    primaryKeyword: "Connecticut defensive driving online",
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
    title: "Best Online Traffic School Kentucky (2026)",
    description: "Compare Kentucky-approved online traffic school courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Traffic Schools in Kentucky (2026)",
    primaryKeyword: "Kentucky traffic school online",
    canonicalPath: "/kentucky",
  },
  maine: {
    title: "Best Online Defensive Driving Maine (2026)",
    description: "Compare Maine-approved online defensive driving courses. Earn an insurance discount. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Maine (2026)",
    primaryKeyword: "Maine defensive driving online",
    canonicalPath: "/maine",
  },
  maryland: {
    title: "Best Online Driver Improvement Maryland (2026)",
    description: "Compare Maryland MVA-approved online driver improvement courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Driver Improvement Courses in Maryland (2026)",
    primaryKeyword: "Maryland driver improvement online",
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
    title: "Best Online Defensive Driving Minnesota (2026)",
    description: "Compare Minnesota-approved online defensive driving courses. Reduce a moving violation on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Minnesota (2026)",
    primaryKeyword: "Minnesota defensive driving online",
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
    description: "Oregon requires in-person traffic school for most violations. Find DDAC-approved course providers and understand your options.",
    h1: "Traffic School in Oregon: What You Need to Know (2026)",
    primaryKeyword: "Oregon traffic school",
    canonicalPath: "/oregon",
  },
  pennsylvania: {
    title: "Best Online Defensive Driving Pennsylvania (2026)",
    description: "Compare Pennsylvania PennDOT-approved defensive driving courses. Reduce points and earn an insurance discount.",
    h1: "The Best Online Defensive Driving Courses in Pennsylvania (2026)",
    primaryKeyword: "Pennsylvania defensive driving online",
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
    title: "Best Online Defensive Driving South Carolina (2026)",
    description: "Compare South Carolina DMV-approved online defensive driving courses. Dismiss your ticket. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in South Carolina (2026)",
    primaryKeyword: "South Carolina defensive driving online",
    canonicalPath: "/south-carolina",
  },
  "south-dakota": {
    title: "Best Online Defensive Driving South Dakota (2026)",
    description: "Compare South Dakota-approved online defensive driving courses. Reduce points on your record. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in South Dakota (2026)",
    primaryKeyword: "South Dakota defensive driving online",
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
    title: "Best Online Defensive Driving Vermont (2026)",
    description: "Compare Vermont-approved online defensive driving courses. Earn an insurance discount. Lowest prices.",
    h1: "The Best Online Defensive Driving Courses in Vermont (2026)",
    primaryKeyword: "Vermont defensive driving online",
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
  description: "Compare court-approved online traffic schools across all 50 states. Find the lowest price, read real reviews, and enroll in minutes.",
  h1: "Find the Best Online Traffic School in Your State",
  primaryKeyword: "best online traffic school",
  canonicalPath: "/",
};

// ─── Blog Posts ───────────────────────────────────────────────

export const BLOG_SEO: Record<string, PageSeoConfig> = {
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
