/**
 * Product-detail port for inspect previews — Oceanic Blue v1.0
 *
 * Lazy by design: suggest payloads stay tiny (name/price/image only);
 * sizes/stock/description load per inspected product, where freshness
 * matters most (a stock number embedded at suggest time is already stale
 * when believed). Same injected-source pattern as `source.ts`.
 *
 * Pure types + port. No React, no fetch.
 */

export interface ProductDetail {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  tag?: string;
  rating?: number;
  description: string;
  sizes: string[];
  /** Units available; 0 renders the out-of-stock state. */
  stock: number;
}

export interface ProductDetailSource {
  /**
   * Full detail for one inspected product. Aborts on `signal` — hover
   * sweeps across rows must never resolve out of order into the panel.
   * Returns null when the id is unknown (absent data, absent preview).
   */
  fetchProduct(id: string, signal: AbortSignal): Promise<ProductDetail | null>;
}
