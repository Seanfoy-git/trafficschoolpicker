/**
 * Static geographic-adjacency map keyed by state code. Powers the "Nearby
 * states" cross-link module that pushes crawl equity from indexed state pages
 * to their neighbors. Neighbors are land-border states (with sensible regional
 * proxies for non-contiguous AK/HI), ordered roughly by relevance. The
 * "Nearby states" module gates each target on getLinkableStates(), so it's safe
 * to list neighbors here that aren't yet Content Status Complete/Partial — they
 * simply won't render until they qualify.
 *
 * Not sourced from Notion: geography is constant. See lib/state-utils.ts for the
 * code → slug/name mapping used to build the hrefs.
 */
export const STATE_ADJACENCY: Record<string, string[]> = {
  AL: ["GA", "FL", "MS", "TN"],
  AK: ["WA", "OR", "CA", "HI"], // non-contiguous — western/Pacific proxies
  AZ: ["CA", "NV", "UT", "NM", "CO"],
  AR: ["TX", "OK", "MO", "TN", "MS", "LA"],
  CA: ["NV", "OR", "AZ", "WA", "ID"],
  CO: ["WY", "NE", "KS", "OK", "NM", "UT"],
  CT: ["NY", "MA", "RI", "NJ"],
  DE: ["MD", "NJ", "PA", "VA"],
  FL: ["GA", "AL", "SC"],
  GA: ["FL", "AL", "SC", "TN", "NC"],
  HI: ["CA", "NV", "OR", "WA"], // non-contiguous — Pacific-coast proxies
  ID: ["WA", "OR", "NV", "UT", "WY", "MT"],
  IL: ["IN", "WI", "IA", "MO", "KY"],
  IN: ["IL", "OH", "MI", "KY", "WI"],
  IA: ["MN", "WI", "IL", "MO", "NE", "SD"],
  KS: ["NE", "MO", "OK", "CO"],
  KY: ["TN", "IN", "OH", "VA", "WV", "IL"],
  LA: ["TX", "AR", "MS"],
  ME: ["NH", "MA", "VT"],
  MD: ["VA", "PA", "DE", "WV"],
  MA: ["NY", "CT", "RI", "NH", "VT"],
  MI: ["OH", "IN", "WI", "IL"],
  MN: ["WI", "IA", "SD", "ND"],
  MS: ["LA", "AL", "TN", "AR"],
  MO: ["KS", "IL", "IA", "AR", "OK", "NE", "TN"],
  MT: ["ND", "SD", "WY", "ID"],
  NE: ["KS", "IA", "MO", "CO", "WY", "SD"],
  NV: ["CA", "AZ", "UT", "OR", "ID"],
  NH: ["ME", "MA", "VT"],
  NJ: ["NY", "PA", "DE", "CT"],
  NM: ["AZ", "CO", "TX", "OK", "UT"],
  NY: ["PA", "NJ", "CT", "MA", "VT"],
  NC: ["SC", "GA", "VA", "TN"],
  ND: ["MN", "SD", "MT"],
  OH: ["PA", "MI", "IN", "KY", "WV"],
  OK: ["TX", "KS", "MO", "AR", "CO", "NM"],
  OR: ["CA", "WA", "NV", "ID"],
  PA: ["NY", "NJ", "OH", "MD", "DE", "WV"],
  RI: ["CT", "MA", "NY"],
  SC: ["NC", "GA", "FL"],
  SD: ["ND", "MN", "IA", "NE", "WY", "MT"],
  TN: ["KY", "GA", "AL", "MS", "AR", "MO", "VA", "NC"],
  TX: ["OK", "NM", "LA", "AR"],
  UT: ["NV", "AZ", "CO", "WY", "ID", "NM"],
  VT: ["NY", "NH", "MA", "ME"],
  VA: ["NC", "MD", "WV", "KY", "TN", "DE"],
  WA: ["OR", "ID", "CA", "MT"],
  WV: ["PA", "OH", "KY", "VA", "MD"],
  WI: ["IL", "IN", "MI", "MN", "IA"],
  WY: ["MT", "SD", "NE", "CO", "UT", "ID"],
};
