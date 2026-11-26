/**
 * CANONICAL ticket-cost study data (re-based 26 Nov 2026).
 *
 * Single source of truth for every per-state dollar figure from "The True Cost of
 * a Traffic Ticket in Every State (2026)". The blog study tables, the state-page
 * cost stat, the cost/worth-it snapshot and the llms surfaces all read these exact
 * numbers so no surface can drift from another.
 *
 * Every one of the 51 jurisdictions has a published figure from the same two
 * sources, so every state carries one:
 *  - `fine`: FinanceBuzz, fine plus court costs for 15 mph over (updated 16 Oct 2025).
 *  - `threeYearSurcharge`: LendingTree's analysis of Quadrant Information Services
 *    rate data (Sept 2026; article updated 2 Nov 2026), the annual increase after a
 *    first 11-to-15-mph-over ticket times three, rounded to the dollar.
 *  - `allInCost` = fine + threeYearSurcharge.
 *  - `netSavings` (only where a course keeps the ticket away from the insurer):
 *    the three-year increase avoided, less $100 for the course and court fees,
 *    rounded down to the nearest $50 and shown with a ~ prefix.
 *
 * Until 26 Nov 2026 the surcharges came from CarInsurance.com/Quadrant (40-year-old,
 * 100/300/100 full coverage), which read two to four times higher than other
 * current sources; Sean asked for one consistent, recent basis (LendingTree).
 * Recompute with /home/claude/scripts/study.py (kept in the PR description).
 */

export type StateTicketCost = {
  code: string;
  allInCost?: number; // fine + estimated 3-year insurance increase
  fine?: number; // typical first-offense 15-over fine plus court costs (FinanceBuzz)
  threeYearSurcharge?: number; // three-year insurance increase (LendingTree); allInCost = fine + this
  netSavings?: number; // ~ 3-year increase avoided, minus course and court fees
  mechanism?: string; // short mechanism note for the savings table
};

export const TICKET_COST_STUDY = {
  slug: "true-cost-of-a-traffic-ticket",
  updated: "2026-11-26",
  nationalIncreasePct: "about 24%",
  nationalThreeYear: 1655, // LendingTree national: $551.54 a year, $1,654.61 over three years
  nationalFine: 157, // FinanceBuzz national average, 15 mph over
  sources:
    "FinanceBuzz (fines plus court costs, 15 mph over, updated October 16 2025); LendingTree using Quadrant Information Services rate data (insurance increase after a first 11-to-15-mph-over ticket, September 2026 data, updated November 2 2026).",
} as const;

/** P17 Task 6b: the three-year increase is a rate-data ESTIMATE, not a state
 *  figure. Every sentence that states one (or an all-in figure built on one)
 *  carries this label so it is never read as an official number. */
export const SURCHARGE_ESTIMATE_LABEL =
  "an estimate from LendingTree's analysis of Quadrant Information Services rate data, not a state figure; your insurer's actual increase varies";

