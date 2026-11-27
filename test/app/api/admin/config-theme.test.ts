/** sf-084 follow-up: the theme BFF reads public settings and writes admin settings. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin theme config BFF", () => {
  let forward: ReturnType<typeof vi.fn>;


  beforeEach(async () => {
    const auth = await import("@/lib/auth/client");
    vi.spyOn(auth, "createAuthClient").mockReturnValue({
      me: async () => ({ ok: true, data: { id: "u", email: "u@x", roles: ["admin"] } }),
    } as never);
    const proxy = await import("@/lib/admin/proxy");
    forward = vi.fn(async () => ({ ok: true, data: { theme: {}, version: 1 } })) as never;
    vi.spyOn(proxy, "forwardAdmin").mockImplementation(forward);
  });

  function request(method = "GET"): NextRequest {
    return new NextRequest(`http://localhost/api/admin/config/theme?preview=abc`, {
      method,
      headers: {
        cookie: "sf_at=token",
        host: "localhost:3000",
        ...(method === "PUT"
          ? { origin: "http://localhost:3000", "content-type": "application/json" }
          : {}),
      },
      body: method === "PUT" ? JSON.stringify({ brand: {} }) : undefined,
    });
  }

  it("GET reads the public/versioned settings with the preview token", async () => {
    const { GET } = await import("@/app/api/admin/config/theme/route");
    await GET(request());
    expect(forward).toHaveBeenCalledTimes(1);
    const options = forward.mock.calls[0][1] as Record<string, unknown>;
    expect(options.path).toBe("/api/v1/cms/settings/global");
    expect(options.previewToken).toBe("abc");
    expect(options.method).toBeUndefined();
    expect(options.body).toBeUndefined();
  });

  it("PUT writes through the admin settings path with the JSON body", async () => {
    const { PUT } = await import("@/app/api/admin/config/theme/route");
    await PUT(request("PUT"));
    expect(forward).toHaveBeenCalledTimes(1);
    const options = forward.mock.calls[0][1] as Record<string, unknown>;
    expect(options.path).toBe("/api/v1/cms/admin/settings/global");
    expect(options.method).toBe("PUT");
    expect(options.body).toEqual({ brand: {} });
    expect(options.previewToken).toBeUndefined();
  });

  it("mints preview tokens through the BFF, never directly from the browser", async () => {
    const { GET } = await import("@/app/api/admin/preview/token/route");
    const preview = new NextRequest(
      "http://localhost/api/admin/preview/token?expiresIn=60",
      { headers: { cookie: "sf_at=token" } },
    );
    await GET(preview);
    expect(forward).toHaveBeenCalledTimes(1);
    const options = forward.mock.calls[0][1] as Record<string, unknown>;
    expect(options.path).toBe("/api/v1/cms/admin/preview-token?expiresIn=60");
  });

  it("refuses a cross-origin write before forwarding", async () => {
    const { PUT } = await import("@/app/api/admin/config/theme/route");
    const cross = new NextRequest("http://localhost/api/admin/config/theme", {
      method: "PUT",
      headers: { cookie: "sf_at=token", host: "localhost:3000", origin: "https://evil.test" },
      body: JSON.stringify({}),
    });
    const response = await PUT(cross);
    expect(response.status).toBe(403);
    expect(forward).not.toHaveBeenCalled();
  });

  it("refuses a non-admin read before forwarding", async () => {
    const auth = await import("@/lib/auth/client");
    vi.spyOn(auth, "createAuthClient").mockReturnValue({
      me: async () => ({ ok: true, data: { id: "u", email: "u@x", roles: ["user"] } }),
    } as never);
    const { GET } = await import("@/app/api/admin/config/theme/route");
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(forward).not.toHaveBeenCalled();
  });
});
