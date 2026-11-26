/**
 * School × state APPROVAL CHECK (25 Nov 2026).
 *
 * Why: the state-card generator treated every school shown on a state page as
 * approved for that state's program. Improv phoned to say we had their facts
 * wrong; the follow-up audit (project doc tsp-site-accuracy-audit-2026-11-25)
 * found cards calling schools "DMV-approved" where the school's OWN site says it
 * is not (DriveSafe Online in NY: "This course is not a New York DMV PIRP
 * course"; Traffic School Online: "is not officially approved in the state of"
 * 14 states). This script records, for every school card that renders on a
 * state page, what the evidence actually says, so the site and the generator
 * can act on it.
 *
 * Evidence, strongest first:
 *   disclaimed  the school's own state page says it is NOT approved for the
 *               program (only the school's own words count here)
 *   resold      the school's state page says the course is another school's
 *               (DriversEd.com: "Provided by our partner company I Drive Safely")
 *   listed      the school (by name or website domain) is on the state's official
 *               list, as rendered in our directory or in the newer recheck file.
 *               Caveat: some directories list a different program (Ohio's lists
 *               drivers ed schools), so "listed" means on the list we hold
 *   claimed     the school's page claims state approval, but no official list we
 *               hold confirms it (our list may be stale or missing: check by hand)
 *   court       no state approval claimed; the school says acceptance is up to the
 *               court ("check with your court", "accepted by most courts")
 *   unchecked   no state page found for the school, or nothing conclusive on it
 *
 * Public sources only (the live site + each school's site), so it runs without
 * Notion secrets. Output: data/school-state-approvals.json (read by
 * lib/school-approvals.ts) and data/school-state-approvals.md (the review list).
 *
 *   npx tsx scripts/check-school-approvals.ts [--base https://www.trafficschoolpicker.com] [--state new-york]
 */
import fs from "fs";
import path from "path";
import { STATE_LIST } from "../lib/state-utils";

const BASE = argValue("--base") ?? "https://www.trafficschoolpicker.com";
const ONLY_STATE = argValue("--state");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const TODAY = new Date().toISOString().slice(0, 10);
const OUT_JSON = path.join("data", "school-state-approvals.json");
const OUT_MD = path.join("data", "school-state-approvals.md");

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// ─── school identities ─────────────────────────────────────

type SchoolId = { name: RegExp; domains: string[]; sitemaps: string[]; partner?: { slug: string; pattern: RegExp } };

const SCHOOLS: Record<string, SchoolId> = {
  aceable: { name: /\baceable\b/i, domains: ["aceable.com"], sitemaps: ["https://www.aceable.com/sitemap.xml"] },
  drivesafeonline: { name: /\bdrive ?safe online\b/i, domains: ["drivesafeonline.org"], sitemaps: ["https://www.drivesafeonline.org/page-sitemap.xml"] },
  driversed: {
    name: /\bdriversed(\.com)?\b/i,
    domains: ["driversed.com"],
    sitemaps: ["https://driversed.com/sitemap.xml"],
    partner: { slug: "idrivesafely", pattern: /provided by our partner company,? I Drive Safely/i },
  },
  trafficschoolonline: { name: /\btraffic school online\b/i, domains: ["trafficschoolonline.com"], sitemaps: ["https://www.trafficschoolonline.com/wp-sitemap-posts-page-1.xml"] },
  gototrafficschool: { name: /\bgo ?to ?traffic ?school\b|\bcyberactive\b/i, domains: ["gototrafficschool.com"], sitemaps: ["https://www.gototrafficschool.com/sitemap.xml"] },
  idrivesafely: { name: /\bi ?drive ?safely\b/i, domains: ["idrivesafely.com"], sitemaps: ["https://www.idrivesafely.com/sitemap.xml"] },
  highwaytrafficschool: { name: /\bhighway traffic school\b/i, domains: ["highwaytrafficschool.com"], sitemaps: ["https://www.highwaytrafficschool.com/sitemap.xml"] },
  improv: { name: /\bimprov\b/i, domains: ["myimprov.com"], sitemaps: ["https://www.myimprov.com/sitemap.xml"] },
  ticketschool: { name: /\bticketschool\b|\bdriver training associates\b/i, domains: ["ticketschool.com"], sitemaps: ["https://ticketschool.com/sitemap.xml"] },
  safe2drive: { name: /\bsafe2drive\b/i, domains: ["safe2drive.com"], sitemaps: ["https://www.safe2drive.com/sitemap.xml"] },
};

