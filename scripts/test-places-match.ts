/**
 * Assertions for scripts/lib/places-match (no network, no Notion).
 *   npx tsx scripts/test-places-match.ts
 */
import assert from "node:assert/strict";
import { nameMatches, nameTokens, needsWebsite, parseAddress, pickCandidate, registrableDomain, websiteMatches } from "./lib/places-match";
import { heldByOther, holdingsOf } from "./lib/places-lookup";
import type { DirRow } from "./lib/directory-rows";

const t = (name: string, fn: () => void) => {
  fn();
  console.log(`  ok  ${name}`);
};

const FIVE_DOLLAR = { id: "ChIJEWUCBbCbwoARnVibuKAvYrI", displayName: "$5 Dollar Traffic School", formattedAddress: "1100 W Town and Country Rd, Orange, CA 92868, USA" };

t("parseAddress: CA DMV, TDLR, GA and junk formats", () => {
  assert.deepEqual(parseAddress("3800 MARKET STREET UNIT K,VENTURA,CA 93003"), { streetNumber: "3800", zip: "93003" });
  assert.deepEqual(parseAddress("13470 FM 1485, CONROE, TX, 77306"), { streetNumber: "13470", zip: "77306" });
  assert.deepEqual(parseAddress("21-23 1ST AVE SW CAIRO GA 39828"), { streetNumber: "21", zip: "39828" });
  assert.deepEqual(parseAddress("701 E 10TH ST, DALHART, TX, 79022-3807"), { streetNumber: "701", zip: "79022" });
  assert.deepEqual(parseAddress("KATY, TX, 77494"), { streetNumber: null, zip: "77494" });
  assert.deepEqual(parseAddress("310, HOUSTON, TX, 77060"), { streetNumber: null, zip: "77060" });
  assert.deepEqual(parseAddress("4/16/2027, DALLAS, DALLAS"), { streetNumber: null, zip: null });
  assert.deepEqual(parseAddress("Class Start Time"), { streetNumber: null, zip: null });
  assert.deepEqual(parseAddress(""), { streetNumber: null, zip: null });
});

t("E1008, E0893, E0954: $5 Dollar Traffic School's listing is rejected (address)", () => {
  for (const address of ["3800 MARKET STREET UNIT K,VENTURA,CA 93003", "206 W 4TH ST STE 325,SANTA ANA,CA 92701", "524 MOUNTAIN VIEW AVE 4,SAN BERNARDINO,CA 92401"]) {
    assert.equal(pickCandidate({ name: "x", address }, [FIVE_DOLLAR]).accepted, false);
  }
});

t("street number and ZIP must both match, as whole numbers", () => {
  const row = { name: "California Licensing Education", address: "3800 MARKET STREET UNIT K,VENTURA,CA 93003" };
  const ok = { id: "a", displayName: "California Licensing Education", formattedAddress: "3800 Market St unit k, Ventura, CA 93003, USA" };
  assert.equal(pickCandidate(row, [FIVE_DOLLAR, ok]).accepted, true);
  assert.equal(pickCandidate(row, [{ ...ok, formattedAddress: "3800 Main St, Oxnard, CA 93030, USA" }]).accepted, false); // ZIP differs
  assert.equal(pickCandidate(row, [{ ...ok, formattedAddress: "13800 Market St, Ventura, CA 93003, USA" }]).accepted, false); // 13800 ≠ 3800
});

t("two schools in one building: the one with the school's name, else nothing", () => {
  const ace = { id: "ace", displayName: "Aceable", formattedAddress: "100 E San Marcos Blvd #439, San Marcos, CA 92069, USA" };
  const ids = { id: "ids", displayName: "I Drive Safely", formattedAddress: "100 E San Marcos Blvd #425, San Marcos, CA 92069, USA" };
  const r = pickCandidate({ name: "ACEABLE TRAFFIC SCHOOL", address: "100 E SAN MARCOS BLVD STE 439,SAN MARCOS,CA 92069" }, [ids, ace]);
  assert.equal(r.accepted && r.candidate.id, "ace");
  assert.equal(pickCandidate({ name: "UNRELATED NAME", address: "100 E SAN MARCOS BLVD STE 400,SAN MARCOS,CA 92069" }, [ids, ace]).accepted, false);
});

