/**
 * Production P0 sweep (read-only). First run: 30 Oct 2026.
 *
 * Fetches every URL in the PRODUCTION sitemap plus /llms.txt and /llms-full.txt
 * straight from https://www.trafficschoolpicker.com (browser User-Agent, no proxy),
 * records the x-vercel-cache / age / x-vercel-id headers per page, and runs seven
 * checks against the raw HTML:
 *
 *   1 card-gating      school cards / tracker links on a page whose own text says the
 *                      courses don't qualify (or whose status is court-program / in-person)
 *   2 one-answer       dismissal / benefit type / frequency / course length disagree
 *                      across Key Facts, meta, banner, True Cost, body, FAQ, FAQPage
 *                      JSON-LD, llms-full and the state's topic pages
 *   3 card-labels      a card course length/format from another program ("classroom" on
 *                      an online card); card pros that contradict the same page's table
 *   4 directories      junk rows (URL / UI label / agency / empty), duplicate license
 *                      numbers, header count vs rows, source label vs the real list
 *   5 coverage-claims  "all 50 states", "accepted statewide", "court-approved" checked
 *                      against what the site itself says about each state
 *   6 template-residue missing-space joins, truncated Key Facts cells, dangling
 *                      sentences, hero counts that don't match what renders
 *   7 llms             llms-full state section vs the live page (benefit, frequency, hours)
 *
 * It never reads Notion and needs no credentials. Deployment metadata (production
 * deployment ID, its commit, main HEAD, failed production deployments in the last
 * 21 days) is collected best-effort from the `gh` and `vercel` CLIs when they are
 * installed and logged in; without them the header says "not determined".
 *
 * Fetched HTML goes to a temp directory (default: $TMPDIR/tsp-p0-sweep-<date>),
 * never the repo. Output: audit/p0-sweep-<date>.md and audit/p0-sweep-<date>.csv.
 *
 * The run ends with four sanity assertions (known live issues on /washington-dc,
 * /georgia and /virginia). If one fails, the CHECK is wrong: fix the check.
 * Once those issues are fixed on the site, the assertions will (correctly) fail;
 * pass --no-sanity to skip them.
 *
 *   npx tsx scripts/audit-p0-sweep.ts [--date=2026-10-30] [--out=audit]
 *        [--scratch=/tmp/dir] [--concurrency=4] [--no-sanity] [--no-deploy-info]
 *        [--gmail-note="text recorded in the header"] [--note="observation for the header"]
 */
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { STATE_LIST } from "../lib/state-utils";

// ───────────────────────── config ─────────────────────────

const SITE = "https://www.trafficschoolpicker.com";
const REPO = "Seanfoy-git/trafficschoolpicker";
const VERCEL_SCOPE = "sean-foys-projects";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const argv = process.argv.slice(2);
const arg = (name: string): string | undefined => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
};
const RUN_DATE = arg("date") ?? new Date().toISOString().slice(0, 10);
const OUT_DIR = arg("out") ?? "audit";
const SCRATCH = arg("scratch") ?? path.join(os.tmpdir(), `tsp-p0-sweep-${RUN_DATE}`);
const CONCURRENCY = parseInt(arg("concurrency") ?? "4", 10);
const RUN_SANITY = !arg("no-sanity");
const DEPLOY_INFO = !arg("no-deploy-info");
const GMAIL_NOTE = arg("gmail-note") ?? null;
const RUN_NOTE = arg("note") ?? null; // free-text observation recorded in the header

// ───────────────────────── types ─────────────────────────

type Severity = "P0" | "P1" | "P2";
type Check =
  | "1-card-gating"
  | "2-one-answer"
  | "3-card-labels"
  | "4-directories"
  | "5-coverage-claims"
  | "6-template-residue"
  | "7-llms";
type FixType = "template" | "data" | "remove";

type Finding = {
  url: string;
  state: string; // state slug, or "sitewide"
  check: Check;
  severity: Severity;
  excerpt: string; // verbatim, < 25 words
  detail: string; // what it disagrees with / why it was flagged
  source: string; // template file or Notion DB › field
  fix: FixType;
};

type Fetched = {
  url: string;
  path: string;
  status: number;
  cache: string;
  age: string;
  vercelId: string;
  dpl: string; // deployment that rendered the HTML (the ?dpl= skew-protection id in its asset URLs)
  fetchedAt: string;
  body: string;
};

type Surface = { name: string; url: string; text: string; source: string };

// ───────────────────────── sources (where each string comes from) ─────────────────────────

const SRC = {
  kfAvailable:
    "components/StateKeyFacts.tsx (value derived from Notion States DB › Online Allowed / Online Dismisses Ticket / Insurance Discount Available / Online Model)",
  kfDismissal: "Notion States DB › Dismissal Answer (fallback: components/StateKeyFacts.tsx by Online Model)",
  kfLength: "Notion States DB › Course Hours",
  kfEligibility: "Notion States DB › Eligibility Requirements",
  kfOther: "components/StateKeyFacts.tsx (Notion States DB fields)",
  intro: "Notion States DB › Intro Paragraph",
  trueCost: "Notion States DB › True Cost of a Ticket",
  banner: "app/[state]/page.tsx (bannersBlock, keyed on Online Model / state slug)",
  rules: "Notion States DB › Eligibility Requirements / Court Acceptance Notes / Research Notes",
  faq: "Notion States DB › State FAQ (JSON); legacy NOTION_FAQ_DB_ID",
  meta: "lib/comparison.ts comparisonMetaDescription (P17) or lib/seo-config.ts STATE_SEO; Notion States DB › Benefit Summary",
  method: "lib/comparison.ts methodStatement",
  hero: "app/[state]/page.tsx hero (P17: lib/comparison.ts comparisonSubhead)",
  cards: "lib/state-page-data.ts showComparison gate + app/[state]/page.tsx cardsBlock/reviewedBlock",
  cardHours: "Notion States DB › Course Hours (state-level value printed on every card by components/SchoolCard.tsx)",
  cardPros: "Notion School Variants DB › Pros (fallback: Notion Schools DB › Pros / per-state Pros)",
  cardText: "Notion School Variants DB › One-Liner/Pros/Best For (fallback: Notion Schools DB)",
  cardPrice: "Notion Pricing DB › Price (card) vs Notion Pricing DB / Directory DB › Price (table) via lib/comparison.ts",
  table: "Notion State Requirements DB › Has Final Exam / Has Lesson Timers (or School Variants / Directory DB overrides) via lib/comparison.ts",
  dirRow: "Notion Directory DB › School Name / License Number (scraped by scripts/scrape-*.ts)",
  dirLabel: "components/DirectoryTable.tsx (hard-coded \"Official {State} DMV records\" / \"DMV-licensed online traffic schools\")",
  dirCount: "components/DirectoryTable.tsx / app/[state]/page.tsx (count = Notion Directory DB rows for the state)",
  topic: "Notion Questions DB › page body / Key Facts (app/[state]/[question]/page.tsx)",
  llms: "scripts/generate-llms-full.ts (from Notion States DB fields)",
  llmsTxt: "scripts/generate-llms-full.ts / public/llms.txt",
  join: "JSX text join renders without a space (components/OutOfStateCallout.tsx, app/[state]/page.tsx)",
  blog: "content/blog/<slug>.mdx",
  review: "app/reviews/[school-slug]/page.tsx + Notion Schools DB",
  other: "page template under app/",
};

// ───────────────────────── fetch ─────────────────────────

/** Most frequent `dpl=dpl_…` id in the HTML: the deployment that rendered this copy. */
function dplOf(body: string): string {
  const counts = new Map<string, number>();
  for (const m of body.matchAll(/dpl=(dpl_[A-Za-z0-9]+)/g)) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function cacheFile(p: string): string {
  const name = (p === "/" ? "index" : p.replace(/^\//, "").replace(/\//g, "__")) + ".html";
  return path.join(SCRATCH, name);
}

async function fetchOne(url: string): Promise<Fetched> {
  const p = url.replace(SITE, "") || "/";
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      const body = await r.text();
      const f: Fetched = {
        url,
        path: p,
        status: r.status,
        cache: r.headers.get("x-vercel-cache") ?? "",
        age: r.headers.get("age") ?? "",
        vercelId: r.headers.get("x-vercel-id") ?? "",
        dpl: dplOf(body),
        fetchedAt: new Date().toISOString(),
        body,
      };
      fs.writeFileSync(cacheFile(p), body);
      return f;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error(`fetch failed for ${url}: ${String(lastErr)}`);
}

async function fetchAll(urls: string[]): Promise<Map<string, Fetched>> {
  const out = new Map<string, Fetched>();
  let i = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (i < urls.length) {
      const u = urls[i++];
      const f = await fetchOne(u);
      out.set(f.path, f);
      process.stdout.write(".");
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");
  return out;
}

// ───────────────────────── html helpers ─────────────────────────

function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&minus;/g, "−")
    .replace(/&rarr;/g, "→")
    .replace(/&amp;/g, "&");
}

const stripScripts = (h: string) =>
  h.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");

/** Visible text of an HTML fragment, one block element per line. React's `<!-- -->`
 *  text separators are removed WITHOUT adding a space, exactly as a browser shows it. */
function toText(h: string): string {
  let s = h.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<\/?(h[1-6]|p|li|tr|div|section|dt|dd|th|td|summary|details|ul|ol|table|header|footer|nav|br)\b[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decode(s);
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

const inline = (h: string) => toText(h).replace(/\n+/g, " ").trim();

function mainOf(html: string): string {
  const noScripts = stripScripts(html);
  const a = noScripts.indexOf("<main");
  const b = noScripts.lastIndexOf("</main>");
  return a >= 0 && b > a ? noScripts.slice(a, b) : noScripts;
}

// Abbreviations that end in a period but don't end a sentence (legal cites, states).
const ABBREV =
  /(?:^|[\s(])(?:Va|Stat|Ann|Rev|Gen|Code|Admin|Reg|Regs|Inc|Co|Corp|St|Dr|Mr|Ms|Mrs|vs|No|Nos|Sec|Secs|Ch|Art|Pt|R|Cal|Veh|Fla|Ga|Tex|Ariz|Conn|Minn|Miss|Neb|Wis|Mich|Ill|Ind|Ky|La|Md|Mass|Mo|Mont|Nev|Okla|Or|Pa|Tenn|Vt|Wash|Wyo|Del|Colo|Ala|Ark|Kan|Penn|Cons|Comp|Laws|Tit|e\.g|i\.e|approx|U\.S|[A-Z](?:\.[A-Z])*)\.$/;

function sentences(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\n+/)) {
    const parts = line.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(§])/);
    let buf = "";
    for (const part of parts) {
      buf = buf ? `${buf} ${part}` : part;
      if (ABBREV.test(buf)) continue; // the period belonged to an abbreviation
      out.push(buf.trim());
      buf = "";
    }
    if (buf) out.push(buf.trim());
  }
  return out.filter((s) => s.length > 2);
}

/** Verbatim excerpt (< 25 words) centred on the first match of `re` in `text`. */
function excerpt(text: string, re?: RegExp, maxWords = 24): string {
  const t = text.replace(/\s+/g, " ").trim();
  const words = t.split(" ");
  if (words.length <= maxWords) return t;
  let startWord = 0;
  if (re) {
    const m = new RegExp(re.source, re.flags.replace("g", "")).exec(t);
    if (m) {
      const before = t.slice(0, m.index).split(" ").length - 1;
      startWord = Math.max(0, Math.min(words.length - maxWords, before - Math.floor(maxWords / 3)));
    }
  }
  const slice = words.slice(startWord, startWord + maxWords).join(" ");
  return (startWord > 0 ? "… " : "") + slice + (startWord + maxWords < words.length ? " …" : "");
}

function metaDescription(html: string): string {
  const m = /<meta name="description" content="([^"]*)"/.exec(html);
  return m ? decode(m[1]) : "";
}

