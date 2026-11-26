/** sf-076/sf-077 resolver/contract tier: guard, forwarder, seam guards. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => vi.unstubAllEnvs());

describe("admin guard", () => {
  it("rejects a session without the admin role with 403", async () => {
    const auth = await import("@/lib/auth/client");
    const spy = vi.spyOn(auth, "createAuthClient").mockReturnValue({
      me: async () => ({ ok: true, data: { id: "u", email: "u@x", roles: ["user"] } }),
    } as never);
    const { requireAdmin } = await import("@/lib/admin/guard");
    const request = new NextRequest("http://localhost/api/admin/badges", {
      headers: { cookie: "sf_at=token" },
    });
    const result = await requireAdmin(request);
    expect(result.identity).toBeNull();
    expect(result.error?.status).toBe(403);
    spy.mockRestore();
  });

  it("passes the preview token from either query or header", async () => {
    const { previewTokenFrom } = await import("@/lib/admin/guard");
    expect(previewTokenFrom(new NextRequest("http://localhost/x?preview=abc"))).toBe("abc");
    expect(
      previewTokenFrom(new NextRequest("http://localhost/x", { headers: { "x-preview-token": "hdr" } })),
    ).toBe("hdr");
    expect(previewTokenFrom(new NextRequest("http://localhost/x"))).toBeNull();
  });
});

describe("versioned config route", () => {
  it("exposes the contract version and additive CMS fields", async () => {
    const { STOREFRONT_CONFIG_VERSION } = await import("@/lib/config/version");
    const { GET } = await import("@/app/api/config/storefront/route");
    const cms = await import("@/lib/cms/client");
    const spy = vi.spyOn(cms, "createCmsClient").mockReturnValue({
      getGlobalSettings: async () => ({ data: { theme: {}, version: 1, configured: true }, status: 200, code: null }),
      getNavigation: async () => ({ data: { navbar: {}, version: 1 }, status: 200, code: null }),
      getFooter: async () => ({ data: { footer: {}, version: 1 }, status: 200, code: null }),
    } as never);
    const response = await GET(new NextRequest("http://localhost/api/config/storefront"));
    const body = await response.json();
    expect(body.version).toBe(STOREFRONT_CONFIG_VERSION);
    expect(body.theme.configured).toBe(true);
    expect(body).toHaveProperty("navigation");
    expect(body).toHaveProperty("footer");
    expect(body).toHaveProperty("badges");
    spy.mockRestore();
  });
});