t("no address: every distinctive name word in the listing's name", () => {
  assert.deepEqual(nameTokens("www Cheap Traffic School 365 com"), ["cheap", "365"]);
  assert.equal(nameMatches("www Cheap Traffic School 365 com", "$5 Dollar Traffic School"), false);
  assert.equal(nameMatches("3DollarsQuickTrafficSchool com", "$5 Dollar Traffic School"), false);
  assert.equal(nameMatches("Safeway Driving School", "SafeRoute Driving School"), false);
  assert.equal(nameMatches("Safeway Driving", "Safeway Driving School - Memorial"), true);
  assert.equal(nameMatches("Traffic School Online", "Anything Traffic School"), false); // nothing distinctive: unprovable
  assert.equal(pickCandidate({ name: "Drop The Ticket", address: "" }, [{ id: "d", displayName: "DropTheTicket.com", formattedAddress: "Phoenix, AZ" }]).accepted, true);
});

t("ZIP but no street number (TDLR): ZIP and name both needed", () => {
  const row = { name: "SAFEWAY DRIVING", address: "KATY, TX, 77494" };
  const saferoute = { id: "s", displayName: "SafeRoute Driving School", formattedAddress: "1234 Pin Oak Rd, Katy, TX 77494, USA" };
  const safeway = { id: "w", displayName: "Safeway Driving School Katy", formattedAddress: "567 Mason Rd, Katy, TX 77494, USA" };
  assert.equal(pickCandidate(row, [saferoute]).accepted, false);
  const r = pickCandidate(row, [saferoute, safeway]);
  assert.equal(r.accepted && r.candidate.id, "w");
  assert.equal(pickCandidate(row, [{ ...safeway, formattedAddress: "567 Westheimer, Houston, TX 77042, USA" }]).accepted, false);
});

t("524 Mountain View Ave, San Bernardino: four licences, one listing; only E0957 gets it", () => {
  const escuela = { id: "esc", displayName: "Escuela de Trafico", formattedAddress: "524 N Mountain View Ave, San Bernardino, CA 92401, USA" };
  const site = new Map([["esc", "https://www.baratoescueladetrafico.com/contact_s.jsp"]]);
  const at = (unit: number) => `524 MOUNTAIN VIEW AVE ${unit},SAN BERNARDINO,CA 92401`;
  const rows = [
    { lic: "E0962", name: "IPaylessTrafficSchoolcom", address: at(1) },
    { lic: "E0948", name: "DUMMIESTRAFFICSCHOOLCOM", address: at(2) },
    { lic: "E0957", name: "BARATOESCUELADETRAFICOCOM", address: at(3) },
    { lic: "E0954", name: "3DollarsQuickTrafficSchool com", address: at(4) },
  ];
  for (const r of rows) {
    assert.deepEqual(needsWebsite(r, [escuela]).map((c) => c.id), ["esc"]); // at the address, name not in displayName
    const m = pickCandidate(r, [escuela], site);
    if (r.lic === "E0957") assert.ok(m.accepted && m.evidence === "website", r.lic);
    else assert.ok(!m.accepted && m.addressOnly.length === 1 && /address only/.test(m.reason), r.lic);
  }
  // Without the website, even E0957 is address only: the address alone proves nothing.
  assert.equal(pickCandidate(rows[2], [escuela]).accepted, false);
});

