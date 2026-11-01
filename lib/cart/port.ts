"use client";

/**
 * Browser cart endpoints — sf-051
 * (plan §9: `lib/cart/port.ts`)
 *
 * The only module in the storefront that knows the cart BFF's paths. Two
 * consumers, one reason to exist:
 *
 * - `CartProvider` (add / qty / remove / clear).
 * - `createCartPort()` — the `QuickAddPort` adapter that `useQuickAdd` already
 *   consumes, so a ProductCard does not learn about carts either. The demo stub
 *   in `lib/cart/quickAdd.ts` survives only for the `/components` showcase; the
 *   commerce path has no stub.
 *
 * Every call goes through `bff()`, which mints the idempotency key once and
 * replays it after a 401 refresh — a tap that survives a token rotation must
 * not add the item twice.
 *
 * Why the error mapping is this blunt: `QuickAddError` has three values, and
 * the card can only say one of three things. `422 CART_PRODUCT_UNAVAILABLE` is
 * the one upstream code with distinct shopper copy ("out of stock"); everything
 * else is "try again" and does not deserve its own branch.
 */

import { bff } from "@/lib/http/browser";
import type { ServiceResult } from "@/lib/http/result";
import { cartMutationSchema, cartSnapshotSchema, type CartMutationDto, type CartSnapshotDto } from "@/lib/cart/schemas";
import type { QuickAddPort, QuickAddResult } from "@/lib/cart/quickAdd";

const ITEMS = "/api/cart/items";

export interface AddItemRequest {
  productId: string;
  variantId?: string;
  qty?: number;
  signal?: AbortSignal;
}

export function postCartItem(request: AddItemRequest): Promise<ServiceResult<CartMutationDto>> {
  const body: { productId: string; qty: number; variantId?: string } = {
    productId: request.productId,
    qty: request.qty ?? 1,
  };
  if (request.variantId !== undefined) body.variantId = request.variantId;

  return bff<CartMutationDto>(ITEMS, {
    method: "POST",
    body,
    schema: cartMutationSchema,
    signal: request.signal,
  });
}

export function patchCartQty(
  itemId: string,
  qty: number,
  signal?: AbortSignal,
): Promise<ServiceResult<CartMutationDto>> {
  return bff<CartMutationDto>(`${ITEMS}/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: { qty },
    schema: cartMutationSchema,
    signal,
  });
}

export function deleteCartItem(
  itemId: string,
  signal?: AbortSignal,
): Promise<ServiceResult<undefined>> {
  return bff<undefined>(`${ITEMS}/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    signal,
  });
}

export function getCart(signal?: AbortSignal): Promise<ServiceResult<CartSnapshotDto>> {
  return bff<CartSnapshotDto>("/api/cart", { schema: cartSnapshotSchema, signal });
}

export function clearCart(signal?: AbortSignal): Promise<ServiceResult<undefined>> {
  return bff<undefined>("/api/cart", { method: "DELETE", signal });
}

export interface CartPortOptions {
  /**
   * Called with the server's line after a successful add, so the caller's store
   * can show the real price and quantity instead of the optimistic line.
   */
  onAdded?: (mutation: CartMutationDto) => void;
}

/**
 * `QuickAddPort` over the cart BFF.
 *
 * Aborts reject with `Error("aborted")` — that is the contract `useQuickAdd`
 * documents (a rejection it recognises as silence, not as a failure to report),
 * and it matches the demo port it replaces.
 */
export function createCartPort(options: CartPortOptions = {}): QuickAddPort {
  return {
    async add(productId: string, signal: AbortSignal): Promise<QuickAddResult> {
      if (signal.aborted) throw new Error("aborted");

      const result = await postCartItem({ productId, qty: 1, signal });

      if (result.ok) {
        options.onAdded?.(result.data);
        return { ok: true };
      }
      if (result.code === "ABORTED") throw new Error("aborted");
      return { ok: false, error: result.status === 422 ? "out-of-stock" : "unavailable" };
    },
  };
}
