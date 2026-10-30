import type { DirectorySchool } from "./types";

/**
 * Directory validation (P0, 30 Oct 2026). The state directories are scraped
 * from regulator pages, and scrapes pick up page furniture as if it were a
 * school: "Search", "Reset all", "Certificate ID", the agency's own name, a
 * bare URL, an empty card. A directory row must be a real school, once.
 *
 * Used at render time (lib/notion getDirectoryForState, so every count and
 * table reads the same cleaned rows) and by the scrapers before they write to
 * Notion (scripts/lib/scraper-utils syncToNotion), so junk doesn't come back.
 */

/** UI labels that scrapes have captured as school names (compared case-insensitively, whole name). */
const UI_LABELS = [
  "search",
  "reset",
  "reset all",
  "clear",
  "clear all",
  "apply",
  "filter",
  "filters",
  "submit",
  "next",
  "previous",
  "prev",
  "back",
  "more",
  "show more",
  "view all",
  "load more",
  "results",
  "certificate id",
  "license number",
  "license #",
  "school name",
  "name",
  "phone",
  "address",
  "website",
  "active program list",
  "program list",
  "map",
  "list",
  "directions",
  "home",
  "location",
  "locations",
  "school information",
];

/**
 * The regulator itself, captured from page headers and footers ("Georgia
 * Department ofDriver Services", "(Approved by the Maryland Motor Vehicle
 * Administration)", "Work at the DMV"). Explicit agency phrases only, so a
 * school called "Safe Driver Services" stays.
 */