type Json = unknown;
type LdNode = {
  "@type"?: string;
  "@graph"?: Json;
  mainEntity?: { name?: unknown; acceptedAnswer?: { text?: unknown } }[];
};

function ldBlocks(html: string): Json[] {
  const out: Json[] = [];
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      try {
        out.push(JSON.parse(decode(m[1])));
      } catch {
        /* ignore malformed */
      }
    }
  }
  return out;
}

function faqFromLd(html: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  const walk = (raw: Json) => {
    if (!raw || typeof raw !== "object") return;
    if (Array.isArray(raw)) return raw.forEach(walk);
    const j = raw as LdNode;
    if (j["@type"] === "FAQPage") {
      for (const e of j.mainEntity ?? []) {
        const q = e?.name;
        const a = e?.acceptedAnswer?.text;
        if (typeof q === "string" && typeof a === "string") out.push({ q, a });
      }
    }
    if (j["@graph"]) walk(j["@graph"]);
  };
  ldBlocks(html).forEach(walk);
  return out;
}

/** Split main HTML into sections keyed by their <h2> text. */
function h2Sections(main: string): { heading: string; html: string }[] {
  const parts = main.split(/(?=<h2\b)/);
  return parts.map((p) => {
    const m = /^<h2\b[^>]*>([\s\S]*?)<\/h2>/.exec(p);
    return { heading: m ? inline(m[1]) : "", html: p };
  });
}

function keyFacts(main: string): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const re = /<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(main))) out.push({ label: inline(m[1]), value: inline(m[2]) });
  return out;
}

type Card = {
  name: string;
  hours: string;
  pros: string[];
  cons: string[];
  text: string;
  price: number | null;
  priceText: string;
  trackers: number;
  enroll: boolean;
};

function parseCards(main: string): Card[] {
  const marker = 'class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm';
  const parts = main.split(marker).slice(1);
  return parts.map((raw) => {
    let seg = raw;
    for (const stop of ["We independently research and review all schools", "<h2"]) {
      const k = seg.indexOf(stop);
      if (k > 0) seg = seg.slice(0, k);
    }
    const name = inline(/<h3 class="text-lg font-bold text-slate-900">([\s\S]*?)<\/h3>/.exec(seg)?.[1] ?? "");
    const hours = inline(/lucide-clock[^>]*>[\s\S]*?<\/svg>([\s\S]*?)<\/span>/.exec(seg)?.[1] ?? "");
    const listAfter = (label: string) => {
      const k = seg.indexOf(`${label}</h4>`);
      if (k < 0) return [];
      const ul = seg.slice(k, seg.indexOf("</ul>", k));
      return [...ul.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((x) => inline(x[1]).replace(/^−\s*/, ""));
    };
    const priceMatches = [...seg.matchAll(/text-2xl font-bold text-slate-900">([^<]*)</g)].map((x) => decode(x[1]).trim());
    const priceText = priceMatches[priceMatches.length - 1] ?? "";
    const pm = /\$([\d,]+(?:\.\d+)?)/.exec(priceText);
    return {
      name,
      hours,
      pros: listAfter("Pros"),
      cons: listAfter("Cons"),
      text: toText(seg),
      price: pm ? parseFloat(pm[1].replace(/,/g, "")) : null,
      priceText,
      trackers: (seg.match(/href="https:\/\/track\.trafficschoolpicker\.com[^"]*"/g) ?? []).length,
      enroll: /Enroll Now/.test(seg),
    };
  });
}

type Table = { headers: string[]; rows: { cells: string[]; hrefs: string[] }[]; html: string };

function parseTables(main: string): Table[] {
  return [...main.matchAll(/<table\b[\s\S]*?<\/table>/g)].map((t) => {
    const html = t[0];
    const thead = /<thead\b[\s\S]*?<\/thead>/.exec(html)?.[0] ?? "";
    const headers = [...thead.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map((x) => inline(x[1]));
    const tbody = /<tbody\b[\s\S]*?<\/tbody>/.exec(html)?.[0] ?? html.replace(thead, "");
    const rows = [...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => {
      const cellsRaw = [...r[1].matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((x) => x[2]);
      return {
        cells: cellsRaw.map(inline),
        hrefs: cellsRaw.map((c) => /href="([^"]*)"/.exec(c)?.[1] ?? ""),
      };
    });
    return { headers, rows, html };
  });
}

function dataCounts(main: string): { value: number; context: string }[] {
  const out: { value: number; context: string }[] = [];
  const re = /data-count="directory">(\d+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(main))) {
    const ctx = inline(main.slice(Math.max(0, m.index - 300), m.index + 250));
    out.push({ value: parseInt(m[1], 10), context: ctx });
  }
  return out;
}

// ───────────────────────── classifiers ─────────────────────────

type DClass = "YES" | "NO" | "COND";

/** Dismissal stance of a single sentence (null when it doesn't talk about dismissal). */
const CONDITIONAL =
  /\b(?:may|might|could|can|if|unless|some (?:\w+ )?(?:courts|judges)|court[- ]by[- ]court|case[- ]by[- ]case|discretion\w*|if the court|where the court|up to the court|court decides|sometimes|many (?:\w+ )?(?:courts|judges|solicitors)|defer\w*|depend\w*|not guaranteed|varies|whether|often|options?|permission)\b/i;
// Sentences about a sub-group, a different course, or the eligibility clock are not
// a stance on whether THE course dismisses THE ticket.
const SUBGROUP =
  /\b(?:CDL|commercial|Traffic Survival School|TSS|remediation|do not confuse|separate|under (?:18|19|20|21)|DUI|out-of-state|another state|other states?)\b/i;
const CLOCK = /\b(?:in the \d+ months|clock|months before|eligib\w*|within the past|already|previous\w*|in[- ]person only|classroom only)\b/i;
const NEGATED_DISMISS = /\b(?:does not|doesn'?t|do not|don'?t|cannot|can'?t|won'?t|will not|never|not|no)\b[^.;:,]{0,80}?\bdismiss\w*\b(?!\s+(?:course|class|program))/i;
const STRONG_YES =
  /\b(?:course|clinic|program|school|class|completion|completing)\b[^;]{0,100}?\b(?:allows?|offers?|provides?|earns?|gets?|leads? to|results? in|qualif\w* (?:you )?for)\b(?: either)?[^;]{0,12}\bdismissal\b|\bdismissal\b(?: \([^)]*\))? (?:or|and) (?:a )?(?:\d+|five)[- ]/i;

function dismissClass(s: string): DClass | null {
  if (!/dismiss/i.test(s)) return null;
  if (SUBGROUP.test(s)) return null;
  // Court-by-court framing is conditional whatever else the sentence says.
  if (/\b(?:some|many|most) (?:\w+ ){0,2}(?:courts|judges|solicitors)|court[- ]by[- ]court|case[- ]by[- ]case\b/i.test(s)) return "COND";
  const negated = NEGATED_DISMISS.test(s);
  if (STRONG_YES.test(s) && !negated) return "YES";
  if (CLOCK.test(s)) return null;
  // NO: the course does not dismiss the ticket / no course or program does / the
  // benefit is something else. ("no statewide dismissal law" = court by court.)
  if (negated && !/\bno (?:statewide )?(?:ticket )?dismissal (?:law|statute|rule)\b/i.test(s)) return "NO";
  if (/\binstead of (?:a )?dismissal\b/i.test(s) || /^\s*no\b[ ,.:]/i.test(s)) return "NO";
  // (Strong YES, checked above: the course / clinic / program itself is credited with
  // a dismissal, even when a "court-discretionary" aside follows.)
  // Weak YES: a flat statement, unless the sentence itself carries a condition.
  const weakYes =
    /^\s*yes\b/i.test(s) ||
    /\bfor (?:ticket )?dismissal\b/i.test(s) ||
    /\bdismiss(?:es|ed)? (?:your|the|a|an) (?:ticket|citation|charge|infraction)\b/i.test(s);
  if (CONDITIONAL.test(s)) return "COND";
  return weakYes ? "YES" : "COND";
}

const NUMWORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, eighteen: 18, "twenty-four": 24, "thirty-six": 36,
};

/** "once every N months/years" style windows, normalised to months ("lifetime" kept). */
function freqWindows(s: string): string[] {
  const out: string[] = [];
  if (/\bonce (?:per|in a|in your|in any|in their|per driving)? ?(?:lifetime|driving career)\b|\bonce in a lifetime\b|\bonce-in-a-lifetime\b|\bone-time(?:-only)?\b/i.test(s))
    out.push("lifetime");
  const re = /\bonce\s+(?:every|per|in any|in a|within(?:\s+any)?|each|a)\s+(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty-four|thirty-six)[- ])?(month|year)s?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const raw = (m[1] ?? "1").toLowerCase();
    const n = /^\d+$/.test(raw) ? parseInt(raw, 10) : NUMWORDS[raw] ?? 1;
    out.push(`${m[2].toLowerCase() === "year" ? n * 12 : n}mo`);
  }
  return out;
}

type HourHit = { lo: number; hi: number; raw: string; secondary: boolean };