t("100 E San Marcos Blvd 92069: E0803 Aceable and E0138 IDriveSafely each get their own listing", () => {
  const ace = { id: "ace", displayName: "Aceable", formattedAddress: "100 E San Marcos Blvd #439, San Marcos, CA 92069, USA" };
  const ids = { id: "ids", displayName: "I Drive Safely", formattedAddress: "100 E San Marcos Blvd #425, San Marcos, CA 92069, USA" };
  const e0803 = pickCandidate({ name: "ACEABLE TRAFFIC SCHOOL", address: "100 E SAN MARCOS BLVD STE 439,SAN MARCOS,CA 92069" }, [ids, ace]);
  const e0138 = pickCandidate({ name: "IDRIVESAFELYCOM", address: "100 E SAN MARCOS BLVD STE 425,SAN MARCOS,CA 92069" }, [ace, ids]);
  assert.ok(e0803.accepted && e0803.candidate.id === "ace");
  assert.ok(e0138.accepted && e0138.candidate.id === "ids");
  // Aceable's listing alone, for IDriveSafely: address only.
  assert.equal(pickCandidate({ name: "IDRIVESAFELYCOM", address: "100 E SAN MARCOS BLVD STE 425,SAN MARCOS,CA 92069" }, [ace], new Map([["ace", "https://aceable.com/"]])).accepted, false);
});

t("glued www/com and the website test", () => {
  assert.deepEqual(nameTokens("IDRIVESAFELYCOM"), ["idrivesafely"]);
  assert.deepEqual(nameTokens("wwwCheapTickets"), ["cheaptickets"]);
  assert.deepEqual(nameTokens("FINISHFAST COM"), ["finishfast"]);
  assert.equal(websiteMatches("BARATOESCUELADETRAFICOCOM", "https://www.baratoescueladetrafico.com/"), true);
  assert.equal(websiteMatches("3DollarsQuickTrafficSchool com", "https://www.baratoescueladetrafico.com/"), false);
  assert.equal(websiteMatches("Best Traffic School", "https://trafficschool.com/"), false); // only generic words
  assert.equal(websiteMatches("ABC Traffic", "https://abc.com/"), false); // under 6 characters
  assert.equal(websiteMatches("IDRIVESAFELYCOM", "https://www.idrivesafely.com/ca"), true);
});

t("1c: a listing held by a different licence at a different address is refused", () => {
  const row = (id: string, licence: string, address: string) => ({ id, licence, address, name: id, placeId: "P" }) as DirRow;
  const h = holdingsOf([row("a", "E0893", "206 W 4TH ST")]);
  assert.ok(heldByOther("P", { id: "b", licence: "E0954", address: "524 MOUNTAIN VIEW AVE", name: "b" }, h));
  assert.equal(heldByOther("P", { id: "b", licence: "E0893", address: "elsewhere", name: "b" }, h), undefined); // same licence
  assert.equal(heldByOther("P", { id: "b", licence: "E9999", address: "206 W 4th St", name: "b" }, h), undefined); // same address
  assert.equal(heldByOther("P", { id: "a", licence: "X", address: "Y", name: "a" }, h), undefined); // itself
  // Placeholder licences: the name decides.
  const u = holdingsOf([{ ...row("u1", "UT-approved", ""), name: "Zion View Driving" }]);
  assert.ok(heldByOther("P", { id: "u2", licence: "UT-approved", address: "", name: "Other School" }, u));
  assert.equal(heldByOther("P", { id: "u2", licence: "UT-approved", address: "", name: "ZION VIEW DRIVING" }, u), undefined);
});

t("registrableDomain", () => {
  assert.equal(registrableDomain("http://www.5dollartrafficschool.com/"), "5dollartrafficschool.com");
  assert.equal(registrableDomain("https://traffic.californialicensingeducation.com/"), "californialicensingeducation.com");
  assert.equal(registrableDomain("https://www.safewaydriving.com/locations/memorial/pricing"), "safewaydriving.com");
  assert.equal(registrableDomain("https://shop.example.co.uk/x"), "example.co.uk");
  assert.equal(registrableDomain(""), null);
});

console.log("places-match: all assertions passed");
