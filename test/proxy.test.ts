/**
 * proxy.ts — the storefront's only server-side token handoff.
 *
 * What is asserted here is what Next actually puts on the wire:
 * `x-middleware-rewrite` (where /api/auth/session goes), the
 * `x-middleware-request-*` override pair (Bearer in, cookie out — Next deletes
 * every header missing from `x-middleware-override-headers`, which is why the
 * deleted cookie cannot ride along), and Location for the two guards.
 *
 * sf-051 added a third job — minting `sf_cid` — so the guest assertions cover
 * both halves: the `Set-Cookie` the browser keeps and the
 * `x-middleware-request-cookie` the *current* render reads.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import proxy, { config } from "@/proxy";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";
import { GUEST_COOKIE } from "@/lib/session/guest";

function request(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie === undefined ? {} : { cookie },
  });
}

const SESSION_COOKIE = `${ACCESS_COOKIE}=at_1; ${REFRESH_COOKIE}=rt_1`;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("config", () => {
  it("matches the session endpoint, the two guarded trees and every page a cart can be filled from", () => {
    expect(config.matcher).toEqual([
      "/",
      "/api/auth/session",
      "/products/:path*",
      "/cart",
      "/account/:path*",
      "/checkout/:path*",
    ]);
  });
});

describe("GET /api/auth/session", () => {
  it("answers 401 without ever calling auth-svc", () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");

    const response = proxy(request("/api/auth/session"));

    expect(response.status).toBe(401);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("rewrites to auth-svc /me with the Bearer injected and the cookie stripped", () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");

    const response = proxy(request("/api/auth/session", SESSION_COOKIE));
    const overrides = response.headers.get("x-middleware-override-headers") ?? "";

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://auth.test/api/v1/auth/me");
    expect(response.headers.get("x-middleware-request-authorization")).toBe("Bearer at_1");
    expect(overrides).toContain("authorization");
    // Absent from the override list ⇒ Next deletes it from the forwarded request.
    expect(overrides).not.toContain("cookie");
  });

  it("reads AUTH_SVC_URL at call time and trims trailing slashes", () => {
    vi.stubEnv("AUTH_SVC_URL", "https://auth.internal//");

    const response = proxy(request("/api/auth/session", `${ACCESS_COOKIE}=at_1`));

    expect(response.headers.get("x-middleware-rewrite")).toBe("https://auth.internal/api/v1/auth/me");
  });
});

describe("navigation guards", () => {
  it("passes a signed-in shopper through", () => {
    const response = proxy(request("/checkout", `${ACCESS_COOKIE}=at_1`));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends a stranger to /signin with the requested path preserved", () => {
    const response = proxy(request("/account/orders?page=2"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/signin?next=%2Faccount%2Forders%3Fpage%3D2",
    );
  });

  it("bounces an expired access token through the refresh route, not to /signin", () => {
    const response = proxy(request("/account", `${REFRESH_COOKIE}=rt_1`));

    expect(response.status).toBe(307);
    // Not `REFRESH_PATH` (that is the cookie's scope) — the route is the
    // handler under app/api/auth/refresh.
    expect(response.headers.get("location")).toBe(
      "http://localhost/api/auth/refresh?next=%2Faccount",
    );
  });

  it("mints sf_cid on a page the matcher covers, before the render", () => {
    const page = request("/products/mug");

    const response = proxy(page);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    const cookie = response.headers
      .getSetCookie()
      .find((value) => value.startsWith(`${GUEST_COOKIE}=`));
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/httponly/i);
    expect(cookie).toMatch(/samesite=lax/i);
    expect(cookie).toMatch(/path=\/(;|$)/i);
    expect(cookie).toMatch(/max-age=2592000/i);

    // The cookie has to be on the *request* too, or the render that follows
    // this proxy run fetches an empty cart.
    expect(page.cookies.get(GUEST_COOKIE)?.value).toBeDefined();
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      `${GUEST_COOKIE}=`,
    );
  });

  it("carries the minted cookie on a redirect too, so the basket survives sign-in", () => {
    const response = proxy(request("/checkout"));

    expect(response.status).toBe(307);
    expect(
      response.headers.getSetCookie().some((value) => value.startsWith(`${GUEST_COOKIE}=`)),
    ).toBe(true);
  });

  it("does not re-mint when the browser already has one", () => {
    const response = proxy(request("/cart", `${GUEST_COOKIE}=guest-1234`));

    expect(
      response.headers.getSetCookie().some((value) => value.startsWith(`${GUEST_COOKIE}=`)),
    ).toBe(false);
  });

  it("never mints on the session endpoint — that is an API answer, not a page", () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");

    const response = proxy(request("/api/auth/session"));

    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("does not treat /accounting as a guarded route", () => {
    const response = proxy(request("/accounting"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("preview framing (sf-096)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("leaves published routes with no CSP header at all", () => {
    const response = proxy(request("/"));
    expect(response.headers.get("content-security-policy")).toBeNull();
  });

  it("pins frame-ancestors to the exact admin origin for ?preview= routes", () => {
    vi.stubEnv("ADMIN_ORIGIN", "https://admin.test:8443/path");
    const response = proxy(request("/?preview=token"));
    expect(response.headers.get("content-security-policy")).toBe(
      "frame-ancestors https://admin.test:8443",
    );
  });

  it("does the same for a header-supplied preview token", () => {
    vi.stubEnv("ADMIN_ORIGIN", "https://admin.test");
    const req = new NextRequest("http://localhost/", {
      headers: { "x-preview-token": "token" },
    });
    expect(proxy(req).headers.get("content-security-policy")).toBe(
      "frame-ancestors https://admin.test",
    );
  });

  it("fails closed when the admin origin is unusable", () => {
    vi.stubEnv("ADMIN_ORIGIN", "javascript:alert(1)");
    const response = proxy(request("/?preview=token"));
    expect(response.headers.get("content-security-policy")).toBeNull();
  });
});
