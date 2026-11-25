import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getWishlist } from "@/app/api/wishlist/route";
import { POST as postWishlistItem } from "@/app/api/wishlist/items/route";
import { POST as consumePending } from "@/app/api/wishlist/consume-pending/route";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { PENDING_WISHLIST_COOKIE } from "@/lib/wishlist/pending";

function stubFetch(status: number, body: unknown) {
  const fetchFn = vi.fn(async () =>
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
});

describe("Wishlist API BFF", () => {
  it("GET /api/wishlist returns 401 for unauthenticated user", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const req = new NextRequest("http://localhost/api/wishlist");
    const res = await getWishlist(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/wishlist/items sets sf_pw cookie and returns 401 for guest", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const req = new NextRequest("http://localhost/api/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ productId: "prod-1" }),
      headers: { "content-type": "application/json" },
    });
    const res = await postWishlistItem(req);
    expect(res.status).toBe(401);
    const cookie = res.cookies.get(PENDING_WISHLIST_COOKIE);
    expect(cookie?.value).toBe("prod-1");
  });

  it("POST /api/wishlist/items forwards to cart-svc for authenticated user", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubFetch(201, {
      item: { id: "w-1", productId: "prod-1", addedAt: "2026-11-02T10:00:00Z" },
    });

    const req = new NextRequest("http://localhost/api/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ productId: "prod-1" }),
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_COOKIE}=token_123`,
      },
    });

    const res = await postWishlistItem(req);
    expect(res.status).toBe(201);
    expect(fetchFn).toHaveBeenCalled();
  });

  it("POST /api/wishlist/consume-pending claims cookie and clears it", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    stubFetch(201, {
      item: { id: "w-2", productId: "prod-99", addedAt: "2026-11-02T10:00:00Z" },
    });

    const req = new NextRequest("http://localhost/api/wishlist/consume-pending", {
      method: "POST",
      headers: {
        cookie: `${ACCESS_COOKIE}=token_123; ${PENDING_WISHLIST_COOKIE}=prod-99`,
      },
    });

    const res = await consumePending(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.consumed).toBe(true);
    expect(body.productId).toBe("prod-99");
    const cleared = res.cookies.get(PENDING_WISHLIST_COOKIE);
    expect(cleared?.value).toBe("");
  });
});
