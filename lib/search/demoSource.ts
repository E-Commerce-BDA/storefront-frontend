/**
 * Demo search source — clearly-named throwaway for previews and tests.
 * Same shapes the search-svc source will return; swapped at the call site
 * (one line) when it lands. Never import from production routes.
 */
import type { SearchResult, SearchSource } from "./source";

const CATALOG: SearchResult[] = [
  { id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts", tag: "Bestseller", rating: 4.8 },
  { id: "p2", name: "Raw Hem Linen Trouser", price: 94, image: "", category: "Pants", tag: "Organic", rating: 4.7 },
  { id: "p3", name: "Minimalist Suede Bomber Jacket", price: 245, image: "", category: "Outerwear", tag: "Trending", rating: 4.9 },
  { id: "p4", name: "Lug-Sole Leather Chelsea Boots", price: 185, image: "", category: "Footwear", tag: "Waterproof", rating: 4.6 },
  { id: "p5", name: "Oversized Cashmere Knit Sweater", price: 160, image: "", category: "Shirts", tag: "Bestseller", rating: 4.9 },
  { id: "p6", name: "Structured Canvas Weekender Bag", price: 110, image: "", category: "Accessories", tag: "Heavyweight", rating: 4.7 },
];

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
