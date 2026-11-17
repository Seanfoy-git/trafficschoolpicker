/**
 * Google Places matching for the School Directory (17 Nov 2026).
 *
 * Why this exists: enrich-places used to take Text Search's first result for
 * "{name} traffic school {state}" with no check, so unrelated schools got the
 * Visit link of whichever school ranks first nearby (E1008 California Licensing
 * Education, E0893 and E0954 all got $5 Dollar Traffic School's listing). A wrong
 * link is worse than no link, so a candidate is accepted only when it can be
 * proved to be the row's school:
 *
 *   - the row has a street address: the street number AND the ZIP both appear in
 *     the candidate's formattedAddress, AND there is name evidence: the
 *     candidate's displayName passes the name rule, or its website's domain is
 *     the school's name (one building can hold several licences: 524 Mountain View
 *     Ave, San Bernardino holds E0962, E0948, E0957 and E0954, so an address alone
 *     proves nothing). Address without name evidence is "address only": not accepted;
 *   - the row has a ZIP but no street number (most TDLR rows are "CITY, TX, ZIP"):
 *     the ZIP appears AND the name rule below passes;
 *   - the row has no usable address: the candidate's displayName contains every
 *     distinctive token of the school name (generic words dropped).
 *
 * One candidate with evidence is accepted; two or more with evidence are ambiguous
 * and nothing is accepted. Pure functions only (no I/O), so
 * scripts/test-places-match.ts can assert them.
 */

export interface PlaceCandidate {
  id: string;
  displayName: string;
  formattedAddress: string;
}

export interface ParsedAddress {
  streetNumber: string | null;
  zip: string | null;
}

/** Words that say nothing about which school it is. */
export const GENERIC_WORDS = new Set([
  "traffic", "school", "driving", "defensive", "online", "course", "com", "www", "inc", "llc", "the",
]);

/**
 * Street number and ZIP from a scraped Address. The street number is a number
 * that starts the address and is followed by a street name ("3800 MARKET STREET
 * UNIT K,VENTURA,CA 93003", "21-23 1ST AVE SW CAIRO GA 39828"); a bare number
 * before a comma ("310, HOUSTON, TX") or a date is not one.
 */
export function parseAddress(address: string | null | undefined): ParsedAddress {
  const a = (address ?? "").trim();
  // A number, then whitespace and a street name with at least one letter before the next comma.
  const street = a.match(/^(\d{1,6})(?:-\d+)?[A-Z]?\s+[^,]*[A-Z]/i);
  // The ZIP is the last 5-digit group after the street number (which can itself be 5 digits).
  const rest = street ? a.slice(street[1].length) : a;
  const zips = rest.match(/\b\d{5}(?:-\d{4})?\b/g);
  return { streetNumber: street ? street[1] : null, zip: zips ? zips[zips.length - 1].slice(0, 5) : null };
}

/**
 * Distinctive name tokens: lower-cased alphanumeric runs, generic words dropped.
 * A "www" or "com" glued to a token is stripped too ("IDRIVESAFELYCOM" →
 * "idrivesafely", "wwwcheap" → "cheap"), when at least 4 characters remain.
 */
