import { Client } from "@notionhq/client";

/**
 * Notion client factory with transient-network-error retry.
 *
 * The Notion SDK retries HTTP 429 / 5xx, but NOT network-level stream failures
 * (ERR_STREAM_PREMATURE_CLOSE, ECONNRESET, "socket hang up", "fetch failed").
 * Those surface as thrown FetchErrors — and in the monthly `&&` scraper chain a
 * single flaky request aborts the entire run (see the 2026-07-01 failure: the CA
 * scraper pulled 209 rows, then died on `databases/query: Premature close`).
 *
 * Wrapping fetch with a short exponential backoff makes every scraper resilient
 * to these blips. HTTP-status handling is left to the SDK so we don't double-retry
 * or ignore Retry-After.
 */

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 500; // 0.5s, 1s, 2s, 4s between the 5 attempts

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
  const e = err as {
    code?: string;
    errno?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  const code = e.code ?? e.errno ?? e.cause?.code;
  if (code && TRANSIENT_CODES.has(code)) return true;
  const msg = `${e.message ?? ""} ${e.cause?.message ?? ""}`;
  return TRANSIENT_MESSAGE.test(msg);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Typed as the global fetch so it slots straight into the SDK's `fetch` option
// (a global-fetch wrapper structurally satisfies Notion's SupportedFetch).
export const retryingFetch: typeof fetch = async (url, init) => {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === MAX_ATTEMPTS) throw err;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[notion] transient fetch error (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delay}ms: ${
          (err as Error).message
        }`
      );
      await sleep(delay);
    }
  }
  throw lastErr;
};

/** Notion Client that transparently retries transient network failures. */
export function makeNotionClient(): Client {
  return new Client({ auth: process.env.NOTION_TOKEN, fetch: retryingFetch });
}
