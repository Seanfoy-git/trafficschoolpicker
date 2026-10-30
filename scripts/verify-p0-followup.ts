/**
 * Acceptance checks for the P0 follow-up (Tasks 1-3, 30 Oct 2026), from raw HTML.
 * Run after the Notion --apply runs and a rebuild:
 *
 *   npm run build && npm start &                       # local rebuild
 *   npx tsx scripts/verify-p0-followup.ts --base=http://localhost:3000 [--task=1,2,3]
 *
 * A protected preview works too: set VERCEL_AUTOMATION_BYPASS_SECRET and pass
 * --base=<preview URL>. Exits 1 if any check fails.
 */
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
const BASE = (arg("base") ?? "http://localhost:3000").replace(/\/$/, "");
const TASKS = new Set((arg("task") ?? "1,2,3").split(","));
const headers: Record<string, string> = { "user-agent": "Mozilla/5.0 (verify-p0-followup)" };
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const VA_DISMISSAL =
  "Not by itself. The clinic earns a 5-point credit or, if your insurer offers one, a premium reduction. You choose one, once every two years. Virginia law bars a judge from reducing or dismissing a charge because of a clinic only for CDL holders and commercial-vehicle offenses (Va. Code § 46.2-505(B)); for everyone else it's the judge's call.";

let failures = 0;
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

async function get(path: string): Promise<string> {
  const r = await fetch(BASE + path, { headers, redirect: "follow" });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.text();
}
/** Visible text: scripts/styles out, React's text-split comments joined, entities decoded. */
function visible(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}
const around = (t: string, i: number, w = 80) => t.slice(Math.max(0, i - w), i + w);
function hits(t: string, needle: RegExp): string[] {
  const out: string[] = [];
  for (const m of t.matchAll(new RegExp(needle.source, needle.flags.includes("g") ? needle.flags : needle.flags + "g"))) out.push(around(t, m.index ?? 0));
  return out;
}
/** Every page path in the sitemap. */
async function sitemapPaths(): Promise<string[]> {
  const sm = await get("/sitemap.xml");
  return [...new Set([...sm.matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map((m) => m[1] || "/"))];
}
/** Top-level pages (state pages among them). */
async function stateSlugs(): Promise<string[]> {
  return (await sitemapPaths()).map((p) => p.match(/^\/([a-z-]+)$/)?.[1]).filter((s): s is string => !!s);
}

async function task1() {
  console.log("\n== Task 1: Virginia and New Jersey program records");
  const va = visible(await get("/virginia"));
  // The Virginia parts of the llms files: its llms-full section and its llms.txt lines.
  const full = await get("/llms-full.txt");
  const vaSection = full.match(/\n## Virginia\b[\s\S]*?(?=\n## |$)/)?.[0] ?? "";
  const vaLines = (await get("/llms.txt")).split("\n").filter((l) => /Virginia/.test(l) && !/West Virginia/.test(l)).join("\n");
  const llms = `${vaSection}\n${vaLines}`;
  ok(vaSection.length > 0, "llms-full.txt has a Virginia section");
  const kf = va.match(/Ticket dismissal\s+(.{0,400})/);
  ok(!!kf && kf[1].startsWith(VA_DISMISSAL), "/virginia Key Facts 'Ticket dismissal' row is the 1c text");
  ok(va.includes(`Does it dismiss your ticket? ${VA_DISMISSAL}`), "/virginia banner shows the 1c text");
  for (const s of ["never dismisses", "allows either dismissal", "accepted statewide", "lasts 3 years", "Insurance discount only"]) {
    const onPage = hits(va, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    const inLlms = hits(llms, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    ok(onPage.length === 0 && inLlms.length === 0, `"${s}" absent from /virginia and the llms files${onPage.length + inLlms.length ? `: ${[...onPage, ...inLlms].slice(0, 3).join(" … ")}` : ""}`);
  }
  const nj = visible(await get("/new-jersey"));
  ok(!/Insurance discount only/i.test(nj), "/new-jersey has no 'Insurance discount only'");
  const njkf = nj.match(/Ticket dismissal\s+(.{0,120})/);
  ok(!!njkf && /^No\b/.test(njkf[1]) && /point/i.test(njkf[1].slice(0, 60)), `/new-jersey Ticket dismissal row says No and names the point credit (${njkf?.[1].slice(0, 60)})`);
  const elsewhere = hits(full.replace(vaSection, ""), /accepted statewide/i);
  if (elsewhere.length) console.log(`INFO  "accepted statewide" outside Virginia in llms-full.txt (not part of this task): ${elsewhere.map((h) => h.trim().slice(0, 100)).join(" … ")}`);
  const mo = visible(await get("/missouri"));
  const moAt = mo.indexOf("Does it dismiss your ticket?");
  console.log(`INFO  /missouri banner: ${moAt >= 0 ? around(mo, moAt, 120) : "(fixed point-reduction copy)"}`);
}

async function task2() {
  console.log("\n== Task 2: card and blog text");
  const allowed = /National providers often list all 50 states in their marketing/i;
  const pages = [...(await sitemapPaths()), "/llms.txt", "/llms-full.txt"];
  let bad: string[] = [];
  for (const p of pages) {
    let t: string;
    try { t = p.startsWith("/llms") ? await get(p) : visible(await get(p)); } catch { continue; }
    for (const h of hits(t, /all 50 states/i)) {
      const okLine = allowed.test(h) && (p === "/maine" || p === "/new-hampshire" || p.startsWith("/llms"));
      if (!okLine) bad.push(`${p}: …${h}…`);
    }
  }
  bad = [...new Set(bad)];
  ok(bad.length === 0, `no "all 50 states" outside the Maine / New Hampshire marketing lines${bad.length ? `\n      ${bad.slice(0, 10).join("\n      ")}` : ""}`);
  for (const s of ["/virginia", "/new-jersey"]) {
    const t = visible(await get(s));
    ok(!/No final exam/i.test(t), `${s} has no "No final exam" pro${/No final exam/i.test(t) ? `: ${hits(t, /No final exam/i)[0]}` : ""}`);
  }
  const blog = visible(await get("/blog/best-online-traffic-schools-2026")) + (await get("/blog/best-online-traffic-schools-2026"));
  for (const s of ["Every school on this list is verified as court-approved", "Every school on this list is independently verified as court-approved", "is the most widely accepted online traffic school in the country"]) {
    ok(!blog.includes(s), `blog: "${s}" gone (page and meta)`);
  }
}

async function task3() {
  console.log("\n== Task 3: directories");
  let checked = 0;
  for (const s of await stateSlugs()) {
    let raw: string;
    try { raw = await get(`/${s}`); } catch { continue; }
    const v = raw.replace(/<!-- -->/g, "");
    const head = v.match(/All <span data-count="directory">(\d+)<\/span>/);
    const table = [...v.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]).find((t) => t.includes("License #"));
    if (!head || !table) continue;
    checked++;
    const rows = (table.match(/<tr/g) ?? []).length - 1;
    ok(Number(head[1]) === rows, `/${s} directory header ${head[1]} = ${rows} rows`);
  }
  console.log(`INFO  ${checked} directories checked`);
}

async function main() {
  console.log(`verify-p0-followup against ${BASE}`);
  if (TASKS.has("1")) await task1();
  if (TASKS.has("2")) await task2();
  if (TASKS.has("3")) await task3();
  console.log(`\n${failures ? `${failures} check(s) FAILED` : "all checks passed"}`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
