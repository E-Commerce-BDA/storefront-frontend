/**
 * Order client — checkout must forward the caller's idempotency key verbatim
 * (order-svc replays its cache on that header), reads must never be cached, and
 * a 409 must survive intact so the checkout island can pick the right banner.
 */
import { describe, expect, it } from "vitest";
import { createOrderClient } from "@/lib/order/client";
import type { Perform, RequestOptions, ServiceResult } from "@/lib/http/result";
import type { CheckoutInput } from "@/lib/order/schemas";

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

const CONFIRMATION = {
  orderId: "o1",
  orderNumber: "ORD-1",
  status: "confirmed",
  totals: { subtotal: 80, shipping: 5, tax: 6, discount: 0, grandTotal: 91 },
  items: [
    { productId: "p1", productName: "Blue shirt", sku: "SKU-1", unitPrice: 40, qty: 2, lineTotal: 80 },
  ],
};

function stub<R>(response: R) {
  const calls: RequestOptions<unknown>[] = [];
  const perform: Perform = async <T,>(req: RequestOptions<T>): Promise<ServiceResult<T>> => {
    calls.push(req as unknown as RequestOptions<unknown>);
    return { ok: true, data: response as unknown as T };
  };
  return { perform, calls };
}

describe("checkout", () => {
  it("forwards the caller's key and the checkout body", async () => {
    const { perform, calls } = stub(CONFIRMATION);

    const result = await createOrderClient(perform).checkout(IDENTITY, INPUT, {
      idempotencyKey: "body-hash-1",
    });

    expect(calls[0]).toMatchObject({
      method: "POST",
      path: "/api/v1/order/checkout",
      headers: { ...IDENTITY, "x-idempotency-key": "body-hash-1" },
      body: INPUT,
      cache: "no-store",
    });
    expect(result).toEqual({ ok: true, data: CONFIRMATION });
  });

  it("returns a 409 stock conflict as a conflict, code intact", async () => {
    const perform: Perform = async () => ({
      ok: false,
      kind: "conflict",
      status: 409,
      code: "STOCK_INSUFFICIENT",
      message: "not enough stock",
    });

    const result = await createOrderClient(perform).checkout(IDENTITY, INPUT, {
      idempotencyKey: "k1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe("conflict");
    expect(result.code).toBe("STOCK_INSUFFICIENT");
  });

  it("passes a 402 payment failure through as invalid", async () => {
    const perform: Perform = async () => ({
      ok: false,
      kind: "invalid",
      status: 402,
      code: "PAYMENT_FAILED",
      message: "card declined",
    });

    const result = await createOrderClient(perform).checkout(IDENTITY, INPUT, {
      idempotencyKey: "k1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("PAYMENT_FAILED");
  });
});

describe("listOrders", () => {
  it("reads the customer's orders and unwraps the envelope", async () => {
    const order = {
      id: "o1",
      order_number: "ORD-1",
      status: "confirmed",
      subtotal: 80,
      shipping_fee: 5,
      tax: 6,
      discount: 0,
      grand_total: 91,
      shipping_address: {
        line1: "1 Main St",
        city: "Springfield",
        postalCode: "12345",
        country: "US",
      },
      created_at: "2026-11-01T10:00:00Z",
      items: [],
    };
    const { perform, calls } = stub({ data: [order], nextCursor: "c-2" });

    const result = await createOrderClient(perform).listOrders(IDENTITY, { limit: 10 });

    expect(calls[0]).toMatchObject({
      path: "/api/v1/order/me/orders",
      headers: IDENTITY,
      query: { limit: 10 },
      cache: "no-store",
    });
    expect(result).toEqual({ ok: true, data: { orders: [order], nextCursor: "c-2" } });
  });

  it("normalises a missing cursor to null", async () => {
    const { perform } = stub({ data: [] });

    const result = await createOrderClient(perform).listOrders(IDENTITY);

    expect(result).toEqual({ ok: true, data: { orders: [], nextCursor: null } });
  });
});

describe("getOrder", () => {
  it("reads one order by id", async () => {
    const { perform, calls } = stub({ order: { id: "o 1" } });

    const result = await createOrderClient(perform).getOrder(IDENTITY, "o 1");

    expect(calls[0].path).toBe("/api/v1/order/orders/o%201");
    expect(result).toEqual({ ok: true, data: { id: "o 1" } });
  });
});
