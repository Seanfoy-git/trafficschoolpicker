/**
 * CANONICAL ticket-cost study data (Package 6 / Phase B).
 *
 * Single source of truth for every per-state dollar figure from "The True Cost of
 * a Traffic Ticket in Every State (2026)". The blog study tables, the state-page
 * cost stat, and the llms surfaces all read these exact numbers so no surface can
 * drift from another.
 *
 * Only jurisdictions with a PUBLISHED figure appear here. Every other state
 * intentionally has none — we never invent a per-state dollar figure. `allInCost`
 * is fine + estimated three-year insurance surcharge; `netSavings` is the
 * three-year surcharge a state-approved course can avoid, minus a typical
 * $25–$100 course cost (approximate, shown with a ~ prefix).
 */

export type StateTicketCost = {
  code: string;
  allInCost?: number; // fine + estimated 3-year surcharge (published states only)
  netSavings?: number; // ~ 3-year surcharge avoided, minus course cost
  mechanism?: string; // short mechanism note for the savings table
};

export const TICKET_COST_STUDY = {
  slug: "true-cost-of-a-traffic-ticket",
  updated: "2026-08-15",
  nationalIncreasePct: "24 to 25%",
  nationalThreeYear: 1300, // ~ national three-year surcharge, dollars
  sources:
    "FinanceBuzz (fines, updated October 2025); CarInsurance.com using Quadrant Information Services (surcharges, June 25 2026); corroborated by Liberty Mutual, ValuePenguin, U.S. News, NerdWallet, Bankrate, Forbes Advisor, Experian, and The Zebra.",
} as const;

export const STATE_TICKET_COST: Record<string, StateTicketCost> = {
  // Most expensive (all-in) — several also carry a savings figure
  MI: { code: "MI", allInCost: 8742, netSavings: 8600, mechanism: "Basic Driver Improvement masks points" },
  CA: { code: "CA", allInCost: 5619, netSavings: 5300, mechanism: "masking under VC §1808.7" },
  HI: { code: "HI", allInCost: 5227, netSavings: 5050, mechanism: "court dismissal, case by case" },
  TX: { code: "TX", allInCost: 5047, netSavings: 4650, mechanism: "course dismissal, under 25 over" },
  NJ: { code: "NJ", allInCost: 4965 },
  DE: { code: "DE", allInCost: 4582 },
  LA: { code: "LA", allInCost: 4512, netSavings: 4300, mechanism: "court dismissal" },
  RI: { code: "RI", allInCost: 4481 },
  NV: { code: "NV", allInCost: 4228, netSavings: 3950, mechanism: "court dismissal" },
  FL: { code: "FL", allInCost: 4170, netSavings: 3900, mechanism: "adjudication withheld, BDI" },
  // Cheapest (all-in)
  VT: { code: "VT", allInCost: 1305 },
  MT: { code: "MT", allInCost: 1486 },
  PA: { code: "PA", allInCost: 1494 },
  NE: { code: "NE", allInCost: 1528 },
  OH: { code: "OH", allInCost: 1684 },
  UT: { code: "UT", allInCost: 1792 },
  VA: { code: "VA", allInCost: 1818 },
  MD: { code: "MD", allInCost: 1869 },
  NH: { code: "NH", allInCost: 2024 },
  ME: { code: "ME", allInCost: 2100 },
  // Savings-only (not in the top/bottom-10 all-in lists)
  TN: { code: "TN", netSavings: 2950, mechanism: "driver improvement" },
  AZ: { code: "AZ", netSavings: 2950, mechanism: "defensive driving, no points" },
  OK: { code: "OK", netSavings: 2350, mechanism: "court dismissal + 2-pt credit" },
};

/** Ordered code lists for the three study tables (highest → lowest as published). */
export const MOST_EXPENSIVE = ["MI", "CA", "HI", "TX", "NJ", "DE", "LA", "RI", "NV", "FL"];
export const CHEAPEST = ["VT", "MT", "PA", "NE", "OH", "UT", "VA", "MD", "NH", "ME"];
export const BEST_SAVINGS = ["MI", "CA", "HI", "TX", "LA", "NV", "FL", "TN", "AZ", "OK"];

export function ticketCostFor(code: string): StateTicketCost | null {
  return STATE_TICKET_COST[code.toUpperCase()] ?? null;
}

/** "$8,742" — thousands-separated dollars, no cents. */
export function formatCost(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