// The school's own words. Only these can mark a pair "disclaimed". Each pattern
// captures the state it names, and the pair counts only when that is this state
// exactly ("Washington, D.C." is not Washington; "West Virginia" is not Virginia).
const DISCLAIMS: RegExp[] = [
  /is not officially approved in the state of ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
  /is not currently an approved course provider in ([A-Z][a-z]+(?:,? [A-Z][a-z.]+)*)/,
  /is not (?:a|an) ((?:[A-Z][a-z]+ ){1,2})(?:DMV|MVC|DPS) [A-Za-z ]{0,20}course/,
  /is not approved with the courts for ticket dismissal()/,
];
const CLAIM =
  /\b(?:approved|certified|licensed) by (?:the )?(?:[A-Z][A-Za-z.&]*\s?){1,8}(?:DMV|BMV|MVC|DPS|Department|Division|Commission|Supreme Court|Bureau|Office|Safety Center|TDLR|DHSMV|Secretary of State)\b|\b(?:DMV|BMV|MVC|TDLR|DHSMV|state)[- ]approved\b/;
const COURT =
  /check with your (?:local )?court|permission from your court|accepted by (?:most|many|participating) [a-z ]*courts|approved by (?:most|participating) [A-Za-z ]*courts|court[- ]approved/i;

// ─── fetch helpers ─────────────────────────────────────────

const cache = new Map<string, Promise<string>>();
function get(url: string): Promise<string> {
  if (!cache.has(url)) {
    cache.set(
      url,
      // identity: one school serves a gzip body its headers misdescribe, which
      // makes undici throw mid-stream.
      fetch(url, { headers: { "user-agent": UA, "accept-encoding": "identity" }, redirect: "follow", signal: AbortSignal.timeout(30000) })
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => ""),
    );
  }
  return cache.get(url)!;
}

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
}

function snippet(text: string, m: RegExpMatchArray | null): string {
  if (!m || m.index == null) return "";
  return text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 60).trim();
}

async function sitemapUrls(start: string, depth = 0): Promise<string[]> {
  const xml = await get(start);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  if (/<sitemapindex/i.test(xml) && depth < 2) {
    const nested = await Promise.all(locs.filter((u) => /page|post|product|state|course|sitemap/i.test(u)).slice(0, 12).map((u) => sitemapUrls(u, depth + 1)));
    return nested.flat();
  }
  return locs;
}

const schoolUrlCache = new Map<string, Promise<string[]>>();
function schoolUrls(slug: string): Promise<string[]> {
  if (!schoolUrlCache.has(slug)) {
    schoolUrlCache.set(slug, Promise.all(SCHOOLS[slug].sitemaps.map((s) => sitemapUrls(s))).then((a) => [...new Set(a.flat())]));
  }
  return schoolUrlCache.get(slug)!;
}