function hourHits(s: string): HourHit[] {
  const hits: HourHit[] = [];
  const re = /(\d+(?:\.\d+)?)\s*(?:(?:to|through|-|–|and|or)\s*(\d+(?:\.\d+)?)\s*)?[- ]?hours?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const lo = parseFloat(m[1]);
    const hi = m[2] ? parseFloat(m[2]) : lo;
    const around = s.slice(Math.max(0, m.index - 100), m.index + m[0].length + 100);
    const near = s.slice(Math.max(0, m.index - 25), m.index + m[0].length + 30);
    const secondary =
      /\b(mature|55\+|senior|invitation|refresher|mandatory|dui|alcohol|advanced|remedial|assigned|survival|intermediate|super speeder|teen|under 18|under 21|drivers? ed|driver'?s? education|permit|cdl|commercial|aggressive|risk reduction|court-ordered|dmv-ordered|motorcycle)\b/i.test(around) ||
      /\b(separate|also (?:runs|offers|has)|do not confuse|different course|instead|padded|nobody|no one|isn'?t allowed|not allowed)\b/i.test(around) ||
      /\b(within|certificate|deliver\w*|process\w*|support|24\/7|business|per day|a day|each day|per session|at a time|break|timer|log ?in|sitting|emailed|mailed|in one sitting)\b/i.test(near) ||
      lo >= 24;
    hits.push({ lo, hi, raw: m[0], secondary });
  }
  return hits;
}

const overlaps = (a: { lo: number; hi: number }, b: { lo: number; hi: number }) => a.lo <= b.hi && b.lo <= a.hi;

// ───────────────────────── state context ─────────────────────────

type StatePage = {
  slug: string;
  name: string;
  url: string;
  fetched: Fetched;
  main: string;
  text: string;
  status: string; // "Online Status" text from the rules section
  kf: { label: string; value: string }[];
  cards: Card[];
  tables: Table[];
  sections: { heading: string; html: string }[];
  surfaces: Surface[];
  noQualify: boolean; // page itself says the listed/online courses don't deliver
};

const findings: Finding[] = [];
const coverageBuf: Finding[] = [];
const add = (f: Finding) => {
  f.excerpt = f.excerpt.replace(/\s+/g, " ").trim();
  findings.push(f);
};

function buildSurfaces(slug: string, url: string, html: string, main: string): Surface[] {
  const s: Surface[] = [];
  const kf = keyFacts(main);
  for (const f of kf) {
    const src =
      f.label === "Online course available"
        ? SRC.kfAvailable
        : f.label === "Ticket dismissal"
          ? SRC.kfDismissal
          : f.label === "Course length"
            ? SRC.kfLength
            : f.label === "Eligibility"
              ? SRC.kfEligibility
              : SRC.kfOther;
    s.push({ name: `Key Facts › ${f.label}`, url, text: f.value, source: src });
  }
  s.push({ name: "meta description", url, text: metaDescription(html), source: SRC.meta });
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(main);
  if (h1) s.push({ name: "H1", url, text: inline(h1[1]), source: SRC.hero });
  // banners (title + body)
  for (const m of main.matchAll(
    /<p class="font-semibold text-(?:amber-800|slate-700)[^"]*">([\s\S]*?)<\/p>\s*<p class="text-sm[^"]*">([\s\S]*?)<\/p>/g
  )) {
    s.push({ name: `banner › ${inline(m[1])}`, url, text: `${inline(m[1])}. ${inline(m[2])}`, source: SRC.banner });
  }
  for (const m of main.matchAll(/<p class="text-base md:text-lg text-slate-700 leading-relaxed">([\s\S]*?)<\/p>/g)) {
    s.push({ name: "intro paragraph", url, text: inline(m[1]), source: SRC.intro });
  }
  for (const m of main.matchAll(/<p class="text-base text-slate-700 leading-relaxed max-w-4xl">([\s\S]*?)<\/p>/g)) {
    s.push({ name: "method statement", url, text: inline(m[1]), source: SRC.method });
  }
  for (const sec of h2Sections(main)) {
    if (/^The True Cost of a Ticket/i.test(sec.heading))
      s.push({ name: "True Cost block", url, text: toText(sec.html), source: SRC.trueCost });
    if (/Traffic School Rules/i.test(sec.heading))
      s.push({ name: "Rules & Requirements", url, text: toText(sec.html), source: SRC.rules });
    if (/FAQ$/i.test(sec.heading)) s.push({ name: "FAQ (visible)", url, text: toText(sec.html), source: SRC.faq });
    if (/^When a lawyer beats/i.test(sec.heading))
      s.push({ name: "lawyer block", url, text: toText(sec.html), source: "Notion States DB › Lawyer Block" });
  }
  const ld = faqFromLd(html);
  if (ld.length)
    s.push({
      name: "FAQPage JSON-LD",
      url,
      text: ld.map((x) => `${x.q}\n${x.a}`).join("\n"),
      source: SRC.faq,
    });
  return s;
}

function topicSurfaces(url: string, html: string): Surface[] {
  const main = mainOf(html);
  const out: Surface[] = [];
  const kf = keyFacts(main);
  if (kf.length)
    out.push({ name: `topic ${url.replace(SITE, "")} › Key Facts`, url, text: kf.map((f) => `${f.label}: ${f.value}.`).join("\n"), source: SRC.topic });
  // body without the out-of-state callout + key facts + sources
  let body = main.replace(/<dl\b[\s\S]*?<\/dl>/g, "");
  body = body.replace(/Ticket in [\s\S]*?Same guide, other direction\./, "");
  out.push({ name: `topic ${url.replace(SITE, "")} › body`, url, text: toText(body), source: SRC.topic });
  const ld = faqFromLd(html);
  if (ld.length)
    out.push({ name: `topic ${url.replace(SITE, "")} › FAQPage JSON-LD`, url, text: ld.map((x) => `${x.q}\n${x.a}`).join("\n"), source: SRC.topic });
  return out;
}

function llmsSections(full: string): Map<string, string> {
  const out = new Map<string, string>();
  const stateRef = full.split(/\n# TrafficSchoolPicker\.com — School Reviews/)[0];
  for (const part of stateRef.split(/\n(?=## )/)) {
    const m = /^## (.+)\n/.exec(part);
    if (m) out.set(m[1].trim(), part);
  }
  return out;
}

// ───────────────────────── checks ─────────────────────────

const DISQUAL =
  /\bnot valid\b|\bnot accepted\b|\binvitation[- ]only\b|\bclassroom[- ]only\b|\bcourt program only\b|\bin[- ]person\b|\bdo(?:es)? not qualify\b|\bdon'?t qualify\b|\bdoesn'?t qualify\b|\bnot (?:DMV[- ])?approved\b|\bnot eligible\b|\bno self-serve online course\b/i;
const REFERS_TO_LISTED =
  /\b(?:listed below|(?:courses?|schools?) (?:listed|shown) below|national courses|these (?:courses|schools)|online(?:-only)? courses?|self-paced online|online course|retail online course|self-serve online course)\b/i;
const LIMITED_TO_OTHER_BENEFIT =
  /\bfor (?:that|the|this)(?: statewide)? (?:\d+-point |two-point |three-point |seven-point )?(?:benefit|reduction|credit|deduction|points?(?: reduction)?|point (?:reduction|credit))|\bfor points? reduction\b|\bfor the DDS\b|\bfor it\b|\b(?:two|three|seven|\d+)-point (?:credit|deduction|reduction)\b|\bpoint credit\b|^separately\b/i;

function check1(sp: StatePage) {
  const trackers = (sp.main.match(/href="https:\/\/track\.trafficschoolpicker\.com[^"]*"/g) ?? []).length;
  if (!sp.cards.length && !trackers) return;
  const cardNames = sp.cards.map((c) => c.name).join(", ");
  const enroll = sp.cards.filter((c) => c.enroll).map((c) => c.name);
  const detailBase = `${sp.cards.length} cards rendered (${cardNames}); ${trackers} tracker link(s)${enroll.length ? `; "Enroll Now" on ${enroll.join(", ")}` : ""}`;

  if (/Court program only|In-person only/i.test(sp.status)) {
    add({
      url: sp.url, state: sp.slug, check: "1-card-gating", severity: "P0",
      excerpt: `Online Status: ${sp.status}`,
      detail: `${detailBase}, but the page's own status says no online course delivers the benefit.`,
      source: SRC.cards, fix: "template",
    });
  }
  const pointProgram = /point reduction/i.test(sp.status);
  const seen = new Set<string>();
  for (const surf of sp.surfaces) {
    if (/^(meta description|H1|lawyer block)$/.test(surf.name)) continue;
    for (const sent of sentences(surf.text)) {
      if (!DISQUAL.test(sent) || seen.has(sent)) continue;
      seen.add(sent);
      const refersToListed = REFERS_TO_LISTED.test(sent);
      const limited = LIMITED_TO_OTHER_BENEFIT.test(sent);
      const removesOnlyBenefit = pointProgram && /\bpoint/i.test(sent);
      let severity: Severity;
      let why: string;
      if (refersToListed && (!limited || removesOnlyBenefit)) {
        severity = "P0";
        why = "the page says the listed/online courses don't qualify";
      } else if (refersToListed && limited) {
        severity = "P1";
        why = "the page says online courses don't qualify for one of the state's benefits (cards are sold for another)";
      } else {
        continue; // disqualifier about something else (e.g. CDL holders, a classroom program)
      }
      add({
        url: sp.url, state: sp.slug, check: "1-card-gating", severity,
        excerpt: excerpt(sent, DISQUAL),
        detail: `${detailBase}; ${why} (${surf.name}).`,
        source: `${SRC.cards}; disqualifying text from ${surf.source}`,
        fix: "template",
      });
    }
  }
}

function check2(sp: StatePage, extra: Surface[]) {
  const all = [...sp.surfaces, ...sp.cards.map((c) => ({ name: `card › ${c.name}`, url: sp.url, text: c.text, source: SRC.cardText })), ...extra];
  // ---- dismissal polarity
  type Claim = { cls: DClass; sent: string; surf: Surface };
  const claims: Claim[] = [];
  for (const surf of all) {
    const isKfDismiss = surf.name === "Key Facts › Ticket dismissal";
    const units = isKfDismiss ? [surf.text] : sentences(surf.text);
    for (const u of units) {
      // FAQ "question" lines are not claims
      if (/\?$/.test(u)) continue;
      const c = isKfDismiss ? (/^\s*no\b/i.test(u) ? "NO" : /^\s*yes\b/i.test(u) ? "YES" : dismissClass(u) ?? "COND") : dismissClass(u);
      if (c) claims.push({ cls: c as DClass, sent: u, surf });
    }
  }
  const yes = claims.filter((c) => c.cls === "YES");
  const no = claims.filter((c) => c.cls === "NO");
  const cond = claims.filter((c) => c.cls === "COND");
  if (yes.length && no.length) {
    const anchor = no.find((c) => c.surf.name.startsWith("Key Facts")) ?? no[0];
    const seen = new Set<string>();
    for (const y of yes) {
      const key = `${y.surf.url}|${y.sent}`;
      if (seen.has(key)) continue;
      seen.add(key);
      add({
        url: y.surf.url, state: sp.slug, check: "2-one-answer", severity: "P0",
        excerpt: excerpt(y.sent, /dismiss/i),
        detail: `Dismissal: ${y.surf.name} says YES; ${anchor.surf.name}${anchor.surf.url !== y.surf.url ? ` (${anchor.surf.url.replace(SITE, "")})` : ""} says NO: "${excerpt(anchor.sent, /dismiss/i, 18)}"`,
        source: y.surf.source, fix: "data",
      });
    }
  } else if (yes.length && cond.some((c) => c.surf.name === "Key Facts › Ticket dismissal")) {
    const kf = cond.find((c) => c.surf.name === "Key Facts › Ticket dismissal")!;
    const seen = new Set<string>();
    for (const y of yes) {
      if (seen.has(y.sent)) continue;
      seen.add(y.sent);
      add({
        url: y.surf.url, state: sp.slug, check: "2-one-answer", severity: "P1",
        excerpt: excerpt(y.sent, /dismiss/i),
        detail: `Dismissal: ${y.surf.name} states it flatly; Key Facts says "${kf.sent}".`,
        source: y.surf.source, fix: "data",
      });
    }
  }

  // ---- benefit type: "insurance discount only" vs a points credit stated elsewhere
  const insOnly = all.find((s) => /insurance discount only|for an insurance discount, not ticket dismissal/i.test(s.text) && /^(Key Facts › Online course available|banner)/.test(s.name));
  if (insOnly) {
    const ptsClaim = (x: string) =>
      /\b(?:credits?|earns?|adds?|reduc\w+|remov\w+|provides? a)\b[^.]{0,40}\b(?:safe[- ]driv\w+ )?points?\b/i.test(x) &&
      !/\b(?:not|never|no|doesn'?t|does not|isn'?t)\b/i.test(x);
    const pts = all.find(
      (s) =>
        /^(Key Facts › Ticket dismissal|FAQPage JSON-LD|intro paragraph|True Cost block)$/.test(s.name) && sentences(s.text).some(ptsClaim)
    );
    if (pts) {
      const sent = sentences(pts.text).find(ptsClaim) ?? pts.text;
      add({
        url: sp.url, state: sp.slug, check: "2-one-answer", severity: "P1",
        excerpt: excerpt(`${insOnly.name.replace(/^Key Facts › /, "")}: ${sentences(insOnly.text)[0]}`, undefined, 14),
        detail: `Benefit type: ${insOnly.name} says insurance discount only; ${pts.name} says "${excerpt(sent, /points?/i, 18)}"`,
        source: insOnly.source, fix: "data",
      });
    }
  }

  // ---- frequency
  type FW = { w: string; sent: string; surf: Surface };
  const fws: FW[] = [];
  for (const surf of all) {
    if (/^card ›/.test(surf.name)) continue;
    const ss = sentences(surf.text);
    for (const [i, sent] of ss.entries()) {
      // other programs / other benefits (insurance discount windows, PJC, mandated
      // courses), judged with the previous sentence as context
      const ctx = `${ss[i - 1] ?? ""} ${sent}`;
      if (/\b(nonmoving|non-moving|mature|55|senior|insurance|discount|cdl|commercial|dui|refresher|PJC|prayer for judgment|failure to yield|mandated|required|triggered|household)\b/i.test(ctx)) continue;
      if (/\bnot once\b/i.test(sent)) continue; // "once every three years, not once per lifetime"
      for (const w of freqWindows(sent)) fws.push({ w, sent, surf });
    }
  }
  const byW = new Map<string, FW[]>();
  for (const f of fws) byW.set(f.w, [...(byW.get(f.w) ?? []), f]);
  if (byW.size > 1) {
    const ranked = [...byW.entries()].sort((a, b) => b[1].length - a[1].length);
    const kfW = fws.find((f) => f.surf.name.startsWith("Key Facts"))?.w;
    const major = kfW ?? ranked[0][0];
    const majorEx = byW.get(major)![0];
    for (const [w, list] of ranked) {
      if (w === major) continue;
      const seenUrl = new Set<string>();
      for (const f of list) {
        const key = `${f.surf.url}|${f.surf.name}`;
        if (seenUrl.has(key)) continue;
        seenUrl.add(key);
        add({
          url: f.surf.url, state: sp.slug, check: "2-one-answer", severity: "P1",
          excerpt: excerpt(f.sent, /once/i),
          detail: `Frequency: ${f.surf.name} says ${w}; ${majorEx.surf.name} says ${major}: "${excerpt(majorEx.sent, /once/i, 16)}"`,
          source: f.surf.source, fix: "data",
        });
      }
    }
  }

  // ---- course length
  const kfLen = sp.kf.find((f) => f.label === "Course length")?.value ?? "";
  const base = hourHits(kfLen);
  if (base.length) {
    const seen = new Set<string>();
    for (const surf of all) {
      if (surf.name === "Key Facts › Course length" || /^card ›/.test(surf.name)) continue;
      for (const sent of sentences(surf.text)) {
        for (const h of hourHits(sent)) {
          if (h.secondary || base.some((b) => overlaps(b, h))) continue;
          const key = `${surf.url}|${surf.name}|${h.lo}`;
          if (seen.has(key)) continue;
          seen.add(key);
          add({
            url: surf.url, state: sp.slug, check: "2-one-answer", severity: "P1",
            excerpt: excerpt(sent, /hours?/i),
            detail: `Course length: ${surf.name} says ${h.raw}; Key Facts says "${kfLen}".`,
            source: surf.source, fix: "data",
          });
        }
      }
    }
  }
}

function check3(sp: StatePage) {
  if (!sp.cards.length) return;
  // (a) a card course length / format belonging to another program
  for (const c of sp.cards) {
    if (/classroom|in[- ]person|zoom|live (?:online )?session/i.test(c.hours)) {
      add({
        url: sp.url, state: sp.slug, check: "3-card-labels", severity: "P0",
        excerpt: `${c.name}: ${c.hours}`,
        detail: `Online card shows a classroom/in-person course length (${c.hours}); tracker link(s) on card: ${c.trackers}.`,
        source: SRC.cardHours, fix: "data",
      });
    }
  }
  // (b) card pros/one-liner vs the same page's comparison table row
  const cmp = sp.tables.filter((t) => t.headers.some((h) => /final exam/i.test(h)));
  const rowFor = (name: string) => {
    for (const t of cmp) {
      const r = t.rows.find((r) => r.cells[0]?.toLowerCase() === name.toLowerCase());
      if (r) return { t, r };
    }
    return null;
  };
  for (const c of sp.cards) {
    const hit = rowFor(c.name);
    if (!hit) continue;
    const col = (re: RegExp) => hit.r.cells[hit.t.headers.findIndex((h) => re.test(h))] ?? "";
    const exam = col(/final exam/i);
    const timers = col(/timers/i);
    const price = col(/price/i);
    const lines = [...c.pros, ...c.text.split("\n").filter((l) => /^Our take|^Best for/i.test(l) || /exam|timer/i.test(l))];
    const noExam = lines.find((l) => /\bno[- ](?:final )?exam\b|\bwithout (?:a |any )?(?:final )?exam\b|\bno exam pressure\b|\bno final test\b/i.test(l));
    if (noExam && /^yes/i.test(exam)) {
      add({
        url: sp.url, state: sp.slug, check: "3-card-labels", severity: "P1",
        excerpt: `${c.name}: ${excerpt(noExam, /exam/i, 18)}`,
        detail: `Card says no final exam; comparison table row for ${c.name} says Final exam: ${exam}.`,
        source: `${SRC.cardPros} vs ${SRC.table}`, fix: "data",
      });
    }
    const yesExam = lines.find((l) => /\b(?:includes?|requires?|has) (?:a )?final exam\b/i.test(l) && !/\bno\b/i.test(l));
    if (yesExam && /^no$/i.test(exam)) {
      add({
        url: sp.url, state: sp.slug, check: "3-card-labels", severity: "P1",
        excerpt: `${c.name}: ${excerpt(yesExam, /exam/i, 18)}`,
        detail: `Card says there is a final exam; table row says Final exam: ${exam}.`,
        source: `${SRC.cardPros} vs ${SRC.table}`, fix: "data",
      });
    }
    const noTimers = lines.find((l) => /\bno (?:lesson |page |course )?timers?\b|\bwithout timers\b/i.test(l));
    if (noTimers && /^yes/i.test(timers)) {
      add({
        url: sp.url, state: sp.slug, check: "3-card-labels", severity: "P1",
        excerpt: `${c.name}: ${excerpt(noTimers, /timer/i, 18)}`,
        detail: `Card says no timers; table row for ${c.name} says Timers: ${timers}.`,
        source: `${SRC.cardPros} vs ${SRC.table}`, fix: "data",
      });
    }
    const tp = /\$([\d,]+(?:\.\d+)?)/.exec(price);
    if (tp && c.price != null && Math.abs(parseFloat(tp[1].replace(/,/g, "")) - c.price) > 0.005) {
      add({
        url: sp.url, state: sp.slug, check: "3-card-labels", severity: "P1",
        excerpt: `${c.name}: card ${c.priceText}; table ${price}`,
        detail: `Card price differs from the same page's comparison-table price for ${c.name}.`,
        source: SRC.cardPrice, fix: "data",
      });
    }
  }
}

// The whole name is a URL / domain (no spaces): "http://---", "www.x.com", "X.COM".
const BARE_URL = /^(?:https?:\/\/\S*|www\.\S+|[\w.-]+\.(?:com|net|org|us|info|biz)(?:\/\S*)?)$/i;
const UI_LABEL =
  /^(?:search|search schools\.*|reset all|reset|clear(?: all)?|filters?|active program list|program list|certificate id|license ?#?|license number|name|school name|phone|website|address|visit|next|previous|prev|show(?: \d+)?|sort(?: by)?|apply|submit|results?|page \d+|select|all|menu|home|back|more|view(?: all| details)?|download|print|export|loading\.*|n\/a|none|tbd|status|city|county|zip|-+|—)$/i;
const AGENCY =
  /\b(?:department ?of|dept\.? ?of|division ?of|secretary of state|bureau ?of|supreme court|motor vehicles?)|driver services|\b(?:DMV|DDS|TDLR|BMV|MVC|RMV)\b/i;
const SCHOOLISH = /\b(?:school|academy|clinic|institute|llc|inc|education|training|course|driving)\b/i;
const NON_DMV_AGENCIES: { re: RegExp; label: string }[] = [
  { re: /\bDepartment of Driver Services\b|\bDDS\b/, label: "DDS" },
  { re: /\bTDLR\b|Texas Department of Licensing/, label: "TDLR" },
  { re: /\bFLHSMV\b|\bDHSMV\b|Highway Safety and Motor Vehicles/, label: "FLHSMV" },
  { re: /\bBMV\b|Bureau of Motor Vehicles/, label: "BMV" },
  { re: /\bMVC\b|Motor Vehicle Commission/, label: "MVC" },
  { re: /\bRMV\b|Registry of Motor Vehicles/, label: "RMV" },
  { re: /\bPennDOT\b/, label: "PennDOT" },
  { re: /\bSupreme Court\b/, label: "Supreme Court" },
  { re: /\bSecretary of State\b/, label: "Secretary of State" },
  { re: /\bMVD\b/, label: "MVD" },
];

function check4(sp: StatePage) {
  const dir = sp.tables.find((t) => t.headers.some((h) => /^license/i.test(h)));
  if (!dir) return;
  const rows = dir.rows.filter((r) => r.cells.length >= 2 && !/No schools match/i.test(r.cells[0]));
  let junk = 0;
  const urlRows: string[] = [];
  const gluedRows: string[] = [];
  for (const r of rows) {
    const name = r.cells[0] ?? "";
    let why: string | null = null;
    let sev: Severity = "P2";
    const fix: FixType = "remove";
    if (!name.trim()) why = "row with an empty name";
    else if (BARE_URL.test(name.trim())) {
      urlRows.push(name);
      why = "row named as a URL";
    } else if (/(?:https?:\/\/|www\.)\S+|\b\d{3}\) ?\d{3}-\d{4}\b|\b[A-Z]{2} \d{5}\b/.test(name)) {
      why = "row name has a URL / address / phone glued in";
    } else if (UI_LABEL.test(name.trim())) why = "row named as a UI label";
    else if (AGENCY.test(name) && !SCHOOLISH.test(name)) {
      why = "row named as an agency";
      sev = "P1";
    }
    if (!why) continue;
    junk++;
    // URL-named / glued rows are aggregated below (one finding per row would bury the report)
    if (why === "row named as a URL" && name !== "http://---" && urlRows.length > 3) continue;
    if (why.startsWith("row name has") && (gluedRows.push(name), gluedRows.length > 3)) continue;
    add({
      url: sp.url, state: sp.slug, check: "4-directories", severity: sev,
      excerpt: `${name || "(empty)"} | ${r.cells[1] ?? ""} (row ${rows.indexOf(r) + 1} of ${rows.length})`.slice(0, 200),
      detail: `Directory ${why}${/\b(?:of|and|the|for|to)[A-Z]/.test(name) ? " (also a missing-space join)" : ""}.`,
      source: SRC.dirRow, fix,
    });
  }
  if (urlRows.length > 3) {
    add({
      url: sp.url, state: sp.slug, check: "4-directories", severity: "P2",
      excerpt: `${urlRows.length} rows named as URLs, e.g. ${urlRows.slice(0, 3).join(", ")}`,
      detail: `Directory has ${urlRows.length} rows whose name is a bare URL (first 3 also listed individually).`,
      source: SRC.dirRow, fix: "data",
    });
  }
  if (gluedRows.length > 3) {
    add({
      url: sp.url, state: sp.slug, check: "4-directories", severity: "P2",
      excerpt: excerpt(`${gluedRows.length} rows with a URL/address glued into the name, e.g. ${gluedRows.slice(0, 2).join("; ")}`),
      detail: `Directory has ${gluedRows.length} rows whose name carries a URL, street address or phone (first 3 also listed individually).`,
      source: SRC.dirRow, fix: "data",
    });
  }
  // duplicate licenses / placeholder license column
  const lic = new Map<string, string[]>();
  for (const r of rows) {
    const l = (r.cells[1] ?? "").trim();
    if (!l || l === "—") continue;
    lic.set(l, [...(lic.get(l) ?? []), r.cells[0] ?? ""]);
  }
  const dupes = [...lic.entries()].filter(([, names]) => names.length >= 2 && names.length <= Math.max(5, rows.length * 0.25));
  if (dupes.length > 10) {
    // a whole-list duplication: one finding, not hundreds
    add({
      url: sp.url, state: sp.slug, check: "4-directories", severity: "P2",
      excerpt: `${dupes.length} license numbers appear more than once, e.g. ${dupes.slice(0, 4).map(([l, n]) => `${l} (${n[0]})`).join(", ")}`.split(" ").slice(0, 24).join(" "),
      detail: `Duplicate license numbers on ${dupes.length} of ${lic.size} licences (${rows.length} rows): the list appears to be loaded more than once.`,
      source: SRC.dirRow, fix: "remove",
    });
  }
  for (const [l, names] of lic) {
    if (names.length < 2) continue;
    if (names.length <= Math.max(5, rows.length * 0.25) && dupes.length > 10) continue;
    if (names.length > Math.max(5, rows.length * 0.25)) {
      add({
        url: sp.url, state: sp.slug, check: "4-directories", severity: "P2",
        excerpt: `License # "${l}" on ${names.length} of ${rows.length} rows`,
        detail: "License column holds a placeholder, not per-school license numbers.",
        source: SRC.dirRow, fix: "data",
      });
    } else {
      add({
        url: sp.url, state: sp.slug, check: "4-directories", severity: "P2",
        excerpt: `${l} ×${names.length}: ${names.join(" / ")}`.split(" ").slice(0, 24).join(" "),
        detail: `Duplicate license number (${names.length} rows).`,
        source: SRC.dirRow, fix: "remove",
      });
    }
  }
  // header count vs rows
  const counts = dataCounts(sp.main);
  for (const c of counts) {
    if (c.value !== rows.length) {
      add({
        url: sp.url, state: sp.slug, check: "4-directories", severity: "P2",
        excerpt: excerpt(c.context, new RegExp(String(c.value))),
        detail: `Count says ${c.value}; directory renders ${rows.length} rows.`,
        source: SRC.dirCount, fix: "template",
      });
    }
  }
  if (junk) {
    const shown = counts[counts.length - 1]?.value ?? rows.length;
    add({
      url: sp.url, state: sp.slug, check: "4-directories", severity: "P2",
      excerpt: `All ${shown} DMV-licensed online traffic schools in ${sp.name}`,
      detail: `Header count includes ${junk} rows that are not schools (URL / UI label / agency / empty).`,
      source: SRC.dirCount, fix: "data",
    });
  }
  // source label vs the real list
  const label = /Source: (Official [^·<]*?records)/.exec(toText(dir.html.length ? sp.main : ""))?.[1] ?? "";
  if (/DMV/.test(label)) {
    const pageText = sp.surfaces.filter((s) => !/^card/.test(s.name)).map((s) => s.text).join("\n") + "\n" + toText(sp.main.slice(0, sp.main.indexOf("<table") > 0 ? sp.main.indexOf("<table") : undefined));
    const regulator = /official ([^.]*?) approved list/.exec(toText(sp.main))?.[1] ?? "";
    const named = regulator && !/DMV/.test(regulator) ? { label: regulator } : NON_DMV_AGENCIES.find((a) => a.re.test(pageText));
    if (named && !/DMV/.test(regulator)) {
      add({
        url: sp.url, state: sp.slug, check: "4-directories", severity: "P2",
        excerpt: `Source: ${label}`,
        detail: `Directory says it is the state DMV's list; the page itself names ${named.label} as the agency${regulator ? ` (hero: "official ${regulator} approved list")` : ""}.`,
        source: SRC.dirLabel, fix: "template",
      });
    }
  }
}

const COVER_APPROVAL =
  /\b(?:holds?|has|with)?\s*(?:approv\w+|accepted|valid|certified|licensed)\b[^.]{0,40}\ball 50 states\b|\ball 50 states\b[^.]{0,25}\b(?:approv\w+|accept\w+|valid)\b/i;
const COVER_AVAIL = /\b(?:available|offered|sold|operat\w+|serv\w+|courses?)\s+in all 50 states\b|\ball[- ]50[- ]state providers?\b/i;
const COVER_STATEWIDE = /\baccepted statewide\b|\bstatewide acceptance\b|\baccepted (?:by|in) (?:all|every) (?:courts?|county)\b/i;
const COVER_COURT = /\bcourt[- ]approved\b/i;

function check5(page: { url: string; state: string; text: string; source: string }, ctx: { nq: Set<string>; status: Map<string, string>; courtByCourt: boolean }) {
  const seen = new Set<string>();
  for (const sent of sentences(page.text)) {
    if (/All 50 states and DC covered/.test(sent)) continue; // site trust-bar: content coverage, not a course claim
    const kinds: [RegExp, string][] = [
      [COVER_APPROVAL, "approval"],
      [COVER_STATEWIDE, "statewide"],
      [COVER_COURT, "court-approved"],
      [COVER_AVAIL, "availability"],
    ];
    // negated / comparative claims ("Not available in all 50 states", "vs all-50-state
    // providers", 'not just "court approved"') and the "approved-provider list" noun
    if (/\bnot (?:available|just|approved)|\blimited state coverage\b|\bvs\.? all/i.test(sent)) continue;
    for (const [re, kind] of kinds) {
      if (!re.test(sent)) continue;
      if (kind === "approval" && COVER_AVAIL.test(sent) && !/\bapprov\w+ in all 50\b|\bapprovals in all 50\b/i.test(sent)) continue;
      if (kind === "court-approved" && !COVER_COURT.test(sent.replace(/court[- ]approved[- ]provider/gi, ""))) continue;
      const key = `${kind}|${sent}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const st = ctx.status.get(page.state) ?? "";
      const onNq = ctx.nq.has(page.state);
      let sev: Severity | null = null;
      let why = "";
      if (kind === "approval") {
        sev = onNq ? "P0" : "P1";
        why = onNq
          ? "claims approval/acceptance everywhere on a page that says these courses don't qualify here"
          : `site's own pages say online courses don't deliver the benefit in ${[...ctx.nq].join(", ")}`;
      } else if (kind === "statewide") {
        if (/court discretion/i.test(st)) {
          sev = "P0";
          why = "\"accepted statewide\" on a state the site says is decided court by court";
        } else if (onNq) {
          sev = "P0";
          why = "\"accepted statewide\" on a page that says these courses don't qualify";
        } else if (ctx.courtByCourt) {
          sev = "P1";
          why = "same page says the court decides / acceptance varies";
        }
      } else if (kind === "court-approved") {
        if (onNq || /court discretion|court program|point reduction|insurance discount/i.test(st)) {
          sev = onNq ? "P0" : "P1";
          why = `"court-approved" where the state's status is "${st}" (no court approval list for these courses)`;
        } else if (page.state === "sitewide") {
          sev = "P1";
          why = `generic "court-approved" claim; site's own pages say online courses don't deliver the benefit in ${[...ctx.nq].join(", ")}`;
        }
      } else if (kind === "availability") {
        if (onNq) {
          sev = "P1";
          why = "\"available in all 50 states\" on a card on a page that says these courses don't qualify here";
        } else {
          sev = "P2";
          why = `availability claim; site's own pages say online courses don't deliver the benefit in ${[...ctx.nq].join(", ")}`;
        }
      }
      if (!sev) continue;
      coverageBuf.push({
        url: page.url, state: page.state, check: "5-coverage-claims", severity: sev,
        excerpt: excerpt(sent, re), detail: `Coverage claim (${kind}): ${why}.`, source: page.source, fix: "data",
      });
    }
  }
}

function check6(url: string, state: string, main: string, kf: { label: string; value: string }[], source: string) {
  // missing-space joins at React text boundaries
  const seen = new Set<string>();
  const joins: string[] = [];
  const re = /([A-Za-z0-9.)])<!-- -->([A-Za-z(])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(main))) {
    const before = toText(main.slice(Math.max(0, m.index - 120), m.index + 1)).split("\n").pop() ?? "";
    const after = toText(main.slice(m.index + m[0].length - 1, m.index + 80)).split("\n")[0] ?? "";
    const joined = `${before.split(" ").slice(-3).join(" ")}${after.split(" ").slice(0, 4).join(" ")}`;
    // Prose join only: a word of 2+ letters on both sides (skips "option"+"s", "#1"+"Visit").
    if (!/[A-Za-z]{2}[.)]?$/.test(before) || !/^\(?[A-Za-z]{2}/.test(after)) continue;
    const key = joined.replace(/^.*? /, "");
    if (seen.has(key)) continue;
    seen.add(key);
    joins.push(joined);
  }
  if (joins.length) {
    // one finding per page: the joins on a page share one template cause
    add({
      url, state, check: "6-template-residue", severity: "P2",
      excerpt: joins.map((j) => `"${j}"`).join(" / ").split(" ").slice(0, 24).join(" "),
      detail: `${joins.length} missing-space join(s) at JSX text boundaries (the source has the space; the rendered HTML does not).`,
      source: SRC.join, fix: "template",
    });
  }
  // camel joins inside data strings, e.g. "Department ofDriver Services", "2026.The"
  const text = toText(main);
  for (const mm of text.matchAll(/\b(?:of|and|the|for|to|in|at|by)[A-Z][a-z]+\b|[a-z]{3}\.[A-Z][a-z]{2,}/g)) {
    const idx = mm.index ?? 0;
    const token = (/\S*$/.exec(text.slice(Math.max(0, idx - 60), idx))?.[0] ?? "") + (/^\S*/.exec(text.slice(idx))?.[0] ?? "");
    if (/www\.|\.(?:com|net|org|gov|php|html?)\b/i.test(token)) continue;
    const key = `camel|${mm[0]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const line = text.split("\n").find((l) => l.includes(mm[0])) ?? mm[0];
    add({
      url, state, check: "6-template-residue", severity: "P2",
      excerpt: excerpt(line, new RegExp(mm[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
      detail: "Missing-space join inside a data string.", source, fix: "data",
    });
  }
  // Key Facts cells truncated mid-citation
  for (const f of kf) {
    const v = f.value.trim();
    const opens = (v.match(/\(/g) ?? []).length;
    const closes = (v.match(/\)/g) ?? []).length;
    if (opens !== closes || /(?:§\s*|,|;|:|\(|…|\.\.\.|\b(?:and|or|the|of|under|per|see|by|to|with|a|an|including|excludes?|O\.C\.G\.A\.?|Va\. Code|Stat\.?))$/i.test(v)) {
      add({
        url, state, check: "6-template-residue", severity: "P2",
        excerpt: `${f.label}: ${excerpt(v, undefined, 20)}`, detail: "Key Facts cell looks truncated (unbalanced parenthesis or ends mid-citation).",
        source: f.label === "Eligibility" ? SRC.kfEligibility : SRC.kfOther, fix: "data",
      });
    }
  }
  // dangling sentences: prose paragraphs ending without terminal punctuation
  for (const p of main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
    if (/<a\b[^>]*>[^<]*<\/a>\s*$/.test(p[1].trim())) continue; // ends in a link (a CTA line)
    const t = inline(p[1]);
    if (t.length < 60 || t.split(" ").length < 12) continue;
    if (/[.!?:;)"”'’%…*]$/.test(t)) continue;
    if (/→$|Read (?:full )?review|Visit|Enroll|^(?:Citations?|Sources?|Best for|Our take):/i.test(t)) continue;
    // only a paragraph that stops on a function word is mid-sentence (taglines and
    // eligibility fragments legitimately end without a period)
    if (!/\b(?:at|the|of|to|and|or|for|in|on|with|by|from|a|an|is|are|under|per|see|via|than|that|which|your)$/i.test(t)) continue;
    add({
      url, state, check: "6-template-residue", severity: "P2",
      excerpt: excerpt(t.split(" ").slice(-24).join(" ")), detail: "Paragraph ends mid-sentence (no terminal punctuation).",
      source, fix: "data",
    });
  }
}

function check6Counts(sp: StatePage) {
  const text = toText(sp.main);
  const dir = sp.tables.find((t) => t.headers.some((h) => /^license/i.test(h)));
  const dirRows = dir ? dir.rows.filter((r) => r.cells.length >= 2).length : 0;
  const cmpRows = sp.tables.filter((t) => t.headers.some((h) => /final exam/i.test(h))).reduce((n, t) => n + t.rows.length, 0);
  const firstCmp = sp.tables.find((t) => t.headers.some((h) => /final exam/i.test(h)));
  const m1 = /Comparing (\d+) reviewed options?/.exec(text);
  if (m1 && parseInt(m1[1], 10) !== sp.cards.length) {
    add({
      url: sp.url, state: sp.slug, check: "6-template-residue", severity: "P2",
      excerpt: m1[0], detail: `Hero count ${m1[1]} but ${sp.cards.length} cards render.`, source: SRC.hero, fix: "template",
    });
  }
  const m2 = /^(\d+) [^\n]*? compared on price/m.exec(text);
  if (m2 && cmpRows && parseInt(m2[1], 10) !== cmpRows) {
    add({
      url: sp.url, state: sp.slug, check: "6-template-residue", severity: "P2",
      excerpt: excerpt(m2[0]), detail: `Hero says ${m2[1]} compared; comparison tables render ${cmpRows} rows.`, source: SRC.hero, fix: "template",
    });
  }
  const m3 = /Compare the (\d+) [^\n]*?we reviewed/.exec(text);
  if (m3 && firstCmp && parseInt(m3[1], 10) !== firstCmp.rows.length) {
    add({
      url: sp.url, state: sp.slug, check: "6-template-residue", severity: "P2",
      excerpt: m3[0], detail: `Heading says ${m3[1]}; table renders ${firstCmp.rows.length} rows.`, source: SRC.hero, fix: "template",
    });
  }
  if (m3 && parseInt(m3[1], 10) !== sp.cards.length && sp.cards.length) {
    add({
      url: sp.url, state: sp.slug, check: "6-template-residue", severity: "P2",
      excerpt: m3[0], detail: `Heading says ${m3[1]} reviewed; ${sp.cards.length} review cards render.`, source: SRC.hero, fix: "template",
    });
  }
  void dirRows; // directory count is covered by check 4
}

function check7(sp: StatePage, section: string | undefined, llmsUrl: string) {
  if (!section) {
    add({
      url: llmsUrl, state: sp.slug, check: "7-llms", severity: "P2",
      excerpt: `(no "## ${sp.name}" section)`, detail: "State page has no llms-full section.", source: SRC.llms, fix: "template",
    });
    return;
  }
  const pageAll = sp.surfaces.map((s) => s.text).join("\n");
  const kfDis = sp.kf.find((f) => f.label === "Ticket dismissal")?.value ?? "";
  const kfCls: DClass | null = kfDis ? (/^\s*no\b/i.test(kfDis) ? "NO" : /^\s*yes\b/i.test(kfDis) ? "YES" : "COND") : null;
  const sents = sentences(section.replace(/\*\*/g, ""));
  for (const s of sents) {
    if (/\?$/.test(s)) continue;
    const c = dismissClass(s);
    if ((c === "YES" && kfCls === "NO") || (c === "NO" && kfCls === "YES")) {
      add({
        url: llmsUrl, state: sp.slug, check: "7-llms", severity: "P0",
        excerpt: excerpt(s, /dismiss/i), detail: `llms-full dismissal ${c}; live page Key Facts: "${kfDis}".`, source: SRC.llms, fix: "data",
      });
    }
  }
  // frequency windows in llms that the live page never states
  const pageW = new Set(sentences(pageAll).flatMap(freqWindows));
  const seenW = new Set<string>();
  for (const s of sents) {
    if (/\b(nonmoving|non-moving|mature|55|senior|insurance|discount|cdl|commercial|dui|refresher|PJC|prayer for judgment|failure to yield|mandated|required|triggered|household)\b/i.test(s)) continue;
    if (/\bnot once\b/i.test(s)) continue;
    for (const w of freqWindows(s)) {
      if (pageW.size && !pageW.has(w) && !seenW.has(w)) {
        seenW.add(w);
        add({
          url: llmsUrl, state: sp.slug, check: "7-llms", severity: "P1",
          excerpt: excerpt(s, /once/i), detail: `llms-full says ${w}; live page states ${[...pageW].join("/")}.`, source: SRC.llms, fix: "data",
        });
      }
    }
  }
  // hours
  const kfLen = sp.kf.find((f) => f.label === "Course length")?.value ?? "";
  const base = hourHits(kfLen);
  if (base.length) {
    const seenH = new Set<number>();
    for (const s of sents) {
      for (const h of hourHits(s)) {
        if (h.secondary || base.some((b) => overlaps(b, h)) || seenH.has(h.lo)) continue;
        seenH.add(h.lo);
        add({
          url: llmsUrl, state: sp.slug, check: "7-llms", severity: "P1",
          excerpt: excerpt(s, /hours?/i), detail: `llms-full says ${h.raw}; live page Key Facts course length "${kfLen}".`, source: SRC.llms, fix: "data",
        });
      }
    }
  }
  // benefit: llms "insurance discount only" vs page status, and price floor
  const lp = /from \$([\d.]+) to \$([\d.]+)/.exec(section);
  const kfCost = /from \$([\d.]+)/.exec(sp.kf.find((f) => f.label === "Typical cost")?.value ?? "");
  if (lp && kfCost && Math.abs(parseFloat(lp[1]) - parseFloat(kfCost[1])) > 0.005) {
    add({
      url: llmsUrl, state: sp.slug, check: "7-llms", severity: "P1",
      excerpt: excerpt(/\*\*Course prices:\*\*[^\n]*/.exec(section)?.[0].replace(/\*\*/g, "") ?? lp[0], /from \$/),
      detail: `llms-full price floor $${lp[1]}; live page Key Facts "Typical cost" from $${kfCost[1]}.`, source: SRC.llms, fix: "data",
    });
  }
}

// ───────────────────────── deployment info (best effort) ─────────────────────────

type DeployInfo = {
  prodId: string | null;
  prodCreated: string | null;
  prodSha: string | null;
  prodSource: string | null;
  mainHead: string | null;
  failures: { id: string; at: string; sha: string | null; error: string }[];
  notes: string[];
};

/** Run a CLI; returns stdout + stderr (the vercel CLI prints its tables to stderr), or null. */
function sh(cmd: string, args: string[], allowNonZero = false): string | null {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 180000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error || (r.status !== 0 && !allowNonZero)) return null;
  return `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
}
/** stdout only (for JSON). */
function shOut(cmd: string, args: string[]): string | null {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 180000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) return null;
  return r.stdout ?? "";
}

function deployInfo(): DeployInfo {
  const info: DeployInfo = { prodId: null, prodCreated: null, prodSha: null, prodSource: null, mainHead: null, failures: [], notes: [] };
  if (!DEPLOY_INFO) {
    info.notes.push("deployment lookup skipped (--no-deploy-info)");
    return info;
  }
  const head = shOut("gh", ["api", `repos/${REPO}/commits/main`, "--jq", ".sha"]);
  info.mainHead = head?.trim() || null;
  if (!info.mainHead) info.notes.push("main HEAD: gh CLI unavailable or not authenticated");

  const insp = sh("vercel", ["inspect", SITE.replace("https://", ""), "--scope", VERCEL_SCOPE]);
  if (insp) {
    info.prodId = /\bid\s+(dpl_\w+)/.exec(insp)?.[1] ?? null;
    info.prodCreated = /created\s+([^\n[]+)/.exec(insp)?.[1]?.trim() ?? null;
  } else info.notes.push("production deployment: vercel CLI unavailable or not logged in");

  if (info.prodId) {
    const raw = shOut("vercel", ["api", `/v13/deployments/${info.prodId}`, "--scope", VERCEL_SCOPE]);
    try {
      const j = raw ? JSON.parse(raw) : null;
      const meta = j?.meta ?? {};
      info.prodSha = meta["githubCommitSha"] ?? null;
      info.prodSource = meta["deployHookName"] ? `deploy hook "${meta["deployHookName"]}"` : j?.source ?? null;
    } catch {
      info.notes.push("could not parse vercel api deployment JSON");
    }
  }

  // failed production deployments (last 21 days) from GitHub deployment statuses
  const deps = shOut("gh", ["api", `repos/${REPO}/deployments?environment=Production&per_page=10`, "--jq", ".[] | [.id, .sha] | @tsv"]);
  const since = Date.now() - 21 * 86400000;
  const seen = new Set<string>();
  for (const line of (deps ?? "").trim().split("\n").filter(Boolean)) {
    const [id, sha] = line.split("\t");
    const st = shOut("gh", [
      "api", "--paginate", `repos/${REPO}/deployments/${id}/statuses?per_page=100`,
      "--jq", '.[] | select(.state=="failure" or .state=="error") | [.created_at, .target_url, .log_url] | @tsv',
    ]);
    for (const row of (st ?? "").trim().split("\n").filter(Boolean)) {
      const [at, target, logUrl] = row.split("\t");
      if (Date.parse(at) < since) continue;
      const dpl = /\/(\w{20,})$/.exec(logUrl || "")?.[1] ?? /https:\/\/([^/]+)/.exec(target || "")?.[1] ?? target;
      const key = `${at.slice(0, 16)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      let error = "";
      let idArg = dpl.startsWith("dpl_") || dpl.includes(".") ? dpl : `dpl_${dpl}`;
      const meta = sh("vercel", ["inspect", idArg, "--scope", VERCEL_SCOPE], true);
      idArg = /\bid\s+(dpl_\w+)/.exec(meta ?? "")?.[1] ?? idArg;
      // `inspect --logs` exits non-zero for an errored deployment, so keep its output
      const logs = sh("vercel", ["inspect", idArg, "--logs", "--scope", VERCEL_SCOPE], true);
      if (logs) {
        error = logs
          .split("\n")
          .filter((l) => /Error|exited with/.test(l) && !/warn|Read more|^\s*status\b/i.test(l))
          .map((l) => l.replace(/^\S+Z\s+/, "").trim())
          .filter((l, i, a) => a.indexOf(l) === i)
          .slice(0, 4)
          .join(" | ");
      }
      info.failures.push({ id: idArg, at, sha, error });
    }
  }
  return info;
}

// ───────────────────────── report ─────────────────────────

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const SEV_ORDER: Record<Severity, number> = { P0: 0, P1: 1, P2: 2 };
const CHECKS: Check[] = ["1-card-gating", "2-one-answer", "3-card-labels", "4-directories", "5-coverage-claims", "6-template-residue", "7-llms"];

// ───────────────────────── main ─────────────────────────

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const dep = deployInfo(); // before the fetch, so the snapshot is tied to the deployment it was taken from
  const startedAt = new Date().toISOString();
  console.log(`P0 sweep ${RUN_DATE} — fetching ${SITE}/sitemap.xml (scratch: ${SCRATCH})`);
  const sm = await fetchOne(`${SITE}/sitemap.xml`);
  const sitemapUrls = [...sm.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/\/$/, "") || SITE);
  const urls = [...new Set([...sitemapUrls.map((u) => (u === SITE ? `${SITE}/` : u)), `${SITE}/llms.txt`, `${SITE}/llms-full.txt`])];
  console.log(`${sitemapUrls.length} sitemap URLs + llms files → ${urls.length} fetches`);
  const pages = await fetchAll(urls);
  const finishedAt = new Date().toISOString();
  if (dep.prodId) {
    const after = /\bid\s+(dpl_\w+)/.exec(sh("vercel", ["inspect", SITE.replace("https://", ""), "--scope", VERCEL_SCOPE]) ?? "")?.[1];
    if (after && after !== dep.prodId) dep.notes.push(`production alias moved from ${dep.prodId} to ${after} during the fetch; re-run for a clean snapshot`);
  }

  const slugs = new Set(STATE_LIST.map((s) => s.slug));
  const nameOf = new Map(STATE_LIST.map((s) => [s.slug, s.name] as const));
  const llmsFull = pages.get("/llms-full.txt")?.body ?? "";
  const llmsTxt = pages.get("/llms.txt")?.body ?? "";
  const llmsBy = llmsSections(llmsFull);
  const llmsUrl = `${SITE}/llms-full.txt`;

  // non-200s
  for (const f of pages.values()) {
    if (f.status !== 200) {
      add({ url: f.url, state: "sitewide", check: "6-template-residue", severity: "P1", excerpt: `HTTP ${f.status}`, detail: "Sitemap URL does not return 200.", source: SRC.other, fix: "template" });
    }
  }

  // build state pages
  const statePages: StatePage[] = [];
  for (const f of pages.values()) {
    const slug = f.path.replace(/^\//, "");
    if (!slugs.has(slug) || f.status !== 200) continue;
    const main = mainOf(f.body);
    const rulesSec = h2Sections(main).find((s) => /Traffic School Rules/i.test(s.heading));
    const status = rulesSec ? (/Online Status<\/h3>\s*<\/div>\s*<p[^>]*>([^<]*)</.exec(rulesSec.html)?.[1] ?? "") : "";
    const sp: StatePage = {
      slug, name: nameOf.get(slug) ?? slug, url: f.url, fetched: f, main, text: toText(main),
      status: decode(status), kf: keyFacts(main), cards: parseCards(main), tables: parseTables(main),
      sections: h2Sections(main), surfaces: buildSurfaces(slug, f.url, f.body, main), noQualify: false,
    };
    statePages.push(sp);
  }
  statePages.sort((a, b) => a.slug.localeCompare(b.slug));

  // states where the site itself says the self-serve online course doesn't deliver
  const nq = new Set<string>();
  for (const sp of statePages) {
    if (/Court program only|In-person only/i.test(sp.status)) nq.add(sp.slug);
    const allText = sp.surfaces.map((s) => s.text).join("\n");
    if (/not valid for [^.]*?(point|dismiss)|national courses listed below are shown for reference only/i.test(allText)) nq.add(sp.slug);
  }
  const statusBy = new Map(statePages.map((s) => [s.slug, s.status] as const));

  for (const sp of statePages) {
    sp.noQualify = nq.has(sp.slug);
    const topicPages = [...pages.values()].filter((f) => f.path.startsWith(`/${sp.slug}/`) && f.status === 200);
    const extra: Surface[] = [];
    for (const tp of topicPages) extra.push(...topicSurfaces(tp.url, tp.body));
    const llmsSec = llmsBy.get(sp.name);
    if (llmsSec) extra.push({ name: "llms-full section", url: llmsUrl, text: llmsSec.replace(/\*\*/g, ""), source: SRC.llms });

    check1(sp);
    check2(sp, extra);
    check3(sp);
    check4(sp);
    const courtByCourt = /court[- ]by[- ]court|court decides|court determines|court'?s discretion|decided by the court/i.test(sp.surfaces.map((s) => s.text).join("\n"));
    check5({ url: sp.url, state: sp.slug, text: sp.surfaces.map((s) => s.text).join("\n"), source: "Notion States DB fields (see surface)" }, { nq, status: statusBy, courtByCourt });
    for (const c of sp.cards)
      check5({ url: sp.url, state: sp.slug, text: c.text, source: `${SRC.cardText} (card: ${c.name})` }, { nq, status: statusBy, courtByCourt });
    check6(sp.url, sp.slug, sp.main, sp.kf, "Notion States DB (text field rendered on the page)");
    check6Counts(sp);
    check7(sp, llmsSec, llmsUrl);

    // topic pages: tracker links + residue + coverage
    for (const tp of topicPages) {
      const tmain = mainOf(tp.body);
      const trackers = (tmain.match(/href="https:\/\/track\.trafficschoolpicker\.com[^"]*"/g) ?? []).length;
      if (trackers) {
        add({ url: tp.url, state: sp.slug, check: "1-card-gating", severity: "P1", excerpt: `${trackers} tracker link(s)`, detail: "Question pages are citation-only; tracker link present.", source: SRC.topic, fix: "template" });
      }
      check6(tp.url, sp.slug, tmain, keyFacts(tmain), SRC.topic);
      check5({ url: tp.url, state: sp.slug, text: toText(tmain), source: SRC.topic }, { nq, status: statusBy, courtByCourt });
    }
  }

  // other pages (blog, reviews, schools, methodology, home, about …): coverage + residue
  for (const f of pages.values()) {
    if (f.status !== 200 || /\.txt$|\.xml$/.test(f.path)) continue;
    const seg = f.path.split("/").filter(Boolean);
    if (seg.length && slugs.has(seg[0])) continue; // state + topic pages done above
    const main = mainOf(f.body);
    const src = f.path.startsWith("/blog/") ? SRC.blog.replace("<slug>", seg[1] ?? "") : f.path.startsWith("/reviews/") ? SRC.review : `app${f.path === "/" ? "" : f.path}/page.tsx`;
    check5({ url: f.url, state: "sitewide", text: toText(main), source: src }, { nq, status: statusBy, courtByCourt: false });
    check6(f.url, "sitewide", main, keyFacts(main), src);
  }

  // llms.txt + llms-full sitewide text
  check5({ url: `${SITE}/llms.txt`, state: "sitewide", text: llmsTxt, source: SRC.llmsTxt }, { nq, status: statusBy, courtByCourt: false });
  const llmsStateList = [...llmsTxt.matchAll(/^- \[[^\]]+\]\(https:\/\/www\.trafficschoolpicker\.com\/([a-z-]+)\)/gm)].map((m) => m[1]).filter((s) => slugs.has(s));
  const llmsHeader = /## State pages \(([^)]*)\)/.exec(llmsTxt)?.[1];
  if (llmsHeader && /all 50/.test(llmsHeader) && new Set(llmsStateList).size !== 50) {
    add({
      url: `${SITE}/llms.txt`, state: "sitewide", check: "7-llms", severity: "P2",
      excerpt: `## State pages (${llmsHeader})`, detail: `Heading says all 50 states; list has ${new Set(llmsStateList).size} state links.`, source: SRC.llmsTxt, fix: "template",
    });
  }
  const llmsSchools = llmsFull.split(/\n# TrafficSchoolPicker\.com — School Reviews/)[1] ?? "";
  check5({ url: llmsUrl, state: "sitewide", text: llmsSchools.replace(/\*\*/g, ""), source: SRC.llms }, { nq, status: statusBy, courtByCourt: false });

  // coverage claims: the same card / template sentence repeats on dozens of pages, so
  // one finding per (claim, severity) lists the pages; a single-page claim stays as is.
  const covGroups = new Map<string, Finding[]>();
  for (const f of coverageBuf) {
    const k = `${f.severity}|${f.excerpt}|${f.detail}`;
    covGroups.set(k, [...(covGroups.get(k) ?? []), f]);
  }
  for (const list of covGroups.values()) {
    const paths = [...new Set(list.map((f) => f.url.replace(SITE, "") || "/"))];
    const states = new Set(list.map((f) => f.state));
    if (paths.length === 1) {
      add(list[0]);
      continue;
    }
    add({
      ...list[0],
      state: states.size === 1 ? list[0].state : "sitewide",
      detail: `${list[0].detail} Repeated on ${paths.length} pages: ${paths.slice(0, 12).join(", ")}${paths.length > 12 ? ", …" : ""}.`,
    });
  }

  // dedupe identical findings
  const uniq = new Map<string, Finding>();
  for (const f of findings) uniq.set(`${f.url}|${f.check}|${f.severity}|${f.excerpt}|${f.detail}`, f);
  const all = [...uniq.values()].sort(
    (a, b) => a.state.localeCompare(b.state) || SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.check.localeCompare(b.check) || a.url.localeCompare(b.url)
  );

  // ───── sanity assertions ─────
  const has = (pred: (f: Finding) => boolean) => all.some(pred);
  const sanity: { name: string; ok: boolean; quote: string }[] = [];
  const q = (pred: (f: Finding) => boolean) => {
    const f = all.find(pred);
    return f ? `[${f.severity} ${f.check}] ${f.excerpt} — ${f.detail}` : "(not found)";
  };
  {
    const p = (f: Finding) => f.state === "washington-dc" && f.check === "1-card-gating" && f.severity === "P0" && /DriveSafe/.test(f.detail) && /I Drive Safely/.test(f.detail) && /Enroll Now/.test(f.detail);
    sanity.push({ name: "/washington-dc renders school cards + trackers while saying national courses are not valid", ok: has(p), quote: q(p) });
  }
  {
    const hoursCards = all.filter((f) => f.state === "georgia" && f.check === "3-card-labels" && /6 hours \(classroom\)/.test(f.excerpt)).length;
    const junk = ["Active Program List", "Certificate ID", "Search", "Georgia Department of"].every((j) => has((f) => f.state === "georgia" && f.check === "4-directories" && f.excerpt.startsWith(j)));
    const dups = ["DI000777", "DI002372", "DI002039", "DI002112"].every((l) => has((f) => f.state === "georgia" && f.check === "4-directories" && f.excerpt.startsWith(l)));
    sanity.push({
      name: "/georgia: 5 cards '6 hours (classroom)'; junk directory rows; duplicate licenses DI000777/DI002372/DI002039/DI002112",
      ok: hoursCards >= 5 && junk && dups,
      quote: `${hoursCards} card-hours findings, e.g. ${q((f) => f.state === "georgia" && f.check === "3-card-labels" && /classroom/.test(f.excerpt))}; junk rows ${junk ? "all found" : "MISSING"}; duplicate licences ${dups ? "all found" : "MISSING"}`,
    });
  }
  {
    const p = (f: Finding) => f.state === "virginia" && f.check === "2-one-answer" && /allows either dismissal/.test(f.excerpt);
    const exam = ["DriveSafe Online", "Traffic School Online", "GoToTrafficSchool"].every((n) => has((f) => f.state === "virginia" && f.check === "3-card-labels" && f.excerpt.startsWith(`${n}:`) && /exam/i.test(f.excerpt)));
    sanity.push({
      name: "/virginia: True Cost 'allows either dismissal' vs Key Facts 'does not dismiss'; 'No final exam' cards vs table Final exam: Yes",
      ok: has(p) && exam,
      quote: `${q(p)}; exam contradictions ${exam ? "found for DriveSafe Online, Traffic School Online, GoToTrafficSchool" : "MISSING"}`,
    });
  }
  {
    const a = has((f) => f.state === "virginia" && f.check === "4-directories" && f.excerpt.startsWith("http://---"));
    const b = has((f) => f.state === "virginia" && f.check === "4-directories" && f.excerpt.startsWith("Reset all"));
    const agg = all.find((f) => f.state === "virginia" && f.check === "4-directories" && /rows named as URLs/.test(f.excerpt));
    const n = agg ? parseInt(/^(\d+)/.exec(agg.excerpt)?.[1] ?? "0", 10) : 0;
    sanity.push({ name: "/virginia directory rows 'http://---', 'Reset all' and ~50 bare-URL names", ok: a && b && n >= 40, quote: `http://--- ${a ? "found" : "MISSING"}; Reset all ${b ? "found" : "MISSING"}; ${agg?.excerpt ?? "no URL aggregate"}` });
  }

  // ───── deployment + cache header info ─────
  const cacheCounts = new Map<string, number>();
  for (const f of pages.values()) cacheCounts.set(f.cache || "(none)", (cacheCounts.get(f.cache || "(none)") ?? 0) + 1);
  const prodCreatedMs = dep.prodCreated ? Date.parse(dep.prodCreated.replace(/\s*\(.*\)$/, "")) : NaN;
  const dplCounts = new Map<string, number>();
  for (const f of pages.values()) if (f.dpl) dplCounts.set(f.dpl, (dplCounts.get(f.dpl) ?? 0) + 1);
  const stale = [...pages.values()].filter((f) => {
    if (f.cache === "STALE") return true;
    if (dep.prodId && f.dpl) return f.dpl !== dep.prodId; // rendered by another deployment
    const age = parseInt(f.age || "0", 10);
    // 15-minute tolerance: a build prerenders pages a few minutes around "created"
    return !Number.isNaN(prodCreatedMs) && Date.parse(f.fetchedAt) - age * 1000 < prodCreatedMs - 15 * 60000;
  });

  // ───── write CSV ─────
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const csvPath = path.join(OUT_DIR, `p0-sweep-${RUN_DATE}.csv`);
  const header = ["url", "state", "check", "severity", "excerpt", "detail", "source", "fix_type"];
  const csv = [header.join(",")]
    .concat(all.map((f) => [f.url, f.state, f.check, f.severity, f.excerpt, f.detail, f.source, f.fix].map(csvCell).join(",")))
    .join("\n");
  fs.writeFileSync(csvPath, csv + "\n");

  // ───── write markdown ─────
  const count = (c: Check, s: Severity) => all.filter((f) => f.check === c && f.severity === s).length;
  const md: string[] = [];
  md.push(`# Production P0 sweep, ${RUN_DATE} (read-only)`, "");
  md.push("Generated by `npx tsx scripts/audit-p0-sweep.ts`. Nothing on the site or in Notion was changed.", "");
  md.push("## Header", "");
  md.push(`| Item | Value |`, `|---|---|`);
  md.push(`| Production deployment | ${dep.prodId ?? "not determined"}${dep.prodCreated ? ` (created ${dep.prodCreated})` : ""}${dep.prodSource ? `, triggered by ${dep.prodSource}` : ""} |`);
  md.push(`| Production commit | ${dep.prodSha ?? "not determined"} |`);
  md.push(`| main HEAD | ${dep.mainHead ?? "not determined"} |`);
  md.push(`| Match | ${dep.prodSha && dep.mainHead ? (dep.prodSha === dep.mainHead ? "YES, production is main HEAD" : "NO") : "not determined"} |`);
  md.push(
    `| Failed production deployments (last 21 days) | ${
      dep.failures.length
        ? dep.failures.map((f) => `${f.id} at ${f.at}, commit ${f.sha?.slice(0, 7) ?? "?"}: ${f.error || "error text not retrieved"}`).join("<br>")
        : "none found in GitHub deployment statuses"
    } |`
  );
  if (dep.failures.length && dep.prodSha && dep.mainHead) {
    md.push(
      `| Merged since the failure but not live? | ${
        dep.prodSha === dep.mainHead
          ? `No. The failed build was ${dep.failures.every((f) => f.sha === dep.prodSha) ? "a rebuild of the same commit that is live now" : "an earlier commit"}; the current production deployment runs main HEAD.`
          : `Yes: production runs ${dep.prodSha.slice(0, 7)}, main HEAD is ${dep.mainHead.slice(0, 7)}.`
      } |`
    );
  }
  if (GMAIL_NOTE) md.push(`| Vercel failure email | ${GMAIL_NOTE} |`);
  md.push(`| Fetch window | ${startedAt} to ${finishedAt} (UTC), direct from ${SITE}, browser User-Agent |`);
  {
    const paths = [...pages.keys()];
    const nState = statePages.length;
    const nTopic = paths.filter((p) => p.split("/").filter(Boolean).length === 2 && slugs.has(p.split("/")[1])).length;
    const nBlog = paths.filter((p) => p.startsWith("/blog/")).length;
    const nRev = paths.filter((p) => p.startsWith("/reviews/")).length;
    md.push(
      `| Pages fetched | ${pages.size}: ${sitemapUrls.length} sitemap URLs (${nState} state pages, ${nTopic} topic pages, ${nBlog} blog posts, ${nRev} review pages, ${sitemapUrls.length - nState - nTopic - nBlog - nRev} other incl. /schools, /reviews, /methodology) + llms.txt + llms-full.txt |`
    );
  }
  md.push(`| x-vercel-cache | ${[...cacheCounts.entries()].map(([k, v]) => `${k}: ${v}`).join(", ")} |`);
  md.push(
    `| HTML rendered by (the \`?dpl=\` id in each page's asset URLs) | ${[...dplCounts.entries()].map(([k, v]) => `${k}${k === dep.prodId ? " (current production)" : ""}: ${v} pages`).join(", ") || "not found"} |`
  );
  md.push(
    `| Cached copies older than the production deployment | ${
      stale.length
        ? `${stale.length} page(s) whose HTML was rendered by a different deployment than the one now aliased (or x-vercel-cache STALE): ${stale
            .map((f) => `${f.path} (${f.cache}, age ${f.age}s, ${f.dpl || "no dpl"})`)
            .join(", ")}`
        : "none (every cached copy is younger than the current deployment)"
    } |`
  );
  if (RUN_NOTE) dep.notes.push(RUN_NOTE);
  if (dep.notes.length) md.push(`| Notes | ${dep.notes.join("; ")} |`);
  md.push("");

  md.push("## Counts by check and severity", "");
  md.push("| Check | P0 | P1 | P2 | Total |", "|---|---|---|---|---|");
  for (const c of CHECKS) {
    const t = count(c, "P0") + count(c, "P1") + count(c, "P2");
    md.push(`| ${c} | ${count(c, "P0")} | ${count(c, "P1")} | ${count(c, "P2")} | ${t} |`);
  }
  const tot = (s: Severity) => all.filter((f) => f.severity === s).length;
  md.push(`| **All** | **${tot("P0")}** | **${tot("P1")}** | **${tot("P2")}** | **${all.length}** |`, "");
  md.push("Severity: P0 = could lead someone to buy a course that doesn't deliver, or states a false legal fact. P1 = contradiction unlikely to cost the reader money. P2 = cosmetic.", "");
  md.push("The sweep shows where two surfaces disagree. It does not decide which legal answer is right.", "");

  md.push("## Sanity cases", "");
  for (const s of sanity) md.push(`- ${s.ok ? "CAUGHT" : "MISSED"}: ${s.name}`, `  - ${s.quote}`);
  md.push("");

  md.push("## How the checks read the page", "");
  md.push(
    "- Card gating: cards render when `showComparison` is true (lib/state-page-data.ts: status is one of the four online statuses, No Partner Offer is off, and the state has tier-1 schools). There is no Qualifies For Benefit field in the code: the only mention is a comment in app/[state]/page.tsx, so per-school qualification gates nothing. The /washington-dc exception in app/[state]/page.tsx suppresses only the Product JSON-LD, not the cards. /michigan has no cards because its Online Model is \"Court program only\". A page with cards is P0 when its own text says the listed / online courses don't deliver the page's benefit, and P1 when the text rules online courses out of one benefit (e.g. a classroom-only point credit) while the cards are sold for another (court dismissal).",
    "- One answer: each sentence on each surface that mentions dismissal is classed YES (the course itself is credited with a dismissal, or a flat \"Yes\"), NO, or conditional (court-by-court, may, discretion). YES against NO is P0; YES against a conditional Key Facts value is P1; NO against conditional is not flagged. Frequencies (\"once every N\") and hour values are compared across surfaces, ignoring clearly secondary programs (mature driver, DUI, CDL, certificate delivery times).",
    "- Surfaces: Key Facts rows, meta description, H1, status banners, intro paragraph, method statement, True Cost block, Rules & Requirements, visible FAQ, FAQPage JSON-LD, cards, the state's llms-full section and every topic page under the state.",
    "- Without Notion credentials the sweep cannot read a program record; where a string's source is named, it comes from reading the template code in this repo.",
    ""
  );

  md.push("## Findings by state", "");
  const byState = new Map<string, Finding[]>();
  for (const f of all) byState.set(f.state, [...(byState.get(f.state) ?? []), f]);
  const order = [...byState.keys()].sort((a, b) => (a === "sitewide" ? 1 : b === "sitewide" ? -1 : a.localeCompare(b)));
  for (const st of order) {
    const list = byState.get(st)!;
    const n = (s: Severity) => list.filter((f) => f.severity === s).length;
    md.push(`### ${st === "sitewide" ? "Sitewide / non-state pages" : nameOf.get(st) ?? st} (P0 ${n("P0")}, P1 ${n("P1")}, P2 ${n("P2")})`, "");
    const sp = statePages.find((s) => s.slug === st);
    if (sp) md.push(`Status: ${sp.status || "n/a"}. Cache: ${sp.fetched.cache}, age ${sp.fetched.age || 0}s, x-vercel-id ${sp.fetched.vercelId}.`, "");
    md.push("| Sev | Check | Page | Excerpt | Detail | Fix |", "|---|---|---|---|---|---|");
    const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
    for (const f of list) md.push(`| ${f.severity} | ${f.check} | ${f.url.replace(SITE, "") || "/"} | ${cell(f.excerpt)} | ${cell(f.detail)} | ${f.fix} |`);
    md.push("");
  }

  md.push("## Appendix: fetch log", "");
  md.push("| Path | HTTP | x-vercel-cache | age (s) | rendered by (dpl) | x-vercel-id |", "|---|---|---|---|---|---|");
  for (const f of [...pages.values()].sort((a, b) => a.path.localeCompare(b.path))) md.push(`| ${f.path} | ${f.status} | ${f.cache} | ${f.age} | ${f.dpl || "n/a"} | ${f.vercelId} |`);
  md.push("");

  const mdPath = path.join(OUT_DIR, `p0-sweep-${RUN_DATE}.md`);
  fs.writeFileSync(mdPath, md.join("\n"));

  console.log(`\nFindings: ${all.length} (P0 ${tot("P0")}, P1 ${tot("P1")}, P2 ${tot("P2")})`);
  for (const c of CHECKS) console.log(`  ${c.padEnd(20)} P0 ${count(c, "P0")}  P1 ${count(c, "P1")}  P2 ${count(c, "P2")}`);
  console.log(`Wrote ${mdPath} and ${csvPath}`);
  for (const s of sanity) console.log(`${s.ok ? "✓" : "✗"} sanity: ${s.name}`);
  if (RUN_SANITY && sanity.some((s) => !s.ok)) {
    console.error("Sanity case missed: fix the check, not the expectation.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