export const STATE_TICKET_COST: Record<string, StateTicketCost> = {
  AL: { code: "AL", allInCost: 1912, fine: 178, threeYearSurcharge: 1734 },
  AK: { code: "AK", allInCost: 1370, fine: 130, threeYearSurcharge: 1240 },
  AZ: { code: "AZ", allInCost: 3679, fine: 251, threeYearSurcharge: 3428, netSavings: 3300, mechanism: "defensive driving, no points" },
  AR: { code: "AR", allInCost: 2594, fine: 192, threeYearSurcharge: 2402 },
  CA: { code: "CA", allInCost: 3429, fine: 234, threeYearSurcharge: 3195, netSavings: 3050, mechanism: "masking under VC §1808.7" },
  CO: { code: "CO", allInCost: 2649, fine: 151, threeYearSurcharge: 2498 },
  CT: { code: "CT", allInCost: 1947, fine: 191, threeYearSurcharge: 1756 },
  DE: { code: "DE", allInCost: 2797, fine: 117, threeYearSurcharge: 2680 },
  DC: { code: "DC", allInCost: 2026, fine: 100, threeYearSurcharge: 1926 },
  FL: { code: "FL", allInCost: 1192, fine: 254, threeYearSurcharge: 938, netSavings: 800, mechanism: "adjudication withheld, BDI" },
  GA: { code: "GA", allInCost: 1726, fine: 223, threeYearSurcharge: 1503 },
  HI: { code: "HI", allInCost: 961, fine: 197, threeYearSurcharge: 764, netSavings: 650, mechanism: "court dismissal, case by case" },
  ID: { code: "ID", allInCost: 1199, fine: 90, threeYearSurcharge: 1109 },
  IL: { code: "IL", allInCost: 1893, fine: 120, threeYearSurcharge: 1773 },
  IN: { code: "IN", allInCost: 1294, fine: 167, threeYearSurcharge: 1127 },
  IA: { code: "IA", allInCost: 1935, fine: 176, threeYearSurcharge: 1759 },
  KS: { code: "KS", allInCost: 1990, fine: 148, threeYearSurcharge: 1842 },
  KY: { code: "KY", allInCost: 1227, fine: 173, threeYearSurcharge: 1054 },
  LA: { code: "LA", allInCost: 3380, fine: 168, threeYearSurcharge: 3212, netSavings: 3100, mechanism: "court dismissal" },
  ME: { code: "ME", allInCost: 1268, fine: 170, threeYearSurcharge: 1098 },
  MD: { code: "MD", allInCost: 1824, fine: 90, threeYearSurcharge: 1734 },
  MA: { code: "MA", allInCost: 1454, fine: 150, threeYearSurcharge: 1304 },
  MI: { code: "MI", allInCost: 2869, fine: 147, threeYearSurcharge: 2722, netSavings: 2600, mechanism: "Basic Driver Improvement masks points" },
  MN: { code: "MN", allInCost: 1642, fine: 145, threeYearSurcharge: 1497 },
  MS: { code: "MS", allInCost: 1475, fine: 197, threeYearSurcharge: 1278 },
  MO: { code: "MO", allInCost: 1690, fine: 103, threeYearSurcharge: 1587 },
  MT: { code: "MT", allInCost: 1368, fine: 70, threeYearSurcharge: 1298 },
  NE: { code: "NE", allInCost: 1505, fine: 75, threeYearSurcharge: 1430 },
  NV: { code: "NV", allInCost: 2129, fine: 290, threeYearSurcharge: 1839, netSavings: 1700, mechanism: "court dismissal" },
  NH: { code: "NH", allInCost: 1185, fine: 93, threeYearSurcharge: 1092 },
  NJ: { code: "NJ", allInCost: 1306, fine: 106, threeYearSurcharge: 1200 },
  NM: { code: "NM", allInCost: 1671, fine: 30, threeYearSurcharge: 1641 },
  NY: { code: "NY", allInCost: 1245, fine: 230, threeYearSurcharge: 1015 },
  NC: { code: "NC", allInCost: 1954, fine: 218, threeYearSurcharge: 1736 },
  ND: { code: "ND", allInCost: 1445, fine: 45, threeYearSurcharge: 1400 },
  OH: { code: "OH", allInCost: 1256, fine: 126, threeYearSurcharge: 1130 },
  OK: { code: "OK", allInCost: 1624, fine: 178, threeYearSurcharge: 1446, netSavings: 1300, mechanism: "court dismissal + 2-pt credit" },
  OR: { code: "OR", allInCost: 2145, fine: 165, threeYearSurcharge: 1980 },
  PA: { code: "PA", allInCost: 1869, fine: 142, threeYearSurcharge: 1727 },
  RI: { code: "RI", allInCost: 3345, fine: 205, threeYearSurcharge: 3140 },
  SC: { code: "SC", allInCost: 1264, fine: 171, threeYearSurcharge: 1093 },
  SD: { code: "SD", allInCost: 1528, fine: 138, threeYearSurcharge: 1390 },
  TN: { code: "TN", allInCost: 1886, fine: 164, threeYearSurcharge: 1722, netSavings: 1600, mechanism: "court dismissal, court by court" },
  TX: { code: "TX", allInCost: 1258, fine: 245, threeYearSurcharge: 1013, netSavings: 900, mechanism: "course dismissal, under 25 over" },
  UT: { code: "UT", allInCost: 1710, fine: 160, threeYearSurcharge: 1550 },
  VT: { code: "VT", allInCost: 832, fine: 151, threeYearSurcharge: 681 },
  VA: { code: "VA", allInCost: 1448, fine: 141, threeYearSurcharge: 1307 },
  WA: { code: "WA", allInCost: 2976, fine: 58, threeYearSurcharge: 2918 },
  WV: { code: "WV", allInCost: 1207, fine: 162, threeYearSurcharge: 1045 },
  WI: { code: "WI", allInCost: 1685, fine: 175, threeYearSurcharge: 1510 },
  WY: { code: "WY", allInCost: 1112, fine: 190, threeYearSurcharge: 922 },
};

/** Ordered code lists for the three study tables (highest → lowest). Savings are
 *  ranked among the ten states where the study records a course mechanism. */
export const MOST_EXPENSIVE = ["AZ", "CA", "LA", "RI", "WA", "MI", "DE", "CO", "AR", "OR"];
export const CHEAPEST = ["VT", "HI", "WY", "NH", "FL", "ID", "WV", "KY", "NY", "OH"];
export const BEST_SAVINGS = ["AZ", "LA", "CA", "MI", "NV", "TN", "OK", "TX", "FL", "HI"];

export function ticketCostFor(code: string): StateTicketCost | null {
  return STATE_TICKET_COST[code.toUpperCase()] ?? null;
}

/** "$3,679" — thousands-separated dollars, no cents. */
export function formatCost(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

/** The one savings sentence every surface prints (state page stat box, the cost
 *  and worth-it snapshot, llms). Where the study's mechanism is the court's
 *  choice (HI, LA, NV, OK, TN), the saving depends on the court, so the sentence
 *  says so instead of promising it (helpfulness audit, 24 Nov 2026). */
export function savingsSentence(c: StateTicketCost): string | null {
  if (!c.netSavings) return null;
  const amount = formatCost(c.netSavings);
  return /^court dismissal/i.test(c.mechanism ?? "")
    ? `If the court lets a course dismiss or reduce the ticket, that can save you about ${amount} of it.`
    : `An approved course can save you about ${amount} of that.`;
}
