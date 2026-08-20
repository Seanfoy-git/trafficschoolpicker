export type TrackingMethod = 'network' | 'direct' | 'coupon_code';

export interface BuildAffiliateLinkInput {
  school: {
    slug: string;
    name: string;
  };
  affiliateProgram: {
    trackingMethod: TrackingMethod | null;  // null treated as 'network'
    networkUrl?: string | null;
    partnerSlug?: string;
    couponCode?: string;
    destinationUrl?: string;
  };
  stateCode?: string;
  sourcePageId?: string;
}

export interface AffiliateLinkResult {
  href: string;
  rel: string;          // always 'sponsored nofollow'
  target: string;       // always '_blank'
  couponCode?: string;  // only set when trackingMethod = 'coupon_code'
  tracked: boolean;     // true when href is a real monetized/tracked link (tracker,
                        // network, or coupon) — false when it degraded to a bare
                        // website/# fallback. Drives the button label + sponsored rel.
}

const REL = 'sponsored nofollow';
const TARGET = '_blank';

/**
 * Build the tracker hop for ANY outbound school click so it lands in the click log,
 * monetized or not. The Worker resolves `slug:STATE` -> `slug:_default` (the bare
 * site for unmonetized schools) and logs every hit. Returns null when no tracker
 * host is configured (callers then fall back to the raw destination).
 */
export function trackerUrl(
  slug: string,
  opts: { stateCode?: string | null; sourcePageId?: string | null; src?: string } = {}
): string | null {
  const host = process.env.NEXT_PUBLIC_TRACKER_HOST?.replace(/\/+$/, '');
  if (!host || !slug) return null;
  const url = new URL(`${host}/c/${encodeURIComponent(slug)}`);
  if (opts.stateCode?.trim()) url.searchParams.set('s', opts.stateCode.trim());
  if (opts.sourcePageId?.trim()) url.searchParams.set('p', opts.sourcePageId.trim());
  if (opts.src?.trim()) url.searchParams.set('src', opts.src.trim());
  return url.toString();
}

function logWarn(message: string) {
  if (typeof console !== 'undefined') {
    console.warn(`[affiliate-link] ${message}`);
  }
}

function buildNetworkFallback(input: BuildAffiliateLinkInput, reason: string): AffiliateLinkResult {
  const { networkUrl, destinationUrl } = input.affiliateProgram;
  if (networkUrl) return { href: networkUrl, rel: REL, target: TARGET, tracked: true };
  if (destinationUrl) {
    logWarn(`${reason} — no networkUrl, falling back to destinationUrl for ${input.school.slug}`);
    return { href: destinationUrl, rel: REL, target: TARGET, tracked: false };
  }
  logWarn(`${reason} — no networkUrl or destinationUrl for ${input.school.slug}; returning #`);
  return { href: '#', rel: REL, target: TARGET, tracked: false };
}

export function buildAffiliateLink(input: BuildAffiliateLinkInput): AffiliateLinkResult {
  const method = input.affiliateProgram.trackingMethod ?? 'network';
  const { networkUrl, partnerSlug, couponCode, destinationUrl } = input.affiliateProgram;

  // Does this click earn? Drives the button label ("Enroll Now" vs "Visit Website")
  // and the sponsored rel — independent of routing.
  const monetized =
    method === 'direct' ? !!partnerSlug
    : method === 'coupon_code' ? !!destinationUrl
    : !!networkUrl; // network

  // UNIVERSAL TRACKING: every school routes through the tracker so the click is
  // logged, monetized or not. The KV map holds the real destination per school/state
  // (a `slug:_default` = bare site for unmonetized schools), so the frontend never
  // needs it. Falls back to the legacy direct-to-destination logic only when no
  // tracker host is configured.
  const hop = trackerUrl(input.school.slug, { stateCode: input.stateCode, sourcePageId: input.sourcePageId });
  if (hop) {
    return {
      href: hop,
      rel: monetized ? 'sponsored nofollow' : 'nofollow',
      target: TARGET,
      couponCode: method === 'coupon_code' ? couponCode : undefined,
      tracked: monetized,
    };
  }

  // ── No tracker host → legacy behavior ──────────────────────────────
  if (method === 'coupon_code') {
    if (!destinationUrl) {
      logWarn(`coupon_code method but destinationUrl missing for ${input.school.slug}; returning #`);
      return { href: '#', rel: REL, target: TARGET, couponCode, tracked: false };
    }
    return { href: destinationUrl, rel: REL, target: TARGET, couponCode, tracked: true };
  }
  return buildNetworkFallback(input, `${method} method (no tracker host)`);
}
