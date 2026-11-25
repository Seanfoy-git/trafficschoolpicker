/**
 * DIRECTORY HEALTH REPORT (monthly, after scrape:dmv). 25 Nov 2026.
 *
 * The monthly scrape step runs with continue-on-error so one dead regulator site
 * can't block the refresh. The cost: when a state's scraper broke, the run still
 * went green and nobody heard. Virginia's list was last written 1 May (its pager
 * changed); New York and Nevada 1 June; Texas 1 August; Arizona, Georgia, North
 * Dakota, Rhode Island and Tennessee 13 August. The approval gate
 * (lib/school-approvals) reads those lists, so a stale list mislabels real
 * approvals.
 *
 * This report reads the Directory DB and this run's scrape summary
 * (DIRECTORY_SCRAPE_SUMMARY, written by scripts/lib/scraper-utils) and flags:
 *   - STALE: a state whose newest "Date Scraped" is older than STALE_DAYS;
 *   - FAILED THIS RUN: a state whose scrape this run was shrunk or empty, with no
 *     healthy scrape of the same state in the run.
 * It writes markdown (--out) for the workflow's GitHub issue and exits 1 when
 * anything is flagged, so the run goes red and GitHub emails the owner.
 *
 *   npx tsx scripts/report-directory-health.ts [--out directory-health.md] [--no-fail]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs";
import { makeNotionClient } from "./lib/notion-client";

const STALE_DAYS = 35;
const OUT = argValue("--out");
const NO_FAIL = process.argv.includes("--no-fail");

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

type Run = { state: string; code: string; scraped: number; valid: number; held: number; status: string; delisted?: number; date: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
async function directoryByState(): Promise<Map<string, { rows: number; inactive: number; newest: string | null }>> {
  const notion = makeNotionClient();
  const db = process.env.NOTION_DIRECTORY_DB!;
  const map = new Map<string, { rows: number; inactive: number; newest: string | null }>();
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({ database_id: db, start_cursor: cursor, page_size: 100 });
    for (const p of res.results) {
      const props = p.properties;
      const state = props["State"]?.select?.name;
      if (!state) continue;
      const date: string | null = props["Date Scraped"]?.date?.start ?? null;
      const inactive = (props["Licence Status"]?.select?.name ?? "").toLowerCase() === "inactive";
      const s = map.get(state) ?? { rows: 0, inactive: 0, newest: null };
      s.rows++;
      if (inactive) s.inactive++;
      if (date && (!s.newest || date > s.newest)) s.newest = date;
      map.set(state, s);
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return map;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso + "T00:00:00Z").getTime()) / 86_400_000);
}

async function main() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DIRECTORY_DB) {
    console.error("report-directory-health: NOTION_TOKEN and NOTION_DIRECTORY_DB are required");
    process.exit(1);
  }
  const runs: Run[] = process.env.DIRECTORY_SCRAPE_SUMMARY && fs.existsSync(process.env.DIRECTORY_SCRAPE_SUMMARY)
    ? fs.readFileSync(process.env.DIRECTORY_SCRAPE_SUMMARY, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l))
    : [];
  const healthy = new Set(runs.filter((r) => r.status === "ok").map((r) => r.state));
  const failed = runs.filter((r) => r.status !== "ok" && !healthy.has(r.state));

  const dir = await directoryByState();
  const stale = [...dir.entries()]
    .filter(([, s]) => !s.newest || daysSince(s.newest) > STALE_DAYS)
    .sort((a, b) => (a[1].newest ?? "").localeCompare(b[1].newest ?? ""));

  const lines: string[] = [];
  lines.push(`Directory health check, ${new Date().toISOString().slice(0, 10)}. The official school lists feed the state-page directories and the approval gate (data/school-state-approvals.json).`, "");
  if (failed.length) {
    lines.push(`### Failed this run (${failed.length})`, "", "Nothing was written for these. Fix the scraper, then re-run the Monthly Data Refresh.", "");
    for (const r of failed) {
      lines.push(`- **${r.state}**: ${r.status}, ${r.valid} usable of ${r.scraped} scraped against ${r.held} we hold`);
    }
    lines.push("");
  }
  if (stale.length) {
    lines.push(`### Not refreshed in over ${STALE_DAYS} days (${stale.length})`, "");
    for (const [state, s] of stale) {
      lines.push(`- **${state}**: last scraped ${s.newest ?? "never"}${s.newest ? ` (${daysSince(s.newest)} days)` : ""}, ${s.rows} rows`);
    }
    lines.push("");
  }
  const delisted = runs.filter((r) => (r.delisted ?? 0) > 0);
  if (delisted.length) {
    lines.push("### Marked Inactive this run (no longer on the regulator's list)", "");
    for (const r of delisted) lines.push(`- ${r.state}: ${r.delisted}`);
    lines.push("");
  }
  const flagged = failed.length + stale.length;
  if (!flagged) lines.push("All state lists refreshed within the window. ✅");
  lines.push("", "_Regenerated by the Monthly Data Refresh. Closes itself when every state is fresh._");

  const md = lines.join("\n");
  console.log(md);
  if (OUT) fs.writeFileSync(OUT, md + "\n");
  if (flagged && !NO_FAIL) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
