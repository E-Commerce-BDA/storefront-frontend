/**
 * Trending-terms port — Oceanic Blue v1.0
 *
 * Hooks depend on this interface, never on URLs or fetch. The demo list
 * (DEMO_TRENDING in demoSource.ts) serves today; the search-svc/CMS source
 * swaps in at the call site (one line) when it lands.
 * Throwaway-by-replacement, never rewrite.
 *
 * Pure types + port. No React, no fetch.
 */

export interface TrendingSource {
  /** Ranked trending terms. Aborts on `signal` — stale lists never land. */
  list(signal: AbortSignal): Promise<string[]>;
}
