/**
 * Thin auth client — the mapping table is the contract, so it is a test.
 *
 * Every case injects `fetchFn`: no network, no clock, no ports. The rule the
 * table encodes is "status first, a known domain code refines a 401 on refresh";
 * no case may depend on the message text.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_SERVICE_TIMEOUT_MS,
  authServiceUrl,
  createAuthClient,
} from "@/lib/auth/client";

const BASE = "http://auth.test";

const SESSION = {
  user: {
    id: "u1",
    email: "ana@x.com",
    firstName: "Ana",
    lastName: "Silva",
    roles: ["customer"],
  },
  accessToken: "at_1",
  refreshToken: "rt_1",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function authError(status: number, code: string, message = code): Response {
  return json({ error: { code, message } }, status);
}

function client(handler: () => Promise<Response>) {
  const fetchFn = vi.fn(handler);
  return {
    fetchFn,
    auth: createAuthClient({ baseUrl: BASE, fetchFn: fetchFn as unknown as typeof fetch }),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("login / register", () => {
  it("parses a 200 session and posts JSON to the documented path", async () => {
    const { auth, fetchFn } = client(async () => json(SESSION, 201));

    const result = await auth.login({ email: "ana@x.com", password: "secret123" });

    expect(result).toEqual({ ok: true, data: SESSION });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${BASE}/api/v1/auth/login`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "ana@x.com",
      password: "secret123",
    });
  });

  it("maps a 401 on login to INVALID_CREDENTIALS, whatever the message says", async () => {
    const { auth } = client(async () => authError(401, "ACCOUNT_DISABLED", "Account is disabled"));

    const result = await auth.login({ email: "ana@x.com", password: "nope" });

    // Generic on purpose: "disabled" must not be distinguishable at sign-in.
    expect(result).toEqual({ ok: false, code: "INVALID_CREDENTIALS", status: 401 });
  });

  it("maps a 409 on register to EMAIL_TAKEN", async () => {
    const { auth } = client(async () => authError(409, "EMAIL_TAKEN", "Email already registered"));

    const result = await auth.register({
      email: "ana@x.com",
      password: "secret123",
      firstName: "Ana",
      lastName: "Silva",
    });

    expect(result).toEqual({ ok: false, code: "EMAIL_TAKEN", status: 409 });
  });

  it("treats a 200 without tokens as SERVICE_UNAVAILABLE (never a partial session)", async () => {
    const { auth } = client(async () => json({ user: SESSION.user }));

    const result = await auth.login({ email: "ana@x.com", password: "secret123" });

    expect(result).toEqual({ ok: false, code: "SERVICE_UNAVAILABLE", status: 200 });
  });
});

describe("refresh", () => {
  it("returns the new pair", async () => {
    const { auth } = client(async () =>
      json({ accessToken: "at_2", refreshToken: "rt_2" }),
    );

    const result = await auth.refresh("rt_1");

    expect(result).toEqual({
      ok: true,
      data: { accessToken: "at_2", refreshToken: "rt_2" },
    });
  });

  it("maps a TOKEN_REUSED code from a 401 refresh to TOKEN_REUSED", async () => {
    const { auth } = client(async () =>
      authError(401, "TOKEN_REUSED", "Session terminated due to security violation"),
    );

    expect(await auth.refresh("rt_1")).toEqual({
      ok: false,
      code: "TOKEN_REUSED",
      status: 401,
    });
  });

  it("maps an ACCOUNT_DISABLED code from a 401 refresh to ACCOUNT_DISABLED", async () => {
    const { auth } = client(async () => authError(401, "ACCOUNT_DISABLED", "Account is disabled"));

    expect(await auth.refresh("rt_1")).toEqual({
      ok: false,
      code: "ACCOUNT_DISABLED",
      status: 401,
    });
  });

  it("maps a plain 401 to TOKEN_EXPIRED (the common case)", async () => {
    const { auth } = client(async () =>
      authError(401, "UNAUTHENTICATED", "Invalid or expired refresh token"),
    );

    expect(await auth.refresh("rt_1")).toEqual({
      ok: false,
      code: "TOKEN_EXPIRED",
      status: 401,
    });
  });
});

describe("status map", () => {
  it.each([
    [400, "VALIDATION_FAILED"],
    [429, "RATE_LIMITED"],
    [502, "SERVICE_UNAVAILABLE"],
  ])("maps %i to %s", async (status, code) => {
    const { auth } = client(async () => authError(status, "UNAUTHENTICATED", "whatever"));

    const result = await auth.login({ email: "ana@x.com", password: "x" });

    expect(result).toMatchObject({ ok: false, code });
  });

  it("turns a thrown AbortError into SERVICE_UNAVAILABLE with status 0", async () => {
    const { auth } = client(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });

    const result = await auth.login({ email: "ana@x.com", password: "x" });

    expect(result).toEqual({ ok: false, code: "SERVICE_UNAVAILABLE", status: 0 });
  });

  it("turns a non-JSON success body into SERVICE_UNAVAILABLE", async () => {
    const { auth } = client(async () => new Response("<html>gateway</html>"));

    const result = await auth.refresh("rt_1");

    expect(result).toEqual({ ok: false, code: "SERVICE_UNAVAILABLE", status: 200 });
  });
});

describe("logout", () => {
  it("accepts auth-svc's 204 with no payload", async () => {
    const { auth, fetchFn } = client(async () => new Response(null, { status: 204 }));

    const result = await auth.logout("rt_1");

    expect(result).toEqual({ ok: true, data: null });
    const [url] = fetchFn.mock.calls[0] as unknown as [string];
    expect(url).toBe(`${BASE}/api/v1/auth/logout`);
  });
});

describe("configuration", () => {
  it("defaults to :4010 and trims trailing slashes", () => {
    vi.stubEnv("AUTH_SVC_URL", "");
    expect(authServiceUrl()).toBe("http://localhost:4010");

    vi.stubEnv("AUTH_SVC_URL", "http://auth.internal:9000//");
    expect(authServiceUrl()).toBe("http://auth.internal:9000");
  });

  it("exposes a 3 s budget — shorter than a shopper's patience, longer than auth-svc's p99", () => {
    expect(AUTH_SERVICE_TIMEOUT_MS).toBe(3000);
  });
});
