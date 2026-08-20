/**
 * Ensure every school has a `slug:_default` destination in the tracker KV seed map
 * (tracker/seed/map.json) = its bare website. This is the safety net that makes
 * UNIVERSAL click tracking safe: the frontend routes every outbound CTA through the
 * tracker (/c/:slug), and the Worker resolves `slug:STATE` -> `slug:_default` -> the
 * global site. Without a per-school _default, an unmonetized (or uncovered-state)
 * click would land on OUR homepage instead of the school. Monetized per-state entries
 * (generated from Tune) take precedence and are untouched.
 *
 *   npx tsx scripts/seed-default-destinations.ts            # dry-run: show additions
 *   npx tsx scripts/seed-default-destinations.ts --write    # update tracker/seed/map.json
 *
 * After --write:  cd tracker && npm run seed   (pushes the map to KV --remote)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const WRITE = process.argv.includes("--write");
/* eslint-disable @typescript-eslint/no-explicit-any */

async function main() {
  const { getAllSchools } = await import("../lib/notion");
  const schools = (await getAllSchools()) as any[];
  const mapPath = join(process.cwd(), "tracker", "seed", "map.json");
  const cur: Array<{ key: string; value: string }> = JSON.parse(readFileSync(mapPath, "utf8"));
  const have = new Map(cur.map((e) => [e.key, e.value]));

  const additions: Array<{ key: string; value: string }> = [];
  const changes: string[] = [];
  for (const s of schools) {
    if (!s.slug || !s.website) continue;
    const key = `${s.slug}:_default`;
    const want = String(s.website).replace(/\/+$/, "");
    if (!have.has(key)) { additions.push({ key, value: want }); changes.push(`+ ${key} -> ${want}`); }
    else if (have.get(key) !== want) { changes.push(`~ ${key}: ${have.get(key)} -> ${want}`); have.set(key, want); }
  }

  console.log(changes.length ? changes.join("\n") : "(all schools already have a _default — nothing to do)");
  if (!WRITE) { console.log(`\nDRY RUN — ${additions.length} to add, ${changes.length - additions.length} to change. Re-run with --write.`); return; }

  // Rebuild: existing entries (with any _default value updates applied) + new _defaults, sorted.
  const merged = new Map(cur.map((e) => [e.key, e.value] as const));
  for (const [k, v] of have) merged.set(k, v); // apply value changes
  for (const a of additions) merged.set(a.key, a.value);
  const out = [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => ({ key, value }));
  writeFileSync(mapPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWROTE tracker/seed/map.json (${out.length} keys). Next: cd tracker && npm run seed`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
