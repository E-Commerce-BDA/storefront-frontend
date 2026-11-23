/**
 * POST /api/auth/login — the G3 proof, executed rather than grepped.
 *
 * The handler's whole job is: tokens → cookies, everything else → `{ user }`.
 * So the assertions are (a) the body's key set is exactly `['user']`, (b) the
 * serialised body contains no token value, (c) the Set-Cookie pair carries
 * HttpOnly/SameSite/path, (d) a failure sets no cookie at all, and (e) a guest
 * cart is absorbed after the cookies land, without ever failing the sign-in.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";
import { GUEST_COOKIE } from "@/lib/session/guest";

const SESSION = {
  user: {
    id: "u1",
    email: "ana@x.com",
    firstName: "Ana",
    lastName: "Silva",
    roles: ["customer"],
  },
  accessToken: "at_should_never_ship",
  refreshToken: "rt_should_never_ship",
};

const GUEST = "guest-1234";

function request(body: unknown, guestId?: string): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (guestId !== undefined) headers.cookie = `${GUEST_COOKIE}=${guestId}`;

  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function stubAuthService(status: number, body: unknown) {
  const fetchFn = vi.fn(
    async () => new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

function stubServices(routes: Record<string, { status: number; body: unknown }>) {
  const fetchFn = vi.fn(async (url: string | URL | Request) => {
    const href = String(url);
    const path = Object.keys(routes).find((candidate) => href.includes(candidate));
    if (path === undefined) throw new Error(`unstubbed fetch: ${href}`);
    const route = routes[path];
    return new Response(JSON.stringify(route.body), {
      status: route.status,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

function stubAuthServiceDown() {
  const fetchFn = vi.fn(async () => {
    throw new DOMException("The operation was aborted.", "AbortError");
  });
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/auth/login", () => {
  it("answers { user } and never the token pair", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(200, SESSION);

    const response = await POST(request({ email: "ana@x.com", password: "secret123" }));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(Object.keys(body)).toEqual(["user"]);
    const serialised = JSON.stringify(body);
    expect(serialised).not.toContain(SESSION.accessToken);
    expect(serialised).not.toContain(SESSION.refreshToken);
    expect(serialised).not.toContain("Token");
  });

  it("sets an HttpOnly access cookie on / and a refresh cookie scoped to /api/auth", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(200, SESSION);

    const response = await POST(request({ email: "ana@x.com", password: "secret123" }));
    const cookies = response.headers.getSetCookie();
    const access = cookies.find((cookie) => cookie.startsWith(`${ACCESS_COOKIE}=`)) ?? "";
    const refresh = cookies.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`)) ?? "";

    expect(access).toContain(SESSION.accessToken);
    expect(access).toMatch(/httponly/i);
    expect(access).toMatch(/samesite=lax/i);
    expect(access).toMatch(/path=\/(;|$)/i);
    expect(access).toMatch(/max-age=900/i);
    expect(access).not.toMatch(/;\s*secure/i);

    expect(refresh).toContain(SESSION.refreshToken);
    expect(refresh).toMatch(/httponly/i);
    expect(refresh).toMatch(/path=\/api\/auth/i);
    expect(refresh).toMatch(/max-age=2592000/i);
  });

  it("rejects a malformed body without calling auth-svc", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    const fetchFn = stubAuthService(200, SESSION);

    const response = await POST(request({ email: "not-an-email", password: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "VALIDATION_FAILED" } });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("passes a 401 through as INVALID_CREDENTIALS and sets no cookie", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(401, {
      error: { code: "UNAUTHENTICATED", message: "Invalid email or password" },
    });

    const response = await POST(request({ email: "ana@x.com", password: "wrong" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "INVALID_CREDENTIALS" } });
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("answers 503 when auth-svc cannot be reached", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthServiceDown();

    const response = await POST(request({ email: "ana@x.com", password: "secret123" }));

    // status 0 from the client becomes a real 503, not a 0-status response.
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: "SERVICE_UNAVAILABLE" } });
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});

describe("POST /api/auth/login — guest cart merge (A4.6)", () => {
  it("absorbs sf_cid into the new session and rotates it", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubServices({
      "/api/v1/auth/login": { status: 200, body: SESSION },
      "/api/v1/cart/merge": { status: 200, body: { cart: { id: "c2" } } },
    });

    const response = await POST(
      request({ email: "ana@x.com", password: "secret123" }, GUEST),
    );

    expect(response.status).toBe(200);

    const merge = fetchFn.mock.calls[1] as unknown as [string, RequestInit];
    expect(merge[0]).toBe("http://cart.test/api/v1/cart/merge");
    expect(merge[1].headers).toMatchObject({
      authorization: `Bearer ${SESSION.accessToken}`,
      "x-session-id": GUEST,
    });

    // Cookies land first, rotation last: the response is a signed-in one either way.
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((cookie) => cookie.startsWith(`${ACCESS_COOKIE}=`))).toBe(true);
    const guest = cookies.find((cookie) => cookie.startsWith(`${GUEST_COOKIE}=`)) ?? "";
    expect(guest).toMatch(/httponly/i);
    // The converted id must not survive: a later sign-out starts a clean cart.
    expect(guest.split(";")[0]).not.toBe(`${GUEST_COOKIE}=${GUEST}`);
  });

  it("carries the guest id as x-session-id, never as a cookie, to cart-svc", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubServices({
      "/api/v1/auth/login": { status: 200, body: SESSION },
      "/api/v1/cart/merge": { status: 200, body: { cart: { id: "c2" } } },
    });

    await POST(request({ email: "ana@x.com", password: "secret123" }, GUEST));

    const [, init] = fetchFn.mock.calls[1] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).cookie).toBeUndefined();
    expect((init.headers as Record<string, string>)["x-idempotency-key"]).toBeTruthy();
  });

  it("still signs the shopper in when the merge fails, and keeps the guest id", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubServices({
      "/api/v1/auth/login": { status: 200, body: SESSION },
      "/api/v1/cart/merge": {
        status: 503,
        body: { error: { code: "CART_UNAVAILABLE", message: "down" } },
      },
    });

    const response = await POST(
      request({ email: "ana@x.com", password: "secret123" }, GUEST),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ user: { id: "u1" } });
    // No rotation: the guest cart is still reachable under the old id.
    expect(
      response.headers
        .getSetCookie()
        .some((cookie) => cookie.startsWith(`${GUEST_COOKIE}=`)),
    ).toBe(false);
  });

  it("never calls cart-svc when the shopper had no guest cart", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubEnv("CART_SVC_URL", "http://cart.test");
    const fetchFn = stubServices({
      "/api/v1/auth/login": { status: 200, body: SESSION },
    });

    const response = await POST(request({ email: "ana@x.com", password: "secret123" }));

    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
