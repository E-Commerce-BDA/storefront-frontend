/**
 * Search → product card — sf-081.
 *
 * `ProductCardData` extends `SearchResult`, so this is the one place that adds
 * the card's media shape instead of letting three overlays each invent a
 * letter tile. A missing image stays missing: the card media cell paints its
 * own solid fallback, and no letter is fabricated from the product name.
 */
import type { SearchResult } from "@/lib/search/source";
import type { ProductCardData } from "./productCard";

export function fromSearchResult(result: SearchResult): ProductCardData {
  return {
    ...result,
    ...(result.image !== "" ? { images: [{ url: result.image, alt: result.name }] } : {}),
  };
}

export function fromSearchResults(results: readonly SearchResult[]): ProductCardData[] {
  return results.map(fromSearchResult);
}
