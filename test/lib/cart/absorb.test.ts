/**
 * `absorbGuestCart` — the login/register bridge between `sf_cid` and a session.
 *
 * Two invariants, both about not losing a basket:
 *
 * - the merge only ever runs against a *valid* guest id, and
 * - `sf_cid` rotates **only** when the merge succeeded. Rotating on failure
 *   would retire the one pointer to a cart that still holds the shopper's
 *   items.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { absorbGuestCart } from "@/lib/cart/absorb";
import { GUEST_COOKIE } from "@/lib/session/guest";

const GUEST = "guest-1234";

function request(guestId?: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers:
      guestId === undefined ? {} : { cookie: `${GUEST_COOKIE}=${guestId}` },
  });
}

function stubCartService(status: number, body: unknown) {
  const fetchFn = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("absorbGuestCart", () => {
  it("merges the guest cart and rotates sf_cid", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCartService(200, { cart: { id: "c2" } });
    const response = NextResponse.json({ user: { id: "u1" } });

    const merged = await absorbGuestCart(request(GUEST), response, {
      accessToken: "at_1",
    });

    expect(merged).toBe(true);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://cart.test/api/v1/cart/merge");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      authorization: "Bearer at_1",
      "x-session-id": GUEST,
    });

    const rotated = response.cookies.get(GUEST_COOKIE)?.value;
    expect(rotated).toBeDefined();
    expect(rotated).not.toBe(GUEST);
  });

  it("leaves sf_cid alone when the merge fails", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubCartService(503, {
      error: { code: "CART_UNAVAILABLE", message: "down" },
    });
    const response = NextResponse.json({ user: { id: "u1" } });

    const merged = await absorbGuestCart(request(GUEST), response, {
      accessToken: "at_1",
    });

    expect(merged).toBe(false);
    expect(response.cookies.get(GUEST_COOKIE)).toBeUndefined();
  });

  it("never calls cart-svc without a guest id", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCartService(200, { cart: { id: "c2" } });
    const response = NextResponse.json({ user: { id: "u1" } });

    const merged = await absorbGuestCart(request(), response, {
      accessToken: "at_1",
    });

    expect(merged).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(response.cookies.get(GUEST_COOKIE)).toBeUndefined();
  });

  it("treats a malformed sf_cid as no guest cart", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubCartService(200, { cart: { id: "c2" } });
    const response = NextResponse.json({ user: { id: "u1" } });

    const merged = await absorbGuestCart(request("not a valid id"), response, {
      accessToken: "at_1",
    });

    expect(merged).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
