/**
 * Read-only: run the directory validation filter (lib/directory-filter) over
 * every state's raw Directory DB rows and report what it removes, so the
 * scraped data can be corrected at source. Writes nothing.
 *
 *   npx tsx scripts/report-directory-cleaning.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { Client } = await import("@notionhq/client");
  const { cleanDirectory, directoryListLabel } = await import("../lib/directory-filter");
  const { getAllStateSlugs, getStateBySlug } = await import("../lib/state-utils");
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const db = process.env.NOTION_DIRECTORY_DB!;
  const raw: { name: string; state: string; licenseNumber: string; website: string | null; source: string; onlineAvailable: boolean; phone: string; price: number | null; priceSourceUrl: string | null }[] = [];
  let cursor: string | undefined;
  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = await notion.databases.query({ database_id: db, start_cursor: cursor, page_size: 100 });
    for (const p of r.results) {
      const pr = p.properties;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = (x: any) => (x?.title ?? x?.rich_text ?? []).map((t: any) => t.plain_text).join("");
      raw.push({
        name: text(pr["School Name"]),
        state: pr.State?.select?.name ?? text(pr.State),
        licenseNumber: text(pr["License Number"]),
        website: pr.Website?.url ?? null,
        source: pr.Source?.select?.name ?? text(pr.Source) ?? "",
        phone: text(pr.Phone),
        price: pr.Price?.number ?? null,
        priceSourceUrl: text(pr["Price Source URL"]) || pr["Price Source URL"]?.url || null,
        onlineAvailable: !!pr["Online Available"]?.checkbox,
      });
    }
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);

  console.log("state | raw rows | kept | removed | removed by reason | header");
  let total = 0;
  for (const slug of getAllStateSlugs()) {
    const st = getStateBySlug(slug)!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = raw.filter((r) => r.state === st.name) as any[];
    if (!rows.length) continue;
    const { rows: kept, removed } = cleanDirectory(rows);
    total += removed.length;
    const by = new Map<string, number>();
    for (const x of removed) by.set(x.reason, (by.get(x.reason) ?? 0) + 1);
    const label = directoryListLabel(st.name, kept);
    console.log(`${st.name} | ${rows.length} | ${kept.length} | ${removed.length} | ${[...by].map(([k, v]) => `${k} ${v}`).join(", ") || "-"} | All ${kept.length} ${label.noun} (${label.source})`);
    for (const x of removed) console.log(`    - ${x.reason}: ${JSON.stringify(x.name)} ${x.license}`);
  }
  console.log(`total removed: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
