import { School } from "./schools";

export function buildAffiliateUrl(
  school: School,
  state: string,
  source: string
): string {
  const url = new URL(school.affiliateUrl);
  url.searchParams.set("utm_source", "trafficschoolpicker");
  url.searchParams.set("utm_medium", "comparison");
  url.searchParams.set("utm_campaign", state);
  url.searchParams.set("utm_content", source);
  return url.toString();
}

export async function trackClick(
  schoolId: string,
  state: string,
  source: string
): Promise<void> {
  try {
    await fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school: schoolId,
        state,
        source,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silent fail — don't block user navigation
  }
}
