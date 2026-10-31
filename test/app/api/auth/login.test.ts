/**
 * POST /api/auth/login — the G3 proof, executed rather than grepped.
 *
 * The handler's whole job is: tokens → cookies, everything else → `{ user }`.
 * So the assertions are (a) the body's key set is exactly `['user']`, (b) the
 * serialised body contains no token value, (c) the Set-Cookie pair carries
 * HttpOnly/SameSite/path, and (d) a failure sets no cookie at all.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

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

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
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
