/**
 * Curated blog ↔ state relevance map. Drives the bidirectional in-content
 * cross-links that distribute crawl equity between the blog and state pages:
 *   - each blog post → its 2–3 most relevant state pages (RelatedStateGuides)
 *   - each state page → its most relevant posts (RelatedPosts)
 *
 * State targets are gated downstream on getLinkableStates(), so a code listed
 * here that isn't yet Content Status Complete/Partial simply won't render.
 * Post targets are always renderable (every published post is a real route).
 */

// Blog post slug → most relevant state codes (most relevant first).
export const POST_STATE_LINKS: Record<string, string[]> = {
  "how-to-dismiss-traffic-ticket-california": ["CA"],
  "texas-deferred-disposition": ["TX"],
  "florida-bdi-vs-adi": ["FL"],
  "idrivesafely-vs-aceable": ["CA", "TX", "FL"],
  "does-traffic-school-remove-points": ["CA", "NY", "NJ"],
  "how-long-does-online-traffic-school-take": ["CA", "TX", "FL"],
  "how-to-dismiss-traffic-ticket-online": ["CA", "TX", "FL"],
  "traffic-school-vs-paying-ticket": ["CA", "FL", "NY"],
  "best-online-traffic-schools-2026": ["CA", "TX", "FL"],
};

// General-interest posts used to backfill state pages that have no dedicated
// post, so every state page still surfaces a few relevant guides.
const GENERAL_POSTS = [
  "best-online-traffic-schools-2026",
  "how-to-dismiss-traffic-ticket-online",
  "traffic-school-vs-paying-ticket",
];

// State code → relevant post slugs: dedicated posts first, then general posts
// as backfill, deduped and capped.
export function getPostsForState(stateCode: string, max = 3): string[] {
  const code = stateCode.toUpperCase();
  const dedicated = Object.keys(POST_STATE_LINKS).filter((slug) =>
    POST_STATE_LINKS[slug].includes(code)
  );
  const out: string[] = [];
  for (const slug of [...dedicated, ...GENERAL_POSTS]) {
    if (!out.includes(slug)) out.push(slug);
    if (out.length >= max) break;
  }
  return out;
}

// Blog post slug → relevant state codes (ungated; caller filters on linkable).
export function getStatesForPost(postSlug: string): string[] {
  return POST_STATE_LINKS[postSlug] ?? [];
}
