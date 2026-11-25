/**
 * Stock-shortfall resolver — ord-013 consumer half
 *
 * Pure: order-svc now attaches `details.itemIds` and `details.items` to its 409
 * STOCK_INSUFFICIENT envelope. This is the one place that parses and matches
 * them to cart lines. Nothing here reads the error message: prose is copy, ids
 * are data.
 */

import { stockShortfallSchema, type StockShortfall } from "@/lib/order/schemas";

export interface ShortLine {
  productId: string;
  variantId?: string | null;
}

export function resolveShortfall(details: unknown): StockShortfall | null {
  const parsed = stockShortfallSchema.safeParse(details);
  return parsed.success ? parsed.data : null;
}

export function isShortLine(shortfall: StockShortfall, line: ShortLine): boolean {
  const reservationKey = line.variantId ?? line.productId;
  if (shortfall.itemIds.includes(reservationKey)) return true;
  return shortfall.items.some(
    (item) =>
      item.productId === line.productId &&
      (item.variantId ?? null) === (line.variantId ?? null),
  );
}
