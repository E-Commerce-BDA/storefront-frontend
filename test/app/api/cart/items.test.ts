/**
 * POST / DELETE /api/cart/items — the two writes that can create a line.
 *
 * Beyond the forwarding assertions, this file pins the **guest minting
 * fallback**: a POST that arrives with no `sf_cid` must still put the item in a
 * cart the browser will keep sending, and must hand the minted cookie back.
 * Without it, a build that stops propagating the proxy's request cookie would
 * silently drop the shopper's first add.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, POST } from "@/app/api/cart/items/route";
import { GUEST_COOKIE } from "@/lib/session/guest";

const GUEST = "guest-1234";

const MUTATION = {
  item: { id: "i1", productId: "p1", qty: 1, unitPrice: 12.5, productName: "Mug" },
  cartTotals: { subtotal: 12.5, itemCount: 1, lineCount: 1 },
};

function request(
  method: string,
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost/api/cart/items", {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
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

describe("POST /api/cart/items", () => {
  it("rejects a body without a quantity before calling cart-svc", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(201, MUTATION);

    const response = await POST(
      request("POST", { productId: "p1" }, { cookie: `${GUEST_COOKIE}=${GUEST}` }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "VALIDATION_FAILED" } });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("rejects a fractional or zero quantity", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(201, MUTATION);

    const zero = await POST(
      request("POST", { productId: "p1", qty: 0 }, { cookie: `${GUEST_COOKIE}=${GUEST}` }),
    );
    const fraction = await POST(
      request("POST", { productId: "p1", qty: 1.5 }, { cookie: `${GUEST_COOKIE}=${GUEST}` }),
    );

    expect(zero.status).toBe(400);
    expect(fraction.status).toBe(400);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("forwards the add for a guest and answers 201", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(201, MUTATION);

    const response = await POST(
      request(
        "POST",
        { productId: "p1", variantId: "v1", qty: 2 },
        { cookie: `${GUEST_COOKIE}=${GUEST}`, "x-idempotency-key": "k1" },
      ),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      item: MUTATION.item,
      totals: MUTATION.cartTotals,
    });

    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://cart.test/api/v1/cart/items");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      productId: "p1",
      variantId: "v1",
      qty: 2,
    });
    expect(init.headers).toMatchObject({
      "x-session-id": GUEST,
      "x-idempotency-key": "k1",
    });
  });

  it("mints sf_cid when the request has no identity, so the add is not lost", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(201, MUTATION);

    const response = await POST(request("POST", { productId: "p1", qty: 1 }));

    expect(response.status).toBe(201);
    const minted = (callOf(fetchFn)[1].headers as Record<string, string>)["x-session-id"];
    expect(minted).toMatch(/^[0-9a-f-]{36}$/);
    // The browser has to keep sending it, or the next read is a different cart.
    expect(response.cookies.get(GUEST_COOKIE)?.value).toBe(minted);
  });

  it("never mints a second id for a signed-in shopper", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(201, MUTATION);

    const response = await POST(
      request("POST", { productId: "p1", qty: 1 }, { cookie: "sf_at=at_1" }),
    );

    expect((callOf(fetchFn)[1].headers as Record<string, string>).authorization)
      .toBe("Bearer at_1");
    expect(response.cookies.get(GUEST_COOKIE)).toBeUndefined();
  });

  it("forwards CART_PRODUCT_UNAVAILABLE as a 422 the island can name", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    stubCart(422, {
      error: { code: "CART_PRODUCT_UNAVAILABLE", message: "out of stock" },
    });

    const response = await POST(
      request("POST", { productId: "p1", qty: 1 }, { cookie: `${GUEST_COOKIE}=${GUEST}` }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: { code: "CART_PRODUCT_UNAVAILABLE", message: "out of stock" },
    });
  });

  it("refuses a cross-site write", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(201, MUTATION);

    const response = await POST(
      request(
        "POST",
        { productId: "p1", qty: 1 },
        { cookie: `${GUEST_COOKIE}=${GUEST}`, origin: "http://evil.test", host: "localhost" },
      ),
    );

    expect(response.status).toBe(403);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/cart/items", () => {
  it("removes a batch and answers 204", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(204, null);

    const response = await DELETE(
      request("DELETE", { ids: ["i1", "i2"] }, { cookie: `${GUEST_COOKIE}=${GUEST}` }),
    );

    expect(response.status).toBe(204);
    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://cart.test/api/v1/cart/items");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toEqual({ ids: ["i1", "i2"] });
  });

  it("rejects an empty id list", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCart(204, null);

    const response = await DELETE(
      request("DELETE", { ids: [] }, { cookie: `${GUEST_COOKIE}=${GUEST}` }),
    );

    expect(response.status).toBe(400);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
