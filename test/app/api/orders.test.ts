/**
 * GET /api/orders/[id] — the confirmation page's data source.
 *
 * There is no ownership check here on purpose: order-svc answers 404 for an
 * order that is not the caller's, so the same 404 covers "does not exist" and
 * "not yours" and no probing is possible. Re-implementing the check in the BFF
 * would only add a second place to get it wrong.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/orders/[id]/route";
import { GET as listGET } from "@/app/api/orders/route";
import { ACCESS_COOKIE } from "@/lib/auth/session";

const ORDER = {
  id: "o1",
  order_number: "SF-1001",
  status: "confirmed",
  subtotal: 25,
  shipping_fee: 0,
  tax: 2,
  discount: 0,
  grand_total: 27,
  shipping_address: { line1: "1 Main", city: "Austin", postalCode: "78701", country: "US" },
  created_at: "2026-11-01T10:00:00.000Z",
  items: [],
};

function request(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/api/orders/o1", {
    headers: cookie === undefined ? {} : { cookie },
  });
}

function context(id = "o1"): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
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

describe("GET /api/orders/[id]", () => {
  it("refuses a guest", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(200, { order: ORDER });

    const response = await GET(request(), context());

    expect(response.status).toBe(401);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("forwards the Bearer and unwraps the envelope", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(200, { order: ORDER });

    const response = await GET(request(`${ACCESS_COOKIE}=at_1`), context());

    expect(response.status).toBe(200);
    // Money arrives as a number — order-svc parses `DECIMAL` at its own DB
    // boundary — and the BFF passes it through untouched.
    expect(await response.json()).toMatchObject({ id: "o1", grand_total: 27 });

    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://order.test/api/v1/order/orders/o1");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer at_1");
    expect(init.cache).toBe("no-store");
  });

  it("forwards the owner-or-admin 404 unchanged", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    stubOrder(404, { error: { code: "ORDER_NOT_FOUND", message: "not found" } });

    const response = await GET(request(`${ACCESS_COOKIE}=at_1`), context("someone-elses"));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "ORDER_NOT_FOUND" } });
  });
});


describe("GET /api/orders", () => {
  it("refuses a guest", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(200, { data: [ORDER], nextCursor: null });

    const req = new NextRequest("http://localhost/api/orders");
    const response = await listGET(req);

    expect(response.status).toBe(401);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("forwards the Bearer and returns order list with cursor", async () => {
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubOrder(200, { data: [ORDER], nextCursor: "cursor-1" });

    const req = new NextRequest("http://localhost/api/orders?limit=10", {
      headers: { cookie: `${ACCESS_COOKIE}=at_1` },
    });
    const response = await listGET(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.orders).toHaveLength(1);
    expect(body.nextCursor).toBe("cursor-1");

    const [url, init] = callOf(fetchFn);
    expect(url).toContain("http://order.test/api/v1/order/me/orders");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer at_1");
  });
});
