/**
 * Shared plumbing for the reviewed Notion data fixes (P0 follow-up, 30 Oct
 * 2026). Every script built on this is a DRY RUN unless --apply is passed, and
 * prints, per change: database, page, field, current text, new text. A change
 * is made only when the field's current text matches the reviewed text
 * exactly; anything else is reported as SKIPPED with the text found.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { Client, APIResponseError } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export const APPLY = process.argv.includes("--apply");
export const notion = new Client({ auth: process.env.NOTION_TOKEN });

/** The whole of a rich_text / title property, every segment joined (the site's getText reads only the first). */
export function fullText(page: PageObjectResponse, field: string): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (page.properties as any)[field];
  if (!p) return null;
  if (p.type === "select") return p.select?.name ?? "";
  if (p.type === "checkbox") return String(p.checkbox);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (p[p.type] ?? []).map((t: any) => t.plain_text ?? "").join("");
}

/** A string as rich_text segments of at most 2,000 characters (the Notion API limit per segment). */
export function richText(s: string) {
  const out: { type: "text"; text: { content: string } }[] = [];
  for (let i = 0; i < s.length; i += 2000) out.push({ type: "text", text: { content: s.slice(i, i + 2000) } });
  return out.length ? out : [];
}

export async function getPage(id: string): Promise<PageObjectResponse> {
  return (await notion.pages.retrieve({ page_id: id })) as PageObjectResponse;
}

export type Change = {
  db: string;
  page: string;
  pageId: string;
  field: string;
  current: string;
  next: string;
  /** The Notion property payload to write. */
  property: Record<string, unknown>;
};
export type Skip = { db: string; page: string; field: string; reason: string; found: string };
export type Flag = { db: string; page: string; field: string; note: string; found: string };

export const changes: Change[] = [];
export const skips: Skip[] = [];
export const flags: Flag[] = [];

const clip = (s: string) => JSON.stringify(s);

export function printPlan(title: string) {
  console.log(`\n${title}: ${APPLY ? "APPLY" : "DRY RUN (nothing written; pass --apply to write)"}\n`);
  for (const c of changes) {
    console.log(`CHANGE  ${c.db} > ${c.page} > ${c.field}`);
    console.log(`  current: ${clip(c.current)}`);
    console.log(`  new:     ${clip(c.next)}\n`);
  }
  for (const s of skips) {
    console.log(`SKIPPED ${s.db} > ${s.page} > ${s.field}: ${s.reason}`);
    console.log(`  found:   ${clip(s.found)}\n`);
  }
  for (const f of flags) {
    console.log(`FLAG    ${f.db} > ${f.page} > ${f.field}: ${f.note}`);
    console.log(`  found:   ${clip(f.found)}\n`);
  }
  console.log(`${changes.length} change(s), ${skips.length} skipped, ${flags.length} flagged for Sean.`);
}

/**
 * Stop unless the token can write. A no-op update (no properties) on the first
 * page to be changed returns 403/404 for a read-only or unshared integration.
 */
export async function assertWritable(pageId: string) {
  try {
    await notion.pages.update({ page_id: pageId, properties: {} });
  } catch (e) {
    const code = e instanceof APIResponseError ? `${e.status} ${e.code}` : String(e);
    console.error(
      `\nSTOP: the NOTION_TOKEN in .env.local cannot write to this workspace (${code}).\n` +
        "Nothing was written. Re-run --apply with a token that has write access to the Pellucid CMS workspace.",
    );
    process.exit(2);
  }
}

export async function applyAll() {
  if (!APPLY || changes.length === 0) return;
  await assertWritable(changes[0].pageId);
  // Several changes can hit one page: group, so each page is written once with all its fields.
  const byPage = new Map<string, Change[]>();
  for (const c of changes) byPage.set(c.pageId, [...(byPage.get(c.pageId) ?? []), c]);
  for (const [pageId, cs] of byPage) {
    const properties = Object.assign({}, ...cs.map((c) => c.property));
    await notion.pages.update({ page_id: pageId, properties });
    for (const c of cs) console.log(`  ✓ wrote ${c.db} > ${c.page} > ${c.field}`);
    await new Promise((r) => setTimeout(r, 350));
  }
}

/** A pipe- or newline-separated list field, with its separator style kept on rewrite. */
export function splitList(raw: string): { items: string[]; join: (items: string[]) => string } {
  if (raw.includes("\n")) {
    const lines = raw.split("\n");
    const bullet = lines.find((l) => /^\s*[-•*]\s+/.test(l))?.match(/^\s*([-•*]\s+)/)?.[1] ?? "";
    const items = lines.map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
    return { items, join: (xs) => xs.map((x) => bullet + x).join("\n") };
  }
  const sep = raw.includes(" | ") ? " | " : "|";
  return { items: raw.split("|").map((s) => s.trim()).filter(Boolean), join: (xs) => xs.join(sep) };
}
