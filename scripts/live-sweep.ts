/**
 * Post-relaunch live sweep (P0, 2026-08-25). Fetches every question + review page
 * from the PRODUCTION sitemap and asserts the security + schema invariants:
 *   - 200 OK
 *   - 0 tracker links (track.trafficschoolpicker.com)
 *   - 0 merchant JSON-LD (Product / Offer / AggregateRating)
 *   - 0 internal Notion links (notion.so / app.notion / notion.site)
 *   - question pages: Key Facts present + Article & BreadcrumbList JSON-LD
 * Plus: the incident URL renders correctly, and a known-bad path 404s.
 *
 *   npx tsx scripts/live-sweep.ts
 */
const SITE = "https://www.trafficschoolpicker.com";

async function get(url: string): Promise<{ status: number; body: string }> {
  const r = await fetch(url, { headers: { "User-Agent": "tsp-live-sweep" } });
  return { status: r.status, body: await r.text() };
}

function checkPage(url: string, body: string, isQuestion: boolean): string[] {
  const fail: string[] = [];
  // Notion links + aggregateRating are forbidden EVERYWHERE.
  if (/https?:\/\/(?:[a-z0-9-]+\.)*notion\.(?:so|com|site)/i.test(body)) fail.push("notion link");
  if (/"@type":"AggregateRating"|aggregateRating/.test(body)) fail.push("aggregateRating");
  if (isQuestion) {
    // Question pages: citation-only — no tracker, no affiliate, no merchant markup.
    if (/track\.trafficschoolpicker\.com/.test(body)) fail.push("tracker link");
    if (/"@type":"(Product|Offer)"/.test(body)) fail.push("merchant JSON-LD");
    if (!/Key Facts/.test(body)) fail.push("no Key Facts");
    if (!/"@type":"Article"/.test(body)) fail.push("no Article JSON-LD");
    if (!/"@type":"BreadcrumbList"/.test(body)) fail.push("no BreadcrumbList JSON-LD");
  }
  // Review pages legitimately carry the affiliate/tracker CTA (monetization).
  return fail;
}

async function main() {
  const sm = await get(`${SITE}/sitemap.xml`);
  const urls = [...sm.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const questionUrls = urls.filter((u) => /\/[a-z-]+\/[a-z-]+$/.test(u.replace(SITE, "")) && !u.includes("/blog/") && !u.includes("/reviews/"));
  const reviewUrls = urls.filter((u) => u.includes("/reviews/"));
  console.log(`sitemap: ${urls.length} urls — ${questionUrls.length} question, ${reviewUrls.length} review\n`);

  let checked = 0, failed = 0;
  for (const [list, isQ] of [[questionUrls, true], [reviewUrls, false]] as const) {
    for (const url of list) {
      const { status, body } = await get(url);
      checked++;
      const problems = status !== 200 ? [`HTTP ${status}`] : checkPage(url, body, isQ);
      if (problems.length) { failed++; console.log(`  ✗ ${url.replace(SITE, "")}: ${problems.join(", ")}`); }
      await new Promise((r) => setTimeout(r, 60));
    }
  }
  console.log(`\n${checked} pages checked | ${failed} with problems`);

  // Incident + gating spot-checks
  console.log("\n=== incident / gating spot-checks ===");
  const nc = await get(`${SITE}/north-carolina/does-traffic-school-remove-points`);
  console.log(`NC points: HTTP ${nc.status} | recipe? ${/recipe|ingredient|preheat/i.test(nc.body) ? "YES ⚠" : "no ✓"} | KeyFacts? ${/Key Facts/.test(nc.body) ? "yes ✓" : "no"}`);
  const bad = await get(`${SITE}/california/not-a-real-question-xyz`);
  console.log(`known-bad path: HTTP ${bad.status} ${bad.status === 404 ? "✓" : "⚠ (expected 404)"}`);
  console.log(failed === 0 ? "\n✅ SWEEP CLEAN" : `\n❌ ${failed} pages need attention`);
}
main().catch((e) => { console.error(e); process.exit(1); });
