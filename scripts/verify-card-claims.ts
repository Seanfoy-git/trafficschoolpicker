/**
 * CARD-CLAIMS GUARD (postbuild, deploy-blocking). 25 Nov 2026.
 *
 * Improv phoned to say we had their facts wrong. The audit that followed found
 * state-page cards calling schools "DMV-approved" where the school's own site
 * says it is not, star ratings in card copy that had drifted from the live
 * header, and state exam rules ("2 attempts") stamped onto every school.
 * lib/school-approvals.ts filters all of that at render time; this guard proves
 * the build obeys it. For every built state page, every reviewed card:
 *   (a) no card renders for a pair the school itself disclaims;
 *   (b) a school not on the official list we hold carries no "-approved" badge
 *       and no approval wording in its take, pros, cons or best-for;
 *   (c) no card copy carries a star rating or review count;
 *   (d) no card copy carries an exam-attempt count.
 * Fix at the source (the Notion variant, or data/school-state-approvals.json via
 * scripts/check-school-approvals.ts), never in the built file.
 *
 *   npx tsx scripts/verify-card-claims.ts [buildDir]   (default .next/server/app)
 */
import fs from "fs";
import path from "path";
import { STATE_LIST } from "../lib/state-utils";
import { APPROVAL_CLAIM, EXAM_ATTEMPTS, REVIEW_STAT, isHiddenPair, mayClaimApproval } from "../lib/school-approvals";

function textOf(html: string): string {
  return html
    .replace(/<!--.*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Each card's slug, its copy elements, and whether it shows the approval badge. */
export function cardsIn(html: string): { slug: string; copy: { kind: string; text: string }[]; badge: boolean }[] {
  const starts = [...html.matchAll(/data-card-school="([^"]+)"/g)];
  return starts.map((m, i) => {
    const seg = html.slice(m.index!, i + 1 < starts.length ? starts[i + 1].index! : m.index! + 40000);
    const copy = [...seg.matchAll(/data-card-copy="([a-z-]+)"[^>]*>([\s\S]*?)<\/(?:p|li|span)>/g)].map((c) => ({
      kind: c[1],
      text: textOf(c[2]),
    }));
    return { slug: m[1], copy, badge: seg.includes("data-card-approval") };
  });
}

function main() {
  const buildDir = process.argv[2] ?? path.join(".next", "server", "app");
  const problems: string[] = [];
  let pages = 0, cards = 0;
  for (const st of STATE_LIST) {
    const file = path.join(buildDir, `${st.slug}.html`);
    if (!fs.existsSync(file)) continue;
    pages++;
    for (const card of cardsIn(fs.readFileSync(file, "utf8"))) {
      cards++;
      const where = `/${st.slug} ${card.slug}`;
      if (isHiddenPair(card.slug, st.code)) problems.push(`(a) ${where}: card renders but the school disclaims approval here`);
      const claimsOk = mayClaimApproval(card.slug, st.code);
      if (!claimsOk && card.badge) problems.push(`(b) ${where}: "-approved" badge on a school not on the official list`);
      for (const c of card.copy) {
        if (!claimsOk && APPROVAL_CLAIM.test(c.text)) problems.push(`(b) ${where} ${c.kind}: approval claim "${c.text}"`);
        if (REVIEW_STAT.test(c.text)) problems.push(`(c) ${where} ${c.kind}: review stat "${c.text}"`);
        if (EXAM_ATTEMPTS.test(c.text)) problems.push(`(d) ${where} ${c.kind}: exam attempts "${c.text}"`);
      }
    }
  }
  if (pages === 0) {
    console.error(`verify-card-claims: no state pages found in ${buildDir}`);
    process.exit(1);
  }
  if (problems.length) {
    console.error(`verify-card-claims: ${problems.length} problem(s) across ${cards} cards on ${pages} state pages`);
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log(`verify-card-claims: OK (${cards} cards on ${pages} state pages)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) main();
