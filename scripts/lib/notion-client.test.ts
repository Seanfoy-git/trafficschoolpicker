/**
 * Smoke test for the Notion retry wrapper — no network, no Notion.
 *   npx tsx scripts/lib/notion-client.test.ts
 */
import { isTransient, retryingFetch } from "./notion-client";

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`  [${cond ? "PASS" : "FAIL"}] ${name}`);
  if (!cond) failures++;
}

function prematureClose() {
  const e = new Error("Premature close") as Error & { code?: string };
  e.code = "ERR_STREAM_PREMATURE_CLOSE";
  return e;
}

async function main() {
  const realFetch = globalThis.fetch;
  try {
    console.log("isTransient classification");
    check("ERR_STREAM_PREMATURE_CLOSE is transient", isTransient(prematureClose()));
    check("'socket hang up' message is transient", isTransient(new Error("socket hang up")));
    check("ECONNRESET code is transient", isTransient({ code: "ECONNRESET" }));
    check("nested cause.code is transient", isTransient({ message: "x", cause: { code: "ETIMEDOUT" } }));
    check("a 400-style app error is NOT transient", !isTransient(new Error("validation_error: bad request")));

    console.log("retryingFetch retries transient errors then succeeds");
    {
      let calls = 0;
      globalThis.fetch = (async () => {
        calls++;
        if (calls < 3) throw prematureClose(); // fail twice, succeed on 3rd
        return { ok: true, status: 200, text: async () => "ok", headers: {} } as unknown as Response;
      }) as typeof fetch;
      const res = await retryingFetch("https://api.notion.com/v1/x");
      check("recovered after 2 transient failures", res.status === 200);
      check("called exactly 3 times", calls === 3);
    }

    console.log("retryingFetch rethrows non-transient immediately");
    {
      let calls = 0;
      globalThis.fetch = (async () => {
        calls++;
        throw new Error("validation_error"); // not transient
      }) as typeof fetch;
      let threw = false;
      try {
        await retryingFetch("https://api.notion.com/v1/x");
      } catch {
        threw = true;
      }
      check("threw", threw);
      check("did NOT retry (called once)", calls === 1);
    }

    console.log("");
    if (failures === 0) console.log("ALL PASS");
    else {
      console.log(`${failures} FAILURE(S)`);
      process.exitCode = 1;
    }
  } finally {
    globalThis.fetch = realFetch;
  }
}

main();
