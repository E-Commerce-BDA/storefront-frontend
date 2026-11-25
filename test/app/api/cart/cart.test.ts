/**
 * GET / DELETE /api/cart — the pre-identity answer and the cookie-authenticated
 * clear.
 *
 * The interesting assertions are the two "no identity" branches: a first visit
 * must get an empty cart with 200 (never a 401 the drawer has to special-case),
 * and a clear with nothing to clear must be a 204 no-op.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET } from "@/app/api/cart/route";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { GUEST_COOKIE } from "@/lib/session/guest";

const GUEST = "guest-1234";

const CART = {
  cart: { id: "c1" },
  items: [
    {
      id: "i1",
      productId: "p1",
      qty: 2,
      unitPrice: 12.5,
      productName: "Mug",
    },
  ],
  totals: { subtotal: 25, itemCount: 2, lineCount: 1 },
};

function request(method: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/cart", { method, headers });
}

function stubCart(status: number, body: unknown) {
  const fetchFn = vi.fn(async () =>
    // A 204 must not carry a body — `new Response("null", {status: 204})` throws.
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

function callOf(fetchFn: ReturnType<typeof stubCart>, index = 0): [string, RequestInit] {
  return fetchFn.mock.calls[index] as unknown as [string, RequestInit];
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/cart", () => {
  it("attaches catalog stock to each line for the stock cap (sf-058)", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    vi.stubEnv("CATALOG_SVC_URL", "http://catalog.test");
    const fetchFn = vi.fn(async (url: string | URL) => {
      const target = String(url);
      const body = target.includes("/api/v1/catalog/products")
        ? {
            data: [
              {
                id: "p1",
                name: "Mug",
                slug: "mug",
                status: "active",
                price: 12.5,
                stock: 3,
              },
            ],
            nextCursor: null,
          }
        : CART;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchFn);

    const response = await GET(request("GET", { cookie: `${ACCESS_COOKIE}=at_1` }));
    const body = (await response.json()) as { items: Array<{ stock?: number }> };
    expect(body.items[0].stock).toBe(3);
    expect(fetchFn.mock.calls.some((call) => String((call as unknown as string[])[0]).includes("catalog"))).toBe(true);
  });

  it("answers an empty cart, not a 401, before the shopper has an identity", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(200, CART);

    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      cart: null,
      items: [],
      totals: { subtotal: 0, itemCount: 0, lineCount: 0 },
    });
    // Nothing to ask cart-svc: it would have answered 401.
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("sends a guest as x-session-id", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(200, CART);

    const response = await GET(request("GET", { cookie: `${GUEST_COOKIE}=${GUEST}` }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ totals: { itemCount: 2 } });

    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://cart.test/api/v1/cart");
    expect(init.headers).toMatchObject({ "x-session-id": GUEST });
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it("sends a signed-in shopper as a Bearer", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(200, CART);

    await GET(request("GET", { cookie: `${ACCESS_COOKIE}=at_1` }));

    expect(callOf(fetchFn)[1].headers).toMatchObject({ authorization: "Bearer at_1" });
  });

  it("is never cached — a cached cart is a wrong cart", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    stubCart(200, CART);

    const response = await GET(request("GET", { cookie: `${GUEST_COOKIE}=${GUEST}` }));

    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("forwards an upstream failure with its status and code", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    stubCart(503, { error: { code: "CART_UNAVAILABLE", message: "down" } });

    const response = await GET(request("GET", { cookie: `${GUEST_COOKIE}=${GUEST}` }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: { code: "CART_UNAVAILABLE", message: "down" },
    });
  });

  it("turns a never-reached service into a real 503", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("aborted", "AbortError");
    }));

    const response = await GET(request("GET", { cookie: `${GUEST_COOKIE}=${GUEST}` }));

    // status 0 is not an HTTP status; the browser must still see something.
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "TIMEOUT" } });
  });
});

describe("DELETE /api/cart", () => {
  it("is a 204 no-op when there is nothing to clear", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(204, null);

    const response = await DELETE(request("DELETE"));

    expect(response.status).toBe(204);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("forwards the caller's idempotency key", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(204, null);

    const response = await DELETE(
      request("DELETE", { cookie: `${GUEST_COOKIE}=${GUEST}`, "x-idempotency-key": "k1" }),
    );

    expect(response.status).toBe(204);
    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://cart.test/api/v1/cart");
    expect(init.method).toBe("DELETE");
    expect(init.headers).toMatchObject({ "x-idempotency-key": "k1" });
  });

  it("mints a key when the caller sent none, so the write is never a 400", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(204, null);

    await DELETE(request("DELETE", { cookie: `${GUEST_COOKIE}=${GUEST}` }));

    expect((callOf(fetchFn)[1].headers as Record<string, string>)["x-idempotency-key"])
      .toMatch(/^[0-9a-f-]{36}$/);
  });

  it("refuses a cross-site write", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(204, null);

    const response = await DELETE(
      request("DELETE", {
        cookie: `${GUEST_COOKIE}=${GUEST}`,
        origin: "http://evil.test",
        host: "localhost",
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: { code: "FORBIDDEN" } });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