const AGENCY = /\b(department\s*of|dept\.?\s*of|division\s*of|bureau\s*of|secretary\s*of\s*state|motor\s*vehicle\s*administration)\b|^\(?approved by\b|\bwork at the (dmv|dds|mvc|mva|dps)\b|^(the\s+)?(dmv|dds|mvc|mva|dhsmv|dps|dol)$/i;
const SCHOOLISH = /\b(school|academy|clinic|driving|driver'?s?\s+(ed|education|training|improvement)|safety|traffic|course|institute|college|llc|inc\.?|corp|company)\b/i;

export type JunkReason = "empty" | "url" | "ui label" | "agency name";

/** Why a scraped name is not a school, or null when it can be one. */
export function junkReason(rawName: string | null | undefined): JunkReason | null {
  const name = (rawName ?? "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || !/[a-z]/i.test(name)) return "empty";
  // A URL scraped as a name ("http://---", "www.example.com", "example.org/path").
  // A brand that is its own domain ("DriversEd.com") is a school name and stays.
  if (/^(https?:\/\/|www\.)/i.test(name) || /^[\w.-]+\.(com|org|net|gov|us|edu|info|biz|io|co)\/\S*$/i.test(name)) return "url";
  const lower = name.toLowerCase().replace(/[.:…]+$/, "");
  if (
    UI_LABELS.includes(lower) ||
    /^select\b/i.test(name) ||
    /^(show|sort|page)\b.*\b(entries|by|of)\b/i.test(name) ||
    /^course type\s*:/i.test(name)
  ) return "ui label";
  // The agency's own name, unless it also reads as a school ("DMV Driving School").
  if (AGENCY.test(name.replace(/of(?=[A-Z])/g, "of ")) && !SCHOOLISH.test(name)) return "agency name";
  return null;
}

/**
 * A school name with scrape debris taken off (P0 follow-up, 30 Oct 2026):
 * lines under the name that are a URL or domain, a phone number, a street
 * address or a licence id ("Safe2Drive\n  www.safe2drive.com", Nevada's
 * name + address + phone + TSS number), and a phone number glued to the end
 * ("ND Safety Council 701-223-6372"). Other extra lines, such as New York's
 * "(Internet course)", are kept, joined with a space. A brand that is its own
 * domain ("DriversEd.com") is left alone.
 */
const URLISH = /^(https?:\/\/|www\.)\S*$|^[\w.-]+\.(com|org|net|edu|us|gov|info|biz)(\/\S*)?$/i;
const PHONE = /^\(?\d{3}\)?[\s.-]*\d{3}[\s.-]\d{4}$/;
const ADDRESS = /^\d+\s+\S.*\b(st|street|rd|road|ave|avenue|blvd|boulevard|suite|ste|dr|drive|way|ln|lane|hwy|highway|pkwy|parkway|pl|place|ct|court|cir|circle)\b|^[A-Za-z .'-]+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?$/i;
const LICENCE_LINE = /^TSS\d+/i;
export function cleanName(raw: string): string {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return raw.trim();
  const kept = [lines[0], ...lines.slice(1).filter((l) => !(URLISH.test(l) || PHONE.test(l) || ADDRESS.test(l) || LICENCE_LINE.test(l)))];
  return kept
    .join(" ")
    .replace(/\s+\(?\d{3}\)?[\s.-]*\d{3}[\s.-]\d{4}$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * License numbers the scrapers fill in when the list has none (e.g. "VA-DIC",
 * "TX-approved"): shared by many rows, so they can't identify a school.
 */
export const PLACEHOLDER_LICENSE = /^[A-Z]{2}-(approved|[A-Z]{2,5})$/;

/**
 * A licence number scraped into the name (Nevada: "…\n TSS000047687\n …"),
 * used as the row's licence when the License Number field holds only a
 * placeholder. Two locations of one school carry different numbers, so they
 * stay two rows.
 */
export function licenceFromName(raw: string): string | null {
  return raw.match(/\bTSS\d{6,}/i)?.[0].toUpperCase() ?? null;
}

/** The licence a row is identified and shown by: the field, else one found in the name; placeholders count as none. */
export function effectiveLicence(r: { licenseNumber: string; name: string }): string {
  const lic = r.licenseNumber.trim();
  if (lic && !PLACEHOLDER_LICENSE.test(lic)) return lic;
  return licenceFromName(r.name) ?? "";
}
function isPlaceholderLicense(license: string, counts: Map<string, number>): boolean {
  const l = license.trim();
  if (!l) return true;
  if (PLACEHOLDER_LICENSE.test(l)) return true;
  return (counts.get(l.toUpperCase()) ?? 0) > 5;
}

export interface CleanResult {
  /** Kept rows, names cleaned (cleanName) and placeholder licences blanked. */
  rows: DirectorySchool[];
  removed: { reason: JunkReason | "duplicate license" | "duplicate name"; name: string; license: string; id: string; keptId?: string }[];
}

/** How much a row carries: of two duplicates, the richer one is kept (it may hold the verified price). */
function richness(r: DirectorySchool): number {
  return (r.price != null ? 8 : 0) + (r.priceSourceUrl ? 4 : 0) + (r.website ? 2 : 0) + (r.phone ? 1 : 0);
}

/**
 * Drop junk rows and de-duplicate on license number within the state (on the
 * name and website where the license is a placeholder). Of each duplicate set
 * the richest row is kept, in the position of the first.
 */
export function cleanDirectory(rows: DirectorySchool[]): CleanResult {
  const removed: CleanResult["removed"] = [];
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(effectiveLicence(r).toUpperCase(), (counts.get(effectiveLicence(r).toUpperCase()) ?? 0) + 1);
  const at = new Map<string, number>();
  const kept: DirectorySchool[] = [];
  for (const r of rows) {
    const reason = junkReason(r.name);
    if (reason) {
      removed.push({ reason, name: r.name, license: r.licenseNumber, id: r.id });
      continue;
    }
    const lic = effectiveLicence(r);
    const placeholder = isPlaceholderLicense(lic, counts);
    const key = placeholder
      ? `name:${cleanName(r.name).toLowerCase().replace(/[^a-z0-9]/g, "")}|${(r.website ?? "").toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}`
      : `license:${lic.toUpperCase()}`;
    const i = at.get(key);
    if (i !== undefined) {
      const dupReason = placeholder ? "duplicate name" : "duplicate license";
      if (richness(r) > richness(kept[i])) {
        removed.push({ reason: dupReason, name: kept[i].name, license: kept[i].licenseNumber, id: kept[i].id, keptId: r.id });
        kept[i] = r;
      } else {
        removed.push({ reason: dupReason, name: r.name, license: r.licenseNumber, id: r.id, keptId: kept[i].id });
      }
      continue;
    }
    at.set(key, kept.length);
    kept.push(r);
  }
  // Display: debris off the name, and no placeholder shown as if it were a licence.
  const cleaned = kept.map((r) => ({
    ...r,
    name: cleanName(r.name),
    licenseNumber: effectiveLicence(r),
  }));
  return { rows: cleaned, removed };
}

/**
 * What a directory is, by the list it was scraped from ("Source" in the
 * Directory DB). Classroom clinics are never called online schools: a list is
 * "online" only when the regulator's list is of online courses.
 */
const DIRECTORY_LISTS: Record<string, { noun: string; source: string; online: boolean }> = {
  // Georgia DDS "Driver Improvement Clinic" search: DI-numbered DDS-certified clinics (classroom), not online schools.
  "GA DDS": { noun: "DDS-certified Driver Improvement Clinics", source: "Georgia DDS Driver Improvement Clinic list", online: false },
  // Virginia DMV clinics-schools search, filtered to "Online Clinic".
  "VA DMV": { noun: "DMV-licensed online Driver Improvement Clinics", source: "Virginia DMV list of online Driver Improvement Clinics", online: true },
};

export function directoryListLabel(stateName: string, rows: DirectorySchool[]): { noun: string; source: string; online: boolean } {
  const sources = [...new Set(rows.map((r) => r.source))];
  const known = sources.length === 1 ? DIRECTORY_LISTS[sources[0]] : undefined;
  if (known) return known;
  const online = rows.length > 0 && rows.every((r) => r.onlineAvailable);
  return {
    noun: online ? "DMV-licensed online traffic schools" : "state-licensed traffic schools",
    source: `Official ${stateName} DMV records`,
    online,
  };
}
