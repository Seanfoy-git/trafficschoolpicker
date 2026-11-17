/**
 * One directory row → Google Places → a proved match or nothing. Shared by
 * enrich-places (new rows) and recheck-directory-websites (rows that already
 * carry a website). Rules: scripts/lib/places-match.
 */
import { differentSchools, matchRule, needsWebsite, pickCandidate, type PlaceCandidate } from "./places-match";
import { placeWebsite, searchCandidates } from "./places-client";
import type { DirRow } from "./directory-rows";

const STATE_CODES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT",
  Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI",
  Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH",
  "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

/** With a street address, search for the school at it; otherwise by name in the state. */
export function textQuery(row: Pick<DirRow, "name" | "address" | "state">): string {
  const code = STATE_CODES[row.state] ?? row.state;
  return matchRule(row.address) === "address" ? `${row.name}, ${row.address}` : `${row.name} traffic school ${code}`;
}

/** Place ID → the rows that hold it (Google Place ID property). */
export type Holdings = Map<string, Pick<DirRow, "id" | "licence" | "address" | "name">[]>;

export function holdingsOf(rows: DirRow[]): Holdings {
  const h: Holdings = new Map();
  for (const r of rows) if (r.placeId) h.set(r.placeId, [...(h.get(r.placeId) ?? []), r]);
  return h;
}

/** Another row already holds this place and is a different school (places-match differentSchools). */
export function heldByOther(placeId: string, row: Pick<DirRow, "id" | "licence" | "address" | "name">, holdings: Holdings) {
  return (holdings.get(placeId) ?? []).find((o) => o.id !== row.id && differentSchools(o, row));
}

export type Lookup =
  | { found: true; candidate: PlaceCandidate; rule: string; evidence: string; website: string | null; candidates: PlaceCandidate[]; websites: Record<string, string | null> }
  | { found: false; addressOnly: PlaceCandidate[]; reason: string; candidates: PlaceCandidate[]; websites: Record<string, string | null> };

export async function lookup(row: DirRow, holdings: Holdings): Promise<Lookup> {
  const candidates = await searchCandidates(textQuery(row));
  // Websites only for candidates at the row's address that lack its name in displayName.
  const websites = new Map<string, string | null>();
  for (const c of needsWebsite(row, candidates)) websites.set(c.id, await placeWebsite(c.id));
  const m = pickCandidate(row, candidates, websites);
  const fetched = Object.fromEntries(websites);
  if (!m.accepted) return { found: false, addressOnly: m.addressOnly, reason: m.reason, candidates, websites: fetched };
  const other = heldByOther(m.candidate.id, row, holdings);
  if (other) {
    return { found: false, addressOnly: [], reason: `place ${m.candidate.id} is already held by ${other.licence || "?"} ${other.name} at ${other.address || "(no address)"}`, candidates, websites: fetched };
  }
  const website = websites.has(m.candidate.id) ? websites.get(m.candidate.id)! : await placeWebsite(m.candidate.id);
  fetched[m.candidate.id] = website;
  return { found: true, candidate: m.candidate, rule: m.rule, evidence: m.evidence, website, candidates, websites: fetched };
}
