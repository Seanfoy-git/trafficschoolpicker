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
  // Florida FLHSMV page heading (Sean, 2 Nov 2026): an exact match only, not an all-caps rule.
  "driver improvement schools",
  // Page furniture the 1 Nov refresh wrote as schools (Sean, round 5, 3 Nov 2026): exact strings,
  // whitespace-normalised and lower-cased. Florida's FLHSMV page (headings, the table header, the FAQ):
  "driver improvement courses faq",
  "mature driver discount insurance courses",
  "wireless communications device course",
  "what is advanced driver improvementand how do i find the approved listing of adi course providers?",
  "what is basic driver improvementand how do i find the approved listing of bdi course providers?",
  "what are 3 crashes in 3 years and how do i complete this requirement?",
  "driver education traffic safety",
  "what is traffic law and substance abuse educationand how do i find the approved listing of tlsae course providers?",
  "commercial driving schools providing behind the wheel training",
  "name delivery method contact information",
  // Georgia DDS results table header:
  "dt service type 30/6hr full service30hr classroom only6hr behind the wheel onlyvirtual provider",
];

/**
 * The regulator itself, captured from page headers and footers ("Georgia
 * Department ofDriver Services", "(Approved by the Maryland Motor Vehicle
 * Administration)", "Work at the DMV"). Explicit agency phrases only, so a
 * school called "Safe Driver Services" stays.
 */
