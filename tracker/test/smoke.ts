/**
 * Local smoke test for the tracker Worker — no deploy, no network.
 * Mocks KV and drives the fetch handler through the acceptance scenarios.
 *   npx tsx tracker/test/smoke.ts
 */
import worker, { type Env } from "../src/index";

type Put = { key: string; value: string; opts?: unknown };

function makeKV(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  const puts: Put[] = [];
  const kv = {
    get: async (k: string) => (store.has(k) ? store.get(k)! : null),
    put: async (key: string, value: string, opts?: unknown) => {
      puts.push({ key, value, opts });
      store.set(key, value);
    },
  };
  return { kv: kv as unknown as KVNamespace, puts };
}

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  const ok = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`  [${ok}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function hit(path: string, mapSeed: Record<string, string>) {
  const map = makeKV(mapSeed);
  const clicks = makeKV();
  const env: Env = { MAP: map.kv, CLICKS: clicks.kv, SITE_URL: "https://www.trafficschoolpicker.com" };
  const res = await worker.fetch(
    new Request(`https://track.trafficschoolpicker.com${path}`, { headers: { referer: "https://x/y" } }),
    env
  );
  return { res, clickPut: clicks.puts[0] };
}

const MAP = {
  "idrivesafely:NY": "https://go.idrivesafely.com/aff_c?offer_id=25&aff_id=6858",
  "idrivesafely:GA": "https://go.idrivesafely.com/aff_c?offer_id=21&aff_id=6858",
  "idrivesafely:_default": "https://go.idrivesafely.com/aff_c?offer_id=19&aff_id=6858",
};

async function main() {
  console.log("NY (mapped → offer 25)");
  {
    const { res, clickPut } = await hit("/c/idrivesafely?s=NY&p=demo-uuid", MAP);
    const loc = res.headers.get("location") || "";
    check("302", res.status === 302);
    check("no-store", res.headers.get("cache-control") === "no-store");
    check("offer_id=25", loc.includes("offer_id=25"));
    check("aff_id preserved", loc.includes("aff_id=6858"));
    check("aff_sub=tsp-NY", loc.includes("aff_sub=tsp-NY"));
    check("aff_sub3 clickId present", /aff_sub3=[0-9a-f-]{36}/.test(loc));
    check("click logged", !!clickPut && clickPut.key.startsWith("click:"));
    const rec = clickPut ? JSON.parse(clickPut.value) : {};
    check("logged mapped=true", rec.mapped === true);
    check("logged state=NY", rec.state === "NY");
    check("logged sourcePageId=demo-uuid", rec.sourcePageId === "demo-uuid", rec.sourcePageId);
  }

  console.log("GA (mapped → offer 21)");
  {
    const { res } = await hit("/c/idrivesafely?s=GA&p=x", MAP);
    check("offer_id=21", (res.headers.get("location") || "").includes("offer_id=21"));
  }

  console.log("TX (unmapped → partner default offer 19, logged miss)");
  {
    const { res, clickPut } = await hit("/c/idrivesafely?s=TX&p=x", MAP);
    const loc = res.headers.get("location") || "";
    check("offer_id=19 (default)", loc.includes("offer_id=19"));
    check("aff_sub=tsp-TX still tagged", loc.includes("aff_sub=tsp-TX"));
    const rec = JSON.parse(clickPut.value);
    check("logged mapped=false", rec.mapped === false);
    check("logged fellBackToSite=false", rec.fellBackToSite === false);
  }

  console.log("lowercase s=ny is normalized to NY");
  {
    const { res } = await hit("/c/idrivesafely?s=ny&p=x", MAP);
    check("offer_id=25", (res.headers.get("location") || "").includes("offer_id=25"));
  }

  console.log("unknown partner, no _default → site fallback, still logged");
  {
    const { res, clickPut } = await hit("/c/unknownschool?s=NY", MAP);
    const loc = res.headers.get("location") || "";
    check("redirects to site", loc === "https://www.trafficschoolpicker.com");
    check("logged fellBackToSite=true", JSON.parse(clickPut.value).fellBackToSite === true);
  }

  console.log("non-/c path → site, no click logged");
  {
    const { res, clickPut } = await hit("/favicon.ico", MAP);
    check("302 to site", res.status === 302 && res.headers.get("location") === "https://www.trafficschoolpicker.com");
    check("no click logged", clickPut === undefined);
  }

  console.log("");
  if (failures === 0) console.log("ALL PASS");
  else {
    console.log(`${failures} FAILURE(S)`);
    process.exit(1);
  }
}

main();
