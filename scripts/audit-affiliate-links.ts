/**
 * AUDIT: which school buttons render "Visit Website" instead of "Enroll Now"?
 *
 * Reuses the real resolution logic (getAllSchools / getSchoolPricingForState)
 * so the result matches exactly what the live site renders. Read-only.
 *
 *   npx tsx scripts/audit-affiliate-links.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

// NOTE: lib/notion captures NOTION_SCHOOLS_DB at module-eval time, so it must be
// imported *after* config() runs — use dynamic import inside main(), not a static
// top-level import (which ESM hoists ahead of config()).

// Mirror AffiliateButton / buildAffiliateLink logic exactly.
type Row = {
  school: string;
  slug: string;
  network: string;
  method: string;
  commission: string;
  hasDefaultUrl: boolean;
  partnerSlug: string;
};

function methodOf(trackingMethod: string | null): string {
  return trackingMethod ?? "network";
}

async function main() {
  const { getAllSchools, getSchoolPricingForState } = await import("../lib/notion");
  const { STATE_LIST } = await import("../lib/state-utils");
  const trackerHost = process.env.NEXT_PUBLIC_TRACKER_HOST || "";

  // ── 1. NATIONAL: partners (all rows here are monetizable) missing a default Affiliate URL ──
  const schools = await getAllSchools();
  if (schools.length === 0) {
    console.error("No schools returned — check NOTION_TOKEN / NOTION_SCHOOLS_DB in .env.local");
    process.exit(1);
  }

  const nationalGaps: Row[] = schools
    .filter((s) => !s.affiliateUrl)
    .map((s) => ({
      school: s.name,
      slug: s.slug,
      network: s.affiliateNetwork ?? "—",
      method: methodOf(s.trackingMethod),
      commission: s.commissionRate || "—",
      hasDefaultUrl: false,
      partnerSlug: s.partnerSlug || "",
    }));

  // ── 2. PER-STATE: tier-1 schools that render "Visit Website" on a state grid ──
  // A school renders "Visit Website" when hasAffiliate = !(stateAffiliateUrl || affiliateUrl).
  type StateGap = {
    school: string;
    slug: string;
    state: string;
    method: string;
    network: string;
    partnerSlug: string;
    revenueCaptured: boolean; // direct-method still tracks via tracker host
  };
  const stateGaps: StateGap[] = [];
  const statesChecked: string[] = [];

  for (const st of STATE_LIST) {
    let priced;
    try {
      priced = await getSchoolPricingForState(st.code);
    } catch {
      continue;
    }
    if (priced.length === 0) continue;
    statesChecked.push(st.code);

    for (const s of priced) {
      if (s.tier !== 1) continue; // only tier-1 renders on the state grid
      const networkUrl = s.stateAffiliateUrl || s.affiliateUrl;
      const hasAffiliate = Boolean(networkUrl);
      if (hasAffiliate) continue; // renders "Enroll Now" — fine

      const method = methodOf(s.trackingMethod);
      // direct-method still routes through the tracker if partnerSlug + host exist
      const revenueCaptured =
        method === "direct" && Boolean(s.partnerSlug) && Boolean(trackerHost);
      stateGaps.push({
        school: s.name,
        slug: s.slug,
        state: st.code,
        method,
        network: s.affiliateNetwork ?? "—",
        partnerSlug: s.partnerSlug || "",
        revenueCaptured,
      });
    }
  }

  // ── Report ──
  const lines: string[] = [];
  lines.push("# Affiliate link audit\n");
  lines.push(`Schools scanned (monetizable, shown on site): **${schools.length}**`);
  lines.push(`States with a live pricing grid: **${statesChecked.length}** (${statesChecked.join(", ") || "none"})\n`);

  lines.push("## 1. National default Affiliate URL missing\n");
  lines.push("These schools have no default `Affiliate URL` in the Schools DB. On any page without a state-specific override they render **Visit Website**.\n");
  if (nationalGaps.length === 0) {
    lines.push("_None — every partner has a default Affiliate URL._\n");
  } else {
    lines.push("| School | Network | Method | Commission | Partner Slug |");
    lines.push("|---|---|---|---|---|");
    for (const r of nationalGaps) {
      lines.push(`| ${r.school} | ${r.network} | ${r.method} | ${r.commission} | ${r.partnerSlug || "—"} |`);
    }
    lines.push("");
  }

  // Group per-state gaps by school
  const bySchool = new Map<string, StateGap[]>();
  for (const g of stateGaps) {
    const arr = bySchool.get(g.slug) ?? [];
    arr.push(g);
    bySchool.set(g.slug, arr);
  }

  const critical: string[] = [];
  const ctaBug: string[] = [];
  for (const [, gaps] of bySchool) {
    const g0 = gaps[0];
    const states = gaps.map((g) => g.state).sort().join(", ");
    const row = `| ${g0.school} | ${g0.network} | ${g0.method} | ${gaps.length} | ${states} |`;
    if (gaps.some((g) => g.revenueCaptured)) ctaBug.push(row);
    else critical.push(row);
  }

  lines.push("## 2. 🔴 CRITICAL — losing the click AND the commission\n");
  lines.push("Tier-1 schools on a state grid with no state or default affiliate URL, on a `network`/`coupon_code` method. The button links to the bare website — **no tracking, no commission**.\n");
  if (critical.length === 0) {
    lines.push("_None._\n");
  } else {
    lines.push("| School | Network | Method | # States | States |");
    lines.push("|---|---|---|---|---|");
    lines.push(...critical);
    lines.push("");
  }

  lines.push("## 3. 🟠 CTA BUG — revenue tracked, but weak button + wrong rel\n");
  lines.push("`direct`-method schools with a `partnerSlug`: the click still routes through the tracker (commission captured), but because `hasAffiliate` only checks URL presence, the button shows **Visit Website** instead of **Enroll Now** and drops the `sponsored` rel. Fixable in `AffiliateButton`.\n");
  if (ctaBug.length === 0) {
    lines.push("_None._\n");
  } else {
    lines.push("| School | Network | Method | # States | States |");
    lines.push("|---|---|---|---|---|");
    lines.push(...ctaBug);
    lines.push("");
  }

  const report = lines.join("\n");
  console.log(report);

  const fs = await import("fs");
  fs.writeFileSync("data/affiliate-audit.md", report);
  console.error("\n→ written to data/affiliate-audit.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
