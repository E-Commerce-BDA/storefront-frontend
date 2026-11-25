/**
 * Per-line stock ceiling — sf-058
 *
 * Pure: cart-svc never holds stock, so our BFF attaches it from catalog and
 * this is the single place that turns it into a legal stepper/write ceiling.
 * A missing or malformed stock value falls back to the house ceiling rather
 * than to zero, which would make a healthy line look unbuyable.
 */

import { QTY_LIMITS } from "@/lib/commerce/quantity";

export function stockCeiling(stock: number | null | undefined): number {
  if (typeof stock !== "number" || !Number.isFinite(stock)) return QTY_LIMITS.max;
  return Math.max(QTY_LIMITS.min, Math.min(QTY_LIMITS.max, Math.floor(stock)));
}

export function capToStock(qty: number, stock: number | null | undefined): number {
  return Math.min(qty, stockCeiling(stock));
}
