/**
 * State DMV source registry.
 *
 * To add a new state: add an entry here. The scraper reads this config.
 * No new script file needed.
 *
 * Method types:
 * - "playwright": Uses Playwright browser to navigate and extract data
 * - "csv": Downloads a CSV/TSV file and parses it
 * - "static-html": Fetches HTML page and parses tables/lists
 * - "manual": No automated source — schools added manually in Notion
 */

export type StateSource = {
  stateCode: string;
  stateName: string;
  source: string;            // e.g. "CA DMV", "TX TDLR"
  method: "playwright" | "csv" | "static-html" | "manual";
  url: string;               // The page or file to scrape
  enabled: boolean;          // Set false to skip during scrape:dmv runs
  notes?: string;            // Internal documentation
  // For playwright method — selectors and interaction steps
  playwright?: {
    steps?: string[];        // Description of interaction steps
    resultSelector?: string; // CSS selector for result rows
    waitFor?: string;        // Text or selector to wait for after search
  };
  // For csv method
  csv?: {
    delimiter?: string;
    nameColumn?: string;
    licenseColumn?: string;
    phoneColumn?: string;
    addressColumns?: string[];
  };
};

export const stateSources: StateSource[] = [
  // ─── ALREADY BUILT (dedicated scripts) ────────────────────
  {
    stateCode: "CA",
    stateName: "California",
    source: "CA DMV",
    method: "playwright",
    url: "https://drive.dmvonline.ca.gov/s/oll-traffic-schools",
    enabled: true,
    notes: "Salesforce Lightning app. Dedicated script: scrape-ca-dmv.ts",
  },
  {
    stateCode: "TX",
    stateName: "Texas",
    source: "TX TDLR",
    method: "csv",
    url: "https://www.tdlr.texas.gov/dbproduction2/vsDriverEduProvider.csv",
    enabled: true,
    notes: "Direct CSV download. Dedicated script: scrape-tx-tdlr.ts",
  },
  {
    stateCode: "FL",
    stateName: "Florida",
    source: "FL DHSMV",
    method: "static-html",
    url: "https://www.flhsmv.gov/driver-licenses-id-cards/education-courses/driver-improvement-schools/basic-driver-improvement-bdi-find-approved-listing-bdi-course-providers/",
    enabled: true,
    notes: "BDI provider table on page. Dedicated script: scrape-fl-dhsmv.ts",
  },

  // ─── STATIC HTML (easy — table or list on page) ───────────
  {
    stateCode: "NY",
    stateName: "New York",
    source: "NY DMV",
    method: "playwright",
    url: "https://dmv.ny.gov/points-and-penalties/pirp-and-ipirp",
    enabled: true,
    notes: "Dedicated script: scrape-ny-dmv.ts. Two tables (Classroom + Internet). Needs real User-Agent for Cloudflare.",
  },
  {
    stateCode: "NV",
    stateName: "Nevada",
    source: "NV DMV",
    method: "static-html",
    url: "https://dmv.nv.gov/dlschoolstss.htm",
    enabled: true,
    notes: "Static HTML organized by city. Internet/Classroom checkmarks.",
  },
  {
    stateCode: "NJ",
    stateName: "New Jersey",
    source: "NJ MVC",
    method: "static-html",
    url: "https://www.nj.gov/mvc/license/driverprograms.htm",
    enabled: true,
    notes: "HTML table of approved providers. JS randomizes order.",
  },
  {
    stateCode: "WA",
    stateName: "Washington",
    source: "WA DOL",
    method: "static-html",
    url: "https://dol.wa.gov/driver-licenses-and-permits/driver-safety/approved-safe-driving-course-providers",
    enabled: true,
    notes: "Drupal page with h3 headings + ul lists per provider.",
  },
  {
    stateCode: "NE",
    stateName: "Nebraska",
    source: "NE DMV",
    method: "static-html",
    url: "https://dmv.nebraska.gov/dl/approved-driver-safety-schools",
    enabled: true,
    notes: "Drupal CMS page with approved schools.",
  },
  {
    stateCode: "MD",
    stateName: "Maryland",
    source: "MD MVA",
    method: "static-html",
    url: "https://mva.maryland.gov/drivers/Pages/young-dip-providers.aspx",
    enabled: true,
    notes: "SharePoint page with provider names and phones.",
  },
  {
    stateCode: "CT",
    stateName: "Connecticut",
    source: "CT DMV",
    method: "static-html",
    url: "https://portal.ct.gov/dmv/resources/insurance-discounts",
    enabled: true,
    notes: "Approved mature driver course providers as <li> elements.",
  },
  {
    stateCode: "ND",
    stateName: "North Dakota",
    source: "ND HP",
    method: "static-html",
    url: "https://www.nd.gov/ndhp/insurance-premium-reduction-online-courses",
    enabled: true,
    notes: "Highway Patrol page with approved online courses.",
  },

  // ─── PLAYWRIGHT (need browser interaction) ────────────────
  {
    stateCode: "AZ",
    stateName: "Arizona",
    source: "AZ Courts",
    method: "playwright",
    url: "https://www.azcourts.gov/drive/Class-Results",
    enabled: true,
    notes: "Dedicated script: scrape-az-courts.ts. All schools in dropdown select HTML. No search needed.",
  },
  {
    stateCode: "VA",
    stateName: "Virginia",
    source: "VA DMV",
    method: "playwright",
    url: "https://www.dmv.virginia.gov/licenses-ids/improvement/clinics-schools?f[0]=clinic_type:316",
    enabled: true,
    notes: "Dedicated script: scrape-va-dmv.ts. Drupal 10 faceted search, online clinics, paginated.",
  },
  {
    stateCode: "OH",
    stateName: "Ohio",
    source: "OH DPS",
    method: "playwright",
    url: "https://apps.dps.ohio.gov/DETS/public/schools",
    enabled: true,
    notes: "Dedicated script: scrape-oh-dps.ts. Selects Adult Remedial Online + Abbreviated.",
  },
  {
    stateCode: "GA",
    stateName: "Georgia",
    source: "GA DDS",
    method: "playwright",
    url: "https://online.dds.ga.gov/ddsgeorgiagov/locations/driver-improvement-schools.aspx",
    enabled: true,
    notes: "Dedicated script: scrape-ga-dds.ts. Selects Driver Improvement Clinic.",
  },
  {
    stateCode: "TN",
    stateName: "Tennessee",
    source: "TN Safety",
    method: "static-html",
    url: "https://www.tn.gov/safety/driver-services/reinstatements-and-moving-violations/driver-improvement-points-accumulation/approved-8-hour-schools.html",
    enabled: true,
    notes: "8-hour approved schools table. Also has 4-hour traffic schools at separate URL.",
  },
  {
    stateCode: "OR",
    stateName: "Oregon",
    source: "OR ODOT",
    method: "static-html",
    url: "https://www.oregon.gov/odot/safety/pages/ddac-approved-providers.aspx",
    enabled: true,
    notes: "SharePoint DataTables. 18 providers. Table loads via JS but Playwright handles it.",
  },
  {
    stateCode: "SC",
    stateName: "South Carolina",
    source: "SC DMV",
    method: "static-html",
    url: "https://dmv.sc.gov/business-customers/driving-schools",
    enabled: true,
    notes: "SCDMV searchable driving school list.",
  },
  {
    stateCode: "UT",
    stateName: "Utah",
    source: "UT DLD",
    method: "static-html",
    url: "https://dld.utah.gov/third-party-school-list/",
    enabled: true,
    notes: "Driver License Division school/tester list.",
  },

  // ─── PDF SOURCES (parse separately) ───────────────────────
  {
    stateCode: "IL",
    stateName: "Illinois",
    source: "IL SOS",
    method: "manual",
    url: "https://apps.ilsos.gov/adultdrivered/providerlist",
    enabled: false,
    notes: "Blocked by Akamai WAF. Needs residential proxy or manual entry.",
  },
  {
    stateCode: "OK",
    stateName: "Oklahoma",
    source: "OK DPS",
    method: "manual",
    url: "https://oklahoma.gov/content/dam/ok/en/dps/docs/driveredschools.pdf",
    enabled: false,
    notes: "PDF only. Parse manually or with PDF extractor.",
  },
  {
    stateCode: "MN",
    stateName: "Minnesota",
    source: "MN DPS",
    method: "manual",
    url: "https://assets.dps.mn.gov/files/dvs/dvs-accident-prevention-courses.pdf",
    enabled: false,
    notes: "PDF only. Parse manually.",
  },
  {
    stateCode: "ID",
    stateName: "Idaho",
    source: "ID ITD",
    method: "manual",
    url: "https://itd.idaho.gov/wp-content/uploads/2016/07/Defensive-Driving-Accident-Prevention.pdf",
    enabled: false,
    notes: "PDF only. May be outdated (2016 URL).",
  },
  {
    stateCode: "NC",
    stateName: "North Carolina",
    source: "NC DOT",
    method: "manual",
    url: "https://www.ncdot.gov/dmv/license-id/license-suspension/Documents/driver-clinic-schedule.pdf",
    enabled: false,
    notes: "PDF clinic schedule.",
  },

  // ─── NO PUBLIC LIST ───────────────────────────────────────
  {
    stateCode: "CO",
    stateName: "Colorado",
    source: "CO DMV",
    method: "manual",
    url: "https://dmv.colorado.gov/driver-education-school-locations",
    enabled: false,
    notes: "No centralized defensive driving list. Court discretion.",
  },
  {
    stateCode: "PA",
    stateName: "Pennsylvania",
    source: "PA PennDOT",
    method: "manual",
    url: "",
    enabled: false,
    notes: "PennDOT runs own schools at DL Centers. No third-party list.",
  },
  {
    stateCode: "MI",
    stateName: "Michigan",
    source: "MI SOS",
    method: "manual",
    url: "",
    enabled: false,
    notes: "BDIC sponsors via e-Services portal. No simple public list.",
  },
  {
    stateCode: "MO",
    stateName: "Missouri",
    source: "MO Courts",
    method: "manual",
    url: "",
    enabled: false,
    notes: "Court-by-court. No centralized list.",
  },
  {
    stateCode: "LA",
    stateName: "Louisiana",
    source: "LA DPS",
    method: "manual",
    url: "",
    enabled: false,
    notes: "Driving school list is for driver ed, not defensive driving.",
  },
  {
    stateCode: "WI",
    stateName: "Wisconsin",
    source: "WI DMV",
    method: "manual",
    url: "",
    enabled: false,
    notes: "Court-by-court. No state-level list.",
  },
  {
    stateCode: "KS",
    stateName: "Kansas",
    source: "KS DMV",
    method: "manual",
    url: "",
    enabled: false,
    notes: "Court discretion. No centralized list.",
  },
  {
    stateCode: "IN",
    stateName: "Indiana",
    source: "IN BMV",
    method: "manual",
    url: "",
    enabled: false,
    notes: "No public approved provider list found.",
  },
];

/** Get all enabled sources for automated scraping */
export function getEnabledSources(): StateSource[] {
  return stateSources.filter((s) => s.enabled);
}

/** Get source config for a specific state */
export function getSourceForState(stateCode: string): StateSource | undefined {
  return stateSources.find((s) => s.stateCode === stateCode);
}

/** Summary for documentation */
export function getSourceSummary(): string {
  const enabled = stateSources.filter((s) => s.enabled);
  const manual = stateSources.filter((s) => !s.enabled);
  return `${enabled.length} automated sources, ${manual.length} manual-only states`;
}
