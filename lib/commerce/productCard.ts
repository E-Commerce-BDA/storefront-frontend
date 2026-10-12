/**
 * Product card data — extends SearchResult additively (never forks).
 * All new fields optional: absent renders the base face.
 */
import type { SearchResult } from "@/lib/search/source";

export type ProductStock = "in" | "low" | "out";
export type MediaRatio = "3:4" | "4:3" | "4:5" | "1:1" | "16:9";
export type BadgePosition = "left" | "right";
export type HoverMode = "image" | "actions";
export type QuickAction = "quick-view" | "wishlist" | "add-to-cart" | "share";
export type CtaPosition = "left" | "center" | "right";

export interface ProductCardData extends SearchResult {
  /** Hover-swap image (admin sets; absent = static cover). */
  hoverImage?: string;
  /** PDP destination (owner routes; absent = onOpen only). */
  url?: string;
  /** Compare-at price (strikethrough + sale face when above price). */
  compareAt?: number;
  stock?: ProductStock;
  wishlisted?: boolean;
}

/** Reserved (deferred slices land here — never stubbed UI). */
export interface ProductCardReserved {
  /** Single-attribute quick-pick (needs variant-inventory thinking). */
  selectedAttribute?: string;
  onAttribute?: (attr: string) => void;
  onQuickView?: (p: ProductCardData) => void;
  onCompare?: (p: ProductCardData) => void;
}
