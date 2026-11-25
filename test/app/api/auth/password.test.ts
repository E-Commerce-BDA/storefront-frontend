/** au-007 BFF routes: validate → forward → respond; never echo a token or account existence. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const client = vi.hoisted(() => ({
  forgotPassword: vi.fn(async () => ({ ok: true, data: { message: "If an account exists for that email, a password reset link has been sent." } })),
  resetPassword: vi.fn(async () => ({ ok: true, data: null })),
}));

vi.mock("@/lib/auth/client", () => ({
  authServiceUrl: () => "http://auth.test",
  createAuthClient: () => client,
}));

const { POST: forgot } = await import("@/app/api/auth/password/forgot/route");
const { POST: reset } = await import("@/app/api/auth/password/reset/route");

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/password/forgot", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  client.forgotPassword.mockClear();
  client.resetPassword.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("password BFF routes (au-007)", () => {
  it("returns the generic 202 message and forwards only the email", async () => {
    const response = await forgot(request({ email: " SHOPPER@Example.com " }));
    expect(response.status).toBe(202);
    expect(client.forgotPassword).toHaveBeenCalledWith("shopper@example.com");
    const text = await response.text();
    expect(text).toContain("If an account exists");
    expect(text.toLowerCase()).not.toContain("token");
  });

  it("returns 204 for a valid reset and forwards token + password", async () => {
    const response = await reset(request({ token: "tok_123", newPassword: "longer123" }));
    expect(response.status).toBe(204);
    expect(client.resetPassword).toHaveBeenCalledWith("tok_123", "longer123");
  });

  it("rejects a weak password or bad email before forwarding", async () => {
    expect((await forgot(request({ email: "not-an-email" }))).status).toBe(400);
    expect((await reset(request({ token: "tok_123", newPassword: "letters" }))).status).toBe(400);
    expect(client.forgotPassword).not.toHaveBeenCalled();
    expect(client.resetPassword).not.toHaveBeenCalled();
  });

  it("forwards the reset error code, not parsed prose", async () => {
    client.resetPassword.mockResolvedValueOnce({
      ok: false,
      code: "RESET_TOKEN_INVALID",
      status: 401,
    } as never);
    const response = await reset(request({ token: "bad", newPassword: "longer123" }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "RESET_TOKEN_INVALID" } });
  });
});
