/**
 * Demo search source — clearly-named throwaway for previews and tests.
 * Same shapes the search-svc source will return; swapped at the call site
 * (one line) when it lands. Never import from production routes.
 */
import type { SearchResult, SearchSource } from "./source";

const CATALOG: SearchResult[] = [
  { id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts", tag: "Bestseller", rating: 4.8, ratingCount: 142 },
  { id: "p2", name: "Raw Hem Linen Trouser", price: 94, image: "", category: "Pants", tag: "Organic", rating: 4.7, ratingCount: 89 },
  { id: "p3", name: "Minimalist Suede Bomber Jacket", price: 245, image: "", category: "Outerwear", tag: "Trending", rating: 4.9, ratingCount: 210 },
  { id: "p4", name: "Lug-Sole Leather Chelsea Boots", price: 185, image: "", category: "Footwear", tag: "Waterproof", rating: 4.6, ratingCount: 156 },
  { id: "p5", name: "Oversized Cashmere Knit Sweater", price: 160, image: "", category: "Shirts", tag: "Bestseller", rating: 4.9, ratingCount: 98 },
  { id: "p6", name: "Structured Canvas Weekender Bag", price: 110, image: "", category: "Accessories", tag: "Heavyweight", rating: 4.7, ratingCount: 64 },
];

/**
 * Trending terms for the palette's empty-query view (photo terms).
 * Throwaway with the source — search-svc/CMS trending replaces this
 * export through the TrendingSource port, never the component.
 */
export const DEMO_TRENDING: string[] = [
  "Linen shirts",
  "Chelsea boots",
  "Cashmere knit",
  "Canvas tote",
  "Suede jackets",
];

/**
 * Curated rows for the editorial takeover's empty-query view (photo: grid
 * present before typing). Throwaway with the source — CMS collections
 * replace this export, never the component.
 */
export const DEMO_CATALOG: SearchResult[] = CATALOG;

export function createDemoSource(delayMs = 120): SearchSource {
  return {
    suggest(q: string, signal: AbortSignal): Promise<SearchResult[]> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const needle = q.trim().toLowerCase();
          resolve(CATALOG.filter((p) => p.name.toLowerCase().includes(needle)).slice(0, 8));
        }, delayMs);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        });
      });
    },
  };
}
