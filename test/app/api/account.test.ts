/**
 * GET /api/account — the one handler that fans out to two backends.
 *
 * The behaviour under test is the **partial degradation**: an order-svc outage
 * must leave the profile header standing, because "your orders are unavailable"
 * is a far better page than a blank account. The profile is the opposite case —
 * without it there is no page, so its failure is the response's failure.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/account/route";
import { ACCESS_COOKIE } from "@/lib/auth/session";

const USER = {
  id: "u1",
  email: "ana@x.com",
  firstName: "Ana",
  lastName: "Silva",
  roles: ["customer"],
};

const ORDER = {
  id: "o1",
  order_number: "SF-1001",
  status: "confirmed",
  subtotal: "25.00",
  shipping_fee: "0.00",
  tax: "2.00",
  discount: "0.00",
  grand_total: "27.00",
  shipping_address: { line1: "1 Main", city: "Austin", postalCode: "78701", country: "US" },
  created_at: "2026-11-01T10:00:00.000Z",
  items: [],
};

function request(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/api/account", {
    headers: cookie === undefined ? {} : { cookie },
  });
}

/** auth-svc `{user}` and order-svc `{data,nextCursor}` under one fetch. */
function stubServices(routes: { me: Response; orders: Response }) {
  const fetchFn = vi.fn(async (url: string | URL | Request) => {
    const href = String(url);
    if (href.includes("/api/v1/auth/me")) return routes.me.clone();
    if (href.includes("/api/v1/order/me/orders")) return routes.orders.clone();
    throw new Error(`unstubbed fetch: ${href}`);
  });
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/account", () => {
  it("refuses a guest", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubServices({
      me: json(200, { user: USER }),
      orders: json(200, { data: [], nextCursor: null }),
    });

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("answers the profile and the first page of history together", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    const fetchFn = stubServices({
      me: json(200, { user: USER }),
      orders: json(200, { data: [ORDER], nextCursor: "c2" }),
    });

    const response = await GET(request(`${ACCESS_COOKIE}=at_1`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: USER,
      orders: [ORDER],
      ordersError: null,
    });

    // Both calls carry the same Bearer, and both run before either resolves.
    expect(fetchFn).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchFn.mock.calls as unknown as [string, RequestInit][]) {
      expect((init.headers as Record<string, string>).authorization).toBe("Bearer at_1");
    }
    const ordersCall = (fetchFn.mock.calls as unknown as [string, RequestInit][]).find(
      ([url]) => url.includes("/order/me/orders"),
    );
    expect(ordersCall?.[0]).toContain("limit=20");
  });

  it("keeps the profile when order history is down", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    stubServices({
      me: json(200, { user: USER }),
      orders: json(503, { error: { code: "ORDER_UNAVAILABLE", message: "down" } }),
    });

    const response = await GET(request(`${ACCESS_COOKIE}=at_1`));
    const body = (await response.json()) as {
      user: unknown;
      orders: unknown[];
      ordersError: { code: string; status: number };
    };

    expect(response.status).toBe(200);
    expect(body.user).toEqual(USER);
    expect(body.orders).toEqual([]);
    expect(body.ordersError).toEqual({ code: "ORDER_UNAVAILABLE", status: 503 });
  });

  it("fails when the profile cannot be read — half an account page is not one", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    stubServices({
      me: json(401, { error: { code: "UNAUTHENTICATED", message: "expired" } }),
      orders: json(200, { data: [], nextCursor: null }),
    });

    const response = await GET(request(`${ACCESS_COOKIE}=stale`));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "TOKEN_EXPIRED" } });
  });

  it("is never cached — a profile is private", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("ORDER_SVC_URL", "http://order.test");
    stubServices({
      me: json(200, { user: USER }),
      orders: json(200, { data: [], nextCursor: null }),
    });

    const response = await GET(request(`${ACCESS_COOKIE}=at_1`));

    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
