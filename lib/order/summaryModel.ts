/**
 * Order summary resolver — sf-088. Pure. The free-shipping bar is derived from
 * money the caller already resolved; no component recalculates totals.
 */
export interface OrderSummaryInput {
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  freeShipThreshold?: number;
}

export interface ResolvedOrderSummary {
  remaining: number;
  /** 0–100, clamped — the CSS var never receives a runaway percentage. */
  progress: number;
  freeShip: boolean;
  total: number;
  shipping: number;
  tax: number;
}

export const DEFAULT_ORDER_SUMMARY = {
  discount: 0,
  shipping: 0,
  tax: 0,
  freeShipThreshold: 120,
};

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function resolveOrderSummary(
  input: OrderSummaryInput,
  flat: { freeShipThreshold?: number } = {},
): ResolvedOrderSummary {
  const discount = input.discount ?? DEFAULT_ORDER_SUMMARY.discount;
  const shipping = input.shipping ?? DEFAULT_ORDER_SUMMARY.shipping;
  const tax = input.tax ?? DEFAULT_ORDER_SUMMARY.tax;
  const threshold = Math.max(
    0,
    flat.freeShipThreshold ?? input.freeShipThreshold ?? DEFAULT_ORDER_SUMMARY.freeShipThreshold,
  );
  const remaining = Math.max(0, threshold - input.subtotal);
  return {
    remaining,
    progress: threshold === 0 ? 100 : clampPercent(((input.subtotal - discount) / threshold) * 100),
    freeShip: threshold === 0 || input.subtotal >= threshold,
    total: Math.max(0, input.subtotal - discount + shipping + tax),
    shipping,
    tax,
  };
}
