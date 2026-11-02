/**
 * Order client — sf-051
 * (order-svc `checkout.controller.ts`, `orders.controller.ts`)
 *
 * Server-only. Three calls, all `no-store`: an order is private and a cached
 * order is someone else's order.
 *
 * Checkout carries the caller's `x-idempotency-key` through untouched. The key
 * belongs to the caller because the guarantee is about *one logical attempt*:
 * minting it here would mean the second POST after a network blip created a
 * second order — order-svc's replay cache is keyed on the header, so the value
 * has to survive the retry loop that lives in the browser.
 */

import { createServiceClient } from "@/lib/http/client";
import type { Perform, ServiceResult } from "@/lib/http/result";
import type { IdentityHeaders } from "@/lib/cart/client";
import {
  checkoutConfirmationSchema,
  orderListResponseSchema,
  orderResponseSchema,
  type CheckoutConfirmationDto,
  type CheckoutInput,
  type OrderDto,
  type ValidateDiscountCodeInput,
  discountValidationResultSchema,
  type DiscountValidationResult,
} from "@/lib/order/schemas";

export interface OrderPage {
  orders: OrderDto[];
  nextCursor: string | null;
}

export interface ListOrdersQuery {
  cursor?: string;
  limit?: number;
}

export interface OrderClient {
  checkout(
    identity: IdentityHeaders,
    input: CheckoutInput,
    options: { idempotencyKey: string; signal?: AbortSignal },
  ): Promise<ServiceResult<CheckoutConfirmationDto>>;
  listOrders(
    identity: IdentityHeaders,
    query?: ListOrdersQuery,
  ): Promise<ServiceResult<OrderPage>>;
  getOrder(identity: IdentityHeaders, orderId: string): Promise<ServiceResult<OrderDto>>;
  validateDiscountCode(input: ValidateDiscountCodeInput): Promise<ServiceResult<DiscountValidationResult>>;
}

const BASE = "/api/v1/order";

export function createOrderClient(perform: Perform): OrderClient {
  return {
    checkout(identity, input, options) {
      return perform({
        method: "POST",
        path: `${BASE}/checkout`,
        headers: { ...identity, "x-idempotency-key": options.idempotencyKey },
        body: input,
        schema: checkoutConfirmationSchema,
        cache: "no-store",
        signal: options.signal,
      });
    },

    async listOrders(identity, query = {}) {
      const result = await perform({
        path: `${BASE}/me/orders`,
        headers: identity,
        query: { cursor: query.cursor, limit: query.limit },
        schema: orderListResponseSchema,
        cache: "no-store",
      });
      if (!result.ok) return result;
      return {
        ok: true,
        data: { orders: result.data.data, nextCursor: result.data.nextCursor ?? null },
      };
    },

    async getOrder(identity, orderId) {
      const result = await perform({
        path: `${BASE}/orders/${encodeURIComponent(orderId)}`,
        headers: identity,
        schema: orderResponseSchema,
        cache: "no-store",
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data.order };
    },
    validateDiscountCode(input) {
      return perform({
        method: "POST",
        path: `${BASE}/discount-codes/validate`,
        body: input,
        schema: discountValidationResultSchema,
        cache: "no-store",
      });
    },
  };
}

/** Constructed per call so the registry's env read stays live. */
export function orderClient(): OrderClient {
  return createOrderClient(createServiceClient("order"));
}
