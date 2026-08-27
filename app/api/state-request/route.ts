import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isRequestableJurisdiction } from "@/lib/state-requests";

/**
 * Research prioritisation queue for /out-of-state-ticket ("which state do you
 * need next"). Stores { state, email?, timestamp } per request. NOT a CRM and NOT
 * a marketing list: the page promises one email when that state is written, the
 * address is never passed on, and nothing here forwards it to any third party.
 *
 * Spam: a honeypot ("company") + a best-effort per-IP rate limit. No CAPTCHA by
 * design — it would cost us the students and librarians this page is aimed at.
 *
 * Degrades without JS: the form posts natively and gets a plain HTML page back;
 * the JS path sends Accept: application/json and gets JSON, staying on the page.
 */

const REQUESTS_FILE = path.join(process.cwd(), "data", "state-requests.json");
const PAGE = "/out-of-state-ticket";

type StateRequest = { state: string; email: string | null; timestamp: string };

// Best-effort in-memory rate limit (per warm instance): max 5 posts / 10 min / IP.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

/** Append one row. Falls back to a log line if the filesystem is read-only (e.g.
 *  serverless): a legit request is captured in function logs rather than lost.
 *  See notes to Sean — wiring a durable store (Vercel Blob/KV) removes the fallback. */
async function store(row: StateRequest): Promise<void> {
  try {
    await fs.mkdir(path.dirname(REQUESTS_FILE), { recursive: true });
    let rows: StateRequest[] = [];
    try {
      rows = JSON.parse(await fs.readFile(REQUESTS_FILE, "utf-8"));
    } catch {
      /* first write */
    }
    rows.push(row);
    await fs.writeFile(REQUESTS_FILE, JSON.stringify(rows, null, 2));
  } catch {
    // Read-only FS: keep the request rather than drop it.
    console.log("[state-request]", JSON.stringify(row));
  }
}

function htmlPage(title: string, body: string, status: number): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:38rem;margin:12vh auto;padding:0 1.25rem;line-height:1.6;color:#1A1816;background:#FBFAF8}h1{font-size:1.4rem}a{color:#7B2D26}@media(prefers-color-scheme:dark){body{background:#14120F;color:#EDE9E2}a{color:#E39289}}</style>
</head><body><h1>${title}</h1>${body}
<p><a href="${PAGE}">← Back to the reference</a></p></body></html>`;
  return new NextResponse(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function POST(request: NextRequest) {
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const reply = (ok: boolean, opts: { status: number; error?: string; state?: string }) => {
    if (wantsJson) {
      return NextResponse.json(ok ? { ok: true } : { ok: false, error: opts.error }, { status: opts.status });
    }
    return ok
      ? htmlPage(
          "Added to the queue",
          `<p>Thanks — <strong>${opts.state}</strong> is on the list, and we work it in the order people ask. If you left an email, that's the only time we'll use it: one message when ${opts.state} is written, nothing else, and we don't pass it on.</p>`,
          200
        )
      : htmlPage("We couldn't add that", `<p>${opts.error}</p>`, opts.status);
  };

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(false, { status: 400, error: "Please choose a state and submit the form again." });
  }

  // Honeypot: a real person never fills this. Accept silently (don't tip off bots)
  // but store nothing.
  if (String(form.get("company") || "").trim() !== "") {
    return reply(true, { status: 200, state: "your state" });
  }

  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) {
    return reply(false, { status: 429, error: "Too many requests just now — give it a minute and try again." });
  }

  const state = String(form.get("state") || "").trim();
  if (!isRequestableJurisdiction(state)) {
    return reply(false, { status: 400, error: "Please choose one of the listed states and submit again." });
  }

  // Email is optional; keep it only if it's plausibly an address, else drop it.
  const rawEmail = String(form.get("email") || "").trim();
  const email = rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : null;

  await store({ state, email, timestamp: new Date().toISOString() });
  return reply(true, { status: 200, state });
}

// A GET here (e.g. someone opening the action URL directly) just points back.
export async function GET() {
  return htmlPage("State request", `<p>Use the form on the reference page to add a state to the queue.</p>`, 200);
}
