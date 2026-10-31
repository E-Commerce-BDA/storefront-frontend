/**
 * proxy.ts — the storefront's only server-side token handoff.
 *
 * What is asserted here is what Next actually puts on the wire:
 * `x-middleware-rewrite` (where /api/auth/session goes), the
 * `x-middleware-request-*` override pair (Bearer in, cookie out — Next deletes
 * every header missing from `x-middleware-override-headers`, which is why the
 * deleted cookie cannot ride along), and Location for the two guards.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import proxy, { config } from "@/proxy";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

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
  it("only matches the session endpoint and the two guarded trees", () => {
    expect(config.matcher).toEqual([
      "/api/auth/session",
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

  it("ignores paths the matcher does not cover, even without cookies", () => {
    const response = proxy(request("/products"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not treat /accounting as a guarded route", () => {
    const response = proxy(request("/accounting"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
