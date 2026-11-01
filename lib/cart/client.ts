/**
 * Cart client — sf-051
 * (cart-svc `src/cart/cart.controller.ts`, read from source)
 *
 * Server-only. Two things cart-svc demands on **every** write, both handled
 * here so a handler cannot forget them:
 *
 * - **`x-idempotency-key`** — `IdempotencyInterceptor` rejects a POST/PATCH/
 *   DELETE without one (400 `VALIDATION_FAILED`). A fresh UUID is minted per
 *   call; a caller retrying one logical mutation passes its own key.
 * - **identity** — `CartIdentityGuard` reads Bearer first, then `x-session-id`.
 *   Both arrive pre-built from `identityHeaders()`; this client never inspects
 *   a cookie (it has no request object to read one from).
 *
 * `cache: "no-store"` on every method: a cart is private data and a cached cart
 * is a wrong cart (1.Architecture.md §6.7).
 */

import { createServiceClient } from "@/lib/http/client";
import type { Perform, ServiceResult } from "@/lib/http/result";
import {
  cartMergeResponseSchema,
  cartMutationResponseSchema,
  cartResponseSchema,
  type CartDto,
  type CartItemDto,
  type CartSnapshot,
  type CartTotalsDto,
} from "@/lib/cart/schemas";

/**
 * `{ authorization?, "x-session-id"? }` — produced by `identityHeaders()` in
 * `lib/session/identity.ts`. Structural rather than imported so the client stays
 * testable without a request.
 */
export type IdentityHeaders = Record<string, string>;

export interface AddItemInput {
  productId: string;
  variantId?: string;
  qty: number;
}

export interface CartMutation {
  item: CartItemDto;
  totals: CartTotalsDto;
}

export interface CartClientOptions {
  /** Injectable so tests get stable keys. */
  newKey?: () => string;
}

export interface WriteOptions {
  /** Reuse across retries of one logical mutation. Absent → minted. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface CartClient {
  getCart(identity: IdentityHeaders, options?: { signal?: AbortSignal }): Promise<ServiceResult<CartSnapshot>>;
  addItem(identity: IdentityHeaders, input: AddItemInput, options?: WriteOptions): Promise<ServiceResult<CartMutation>>;
  updateItem(identity: IdentityHeaders, itemId: string, qty: number, options?: WriteOptions): Promise<ServiceResult<CartMutation>>;
  removeItem(identity: IdentityHeaders, itemId: string, options?: WriteOptions): Promise<ServiceResult<undefined>>;
  removeItems(identity: IdentityHeaders, ids: string[], options?: WriteOptions): Promise<ServiceResult<undefined>>;
  clear(identity: IdentityHeaders, options?: WriteOptions): Promise<ServiceResult<undefined>>;
  merge(identity: IdentityHeaders, options?: WriteOptions): Promise<ServiceResult<CartDto>>;
}

const BASE = "/api/v1/cart";

export function createCartClient(
  perform: Perform,
  options: CartClientOptions = {},
): CartClient {
  const newKey = options.newKey ?? (() => crypto.randomUUID());

  function key(options?: WriteOptions): string {
    return options?.idempotencyKey ?? newKey();
  }

  return {
    getCart(identity, requestOptions) {
      return perform({
        path: BASE,
        headers: identity,
        schema: cartResponseSchema,
        cache: "no-store",
        signal: requestOptions?.signal,
      });
    },

    async addItem(identity, input, requestOptions) {
      const body: AddItemInput = { productId: input.productId, qty: input.qty };
      if (input.variantId) body.variantId = input.variantId;

      const result = await perform({
        method: "POST",
        path: `${BASE}/items`,
        headers: { ...identity, "x-idempotency-key": key(requestOptions) },
        body,
        schema: cartMutationResponseSchema,
        cache: "no-store",
        signal: requestOptions?.signal,
      });
      if (!result.ok) return result;
      return { ok: true, data: { item: result.data.item, totals: result.data.cartTotals } };
    },

    async updateItem(identity, itemId, qty, requestOptions) {
      const result = await perform({
        method: "PATCH",
        path: `${BASE}/items/${encodeURIComponent(itemId)}`,
        headers: { ...identity, "x-idempotency-key": key(requestOptions) },
        body: { qty },
        schema: cartMutationResponseSchema,
        cache: "no-store",
        signal: requestOptions?.signal,
      });
      if (!result.ok) return result;
      return { ok: true, data: { item: result.data.item, totals: result.data.cartTotals } };
    },

    removeItem(identity, itemId, requestOptions) {
      return perform({
        method: "DELETE",
        path: `${BASE}/items/${encodeURIComponent(itemId)}`,
        headers: { ...identity, "x-idempotency-key": key(requestOptions) },
        cache: "no-store",
        signal: requestOptions?.signal,
      });
    },

    removeItems(identity, ids, requestOptions) {
      return perform({
        method: "DELETE",
        path: `${BASE}/items`,
        headers: { ...identity, "x-idempotency-key": key(requestOptions) },
        body: { ids },
        cache: "no-store",
        signal: requestOptions?.signal,
      });
    },

    clear(identity, requestOptions) {
      return perform({
        method: "DELETE",
        path: BASE,
        headers: { ...identity, "x-idempotency-key": key(requestOptions) },
        cache: "no-store",
        signal: requestOptions?.signal,
      });
    },

    async merge(identity, requestOptions) {
      const result = await perform({
        method: "POST",
        path: `${BASE}/merge`,
        headers: { ...identity, "x-idempotency-key": key(requestOptions) },
        // The merge budget is tighter than the client's: login must not hang on
        // a slow cart-svc (see `lib/auth/merge.ts`).
        schema: cartMergeResponseSchema,
        cache: "no-store",
        signal: requestOptions?.signal,
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data.cart };
    },
  };
}

/** Constructed per call so the registry's env read stays live. */
export function cartClient(): CartClient {
  return createCartClient(createServiceClient("cart"));
}
