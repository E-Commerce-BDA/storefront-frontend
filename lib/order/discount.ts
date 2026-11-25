/**
 * Coupon arithmetic — sf-057
 *
 * One pure function, used by the cart preview and the checkout summary. A
 * second copy would let the two surfaces disagree about what the code is
 * worth, which is exactly the 409 surprise the cart-side preview exists to
 * prevent. The final number still comes from order-svc; this is a preview.
 */

import type { DiscountValidationResult } from "./schemas";

const roundCents = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, subtotal: number) => Math.max(0, Math.min(value, subtotal));

export function discountAmount(
  result: DiscountValidationResult | null,
  subtotal: number,
): number {
  if (result === null || !result.valid) return 0;
  const ceiling = Math.max(0, subtotal);
  if (typeof result.discount === "number") return roundCents(clamp(result.discount, ceiling));
  if (result.discountType === "percent" && typeof result.value === "number") {
    return roundCents(clamp((ceiling * result.value) / 100, ceiling));
  }
  if (result.discountType === "fixed" && typeof result.value === "number") {
    return roundCents(clamp(result.value, ceiling));
  }
  return 0;
}

export function totalAfterDiscount(subtotal: number, discount: number): number {
  return roundCents(Math.max(0, subtotal - discount));
}
