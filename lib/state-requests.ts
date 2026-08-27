/* The 41 jurisdictions NOT yet covered by /out-of-state-ticket (the page covers
 * ten: AZ, CA, FL, GA, NJ, NY, NC, OH, TX, VA — 50 states + DC − 10 = 41).
 *
 * Single source of truth for BOTH the request form's <select> options and the
 * /api/state-request server-side validation, so the allowed set can never drift
 * between what the page offers and what the handler accepts. Values match the
 * authored source form exactly. */
export const REQUESTABLE_JURISDICTIONS = [
  "Alabama",
  "Alaska",
  "Arkansas",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Mexico",
  "North Dakota",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Utah",
  "Vermont",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

export type RequestableJurisdiction = (typeof REQUESTABLE_JURISDICTIONS)[number];

const ALLOWED = new Set<string>(REQUESTABLE_JURISDICTIONS);

/** True iff `value` is exactly one of the 41 requestable jurisdictions. */
export function isRequestableJurisdiction(value: unknown): value is RequestableJurisdiction {
  return typeof value === "string" && ALLOWED.has(value);
}
