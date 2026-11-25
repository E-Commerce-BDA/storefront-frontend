/**
 * POST /api/auth/logout — revoke is best effort, sign-out is not.
 *
 * The contract the browser depends on: 204 and two expired cookies, always —
 * including when auth-svc is down, because a shopper who clicked "sign out"
 * must not stay signed in on that device.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/logout/route";
import { REFRESH_COOKIE } from "@/lib/auth/session";

function request(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/logout", {
    method: "POST",
    headers: cookie === undefined ? undefined : { cookie },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/auth/logout", () => {
  it("revokes the refresh token upstream and expires both cookies", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchFn);

    const response = await POST(request(`${REFRESH_COOKIE}=rt_1`));

    expect(response.status).toBe(204);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://auth.test/api/v1/auth/logout");
    expect(JSON.parse(String(init.body))).toEqual({ refreshToken: "rt_1" });

    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    expect(cookies.every((cookie) => /max-age=0/i.test(cookie))).toBe(true);
  });

  it("skips the upstream call when there is nothing to revoke", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchFn);

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(response.headers.getSetCookie()).toHaveLength(2);
  });

  it("303s a form POST to a safe next path with both cookies expired", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

    const form = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "next=%2F",
    });
    const response = await POST(form);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/");
    expect(response.headers.getSetCookie()).toHaveLength(2);
    expect(response.headers.getSetCookie().every((c) => /max-age=0/i.test(c))).toBe(true);
  });

  it("refuses an off-origin next and keeps the bare 204", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

    const form = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "next=%2F%2Fevil.test",
    });
    const response = await POST(form);

    expect(response.status).toBe(204);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still signs the browser out when auth-svc is unreachable", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("The operation was aborted.", "AbortError");
      }),
    );

    const response = await POST(request(`${REFRESH_COOKIE}=rt_1`));

    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toHaveLength(2);
  });
});
