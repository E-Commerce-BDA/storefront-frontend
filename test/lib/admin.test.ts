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
  it("emits the contracts 2.2.0 envelope with resolved vars and preview metadata", async () => {
    const { storefrontConfigResponseSchema } = await import("@ecom/contracts");
    const { STOREFRONT_CONFIG_VERSION, STOREFRONT_CONFIG_VERSION_STRING } = await import("@/lib/config/version");
    const { GET } = await import("@/app/api/config/storefront/route");
    const { PREVIEW_METADATA } = await import("@/lib/config/preview");
    const cms = await import("@/lib/cms/client");
    const catalog = await import("@/lib/catalog/client");
    const cmsSpy = vi.spyOn(cms, "createCmsClient").mockReturnValue({
      getGlobalSettings: async () => ({
        data: { theme: { palette: { brand: { brand: "#123456" } } }, version: 7, configured: true },
        status: 200,
        code: null,
      }),
      getNavigation: async () => ({ data: { navbar: {}, version: 1 }, status: 200, code: null }),
      getFooter: async () => ({ data: { footer: {}, version: 1 }, status: 200, code: null }),
    } as never);
    const badgeSpy = vi.spyOn(catalog, "catalogClient").mockReturnValue({
      listPublicBadges: async () => ({
        ok: true,
        data: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            key: "sale",
            label: "Sale",
            bg: "#FF6B4A",
            textColor: "#FFFFFF",
          },
        ],
      }),
    } as never);
    const response = await GET(new NextRequest("http://localhost/api/config/storefront"));
    const body = await response.json();
    expect(storefrontConfigResponseSchema.safeParse(body).success).toBe(true);
    expect(body.configVersion).toBe(STOREFRONT_CONFIG_VERSION_STRING);
    expect(body.revision).toBe(7);
    expect(body.version).toBe(STOREFRONT_CONFIG_VERSION);
    expect(body.theme["--sf-color-brand"]).toBe("#123456");
    expect(body.palette.brand.brand).toBe("#123456");
    expect(body.badges).toHaveLength(1);
    expect(body.preview).toEqual(PREVIEW_METADATA);
    expect(body).toHaveProperty("navigation");
    expect(body).toHaveProperty("footer");
    cmsSpy.mockRestore();
    badgeSpy.mockRestore();
  });
});
