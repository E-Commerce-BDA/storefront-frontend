/**
 * Account BFF writes — sf-059. Every handler must reject a guest before it
 * forwards, validate before it forwards, and never let a token or a service
 * URL into the response body.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const client = vi.hoisted(() => ({
  updateProfile: vi.fn(async () => ({ ok: true, data: { id: "u1", email: "a@example.com" } })),
  changePassword: vi.fn(async () => ({ ok: true, data: null })),
  listAddresses: vi.fn(async () => ({ ok: true, data: [] })),
  createAddress: vi.fn(async () => ({ ok: true, data: { id: "a1", line1: "1 Main", city: "S", postalCode: "1" } })),
  updateAddress: vi.fn(async () => ({ ok: true, data: { id: "a1", line1: "2 Main", city: "S", postalCode: "1" } })),
  deleteAddress: vi.fn(async () => ({ ok: true, data: null })),
}));

vi.mock("@/lib/auth/client", () => ({
  authServiceUrl: () => "http://auth.test",
  createAuthClient: () => client,
}));

const { PATCH: patchProfile } = await import("@/app/api/account/profile/route");
const { PATCH: patchPassword } = await import("@/app/api/account/password/route");
const { GET: listAddresses, POST: postAddress } = await import("@/app/api/account/addresses/route");
const { PATCH: patchAddress, DELETE: deleteAddress } = await import(
  "@/app/api/account/addresses/[id]/route"
);

function request(body?: unknown, cookie = "sf_at=at_1"): NextRequest {
  return new NextRequest("http://localhost/api/account/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  for (const fn of Object.values(client)) fn.mockClear();
});

describe("account writes (sf-059)", () => {
  it("forwards a profile edit with the Bearer and returns the user", async () => {
    const response = await patchProfile(request({ firstName: "Ada" }));
    expect(response.status).toBe(200);
    expect(client.updateProfile).toHaveBeenCalledWith("at_1", { firstName: "Ada" });
    expect(((await response.json()) as { email: string }).email).toBe("a@example.com");
  });

  it("returns 204 for a password change", async () => {
    const response = await patchPassword(request({ currentPassword: "old", newPassword: "longer123" }));
    expect(response.status).toBe(204);
    expect(client.changePassword).toHaveBeenCalledWith("at_1", {
      currentPassword: "old",
      newPassword: "longer123",
    });
  });

  it("rejects a guest and validates the body before forwarding", async () => {
    expect((await patchProfile(request({ firstName: "Ada" }, ""))).status).toBe(401);
    expect((await patchProfile(request({ roles: ["admin"] }))).status).toBe(400);
    expect(client.updateProfile).not.toHaveBeenCalled();
    expect((await listAddresses(request(undefined, ""))).status).toBe(401);
  });

  it("reads, creates, updates and deletes addresses through auth-svc", async () => {
    expect((await listAddresses(request())).status).toBe(200);
    expect(client.listAddresses).toHaveBeenCalledWith("at_1");

    expect((await postAddress(request({ line1: "1 Main", city: "S", postalCode: "1" }))).status).toBe(201);
    expect(client.createAddress).toHaveBeenCalledWith("at_1", { line1: "1 Main", city: "S", postalCode: "1" });

    const context = { params: Promise.resolve({ id: "a1" }) };
    expect((await patchAddress(request({ line1: "2 Main" }), context)).status).toBe(200);
    expect(client.updateAddress).toHaveBeenCalledWith("at_1", "a1", { line1: "2 Main" });

    expect((await deleteAddress(request(), context)).status).toBe(204);
    expect(client.deleteAddress).toHaveBeenCalledWith("at_1", "a1");
  });

  it("forwards an upstream failure code without a service URL", async () => {
    client.changePassword.mockResolvedValueOnce({
      ok: false,
      code: "TOKEN_EXPIRED",
      status: 401,
    } as never);
    const response = await patchPassword(request({ currentPassword: "old", newPassword: "longer123" }));
    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain("http://auth.test");
  });
});
