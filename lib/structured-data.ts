import type { SchoolWithPrice, ResolvedSchoolContent } from "@/lib/types";

/**
 * Product/Offer/AggregateRating/ItemList JSON-LD for the state comparison grids.
 *
 * The output MUST mirror what the SchoolCard visibly renders — same price (sale
 * when a live offer undercuts the regular, else the regular) and only genuine
 * ratings the page already shows. Never fabricate a price, rating, or count: a
 * field that isn't displayed is omitted, not invented. See components/SchoolCard.tsx
 * for the render logic this tracks.
 */

const SITE = "https://www.trafficschoolpicker.com";

// ─── Sitewide entity graph (Organization + WebSite) ─────────────────────────

/** Stable @id of the single site-wide Organization node — reference this from
 *  other schema (blog publisher, review author) rather than redefining it. */
export const ORGANIZATION_ID = `${SITE}/#organization`;
const WEBSITE_ID = `${SITE}/#website`;

interface OrganizationSchema {
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  description: string;
  logo: { "@type": "ImageObject"; url: string };
  sameAs: string[];
}

interface WebSiteSchema {
  "@type": "WebSite";
  "@id": string;
  name: string;
  url: string;
  publisher: { "@id": string };
}

interface EntityGraph {
  "@context": "https://schema.org";
  "@graph": [OrganizationSchema, WebSiteSchema];
}

/** The one Organization definition site-wide, plus the WebSite that publishes it.
 *  Rendered once in the root layout on every page; everything else references
 *  ORGANIZATION_ID by @id. No SearchAction — there is no on-site search endpoint. */
export const ORG_WEBSITE_GRAPH: EntityGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "TrafficSchoolPicker",
      url: SITE,
      description:
        "Independent comparison site for court-approved online traffic schools across all 50 US states. Ranks schools by price, reviews, and court acceptance; does not sell courses directly.",
      logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
      sameAs: ["https://www.youtube.com/@trafficschoolpicker"],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: "TrafficSchoolPicker",
      url: SITE,
      publisher: { "@id": ORGANIZATION_ID },
    },
  ],
};

// ─── Minimal typed schema.org shapes (only the fields we emit) ───────────────

interface OfferSchema {
  "@type": "Offer";
  price: string;
  priceCurrency: "USD";
  availability: "https://schema.org/InStock";
  url: string;
}

interface AggregateRatingSchema {
  "@type": "AggregateRating";
  ratingValue: string;
  reviewCount: string;
}

interface BrandSchema {
  "@type": "Brand";
  name: string;
}

interface ProductSchema {
  "@type": "Product";
  name: string;
  url: string;
  brand: BrandSchema;
  offers?: OfferSchema;
  aggregateRating?: AggregateRatingSchema;
}

interface ListItemSchema {
  "@type": "ListItem";
  position: number;
  item: ProductSchema;
}

export interface ItemListSchema {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  itemListElement: ListItemSchema[];
}

/** A tier-1 school paired with its per-state resolved content. */
export interface SchemaSchool {
  school: SchoolWithPrice;
  resolved: ResolvedSchoolContent;
}

/**
 * The price the card actually renders for this school in this state: the sale
 * price only when a live offer undercuts the regular (mirrors SchoolCard's
 * `hasActiveOffer && salePrice < resolved.price` branch), otherwise the regular
 * price. `null` when the card shows "Check website" (no price) — the caller omits
 * the Offer in that case rather than markup a price that isn't visible.
 */
function displayedPrice(school: SchoolWithPrice, resolved: ResolvedSchoolContent): number | null {
  if (resolved.price === null) return null;
  if (school.hasActiveOffer && school.salePrice !== null && school.salePrice < resolved.price) {
    return school.salePrice;
  }
  return resolved.price;
}

/** Canonical URL for a Product item: the review page when one exists, else the state page. */
function productUrl(slug: string, stateSlug: string, reviewSlugs: ReadonlySet<string>): string {
  return reviewSlugs.has(slug) ? `${SITE}/reviews/${slug}` : `${SITE}/${stateSlug}`;
}

function buildProduct(
  { school, resolved }: SchemaSchool,
  stateName: string,
  stateSlug: string,
  reviewSlugs: ReadonlySet<string>
): ProductSchema {
  const url = productUrl(school.slug, stateSlug, reviewSlugs);

  const product: ProductSchema = {
    "@type": "Product",
    name: `${school.name} — ${stateName} Traffic School`,
    url,
    brand: { "@type": "Brand", name: school.name },
  };

  // Offer — only when the card shows a price (matches it exactly, to the cent).
  const price = displayedPrice(school, resolved);
  if (price !== null) {
    product.offers = {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  // AggregateRating — only from genuine data the page displays; both must be > 0.
  // If either is missing the whole node is omitted (never a placeholder rating).
  if (
    school.rating !== null &&
    school.rating > 0 &&
    school.reviewCount !== null &&
    school.reviewCount > 0
  ) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(school.rating),
      reviewCount: String(school.reviewCount),
    };
  }

  return product;
}

/**
 * Build the ItemList of Products for a state's tier-1 comparison grid. `schools`
 * must be in display order — `position` is the rank (i + 1). Emit only when the
 * comparison cards render (online state with tier-1 schools); the caller gates this.
 */
export function buildComparisonItemList(
  schools: SchemaSchool[],
  stateName: string,
  stateSlug: string,
  reviewSlugs: ReadonlySet<string>,
  year: number
): ItemListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best Online Traffic Schools in ${stateName} (${year})`,
    itemListElement: schools.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: buildProduct(s, stateName, stateSlug, reviewSlugs),
    })),
  };
}

// ─── VideoObject (embedded state explainer videos) ──────────────────────────

/** A state's embedded explainer video — the real YouTube id + its metadata. */
export interface VideoEntry {
  id: string;
  uploadDate: string; // ISO 8601 date
  duration: string; // ISO 8601 duration, e.g. "PT3M16S"
  title: string;
}

interface VideoObjectSchema {
  "@context": "https://schema.org";
  "@type": "VideoObject";
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  embedUrl: string;
  url: string;
}

/**
 * VideoObject JSON-LD for an embedded state video. Emitted on the state page that
 * hosts the video (its dedicated section with an H2 is the "watch page" Google
 * requires). `description` must be non-empty — the caller passes the state's
 * intro paragraph or a factual fallback; `pageUrl` is the watch page it lives on.
 */
export function buildVideoObject(video: VideoEntry, description: string, pageUrl: string): VideoObjectSchema {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    uploadDate: video.uploadDate,
    duration: video.duration,
    embedUrl: `https://www.youtube.com/embed/${video.id}`,
    url: pageUrl,
  };
}
