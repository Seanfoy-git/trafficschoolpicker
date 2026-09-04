/**
 * Resilient fetch for the Notion SDK: retries transient network failures AND
 * HTTP 429 rate limits with exponential backoff, honoring Retry-After.
 *
 * Why: a full site build (plus the prebuild guards and the llms generator) makes
 * many Notion requests in a burst. The SDK's own 429 handling is a small fixed
 * budget, and under sustained rate-limiting it gets exhausted, so the query throws
 * and the whole build fails. That has repeatedly broken deploys. Waiting the limit
 * out here — up to ~1 minute of cumulative backoff — turns a transient 429 into a
 * slow success instead of a hard failure. Used by both the runtime/build client
 * (lib/notion.ts) and the script client (scripts/lib/notion-client.ts).
 */

const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 500;

const TRANSIENT_CODES = new Set([
  "ERR_STREAM_PREMATURE_CLOSE",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "UND_ERR_SOCKET",
]);
const TRANSIENT_MESSAGE =
  /premature close|socket hang up|fetch failed|network|econnreset|etimedout|terminated|other side closed/i;

export function isTransient(err: unknown): boolean {
  if (!err) return false;
  const e = err as { code?: string; errno?: string; message?: string; cause?: { code?: string; message?: string } };
  const code = e.code ?? e.errno ?? e.cause?.code;
  if (code && TRANSIENT_CODES.has(code)) return true;
  const msg = `${e.message ?? ""} ${e.cause?.message ?? ""}`;
  return TRANSIENT_MESSAGE.test(msg);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Global build-time rate limiter ──────────────────────────────────────────
// During `next build`, static generation renders many pages, and each page's
// Notion fetches would otherwise burst uncoordinated. Notion's public API caps a
// token at ~3 req/s, so an uncoordinated burst self-inflicts a 429 storm; retrying
// INTO that storm can starve a page past its 60s budget, which is how a transient
// 429 became a prerendered soft-404 (caught by the sitemap-200 guard). This spaces
// EVERY Notion request start to >= MIN_INTERVAL_MS apart, process-wide.
//
// Effective globally because the build is pinned to a single static-generation
// worker (experimental.staticGenerationMinPagesPerWorker in next.config.ts), so this
// one module-level queue governs all Notion traffic during the build. Gated on the
// build phase only — runtime/ISR and /admin read Notion unthrottled (sparse traffic).
const MIN_INTERVAL_MS = 400; // ~2.5 requests/second
let nextSlotAt = 0;
let loggedPhase = false;
async function acquireBuildSlot(): Promise<void> {
  // Active everywhere EXCEPT the Next dev server (where sub-second page-load latency
  // matters and traffic is one developer). That covers `next build` static generation,
  // the prebuild scripts, and prod ISR revalidation — all batchy contexts where pacing
  // Notion to ~2.5 req/s prevents the self-inflicted 429 storm. Checked at call time.
  if (process.env.NEXT_PHASE === "phase-development-server") return;
  if (!loggedPhase) {
    loggedPhase = true;
    console.log(`[notion] build rate limiter active (phase=${process.env.NEXT_PHASE ?? "none"})`);
  }
  const now = Date.now();
  const wait = Math.max(0, nextSlotAt - now);
  // Reserve the next slot for the following caller; concurrent callers queue in
  // 400ms increments rather than all firing at once.
  nextSlotAt = Math.max(now, nextSlotAt) + MIN_INTERVAL_MS;
  if (wait > 0) await sleep(wait);
}

/** Slots straight into the SDK's `fetch` option (structurally satisfies SupportedFetch). */
export const retryingFetch: typeof fetch = async (url, init) => {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await acquireBuildSlot(); // pace request starts to <=2.5/s during the build
      const res = await fetch(url, init);
      if (res.status === 429 && attempt < MAX_ATTEMPTS) {
        const retryAfter = Number(res.headers.get("retry-after")) || 0;
        const delay = Math.max(retryAfter * 1000, BASE_DELAY_MS * 2 ** (attempt - 1));
        console.warn(`[notion] 429 rate limit (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === MAX_ATTEMPTS) throw err;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[notion] transient fetch error (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delay}ms: ${(err as Error).message}`
      );
      await sleep(delay);
    }
  }
  throw lastErr;
};
