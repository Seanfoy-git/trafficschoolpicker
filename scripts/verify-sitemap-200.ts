/**
 * BUILD-TIME SITEMAP-200 GUARD (Package: crawl-paths, 2026-09).
 *
 * A sitemap that serves 404s costs sitemap trust, and sitemap trust is a direct
 * input into the "Discovered – currently not indexed" backlog. This guard asserts
 * that every URL in the GENERATED sitemap prerendered to a real 200 page.
 *
 * How (no network — deterministic against the build output): for each <loc> in
 * .next/server/app/sitemap.xml.body, map the path to its prerender artifact under
 * .next/server/app and fail if the .html is missing OR the .meta sidecar carries a
 * status >= 400. A build-time notFound() writes `"status": 404` into that .meta
 * (see _not-found.meta), which is exactly the Florida `/how-long-does-traffic-
 * school-take` soft-404 that shipped in the sitemap while serving a 404.
 *
 * Runs as `postbuild`; a non-zero exit fails the Vercel deploy. Fail-closed: if the
 * sitemap body can't be read, that's a build failure (never ship unverifiable).
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE_URL = "https://www.trafficschoolpicker.com";
const APP_DIR = join(process.cwd(), ".next", "server", "app");

// URL path -> artifact base under .next/server/app ("/", "/x", "/x/y").
function artifactBase(path: string): string {
  const clean = path.replace(/\/+$/, ""); // drop trailing slash
  return clean === "" ? "index" : clean.replace(/^\//, "");
}

function main() {
  const smPath = join(APP_DIR, "sitemap.xml.body");
  if (!existsSync(smPath)) {
    console.error(`\n❌ SITEMAP-200 GUARD: ${smPath} not found — cannot verify. Build failed.\n`);
    process.exit(1);
  }
  const xml = readFileSync(smPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (locs.length === 0) {
    console.error("\n❌ SITEMAP-200 GUARD: sitemap has zero URLs — cannot verify. Build failed.\n");
    process.exit(1);
  }

  const failures: string[] = [];
  for (const loc of locs) {
    const path = loc.startsWith(BASE_URL) ? loc.slice(BASE_URL.length) : loc;
    const base = artifactBase(path);
    const html = join(APP_DIR, `${base}.html`);
    const meta = join(APP_DIR, `${base}.meta`);

    if (!existsSync(html)) {
      failures.push(`MISSING  ${loc}  (no prerender at app/${base}.html — route would 404)`);
      continue;
    }
    if (existsSync(meta)) {
      try {
        const status = JSON.parse(readFileSync(meta, "utf8"))?.status;
        if (typeof status === "number" && status >= 400) {
          failures.push(`${status}  ${loc}  (prerendered as a ${status} — soft error in sitemap)`);
        }
      } catch {
        failures.push(`UNREADABLE-META  ${loc}  (app/${base}.meta could not be parsed)`);
      }
    }
  }

  if (failures.length) {
    console.error(`\n❌ SITEMAP-200 GUARD FAILED — ${failures.length}/${locs.length} sitemap URL(s) are not 200:`);
    for (const f of failures) console.error(`  ${f}`);
    console.error("  A sitemap must not serve non-200s. Build failed. No deploy.\n");
    process.exit(1);
  }

  console.log(`✅ sitemap-200 guard OK — all ${locs.length} sitemap URLs prerendered 200.`);
}

main();
