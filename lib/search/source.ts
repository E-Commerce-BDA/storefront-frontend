/**
 * Search source port — Oceanic Blue v1.0
 *
 * Hooks depend on this interface, never on URLs or fetch. The demo source
 * (demoSource.ts) serves today; the search-svc source swaps in at the call
 * site (one line) when it lands. Throwaway-by-replacement, never rewrite.
 *
 * Pure types + port. No React, no fetch.
 */

/** The one category token for product rows (shared by suggest + trending). */
export const SEARCH_PRODUCT_CATEGORY = "Products";

export interface SearchResult {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  url?: string;
  tag?: string;
  rating?: number;
  ratingCount?: number;
}

export interface SearchSource {
  /**
   * Ranked suggest for `q` (already debounced + min-length gated by the
   * hook). Aborts on `signal` — stale responses must never overwrite.
   */
  suggest(q: string, signal: AbortSignal): Promise<SearchResult[]>;
}
