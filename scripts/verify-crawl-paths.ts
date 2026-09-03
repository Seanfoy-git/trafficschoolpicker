/**
 * BUILD-TIME CRAWL-PATH GUARD (Package: crawl-paths, 2026-09).
 *
 * Answers, mechanically: is every sitemap URL reachable from `/` by following
 * SERVER-RENDERED <a href> anchors (no JS execution)? This is the guard that would
 * have caught the reviews cluster shipping orphaned, and it keeps a 50-state
 * expansion from silently stranding pages.
 *
 * How (no network): BFS from `/` over the prerendered HTML in .next/server/app,
 * following same-origin <a href> links to other prerendered pages. Compare the
 * reachable set against the sitemap URL set. Report click-depth for every sitemap
 * URL, flag anything deeper than three clicks, and FAIL the build on any orphan
 * (a sitemap URL not reachable from the homepage).
 *
 * Runs as `postbuild`; a non-zero exit fails the Vercel deploy. Fail-closed: if the
 * sitemap or the homepage artifact can't be read, that's a build failure.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE_URL = "https://www.trafficschoolpicker.com";
const APP_DIR = join(process.cwd(), ".next", "server", "app");
const MAX_DEPTH_OK = 3;

// Normalize any href/loc to a canonical same-origin path, or null if off-site /
// non-navigational (mailto, tel, #fragment, external host).
function toPath(href: string): string | null {
  let h = href.trim();
  if (!h || h.startsWith("#") || h.startsWith("mailto:") || h.startsWith("tel:")) return null;
  if (h.startsWith(BASE_URL)) h = h.slice(BASE_URL.length) || "/"; // bare origin = home
  else if (/^https?:\/\//i.test(h)) return null; // external
  if (!h.startsWith("/")) return null;            // relative fragments we don't resolve
  h = h.split("#")[0].split("?")[0];              // drop hash + query
  h = h.replace(/\/+$/, "");                      // drop trailing slash
  return h === "" ? "/" : h;
}

// path -> artifact base under .next/server/app.
function artifactBase(path: string): string {
  return path === "/" ? "index" : path.replace(/^\//, "");
}

function htmlFor(path: string): string | null {
  const f = join(APP_DIR, `${artifactBase(path)}.html`);
  return existsSync(f) ? readFileSync(f, "utf8") : null;
}

function anchorsIn(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]);
}

function main() {
  const smPath = join(APP_DIR, "sitemap.xml.body");
  if (!existsSync(smPath)) {
    console.error(`\n❌ CRAWL-PATH GUARD: ${smPath} not found. Build failed.\n`);
    process.exit(1);
  }
  const sitemap = new Set(
    [...readFileSync(smPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => toPath(m[1]))
      .filter((p): p is string => !!p)
  );
  if (!htmlFor("/")) {
    console.error("\n❌ CRAWL-PATH GUARD: no homepage artifact (app/index.html). Build failed.\n");
    process.exit(1);
  }

  // BFS from "/" over server-rendered anchors to other prerendered pages.
  const depth = new Map<string, number>([["/", 0]]);
  const queue: string[] = ["/"];
  while (queue.length) {
    const cur = queue.shift()!;
    const html = htmlFor(cur);
    if (!html) continue;
    const d = depth.get(cur)!;
    for (const href of anchorsIn(html)) {
      const p = toPath(href);
      if (!p || depth.has(p)) continue;
      if (!htmlFor(p)) continue; // only traverse real prerendered pages
      depth.set(p, d + 1);
      queue.push(p);
    }
  }

  const orphans = [...sitemap].filter((p) => !depth.has(p)).sort();
  const reachableSitemap = [...sitemap].filter((p) => depth.has(p));
  const deep = reachableSitemap.filter((p) => (depth.get(p) ?? 0) > MAX_DEPTH_OK).sort();

  // Click-depth report for every sitemap URL, deepest first.
  const byDepth = [...sitemap].sort((a, b) => (depth.get(b) ?? 99) - (depth.get(a) ?? 99) || a.localeCompare(b));
  console.log("\nClick-depth from / for all sitemap URLs (deepest first):");
  for (const p of byDepth) {
    const d = depth.get(p);
    console.log(`  ${d === undefined ? "∞ ORPHAN" : `d${d}`}  ${p}`);
  }
  const hist = new Map<number, number>();
  for (const p of reachableSitemap) hist.set(depth.get(p)!, (hist.get(depth.get(p)!) ?? 0) + 1);
  console.log(
    `\nReachable ${reachableSitemap.length}/${sitemap.size} | depth histogram: ` +
      [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([d, n]) => `d${d}:${n}`).join(" ")
  );
  if (deep.length) {
    console.log(`\n⚠ ${deep.length} URL(s) deeper than ${MAX_DEPTH_OK} clicks:`);
    for (const p of deep) console.log(`  d${depth.get(p)}  ${p}`);
  }

  if (orphans.length) {
    console.error(`\n❌ CRAWL-PATH GUARD FAILED — ${orphans.length} sitemap URL(s) unreachable from /:`);
    for (const p of orphans) console.error(`  ORPHAN  ${p}`);
    console.error("  Every sitemap URL must be reachable from the homepage via server-rendered anchors.");
    console.error("  Build failed. No deploy.\n");
    process.exit(1);
  }

  console.log(`\n✅ crawl-path guard OK — all ${sitemap.size} sitemap URLs reachable from / (≤ ${MAX_DEPTH_OK} clicks: ${sitemap.size - deep.length}).`);
}

main();
