/**
 * CRAWL-HEALTH REPORT (Package: crawl-efficiency, 2026-09).
 *
 * Informational — never fails the build. Prints a short table into every deploy log
 * so the crawl-efficiency question has a standing answer instead of another
 * investigation. Runs as the trailing `postbuild` step (after the hard guards) and
 * is also runnable on demand: `npx tsx scripts/crawl-health.ts`.
 *
 * Reports:
 *   1. Sitemap URLs that prerendered 200 at the canonical host (artifact-based,
 *      same signal as verify-sitemap-200).
 *   2. Bare-apex references anywhere in generated output (should be 0 — the one
 *      canonical host is www).
 *   3. Sitemap lastmod summary (distinct dates + newest) — a stable, content-driven
 *      lastmod set shows few distinct dates that only move on real edits.
 *   4. Best-effort TTFB sample across the seven page types against production
 *      (measures the currently-live deploy; skipped if the network is unavailable).
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const BASE_URL = "https://www.trafficschoolpicker.com";
const APEX = "https://trafficschoolpicker.com"; // bare apex; www variant won't match this
const APP_DIR = join(process.cwd(), ".next", "server", "app");

function artifactBase(path: string): string {
  const clean = path.replace(/\/+$/, "");
  return clean === "" ? "index" : clean.replace(/^\//, "");
}

function readSitemap(): { locs: string[]; lastmods: string[] } {
  const p = join(APP_DIR, "sitemap.xml.body");
  if (!existsSync(p)) return { locs: [], lastmods: [] };
  const xml = readFileSync(p, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].trim());
  return { locs, lastmods };
}

function count200(locs: string[]): { ok: number; bad: string[] } {
  let ok = 0;
  const bad: string[] = [];
  for (const loc of locs) {
    const base = artifactBase(loc.startsWith(BASE_URL) ? loc.slice(BASE_URL.length) : loc);
    const html = join(APP_DIR, `${base}.html`);
    const meta = join(APP_DIR, `${base}.meta`);
    let status = 200;
    if (!existsSync(html)) status = 0;
    else if (existsSync(meta)) {
      try { status = JSON.parse(readFileSync(meta, "utf8"))?.status ?? 200; } catch { status = -1; }
    }
    if (status === 200) ok++;
    else bad.push(`${status || "MISSING"} ${loc}`);
  }
  return { ok, bad };
}

// Walk the generated HTML + the public llms files for bare-apex references.
function apexRefs(): number {
  let n = 0;
  const scan = (file: string) => {
    try {
      const txt = readFileSync(file, "utf8");
      n += (txt.match(new RegExp(APEX.replace(/[.]/g, "\\.") + "(?!\\w)", "g")) || []).length;
    } catch { /* ignore */ }
  };
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir)) {
      const f = join(dir, e);
      const s = statSync(f);
      if (s.isDirectory()) walk(f);
      else if (f.endsWith(".html") || f.endsWith(".body")) scan(f);
    }
  };
  walk(APP_DIR);
  for (const f of ["public/llms.txt", "public/llms-full.txt"]) scan(join(process.cwd(), f));
  return n;
}

async function ttfbSample(): Promise<string[]> {
  const paths = ["", "california", "california/is-traffic-school-worth-it", "reviews", "reviews/aceable", "schools", "blog/traffic-school-vs-paying-ticket"];
  const out: string[] = [];
  for (const p of paths) {
    const url = `${BASE_URL}/${p}`;
    try {
      const t0 = Date.now();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "tsp-crawl-health" } });
      await r.arrayBuffer();
      clearTimeout(timer);
      const ms = Date.now() - t0;
      out.push(`  ${String(r.status)} ${String(ms).padStart(5)}ms  /${p}`);
    } catch {
      out.push(`  ---  (unreachable)  /${p}`);
    }
  }
  return out;
}

async function main() {
  const { locs, lastmods } = readSitemap();
  const { ok, bad } = count200(locs);
  const apex = apexRefs();
  const distinctDates = [...new Set(lastmods)].sort();
  const newest = distinctDates[distinctDates.length - 1] ?? "n/a";

  console.log("\n─── crawl-health report ───────────────────────────────────");
  console.log(`sitemap URLs 200 (canonical host) : ${ok}/${locs.length}`);
  if (bad.length) for (const b of bad.slice(0, 10)) console.log(`  non-200: ${b}`);
  console.log(`bare-apex refs in generated output: ${apex}   (want 0)`);
  console.log(`sitemap lastmod: ${distinctDates.length} distinct date(s), newest ${newest}`);
  console.log("TTFB sample (live prod; previous deploy):");
  try {
    for (const line of await ttfbSample()) console.log(line);
  } catch {
    console.log("  (skipped — network unavailable during build)");
  }
  console.log("───────────────────────────────────────────────────────────\n");
}

// Never fail the build — this is a report.
main().catch((e) => console.log("crawl-health report skipped:", e?.message ?? e));
