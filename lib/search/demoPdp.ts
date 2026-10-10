/**
 * Demo product-detail map — clearly-named throwaway for previews and tests.
 * Separate map keyed by id (NOT inline in the suggest catalog): suggest
 * payloads stay tiny while preview data stays rich. Swapped at the call
 * site (one line) when the catalog read lands. Never import from
 * production routes.
 */
import type { ProductDetail, ProductDetailSource } from "./pdp";

const DETAILS: Record<string, ProductDetail> = {
  p1: {
    id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts",
    tag: "Bestseller", rating: 4.8,
    description: "Ethically manufactured. Natural dyes and tailored European cut.",
    sizes: ["S", "M", "L", "XL"], stock: 14,
  },
  p2: {
    id: "p2", name: "Raw Hem Linen Trouser", price: 94, image: "", category: "Pants",
    tag: "Organic", rating: 4.7,
    description: "Raw hems, garment-dyed linen twill. Cut roomy through the leg.",
    sizes: ["S", "M", "L"], stock: 6,
  },
  p3: {
    id: "p3", name: "Minimalist Suede Bomber Jacket", price: 245, image: "", category: "Outerwear",
    tag: "Trending", rating: 4.9,
    description: "Full-grain suede, quilted satin lining. Ages beautifully.",
    sizes: ["M", "L", "XL"], stock: 3,
  },
  p4: {
    id: "p4", name: "Lug-Sole Leather Chelsea Boots", price: 185, image: "", category: "Footwear",
    tag: "Waterproof", rating: 4.6,
    description: "Storm-welted leather, lugged sole. Resoleable for life.",
    sizes: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], stock: 8,
  },
  p5: {
    id: "p5", name: "Oversized Cashmere Knit Sweater", price: 160, image: "", category: "Shirts",
    tag: "Bestseller", rating: 4.9,
    description: "Seven-gauge 100% cashmere, hand-linked seams.",
    sizes: ["XS", "S", "M", "L", "XL"], stock: 9,
  },
  p6: {
    id: "p6", name: "Structured Canvas Weekender Bag", price: 110, image: "", category: "Accessories",
    tag: "Heavyweight", rating: 4.7,
    description: "22oz canvas, leather trim, fits a 16-inch laptop.",
    sizes: ["One Size"], stock: 20,
  },
};

export function createDemoPdpSource(delayMs = 150): ProductDetailSource {
  return {
    fetchProduct(id: string, signal: AbortSignal): Promise<ProductDetail | null> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve(DETAILS[id] ?? null);
        }, delayMs);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        });
      });
    },
  };
}
