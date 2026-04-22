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
}

const REL = 'sponsored nofollow';
const TARGET = '_blank';

function logWarn(message: string) {
  if (typeof console !== 'undefined') {
    console.warn(`[affiliate-link] ${message}`);
  }
}

function buildNetworkFallback(input: BuildAffiliateLinkInput, reason: string): AffiliateLinkResult {
  const { networkUrl, destinationUrl } = input.affiliateProgram;
  if (networkUrl) return { href: networkUrl, rel: REL, target: TARGET };
  if (destinationUrl) {
    logWarn(`${reason} — no networkUrl, falling back to destinationUrl for ${input.school.slug}`);
    return { href: destinationUrl, rel: REL, target: TARGET };
  }
  logWarn(`${reason} — no networkUrl or destinationUrl for ${input.school.slug}; returning #`);
  return { href: '#', rel: REL, target: TARGET };
}

function buildDirectLink(
  input: BuildAffiliateLinkInput,
  trackerHost: string
): AffiliateLinkResult {
  const { partnerSlug } = input.affiliateProgram;
  const { stateCode, sourcePageId } = input;

  const host = trackerHost.replace(/\/+$/, '');
  const url = new URL(`${host}/c/${encodeURIComponent(partnerSlug!)}`);
  if (stateCode && stateCode.trim()) url.searchParams.set('s', stateCode);
  if (sourcePageId && sourcePageId.trim()) url.searchParams.set('p', sourcePageId);

  return { href: url.toString(), rel: REL, target: TARGET };
}

export function buildAffiliateLink(input: BuildAffiliateLinkInput): AffiliateLinkResult {
  const method = input.affiliateProgram.trackingMethod ?? 'network';

  if (method === 'network') {
    return buildNetworkFallback(input, 'network method');
  }

  if (method === 'direct') {
    const trackerHost = process.env.NEXT_PUBLIC_TRACKER_HOST;
    if (!trackerHost) {
      logWarn(`direct tracking requested but NEXT_PUBLIC_TRACKER_HOST is unset; falling back to network URL for ${input.school.slug}`);
      return buildNetworkFallback(input, 'direct method (no tracker host)');
    }
    if (!input.affiliateProgram.partnerSlug) {
      logWarn(`direct tracking requested but partnerSlug is missing for ${input.school.slug}; falling back to network URL`);
      return buildNetworkFallback(input, 'direct method (no partner slug)');
    }
    return buildDirectLink(input, trackerHost);
  }

  if (method === 'coupon_code') {
    const { destinationUrl, couponCode } = input.affiliateProgram;
    if (!destinationUrl) {
      logWarn(`coupon_code method but destinationUrl missing for ${input.school.slug}; returning #`);
      return { href: '#', rel: REL, target: TARGET, couponCode };
    }
    return { href: destinationUrl, rel: REL, target: TARGET, couponCode };
  }

  // Exhaustiveness guard — unknown method
  logWarn(`unknown trackingMethod '${method}' for ${input.school.slug}; falling back to network URL`);
  return buildNetworkFallback(input, `unknown method '${method}'`);
}
