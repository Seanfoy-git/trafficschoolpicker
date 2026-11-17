/**
 * Google Places API (New) calls for directory enrichment, split by billing SKU
 * (price list checked 17 Nov 2026, developers.google.com/maps/billing-and-pricing/pricing):
 *
 *   searchCandidates  Text Search, field mask id + displayName + formattedAddress
 *                     → "Text Search Pro": $32 / 1,000, first 5,000 a month free.
 *   placeWebsite      Place Details, field mask websiteUri
 *                     → "Place Details Enterprise": $20 / 1,000, first 1,000 a month free.
 *
 * Asking Text Search for websiteUri would bill every search as Text Search
 * Enterprise ($35 / 1,000, 1,000 free), including the ones we reject, so the
 * website is fetched only for a candidate that passed the match.
 */
import type { PlaceCandidate } from "./places-match";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PRICES = {
  textSearchPro: { per1000: 32, freePerMonth: 5000 },
  placeDetailsEnterprise: { per1000: 20, freePerMonth: 1000 },
} as const;

/** How many candidates to ask for (Text Search pageSize, 1–20). */
export const CANDIDATES = 5;

export const usage = { textSearch: 0, details: 0 };

/** Cost of n calls of a SKU, before and after its monthly free calls. */
export function cost(n: number, sku: keyof typeof PRICES) {
  const p = PRICES[sku];
  return { gross: (n * p.per1000) / 1000, afterFree: (Math.max(0, n - p.freePerMonth) * p.per1000) / 1000 };
}

function key(): string {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  if (!k) throw new Error("GOOGLE_PLACES_API_KEY not set in environment");
  return k;
}

async function call(url: string, init: RequestInit, attempt = 1): Promise<any> {
  const res = await fetch(url, init);
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return call(url, init, attempt + 1);
  }
  if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export async function searchCandidates(textQuery: string): Promise<PlaceCandidate[]> {
  usage.textSearch++;
  const data = await call("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key(),
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery, pageSize: CANDIDATES }),
  });
  return (data.places ?? []).map((p: any) => ({
    id: p.id ?? "",
    displayName: p.displayName?.text ?? "",
    formattedAddress: p.formattedAddress ?? "",
  }));
}

export async function placeWebsite(placeId: string): Promise<string | null> {
  usage.details++;
  const data = await call(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": key(), "X-Goog-FieldMask": "websiteUri" },
  });
  return data.websiteUri ?? null;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