const AGENCY = /\b(department\s*of|dept\.?\s*of|division\s*of|bureau\s*of|secretary\s*of\s*state|motor\s*vehicle\s*administration)\b|^\(?approved by\b|\bwork at the (dmv|dds|mvc|mva|dps)\b|^(the\s+)?(dmv|dds|mvc|mva|dhsmv|dps|dol)$/i;
const SCHOOLISH = /\b(school|academy|clinic|driving|driver'?s?\s+(ed|education|training|improvement)|safety|traffic|course|institute|college|llc|inc\.?|corp|company)\b/i;

/** Licence Status = Inactive: the school is no longer on the regulator's list and is not rendered. */
export function isInactiveLicence(r: Pick<DirectorySchool, "licenceStatus">): boolean {
  return (r.licenceStatus ?? "").trim().toLowerCase() === "inactive";
}

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
 * ("ND Safety Council 701-223-6372") or a URL glued to the end ("Garden State
 * Safety Council www.GardenStateSafetyCouncil.com"). Other extra lines, such as New York's
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
    .replace(/\s+(https?:\/\/\S+|www\.\S+)$/i, "")
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

/**
 * Which of two duplicates is kept (Sean, 30 Oct 2026): a row with a price AND a
 * price source beats one without; next, a row with a phone beats one without;
 * otherwise the first is kept (a tie never replaces it).
 */
export function richness(r: Pick<DirectorySchool, "price" | "priceSourceUrl" | "phone">): number {
  return (r.price != null && r.priceSourceUrl ? 2 : 0) + (r.phone?.trim() ? 1 : 0);
}

/**
 * Drop junk rows and de-duplicate on license number within the state (on the
 * name and website where the license is a placeholder). Of each duplicate set
 * the richer row (richness) is kept, in the position of the first; on a tie,
 * the first.
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
 * Directory DB), so the heading names the real agency and the real list.
 * There is no fallback label: a list we haven't identified is not shown,
 * because a generic "N state-licensed traffic schools · Official X DMV records"
 * line was wrong in most states (25 Nov 2026: Texas's 845 "online traffic
 * schools" were TDLR driver-ed licences; Utah, Wyoming, Oklahoma, Nebraska and
 * South Carolina were driver-ed lists; Arizona's list is the Supreme Court's).
 *
 * kind:
 *  - "ticket": the course the state's ticket process runs on (dismissal, masking).
 *  - "points": the state's point-reduction or driver improvement course list.
 *  - "course": a real list for a narrower course (a suspension, a young-driver
 *    programme, one offence). Shown, but it earns a school no approval badge.
 *  - "driver-ed", "insurance", "unidentified": not a list that helps someone
 *    with a ticket. Not shown (Sean, 25 Nov 2026: hide, don't relabel).
 * Classroom clinics are never called online schools: `onlineNoun` applies only
 * when every row on the list is an online course.
 */
export type DirectoryListKind = "ticket" | "points" | "course" | "driver-ed" | "insurance" | "unidentified";

type DirectoryListInfo = { noun: string; onlineNoun?: string; source: string; kind: DirectoryListKind };

const DIRECTORY_LISTS: Record<string, DirectoryListInfo> = {
  "CA DMV": {
    noun: "DMV-licensed traffic schools",
    onlineNoun: "DMV-licensed online traffic schools",
    source: "California DMV list of licensed traffic schools",
    kind: "ticket",
  },
  "FL DHSMV": {
    noun: "FLHSMV-approved Basic Driver Improvement course providers",
    source: "FLHSMV list of approved Basic Driver Improvement course providers",
    kind: "ticket",
  },
  // azcourts.gov/drive: schools certified by the Arizona Supreme Court's Defensive Driving Program.
  "AZ Courts": {
    noun: "Supreme Court-certified defensive driving schools",
    source: "Arizona Supreme Court Defensive Driving Program school list",
    kind: "ticket",
  },
  "NV DMV": {
    noun: "DMV-licensed traffic safety schools",
    onlineNoun: "DMV-licensed online traffic safety schools",
    source: "Nevada DMV list of licensed traffic safety schools",
    kind: "ticket",
  },
  // nj.gov/mvc/license/driverprograms.htm: state-approved classroom and online defensive driving courses (2-point reduction).
  "NJ MVC": {
    noun: "MVC-approved defensive driving course providers",
    source: "New Jersey MVC list of approved defensive driving courses",
    kind: "points",
  },
  // Virginia DMV clinics-schools search, filtered to "Online Clinic".
  "VA DMV": {
    noun: "DMV-licensed online Driver Improvement Clinics",
    onlineNoun: "DMV-licensed online Driver Improvement Clinics",
    source: "Virginia DMV list of online Driver Improvement Clinics",
    kind: "points",
  },
  // Georgia DDS "Driver Improvement Clinic" search: DI-numbered DDS-certified clinics (classroom), not online schools.
  "GA DDS": {
    noun: "DDS-certified Driver Improvement Clinics",
    source: "Georgia DDS Driver Improvement Clinic list",
    kind: "points",
  },
  // apps.dps.ohio.gov/DETS: Adult Remedial Online and Abbreviated courses.
  "OH DPS": {
    noun: "DPS-approved online remedial driving courses",
    onlineNoun: "DPS-approved online remedial driving courses",
    source: "Ohio DPS list of approved online remedial driving courses",
    kind: "points",
  },
  "TN Safety": {
    noun: "Department of Safety-approved 8-hour driver improvement schools",
    source: "Tennessee Department of Safety list of approved 8-hour schools",
    kind: "points",
  },
  "NY DMV": {
    noun: "DMV-approved PIRP and IPIRP course sponsors",
    source: "New York DMV list of Point and Insurance Reduction Program sponsors",
    kind: "points",
  },
  // dol.wa.gov: the Safe Driving Course is for drivers suspended for an accumulation of tickets.
  "WA DOL": {
    noun: "DOL-approved Safe Driving Course providers",
    source: "Washington DOL list of Safe Driving Course providers (the course for license suspensions)",
    kind: "course",
  },
  "MD MVA": {
    noun: "MVA-approved young-driver Driver Improvement Program providers",
    source: "Maryland MVA list of Driver Improvement Program providers for young drivers",
    kind: "course",
  },
  // oregon.gov/odot/safety: DDAC is the Distracted Driving Avoidance Course a court may refer a driver to.
  "OR ODOT": {
    noun: "ODOT-approved Distracted Driving Avoidance Course providers",
    source: "Oregon ODOT list of Distracted Driving Avoidance Course providers",
    kind: "course",
  },
  // TDLR "Driver Safety Providers" file (vsDriverSafetyProvider.csv): CP-numbered licensed
  // driving safety course providers, the course a Texas court accepts for dismissal.
  "TX TDLR DSC": {
    noun: "TDLR-licensed driving safety course providers",
    source: "TDLR list of licensed driving safety course providers",
    kind: "ticket",
  },
  // Not shown. TDLR's driver education provider file: C-numbered driver-ed schools, ISDs and
  // parent-taught courses. The driving safety course providers (CP numbers) are not in it.
  // Its rows stay in Notion because the Texas comparison's priced tier-2 rows sit on them.
  "TX TDLR": { noun: "TDLR-licensed driver education schools", source: "TDLR driver education provider list", kind: "driver-ed" },
  // Not shown. Nebraska "driver safety schools" teach and test 14 to 16 year olds (POP/SCP permits).
  "NE DMV": { noun: "DMV-approved driver safety schools", source: "Nebraska DMV list of driver safety schools", kind: "driver-ed" },
  // Not shown. Utah DLD third-party driver training and testing schools.
  "UT DLD": { noun: "DLD-certified driver training schools", source: "Utah DLD third-party school list", kind: "driver-ed" },
  // Not shown. Wyoming Department of Education driver education programmes (2022 PDF).
  "WY WDE": { noun: "approved driver education programs", source: "Wyoming Department of Education driver education list", kind: "driver-ed" },
  // Not shown. Oklahoma DPS driver education schools PDF.
  "OK DPS": { noun: "DPS-licensed driver education schools", source: "Oklahoma DPS driver education school list", kind: "driver-ed" },
  // Not shown. SCDMV-licensed driver training schools.
  "SC DMV": { noun: "SCDMV-licensed driver training schools", source: "SCDMV driver training school list", kind: "driver-ed" },
  // Not shown. Connecticut mature-driver insurance discount course providers.
  "CT DMV": { noun: "DMV-approved mature driver course providers", source: "Connecticut DMV insurance discount course list", kind: "insurance" },
  // Not shown. Minnesota accident prevention courses (insurance discount).
  "MN DPS": { noun: "DPS-approved accident prevention courses", source: "Minnesota DPS accident prevention course list", kind: "insurance" },
  // Not shown. North Dakota Highway Patrol insurance premium reduction courses. Point
  // reduction courses are approved separately by NDDOT.
  "ND HP": { noun: "Highway Patrol-approved insurance premium reduction courses", source: "North Dakota Highway Patrol insurance premium reduction course list", kind: "insurance" },
  // Not shown until it is refreshed by hand (the PDF refuses automated requests).
  "RI DMV": { noun: "RI DMV-listed course providers", source: "Rhode Island DMV list", kind: "unidentified" },
};

const SHOWN_KINDS = new Set<DirectoryListKind>(["ticket", "points", "course"]);
const APPROVING_KINDS = new Set<DirectoryListKind>(["ticket", "points"]);
const warnedSources = new Set<string>();

export type DirectoryList = {
  noun: string;
  source: string;
  online: boolean;
  kind: DirectoryListKind;
  /** Render the directory (table, counts, "the directory below") on the state page. */
  shown: boolean;
  /** Being on this list is evidence of the approval a card badge claims. */
  approves: boolean;
};

/**
 * A state's directory and the rows it shows. Most states hold one list. Where a
 * state holds rows from more than one (Texas: the old driver-ed file and TDLR's
 * driving safety providers), the directory is the largest list of a shown kind,
 * and only its rows are shown, counted and dated. The other rows stay data, e.g.
 * for the comparison's priced rows.
 */
export function directoryForState(stateName: string, rows: DirectorySchool[]): { list: DirectoryList; rows: DirectorySchool[] } {
  const bySource = new Map<string, DirectorySchool[]>();
  for (const r of rows) bySource.set(r.source, [...(bySource.get(r.source) ?? []), r]);
  if (bySource.size > 1) {
    const shownLists = [...bySource.entries()]
      .filter(([src]) => DIRECTORY_LISTS[src] && SHOWN_KINDS.has(DIRECTORY_LISTS[src].kind))
      .sort((a, b) => b[1].length - a[1].length);
    if (shownLists.length) {
      const listRows = shownLists[0][1];
      return { list: directoryListLabel(stateName, listRows), rows: listRows };
    }
  }
  return { list: directoryListLabel(stateName, rows), rows };
}

export function directoryListLabel(stateName: string, rows: DirectorySchool[]): DirectoryList {
  const sources = [...new Set(rows.map((r) => r.source))];
  const known = sources.length === 1 ? DIRECTORY_LISTS[sources[0]] : undefined;
  if (!known) {
    const key = `${stateName}:${sources.join("+")}`;
    if (rows.length && !warnedSources.has(key)) {
      warnedSources.add(key);
      console.warn(`[directory] ${stateName}: no label for source ${sources.join(", ") || "(none)"}, directory not shown`);
    }
    return { noun: "listed providers", source: "", online: false, kind: "unidentified", shown: false, approves: false };
  }
  const online = rows.length > 0 && rows.every((r) => r.onlineAvailable) && !!known.onlineNoun;
  return {
    noun: online ? known.onlineNoun! : known.noun,
    source: known.source,
    online,
    kind: known.kind,
    shown: SHOWN_KINDS.has(known.kind),
    approves: APPROVING_KINDS.has(known.kind),
  };
}

/**
 * The directory's "Last verified" date: the date at least 80% of its rows were
 * checked on. The newest row date overclaimed: Nevada said 1 Nov when only 2 of
 * 18 rows were matched that day (25 Nov 2026). Null when fewer than 80% have a date.
 */
export function directoryVerifiedDate(rows: { lastScraped: string | null }[]): string | null {
  if (!rows.length) return null;
  const dates = rows.map((r) => r.lastScraped).filter((d): d is string => !!d).sort().reverse();
  const need = Math.ceil(rows.length * 0.8);
  return dates.length >= need ? dates[need - 1] : null;
}

/**
 * How a scraper identifies a Directory row (P0 follow-up, round 4): the cleaned
 * name, and the real licence (the field unless it's a placeholder, else a
 * licence id found in the name). Scrapers match on this, never on the raw
 * scraped name, so a name cleaned at source still matches on the next refresh.
 */
export function rowIdentity(rawName: string, licenseNumber: string): { name: string; licence: string; nameKey: string } {
  const name = cleanName(rawName);
  return { name, licence: effectiveLicence({ licenseNumber, name: rawName }), nameKey: name.toLowerCase().replace(/[^a-z0-9]/g, "") };
}

/**
 * Existing Directory rows for one state, matched on a real licence number
 * first, then on cleaned name. A name match counts only when one side has no
 * real licence: two rows with the same name and different licences are two
 * locations (Georgia's DUI school chains), never one school.
 */
export class DirectoryIndex {
  private byLicence = new Map<string, string>();
  private byName = new Map<string, { id: string; licence: string }>();
  constructor(rows: Array<{ id: string; name: string; licenseNumber: string }> = []) {
    for (const r of rows) this.add(r.id, r.name, r.licenseNumber);
  }
  add(id: string, rawName: string, licenseNumber: string) {
    const k = rowIdentity(rawName, licenseNumber);
    const L = k.licence.toUpperCase();
    if (L && !this.byLicence.has(L)) this.byLicence.set(L, id);
    if (k.nameKey && !this.byName.has(k.nameKey)) this.byName.set(k.nameKey, { id, licence: L });
  }
  match(rawName: string, licenseNumber: string): { id: string; by: "licence" | "name" } | null {
    const k = rowIdentity(rawName, licenseNumber);
    const L = k.licence.toUpperCase();
    if (L && this.byLicence.has(L)) return { id: this.byLicence.get(L)!, by: "licence" };
    const n = this.byName.get(k.nameKey);
    if (n && (!L || !n.licence)) return { id: n.id, by: "name" };
    return null;
  }
}
