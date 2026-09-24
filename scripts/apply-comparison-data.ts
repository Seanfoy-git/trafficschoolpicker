/**
 * P17 — apply a reviewed comparison-data plan to Notion (prices, provenance, facts,
 * directory cleanup). The plan is a JSON list of operations built from the price
 * research (research/p17-price-data.json); every value in it was read from the
 * school's own page or an official list, with its URL and the day it was read.
 *
 *   npx tsx scripts/apply-comparison-data.ts <plan.json>            # DRY RUN: per-field diff
 *   npx tsx scripts/apply-comparison-data.ts <plan.json> --apply    # write, then read back
 *
 * Ops (props are plain values; each is converted by the target property's type):
 *   { op: "update",  db, pageId, props }            db = directory|pricing|variants|states|reqs
 *   { op: "create",  db, props }
 *   { op: "archive", db, pageId, reason }           moves a junk row to Notion trash (restorable)
 *   { op: "upsert",  db: "pricing", label, schoolSlug, props }  Pricing row by Label "slug-STATE"
 *   { op: "upsert",  db: "variants", name, props }              Variants row by Name "slug:STATE"
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "fs";
import { makeNotionClient } from "./lib/notion-client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const notion = makeNotionClient();
const APPLY = process.argv.includes("--apply");
const planPath = process.argv[2];
if (!planPath || planPath.startsWith("--")) {
  console.error("usage: apply-comparison-data.ts <plan.json> [--apply]");
  process.exit(1);
}

const DBS: Record<string, string | undefined> = {
  directory: process.env.NOTION_DIRECTORY_DB,
  pricing: process.env.NOTION_PRICING_DB,
  variants: process.env.NOTION_SCHOOL_VARIANTS_DB,
  states: process.env.NOTION_STATES_DB,
  reqs: process.env.NOTION_STATE_REQUIREMENTS_DB,
};

type Op =
  | { op: "update"; db: string; pageId: string; props: Record<string, unknown> }
  | { op: "create"; db: string; props: Record<string, unknown> }
  | { op: "archive"; db: string; pageId: string; reason: string }
  | { op: "upsert"; db: "pricing"; label: string; schoolSlug: string; props: Record<string, unknown> }
  | { op: "upsert"; db: "variants"; name: string; props: Record<string, unknown> };

const schemas = new Map<string, Record<string, any>>();
async function schema(db: string): Promise<Record<string, any>> {
  if (!schemas.has(db)) {
    const d: any = await notion.databases.retrieve({ database_id: DBS[db]! });
    schemas.set(db, d.properties);
  }
  return schemas.get(db)!;
}

// Notion caps one rich-text segment at 2000 chars; split, never truncate.
const rt = (s: string) => (s.match(/[\s\S]{1,2000}/g) ?? []).map((content) => ({ text: { content } }));

function toProp(type: string, v: unknown): any {
  switch (type) {
    case "title": return { title: rt(String(v ?? "")) };
    case "rich_text": return { rich_text: rt(String(v ?? "")) };
    case "number": return { number: v === null || v === "" ? null : Number(v) };
    case "url": return { url: v ? String(v) : null };
    case "date": return { date: v ? { start: String(v) } : null };
    case "checkbox": return { checkbox: !!v };
    case "select": return { select: v ? { name: String(v) } : null };
    case "relation": return { relation: (v as string[]).map((id) => ({ id })) };
    default: throw new Error(`unsupported property type ${type}`);
  }
}

function fromProp(p: any): unknown {
  if (!p) return undefined;
  switch (p.type) {
    case "title": return p.title.map((t: any) => t.plain_text).join("");
    case "rich_text": return p.rich_text.map((t: any) => t.plain_text).join("");
    case "number": return p.number;
    case "url": return p.url;
    case "date": return p.date?.start ?? null;
    case "checkbox": return p.checkbox;
    case "select": return p.select?.name ?? null;
    case "relation": return p.relation.map((r: any) => r.id);
    default: return undefined;
  }
}

const norm = (v: unknown) => (v === "" || v === undefined ? null : Array.isArray(v) ? v.join(",") : v);

async function build(db: string, props: Record<string, unknown>) {
  const sch = await schema(db);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!sch[k]) throw new Error(`${db}: no property "${k}"`);
    out[k] = toProp(sch[k].type, v);
  }
  return out;
}

async function findBy(db: string, prop: string, value: string): Promise<any | null> {
  const r: any = await notion.databases.query({
    database_id: DBS[db]!,
    filter: { property: prop, title: { equals: value } },
    page_size: 2,
  });
  if (r.results.length > 1) throw new Error(`${db}: ${r.results.length} rows titled "${value}" (expected at most one)`);
  return r.results[0] ?? null;
}

function diff(current: any, props: Record<string, unknown>): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(props)) {
    const cur = current ? fromProp(current.properties[k]) : undefined;
    if (norm(cur) !== norm(v)) lines.push(`    ${k}: ${JSON.stringify(norm(cur))} -> ${JSON.stringify(norm(v))}`);
  }
  return lines;
}

let schoolIds: Map<string, string> | null = null;
async function schoolId(slug: string): Promise<string> {
  if (!schoolIds) {
    // Canonical (Active + Show On Site) page ids — the ones the Pricing join uses.
    const { getAllSchools } = await import("../lib/notion");
    schoolIds = new Map((await getAllSchools()).map((s) => [s.slug, s.id]));
  }
  const id = schoolIds.get(slug);
  if (!id) throw new Error(`no canonical school page for slug "${slug}"`);
  return id;
}

async function run() {
  const plan: Op[] = JSON.parse(readFileSync(planPath, "utf8"));
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} — ${plan.length} ops from ${planPath}\n`);
  let writes = 0, noops = 0;
  for (const op of plan) {
    if (op.op === "archive") {
      const page: any = await notion.pages.retrieve({ page_id: op.pageId });
      const title = fromProp(Object.values(page.properties).find((p: any) => p.type === "title"));
      if (page.archived) { noops++; continue; }
      console.log(`ARCHIVE ${op.db} ${op.pageId} "${title}" (${op.reason})`);
      if (APPLY) await notion.pages.update({ page_id: op.pageId, archived: true });
      writes++;
      continue;
    }
    let current: any = null;
    let pageId: string | null = null;
    let props = op.props;
    if (op.op === "update") {
      current = await notion.pages.retrieve({ page_id: op.pageId });
      pageId = op.pageId;
    } else if (op.op === "upsert" && op.db === "pricing") {
      current = await findBy("pricing", "Label", op.label);
      pageId = current?.id ?? null;
      props = {
        ...(current ? {} : { Label: op.label, "State Code": op.label.split("-").pop(), Approved: true }),
        School: [await schoolId(op.schoolSlug)],
        ...props,
      };
    } else if (op.op === "upsert" && op.db === "variants") {
      current = await findBy("variants", "Name", op.name);
      pageId = current?.id ?? null;
      if (!current) {
        const [slug, code] = op.name.split(":");
        props = { Name: op.name, "School Slug": slug, "State Code": code, ...props };
      }
    }
    const changes = diff(current, props);
    const label = op.op === "update" ? op.pageId : op.op === "create" ? "(new)" : "label" in op ? op.label : op.name;
    if (current && changes.length === 0) { noops++; continue; }
    console.log(`${current ? "UPDATE" : "CREATE"} ${op.db} ${label}`);
    for (const l of changes) console.log(l);
    if (APPLY) {
      const properties = await build(op.db, props);
      const page: any = pageId
        ? await notion.pages.update({ page_id: pageId, properties })
        : await notion.pages.create({ parent: { database_id: DBS[op.db]! }, properties });
      const back: any = await notion.pages.retrieve({ page_id: page.id });
      const bad = diff(back, props);
      if (bad.length) throw new Error(`read-back mismatch on ${label}:\n${bad.join("\n")}`);
    }
    writes++;
  }
  console.log(`\n${APPLY ? "Applied" : "Would apply"} ${writes} write(s); ${noops} already current.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
