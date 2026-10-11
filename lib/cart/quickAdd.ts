/**
 * Quick-add port — Oceanic Blue v1.0
 *
 * Hooks depend on this interface, never on URLs or fetch. The demo stub
 * below serves today (120ms delay, always ok); the cart-svc source swaps
 * in at the call site (one line) when it lands. Throwaway-by-replacement,
 * never rewrite.
 *
 * Pure types + port + demo. No React, no fetch.
 */

export type QuickAddError = "out-of-stock" | "aborted" | "unavailable";

export interface QuickAddResult {
  ok: boolean;
  error?: QuickAddError;
}

export interface QuickAddPort {
  /** Add one unit of `productId`. Aborts on `signal`. */
  add(productId: string, signal: AbortSignal): Promise<QuickAddResult>;
}

/** Demo stub: resolves ok after a beat (cart-svc replaces this, not callers). */
export function createDemoQuickAdd(delayMs = 120): QuickAddPort {
  return {
    add(_productId: string, signal: AbortSignal): Promise<QuickAddResult> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ ok: true }), delayMs);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        });
      });
    },
  };
}
