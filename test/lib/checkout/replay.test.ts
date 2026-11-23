/**
 * Checkout replay — sf-053
 *
 * The two cases that were missing at the client layer, written against
 * order-svc's *actual* replay contract (`checkout.service.ts`):
 *
 * - the same `x-idempotency-key` with the same body returns the order it
 *   already created (200, same `orderId`) — never a second order;
 * - the same key with a changed body is `409 IDEMPOTENCY_CONFLICT`, because
 *   replaying it would hand the shopper the order for the *old* basket;
 * - a stock failure is `409` with a code the island can name.
 *
 * The fixtures are parsed with the real `checkoutConfirmationSchema`, which is
 * the whole point: the 1.5.0 mismatch shipped because a local fixture and a
 * remote shape drifted and no test compared them. Here a drift fails a test
 * instead of a browser.
 */
import { describe, expect, it } from "vitest";
import { bodyHash, nextKey, type IdemPair } from "@/lib/checkout/idempotency";
import { failure, type Perform, type RequestOptions } from "@/lib/http/result";
import { createOrderClient } from "@/lib/order/client";
import {
  checkoutConfirmationSchema,
  type CheckoutConfirmationDto,
  type CheckoutInput,
} from "@/lib/order/schemas";

const IDENTITY = { authorization: "Bearer at" };

const INPUT: CheckoutInput = {
  items: [{ productId: "p1", qty: 2 }],
  shippingAddress: {
    line1: "1 Main St",
    city: "Springfield",
    postalCode: "12345",
    country: "US",
  },
  billingAddress: {
    line1: "1 Main St",
    city: "Springfield",
    postalCode: "12345",
    country: "US",
  },
  payment: { provider: "mock" },
};

const CONFIRMATION: CheckoutConfirmationDto = {
  orderId: "o1",
  orderNumber: "ORD-1",
  status: "confirmed",
  totals: { subtotal: 80, shipping: 5, tax: 6, discount: 0, grandTotal: 91 },
  items: [
    {
      productId: "p1",
      productName: "Blue shirt",
      sku: "SKU-1",
      unitPrice: 40,
      qty: 2,
      lineTotal: 80,
    },
  ],
};

/**
 * order-svc's replay cache in miniature: `key → { hash, confirmation }`, scoped
 * to a user. Returns the number of orders it actually created, which is the
 * only number that matters here.
 */
function orderService() {
  const calls: RequestOptions<unknown>[] = [];
  const cache = new Map<string, { hash: string; confirmation: CheckoutConfirmationDto }>();
  const state = { created: 0 };

  const perform: Perform = async <T>(req: RequestOptions<T>) => {
    calls.push(req as unknown as RequestOptions<unknown>);

    const key = req.headers?.["x-idempotency-key"];
    if (!key) {
      return failure(400, "IDEMPOTENCY_KEY_REQUIRED", "x-idempotency-key header is required") as never;
    }

    // order-svc hashes the canonical body itself; a local FNV-1a answers the
    // same question ("is this the same attempt?"), so the stub can too.
    const hash = bodyHash(req.body);
    const hit = cache.get(key);
    if (hit) {
      if (hit.hash !== hash) {
        return failure(
          409,
          "IDEMPOTENCY_CONFLICT",
          "x-idempotency-key was already used with a different request payload",
        ) as never;
      }
      return { ok: true, data: hit.confirmation as T };
    }

    state.created += 1;
    const confirmation: CheckoutConfirmationDto = {
      ...CONFIRMATION,
      orderId: `o${state.created}`,
      orderNumber: `ORD-${state.created}`,
    };
    cache.set(key, { hash, confirmation });
    return { ok: true, data: confirmation as T };
  };

  return { perform, calls, state };
}

describe("checkout replay", () => {
  it("returns the same confirmation for a repeated key and never places a second order", async () => {
    const service = orderService();
    const client = createOrderClient(service.perform);

    // The browser's retry loop: one attempt, one pair, the key survives.
    const pair: IdemPair = nextKey(null, INPUT, () => "attempt-1");
    const first = await client.checkout(IDENTITY, INPUT, { idempotencyKey: pair.key });
    const retry = await client.checkout(IDENTITY, INPUT, { idempotencyKey: pair.key });

    expect(first.ok).toBe(true);
    expect(retry.ok).toBe(true);
    if (!first.ok || !retry.ok) return;

    expect(retry.data).toEqual(first.data);
    expect(retry.data.orderId).toBe("o1");
    expect(service.state.created).toBe(1);
    expect(service.calls).toHaveLength(2);
    // The header, not the body, is what makes "clicked pay twice, charged once"
    // true — so both calls must carry the identical value.
    expect(service.calls.map((call) => call.headers?.["x-idempotency-key"])).toEqual([
      "attempt-1",
      "attempt-1",
    ]);
  });

  it("both confirmations satisfy the schema the client validates with", async () => {
    const service = orderService();
    const client = createOrderClient(service.perform);

    const first = await client.checkout(IDENTITY, INPUT, { idempotencyKey: "attempt-1" });
    const retry = await client.checkout(IDENTITY, INPUT, { idempotencyKey: "attempt-1" });

    expect(first.ok && retry.ok).toBe(true);
    if (!first.ok || !retry.ok) return;

    expect(checkoutConfirmationSchema.safeParse(first.data).success).toBe(true);
    expect(checkoutConfirmationSchema.safeParse(retry.data).success).toBe(true);
  });

  it("keeps money number-only, the narrowing contracts 1.10.0 introduced", () => {
    // A DECIMAL string is the drift that broke checkout once: order-svc parses
    // to a number at its persistence boundary, so anything else is a contract
    // bug and must not be coerced into passing.
    const asString = { ...CONFIRMATION, totals: { ...CONFIRMATION.totals, grandTotal: "91.00" } };

    expect(checkoutConfirmationSchema.safeParse(CONFIRMATION).success).toBe(true);
    expect(checkoutConfirmationSchema.safeParse(asString).success).toBe(false);
  });

  it("treats a changed body under the same key as a conflict, not a second order", async () => {
    const service = orderService();
    const client = createOrderClient(service.perform);

    await client.checkout(IDENTITY, INPUT, { idempotencyKey: "attempt-1" });
    // A qty edited mid-checkout is a different attempt; the browser mints a new
    // key, and sending the old one is the mistake this asserts is refused.
    const edited: CheckoutInput = { ...INPUT, items: [{ productId: "p1", qty: 3 }] };
    const result = await client.checkout(IDENTITY, edited, { idempotencyKey: "attempt-1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe("conflict");
    expect(result.status).toBe(409);
    expect(result.code).toBe("IDEMPOTENCY_CONFLICT");
    expect(service.state.created).toBe(1);
  });

  it("surfaces a stock failure as a named 409 the island can branch on", async () => {
    const perform: Perform = async () =>
      failure(409, "STOCK_INSUFFICIENT", "not enough stock for p1") as never;

    const result = await createOrderClient(perform).checkout(IDENTITY, INPUT, {
      idempotencyKey: "attempt-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.kind).toBe("conflict");
    // The code matters more than the status: both a stock failure and a replayed
    // key are 409, and only the code tells the shopper which one happened.
    expect(result.code).toBe("STOCK_INSUFFICIENT");
    expect(result.code).not.toBe("IDEMPOTENCY_CONFLICT");
    expect(result.message).toContain("stock");
  });
});
