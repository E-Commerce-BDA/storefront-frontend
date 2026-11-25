/**
 * POST /api/auth/refresh — the proxy's landing pad.
 *
 * Two shapes, one handler: `?next=` present means a browser navigation is
 * waiting and the answer must be a 303 (JSON would render as text); absent
 * means a fetch from an island and the answer is `{ ok }`. The failure path
 * always clears both cookies, otherwise `/account` → `/api/auth/refresh` →
 * `/account` would loop with a dead refresh token.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/refresh/route";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

const PAIR = { accessToken: "at_2", refreshToken: "rt_2" };

function request(query = "", cookie?: string): NextRequest {
  return new NextRequest(`http://localhost/api/auth/refresh${query}`, {
    method: "POST",
    headers: cookie === undefined ? undefined : { cookie },
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

function cleared(response: Response): string[] {
  return response.headers.getSetCookie().filter((cookie) => /max-age=0/i.test(cookie));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/auth/refresh", () => {
  it("rotates the cookies and answers { ok } for a JSON caller", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(200, PAIR);

    const response = await POST(request("", `${REFRESH_COOKIE}=rt_1`));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(Object.keys(body)).toEqual(["ok"]);
    expect(JSON.stringify(body)).not.toContain(PAIR.accessToken);

    const cookies = response.headers.getSetCookie();
    expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=at_2`))).toBe(true);
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=rt_2`))).toBe(true);
  });

  it("answers 303 into the sanitized resume path for a browser navigation", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(200, PAIR);

    const response = await POST(
      request(`?next=${encodeURIComponent("/checkout?step=payment")}`, `${REFRESH_COOKIE}=rt_1`),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/checkout?step=payment");
    expect(response.headers.getSetCookie().some((c) => c.startsWith(`${ACCESS_COOKIE}=at_2`))).toBe(
      true,
    );
  });

  it("drops an off-site resume path instead of echoing it into Location", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(200, PAIR);

    const response = await POST(
      request(`?next=${encodeURIComponent("//evil.com")}`, `${REFRESH_COOKIE}=rt_1`),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/account");
  });

  it("sends a browser to /signin and clears both cookies when the refresh is rejected", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(401, {
      error: { code: "TOKEN_REUSED", message: "Session terminated due to security violation" },
    });

    const response = await POST(
      request(`?next=${encodeURIComponent("/account/orders")}`, `${REFRESH_COOKIE}=rt_stolen`),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/signin?next=%2Faccount%2Forders",
    );
    expect(cleared(response)).toHaveLength(2);
  });

  it("answers 401 TOKEN_EXPIRED with no cookie at all", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    const fetchFn = stubAuthService(200, PAIR);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "TOKEN_EXPIRED" } });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(cleared(response)).toHaveLength(2);
  });

  it("surfaces a dead auth-svc as 503 and still clears the cookies", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("The operation was aborted.", "AbortError");
      }),
    );

    const response = await POST(request("", `${REFRESH_COOKIE}=rt_1`));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: "SERVICE_UNAVAILABLE" } });
    expect(cleared(response)).toHaveLength(2);
  });
});

