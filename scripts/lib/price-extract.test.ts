/**
 * Tests for the price extraction + validation gate (WS1).
 *   npx tsx scripts/lib/price-extract.test.ts
 */
import { pickPrice, classify, median } from "./price-extract";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`  [${cond ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

function main() {
  console.log("median");
  check("odd", median([5, 1, 3]) === 3);
  check("even", median([10, 20, 30, 40]) === 25);
  check("empty", median([]) === null);

  console.log("pickPrice ignores stray low coupon (old Math.min bug)");
  {
    // Real page: course is $29, but a "$5 off" promo sits nearby. Old code returned 5.
    const body = "Save $5 today! Enroll now — course price only $29. Add-on $3.";
    const p = pickPrice(body, false);
    check("keyword-proximate median beats the coupon", p === 29, `got ${p}`);
  }
  {
    // Multiple course-ish figures cluster; median is robust.
    const body = "price $24.95 enroll $25 only $24.95 checkout $199 shipping";
    const p = pickPrice(body, false);
    check("median of keyworded prices", p === 24.95, `got ${p}`);
  }
  check("no dollar figures → null", pickPrice("no prices here", false) === null);

  console.log("pickPrice prefers Regular over a fake-urgency Sale Price (the $5.94 junk source)");
  {
    const body = "Instant certificate available Regular $34.95 Sale Price $5.94 OFFER ENDS 12:00";
    const p = pickPrice(body, false);
    check("Regular $34.95 wins, not Sale $5.94", p === 34.95, `got ${p}`);
  }

  console.log("classify — the safety gate");
  // The exact June failure: iDriveSafely CA prior $29, scrape yields $5 (junk) → quarantine.
  {
    const d = classify(5, 29, false);
    check("huge drop vs prior → Needs Review", d.status === "Needs Review");
    check("…does NOT write price", d.writePrice === null);
    check("…does NOT auto-approve", d.approve === false);
  }
  // Improv TX $3 with no prior → below confident band → quarantine.
  {
    const d = classify(3, null, false);
    check("first-time $3 → Needs Review", d.status === "Needs Review" && d.writePrice === null && !d.approve);
  }
  // Stable price → OK, writes, approves.
  {
    const d = classify(30, 29, false);
    check("small change → OK", d.status === "OK" && d.writePrice === 30 && d.approve === true);
  }
  // First-time in-band → OK.
  {
    const d = classify(24.95, null, false);
    check("first-time in confident band → OK", d.status === "OK" && d.writePrice === 24.95 && d.approve === true);
  }
  // Blocked/failed never touch approval or price.
  {
    const b = classify(null, 29, true);
    check("blocked → Blocked, no write, no approve", b.status === "Blocked" && b.writePrice === null && !b.approve);
    const f = classify(null, 29, false);
    check("no parse → Failed, no write, no approve", f.status === "Failed" && f.writePrice === null && !f.approve);
  }
  // Out-of-band parse (e.g. a stray $150+ / $2) → quarantine even with prior.
  {
    const d = classify(2, null, false);
    check("below hard band → Needs Review", d.status === "Needs Review");
  }

  console.log("");
  if (failures === 0) console.log("ALL PASS");
  else {
    console.log(`${failures} FAILURE(S)`);
    process.exitCode = 1;
  }
}

main();