/** The school's own pages for this state: course pages first, shortest (hub) first. */
async function schoolStatePages(slug: string, stateSlug: string): Promise<string[]> {
  const urls = await schoolUrls(slug);
  const re = new RegExp(`(^|[/_-])${stateSlug}([/_.-]|$)`, "i");
  // Longer state slugs that contain this one ("west-virginia" for "virginia",
  // "washington-dc" for "washington") must not count as this state's page.
  const longer = STATE_LIST.map((s) => s.slug).filter((s) => s !== stateSlug && s.includes(stateSlug));
  const pathOf = (u: string) => u.split("//")[1]?.split("/").slice(1).join("/").toLowerCase() ?? "";
  const mine = urls.filter((u) => {
    const p = pathOf(u).replace(/_/g, "-");
    return re.test(p) && !longer.some((l) => p.includes(l)) && !(stateSlug === "washington" && /washington-?d-?c|district-of-columbia/.test(p));
  });
  const course = mine.filter((u) => /traffic|defensive|driver-improvement|ticket|point|pirp|court|basic-driver|state\//i.test(u));
  const pool = (course.length ? course : mine).filter((u) => !/mature|senior|insurance-discount|drivers-ed|permit|fleet|espanol|curso/i.test(u));
  return pool.sort((a, b) => a.length - b.length).slice(0, 2);
}

// ─── official lists ────────────────────────────────────────

type ListEntry = { name: string; domain: string | null; source: string };

function directoryFromStatePage(html: string, url: string): ListEntry[] {
  const marks = [...html.matchAll(/data-count="directory"/g)].map((m) => m.index!);
  if (!marks.length) return [];
  let block = html.slice(marks[marks.length - 1]);
  block = block.slice(0, block.indexOf("</section>") > 0 ? block.indexOf("</section>") : undefined);
  const heading = textOf(block.slice(0, block.indexOf("</p>") > 0 ? block.indexOf("</p>") + 4 : 400)).trim().slice(0, 200);
  const rows = [...block.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].slice(1);
  return rows.map((r) => {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => textOf(c[1]).trim());
    const href = [...r[1].matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1])[0];
    return { name: cells[0] ?? "", domain: href ? hostOf(href) : null, source: `${url} (directory: ${heading})` };
  });
}

