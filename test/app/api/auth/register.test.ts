/**
 * POST /api/auth/register — sign-up is a sign-in.
 *
 * auth-svc register creates the user (201, { user } only), then the client
 * logs in to get the token pair. The mock returns SESSION for every fetch call
 * so both steps succeed. The BFF sets the same cookies as login and the island
 * lands in the account without a second prompt. The only failure worth naming
 * is 409.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";

const SESSION = {
  user: {
    id: "u1",
    email: "ana@x.com",
    firstName: "Ana",
    lastName: "Silva",
    roles: ["customer"],
  },
  accessToken: "at_new",
  refreshToken: "rt_new",
};

const VALID = {
  email: "ana@x.com",
  password: "secret123",
  firstName: "Ana",
  lastName: "Silva",
};

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function stubAuthService(status: number, body: unknown) {
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
});

describe("POST /api/auth/register", () => {
  it("answers 201 with { user } and sets the session cookies", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(201, SESSION);

    const response = await POST(request(VALID));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(Object.keys(body)).toEqual(["user"]);
    expect(JSON.stringify(body)).not.toContain(SESSION.accessToken);
    expect(response.headers.getSetCookie()).toHaveLength(2);
  });

  it("reports a duplicate email as EMAIL_TAKEN without setting cookies", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    stubAuthService(409, { error: { code: "CONFLICT", message: "Email already registered" } });

    const response = await POST(request(VALID));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: { code: "EMAIL_TAKEN" } });
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("rejects a short password before it reaches auth-svc", async () => {
    vi.stubEnv("AUTH_SVC_URL", "http://auth.test");
    const fetchFn = stubAuthService(201, SESSION);

    const response = await POST(request({ ...VALID, password: "short" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "VALIDATION_FAILED" } });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
