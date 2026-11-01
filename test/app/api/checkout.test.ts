/**
 * POST /api/checkout — the strictest handler in the seam.
 *
 * Three gates before a cent can move: same-origin, a real session, and a
 * caller-supplied idempotency key. Then the body is validated with the same
 * schema the island uses, so an attempt that would fail at order-svc fails here
 * instead — before any stock is reserved.
 *
 * The 409/502/503 forwarding is asserted verbatim because the checkout island
 * switches on the *code* to choose its copy (plan §8): a flattened error would
 * turn "some items are gone" into "payment failed".
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/checkout/route";
import { ACCESS_COOKIE } from "@/lib/auth/session";

const CONFIRMATION = {
  orderId: "o1",
  orderNumber: "SF-1001",
  status: "confirmed",
  totals: { subtotal: 25, shipping: 0, tax: 2, discount: 0, grandTotal: 27 },
  items: [
    {
      productId: "p1",
      productName: "Mug",
      sku: "MUG-1",
      unitPrice: 25,
      qty: 1,
      lineTotal: 25,
    },
  ],
};

const ADDRESS = {
  line1: "1 Main St",
  city: "Austin",
  postalCode: "78701",
  country: "US",
};

const BODY = {
  items: [{ productId: "p1", qty: 1 }],
  shippingAddress: ADDRESS,
  billingAddress: ADDRESS,
  payment: { provider: "mock" },
};

function request(
  body: unknown,
  headers: Record<string, string> = { cookie: `${ACCESS_COOKIE}=at_1` },
): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function stubOrder(status: number, body: unknown) {
  const fetchFn = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

function callOf(fetchFn: ReturnType<typeof stubOrder>, index = 0): [string, RequestInit] {
  return fetchFn.mock.calls[index] as unknown as [string, RequestInit];
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/checkout", () => {
  it("refuses a guest before anything else", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(201, CONFIRMATION);

    const response = await POST(
      request(BODY, { "x-idempotency-key": "k1" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "UNAUTHENTICATED" } });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("demands an idempotency key rather than inventing one", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(201, CONFIRMATION);

    const response = await POST(request(BODY));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "IDEMPOTENCY_KEY_REQUIRED" },
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("rejects an empty basket before order-svc reserves stock", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(201, CONFIRMATION);

    const response = await POST(
      request({ ...BODY, items: [] }, { cookie: `${ACCESS_COOKIE}=at_1`, "x-idempotency-key": "k1" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "VALIDATION_FAILED" } });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("forwards the caller's key verbatim and answers 201", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(201, CONFIRMATION);

    const response = await POST(
      request(BODY, { cookie: `${ACCESS_COOKIE}=at_1`, "x-idempotency-key": "k1" }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(CONFIRMATION);

    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://order.test/api/v1/order/checkout");
    expect(init.method).toBe("POST");
    // The guarantee only exists if the *same* key survives the retry loop.
    expect((init.headers as Record<string, string>)["x-idempotency-key"]).toBe("k1");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer at_1");
    expect(JSON.parse(String(init.body))).toMatchObject({ items: BODY.items });
  });

  it("forwards STOCK_INSUFFICIENT as a 409 the island can name", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    stubOrder(409, {
      error: { code: "STOCK_INSUFFICIENT", message: "not enough stock" },
    });

    const response = await POST(
      request(BODY, { cookie: `${ACCESS_COOKIE}=at_1`, "x-idempotency-key": "k1" }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "STOCK_INSUFFICIENT" } });
  });

  it("forwards a 503 as retryable, not as a payment failure", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    stubOrder(503, { error: { code: "PAYMENT_UNAVAILABLE", message: "down" } });

    const response = await POST(
      request(BODY, { cookie: `${ACCESS_COOKIE}=at_1`, "x-idempotency-key": "k1" }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "PAYMENT_UNAVAILABLE" } });
  });

  it("refuses a cross-site write", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(201, CONFIRMATION);

    const response = await POST(
      request(BODY, {
        cookie: `${ACCESS_COOKIE}=at_1`,
        "x-idempotency-key": "k1",
        origin: "http://evil.test",
        host: "localhost",
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