export function nameTokens(name: string): string[] {
  return (name.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .map((t) => t.replace(/^www(?=[a-z0-9]{4})/, "").replace(/(?<=[a-z0-9]{4})com$/, ""))
    .filter((t) => !GENERIC_WORDS.has(t));
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Every distinctive token of the school name appears in the candidate's name. A name with none can't be proved. */
export function nameMatches(schoolName: string, displayName: string): boolean {
  const tokens = nameTokens(schoolName);
  if (!tokens.length) return false;
  const dn = squash(displayName);
  return tokens.every((t) => dn.includes(t));
}

/** The label is made only of generic words ("trafficschool", "onlinedrivingcourse"), so it names no school. */
function onlyGeneric(label: string): boolean {
  const ok: boolean[] = [true];
  for (let i = 1; i <= label.length; i++) {
    ok[i] = false;
    for (const w of GENERIC_WORDS) if (i >= w.length && ok[i - w.length] && label.slice(i - w.length, i) === w) ok[i] = true;
  }
  return ok[label.length];
}

/**
 * The website's domain is the school's name: the registrable domain's first label
 * (6+ characters, not only generic words) appears in the school name squashed to
 * a-z0-9 with a leading "www" and a trailing "com" dropped.
 * BARATOESCUELADETRAFICOCOM + baratoescueladetrafico.com passes;
 * 3DollarsQuickTrafficSchool com + baratoescueladetrafico.com does not.
 */
export function websiteMatches(schoolName: string, website: string | null | undefined): boolean {
  const label = registrableDomain(website)?.split(".")[0] ?? "";
  if (label.length < 6 || onlyGeneric(label)) return false;
  const name = squash(schoolName).replace(/^www/, "").replace(/com$/, "");
  return name.includes(label);
}

const hasToken = (hay: string, needle: string) => new RegExp(`(^|[^0-9])${needle}([^0-9]|$)`).test(hay);

export function addressMatches(addr: ParsedAddress, formattedAddress: string): boolean {
  if (!addr.streetNumber || !addr.zip) return false;
  return hasToken(formattedAddress, addr.streetNumber) && hasToken(formattedAddress, addr.zip);
}

export type MatchRule = "address" | "zip+name" | "name";

export type MatchResult =
  | { accepted: true; candidate: PlaceCandidate; rule: MatchRule; evidence: "name" | "website" }
  | { accepted: false; addressOnly: PlaceCandidate[]; reason: string };

export function matchRule(address: string | null | undefined): MatchRule {
  const a = parseAddress(address);
  if (a.streetNumber && a.zip) return "address";
  if (a.zip) return "zip+name";
  return "name";
}

/**
 * Candidates whose website must be fetched to decide: at the row's street address
 * but without the school's name in their displayName. (The website of the one
 * accepted is fetched anyway; these are the only extra Place Details calls.)
 */
export function needsWebsite(row: { name: string; address: string | null | undefined }, candidates: PlaceCandidate[]): PlaceCandidate[] {
  if (matchRule(row.address) !== "address") return [];
  const addr = parseAddress(row.address);
  return candidates.filter((c) => addressMatches(addr, c.formattedAddress) && !nameMatches(row.name, c.displayName));
}

/**
 * The one candidate proved to be this school, or why none is. `websites` holds
 * the fetched website of each candidate needsWebsite returned (missing = unknown).
 */
export function pickCandidate(
  row: { name: string; address: string | null | undefined },
  candidates: PlaceCandidate[],
  websites: Map<string, string | null> = new Map(),
): MatchResult {
  if (!candidates.length) return { accepted: false, addressOnly: [], reason: "no candidates" };
  const addr = parseAddress(row.address);
  const rule = matchRule(row.address);
  if (rule === "address") {
    const atAddress = candidates.filter((c) => addressMatches(addr, c.formattedAddress));
    if (!atAddress.length) return { accepted: false, addressOnly: [], reason: "no candidate at this street number and ZIP" };
    const proved = atAddress
      .map((c) => ({ c, evidence: nameMatches(row.name, c.displayName) ? ("name" as const) : websiteMatches(row.name, websites.get(c.id)) ? ("website" as const) : null }))
      .filter((x) => x.evidence);
    if (proved.length === 1) return { accepted: true, candidate: proved[0].c, rule, evidence: proved[0].evidence! };
    if (proved.length > 1) return { accepted: false, addressOnly: [], reason: `ambiguous: ${proved.length} candidates at this address carry the name (${proved.map((x) => x.c.displayName).join("; ")})` };
    return { accepted: false, addressOnly: atAddress, reason: `address only: ${atAddress.length === 1 ? "a listing" : `${atAddress.length} listings`} at this address without the school's name` };
  }
  const passing = candidates.filter((c) =>
    rule === "zip+name" ? hasToken(c.formattedAddress, addr.zip!) && nameMatches(row.name, c.displayName) : nameMatches(row.name, c.displayName),
  );
  if (!passing.length) return { accepted: false, addressOnly: [], reason: rule === "zip+name" ? "no candidate in this ZIP with the school's name" : "no candidate with the school's name" };
  if (passing.length === 1) return { accepted: true, candidate: passing[0], rule, evidence: "name" };
  return { accepted: false, addressOnly: [], reason: `ambiguous: ${passing.length} candidates pass (${passing.map((c) => c.displayName).join("; ")})` };
}

/** Comparable address: upper-case alphanumerics only, so "Ste 439" and "STE 439" are one address. */
export const normAddress = (a: string | null | undefined) => (a ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const normLicence = (l: string | null | undefined) => (l ?? "").trim().toUpperCase();

/** A licence the scraper filled in when the list has none ("UT-approved", "VA-DIC", ""): shared by many schools, so it identifies none. */
export const isPlaceholderLicence = (l: string | null | undefined) => {
  const v = normLicence(l);
  return !v || /^[A-Z]{2}-(APPROVED|[A-Z]{2,5})$/.test(v);
};

const normName = (n: string | null | undefined) => (n ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Two directory rows are different schools: a different licence AND a different
 * address. Where either licence is a placeholder, the licence can't tell, so the
 * school name stands in for it (and two rows with no address at all count as
 * different addresses, since nothing says they share one).
 */
export function differentSchools(
  a: { licence: string; address: string; name: string },
  b: { licence: string; address: string; name: string },
): boolean {
  const placeholder = isPlaceholderLicence(a.licence) || isPlaceholderLicence(b.licence);
  const licenceDiffers = placeholder ? normName(a.name) !== normName(b.name) : normLicence(a.licence) !== normLicence(b.licence);
  const addrA = normAddress(a.address), addrB = normAddress(b.address);
  const addressDiffers = addrA !== addrB || (placeholder && !addrA && !addrB);
  return licenceDiffers && addressDiffers;
}

/**
 * Registrable domain ("eTLD+1") of a URL, for "is the website the same site":
 * www.example.com/path and example.com are one site; sub.example.co.uk keeps 3 labels.
 */
export function registrableDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return null;
  }
  const labels = host.replace(/\.$/, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const twoPart = /^(co|com|org|net|gov|edu|ac)\.[a-z]{2}$/.test(labels.slice(-2).join("."));
  return labels.slice(twoPart ? -3 : -2).join(".");
}