function hostOf(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function recheckLists(): Map<string, ListEntry[]> {
  const map = new Map<string, ListEntry[]>();
  const files = fs.existsSync("data") ? fs.readdirSync("data").filter((f) => /^directory-recheck-state-lists-.*\.jsonl$/.test(f)).sort() : [];
  for (const f of files) {
    for (const line of fs.readFileSync(path.join("data", f), "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line) as { state?: string; name?: string; website?: string };
        if (!r.state || !r.name) continue;
        const list = map.get(r.state.toLowerCase()) ?? [];
        list.push({ name: r.name, domain: r.website ? hostOf(r.website.trim()) : null, source: `data/${f}` });
        map.set(r.state.toLowerCase(), list);
      } catch { /* skip */ }
    }
  }
  return map;
}

// ─── main ──────────────────────────────────────────────────

type Evidence = { kind: "list" | "disclaim" | "claim" | "court" | "partner" | "page"; text: string; url: string };
type Approval = {
  school: string;
  state: string;
  status: "disclaimed" | "listed" | "resold" | "claimed" | "court" | "unchecked";
  partner?: string;
  evidence: Evidence[];
  checked: string;
};

async function checkPair(slug: string, stateName: string, stateSlug: string, lists: ListEntry[]): Promise<Approval> {
  const id = SCHOOLS[slug];
  const evidence: Evidence[] = [];
  const onList = lists.find((e) => id.name.test(e.name) || (e.domain != null && id.domains.some((d) => e.domain!.endsWith(d))));
  if (onList) evidence.push({ kind: "list", text: onList.name, url: onList.source });

  let disclaimed = false, claimed = false, court = false, partner: string | undefined;
  for (const url of await schoolStatePages(slug, stateSlug)) {
    const text = textOf(await get(url));
    if (text.length < 300) continue;
    evidence.push({ kind: "page", text: `${text.length} chars`, url });
    for (const re of DISCLAIMS) {
      const d = text.match(re);
      const named = d?.[1]?.trim().replace(/[.,\s]+$/, "") ?? "";
      // A disclaimer naming another state (shared template text) doesn't count.
      if (d && (named === "" || named === stateName)) {
        disclaimed = true;
        evidence.push({ kind: "disclaim", text: snippet(text, d), url });
      }
    }
    const p = id.partner ? text.match(id.partner.pattern) : null;
    if (p) { partner = id.partner!.slug; evidence.push({ kind: "partner", text: snippet(text, p), url }); }
    const c = text.match(CLAIM);
    if (c) { claimed = true; evidence.push({ kind: "claim", text: snippet(text, c), url }); }
    const ct = text.match(COURT);
    if (ct) { court = true; evidence.push({ kind: "court", text: snippet(text, ct), url }); }
  }

  // Resale outranks a list match: DriversEd.com is on Ohio's list for drivers ed,
  // but the Ohio defensive driving course it sells is I Drive Safely's.
  const status: Approval["status"] = disclaimed ? "disclaimed" : partner ? "resold" : onList ? "listed" : claimed ? "claimed" : court ? "court" : "unchecked";
  return { school: slug, state: stateSlug, status, ...(partner ? { partner } : {}), evidence, checked: TODAY };
}

async function main() {
  const recheck = recheckLists();
  const results: Record<string, Approval> = {};
  const states = STATE_LIST.filter((s) => !ONLY_STATE || s.slug === ONLY_STATE);
  const prior: Record<string, Approval> = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, "utf8")).pairs ?? {} : {};

  for (const st of states) {
    const url = `${BASE}/${st.slug}`;
    const html = await get(url);
    const cardSlugs = [...html.matchAll(/href="\/reviews\/([a-z0-9-]+)"[^>]*>\s*Read full review/g)].map((m) => m[1]);
    // Re-check every pair already on file too, not only the cards on the page: the
    // gate hides "disclaimed" pairs, so a cards-only run never sees them, drops
    // them, and the next build shows those cards again (caught 25 Nov 2026, when a
    // re-run lost all 17).
    const priorSlugs = Object.keys(prior).filter((k) => k.endsWith(`:${st.code}`)).map((k) => k.split(":")[0]);
    const slugs = [...new Set([...cardSlugs, ...priorSlugs])];
    if (!slugs.length) continue;
    const lists = [...directoryFromStatePage(html, url), ...(recheck.get(st.name.toLowerCase()) ?? [])];
    for (const slug of slugs) {
      if (!SCHOOLS[slug]) {
        console.warn(`  ${st.code} ${slug}: no identity configured, skipped`);
        continue;
      }
      const r = await checkPair(slug, st.name, st.slug, lists);
      results[`${slug}:${st.code}`] = r;
      console.log(`${st.code.padEnd(3)} ${slug.padEnd(22)} ${r.status}${r.partner ? ` (${r.partner})` : ""}`);
    }
  }

  // Merge into the existing file so a --state run updates only that state.
  const pairs = ONLY_STATE ? { ...prior, ...results } : results;
  const sorted = Object.fromEntries(Object.entries(pairs).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(OUT_JSON, JSON.stringify({ generated: TODAY, base: BASE, pairs: sorted }, null, 2) + "\n");

  const byStatus = new Map<string, string[]>();
  for (const [k, v] of Object.entries(sorted)) byStatus.set(v.status, [...(byStatus.get(v.status) ?? []), k]);
  const order = ["disclaimed", "resold", "claimed", "court", "unchecked", "listed"];
  const md = [
    `# School × state approval check (${TODAY})`,
    "",
    "Generated by `scripts/check-school-approvals.ts`. One row per school card that renders on a state page.",
    "`disclaimed` pairs are hidden by lib/school-approvals.ts; every non-`listed` card loses approval wording and the \"-approved\" badge.",
    "",
    ...order.map((s) => `- **${s}**: ${(byStatus.get(s) ?? []).length}`),
    "",
    ...order.flatMap((s) => [
      `## ${s}`,
      "",
      "| Pair | Evidence |",
      "|---|---|",
      ...(byStatus.get(s) ?? []).map((k) => {
        const e = sorted[k].evidence.filter((x) => x.kind !== "page").map((x) => `${x.kind}: "${x.text.replace(/\|/g, "/")}"`).join("<br>");
        const src = sorted[k].evidence.find((x) => x.kind !== "list" && x.kind !== "page")?.url ?? sorted[k].evidence.find((x) => x.kind === "page")?.url ?? "";
        return `| ${k} | ${e || "(nothing conclusive)"}${src ? ` [source](${src})` : ""} |`;
      }),
      "",
    ]),
  ].join("\n");
  fs.writeFileSync(OUT_MD, md);
  console.log("\n" + order.map((s) => `${s}: ${(byStatus.get(s) ?? []).length}`).join(" | "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
