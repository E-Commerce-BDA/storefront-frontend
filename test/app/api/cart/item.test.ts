/**
 * PATCH / DELETE /api/cart/items/[id] — one line's quantity, one line gone.
 *
 * Two things worth pinning: a quantity is validated here (cart-svc's 400 has no
 * field path, so "qty must be ≥ 1" has to be our copy), and `params` is a
 * Promise in Next 16 — a handler that forgets to await it forwards
 * `[object Promise]` to cart-svc and gets a 404 nobody can explain.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, PATCH } from "@/app/api/cart/items/[id]/route";
import { GUEST_COOKIE } from "@/lib/session/guest";

const GUEST = "guest-1234";

const MUTATION = {
  item: { id: "i1", productId: "p1", qty: 3, unitPrice: 12.5, productName: "Mug" },
  cartTotals: { subtotal: 37.5, itemCount: 3, lineCount: 1 },
};

function request(method: string, body: unknown, cookie = `${GUEST_COOKIE}=${GUEST}`): NextRequest {
  return new NextRequest("http://localhost/api/cart/items/i1", {
    method,
    headers: { "content-type": "application/json", cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function context(id = "i1"): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function stubCart(status: number, body: unknown) {
  const fetchFn = vi.fn(async () =>
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

describe("PATCH /api/cart/items/[id]", () => {
  it("forwards the new quantity with the awaited id", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(200, MUTATION);

    const response = await PATCH(request("PATCH", { qty: 3 }), context());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      item: MUTATION.item,
      totals: MUTATION.cartTotals,
    });

    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://cart.test/api/v1/cart/items/i1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ qty: 3 });
    expect(init.headers).toMatchObject({ "x-session-id": GUEST });
  });

  it("encodes an id that contains a slash", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(200, MUTATION);

    await PATCH(request("PATCH", { qty: 1 }), context("a/b"));

    expect(callOf(fetchFn)[0]).toBe("http://cart.test/api/v1/cart/items/a%2Fb");
  });

  it("rejects qty below 1 without calling cart-svc", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(200, MUTATION);

    const response = await PATCH(request("PATCH", { qty: 0 }), context());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "VALIDATION_FAILED" } });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("forwards CART_ITEM_NOT_FOUND as a 404", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    stubCart(404, { error: { code: "CART_ITEM_NOT_FOUND", message: "gone" } });

    const response = await PATCH(request("PATCH", { qty: 2 }), context());

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "CART_ITEM_NOT_FOUND" } });
  });
});

describe("DELETE /api/cart/items/[id]", () => {
  it("removes one line and answers 204", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(204, null);

    const response = await DELETE(request("DELETE", undefined), context());

    expect(response.status).toBe(204);
    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://cart.test/api/v1/cart/items/i1");
    expect(init.method).toBe("DELETE");
    expect((init.headers as Record<string, string>)["x-idempotency-key"])
      .toMatch(/^[0-9a-f-]{36}$/);
  });
});
