/**
 * P17 proof check: on a comparison-layout state page, the ItemList JSON-LD follows
 * the comparison tables row for row, and every Offer.price equals the price the
 * row renders (no Offer on an unpriced row). Reads built HTML files or live URLs.
 *
 *   npx tsx scripts/check-itemlist-order.ts .next/server/app/virginia.html
 *   npx tsx scripts/check-itemlist-order.ts https://www.trafficschoolpicker.com/virginia
 */
import fs from "fs";

function unescape(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
}

async function load(src: string): Promise<string> {
  if (/^https?:/.test(src)) {
    const res = await fetch(`${src}${src.includes("?") ? "&" : "?"}cb=${Date.now()}`, { headers: { "user-agent": "Mozilla/5.0" } });
    return res.text();
  }
  return fs.readFileSync(src, "utf8");
}

async function check(src: string): Promise<boolean> {
  const html = await load(src);
  // Table rows in document order across both comparison tables.
  const rows = [...html.matchAll(/<tr\b[^>]*data-priced="(yes|no)"(?:[^>]*data-price="([\d.]+)")?[^>]*data-school="([^"]*)"/g)].map((m) => ({
    name: unescape(m[3]),
    price: m[2] ?? null,
  }));
  let list: { name: string; price: string | null }[] = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const j = JSON.parse(m[1]);
    if (j["@type"] !== "ItemList") continue;
    list = j.itemListElement.map((li: { name?: string; item?: { name: string; offers?: { price: string } } }) => ({
      name: li.item ? li.item.name.replace(/ \([^)]*\)$/, "") : li.name ?? "",
      price: li.item?.offers?.price ?? null,
    }));
  }
  const problems: string[] = [];
  if (rows.length === 0) problems.push("no comparison rows");
  if (list.length !== rows.length) problems.push(`ItemList has ${list.length} entries, tables have ${rows.length} rows`);
  rows.forEach((r, i) => {
    const l = list[i];
    if (!l) return;
    if (l.name !== r.name) problems.push(`#${i + 1}: table "${r.name}" vs ItemList "${l.name}"`);
    if (l.price !== r.price) problems.push(`#${i + 1} ${r.name}: rendered ${r.price ?? "no price"} vs Offer ${l.price ?? "none"}`);
  });
  const priced = rows.filter((r) => r.price !== null).length;
  console.log(
    `${problems.length ? "❌" : "✅"} ${src}: ${rows.length} rows, ${priced} Offers, order + prices ${problems.length ? "MISMATCH" : "identical"}`
  );
  for (const p of problems) console.log(`   - ${p}`);
  return problems.length === 0;
}

(async () => {
  let ok = true;
  for (const src of process.argv.slice(2)) ok = (await check(src)) && ok;
  process.exit(ok ? 0 : 1);
})();
