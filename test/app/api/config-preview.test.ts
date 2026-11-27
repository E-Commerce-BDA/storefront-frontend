/**
 * Contract tier for the public config read (sf-096).
 *
 * The token must reach cms-svc, never the browser: a response that echoed it
 * would hand every shopper an admin's scoped credential. The envelope shape is
 * checked against the contracts schema, not a hand-written subset.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as cmsModule from "@/lib/cms/client";
import * as catalogModule from "@/lib/catalog/client";

const THEME = {
  theme: {
    palette: { brand: { brand: "#123456" } },
    navbar: { height: 64 },
  },
  version: 7,
  configured: true,
};

function mockServices() {
  // Spies stay on the live ESM bindings the route imported at module load.
  const cms = vi.spyOn(cmsModule, "createCmsClient").mockReturnValue({
    getGlobalSettings: async () => ({ data: THEME, status: 200, code: null }),
    getNavigation: async () => ({ data: { navbar: {}, version: 1 }, status: 200, code: null }),
    getFooter: async () => ({ data: { footer: {}, version: 1 }, status: 200, code: null }),
  } as never);
  const catalog = vi.spyOn(catalogModule, "catalogClient").mockReturnValue({
    listPublicBadges: async () => ({ ok: true, data: [] }),
  } as never);
  return { cms, catalog };
}

afterEach(() => vi.restoreAllMocks());

describe("GET /api/config/storefront — preview forwarding", () => {
  it("uses a ?preview= token and never emits it in the envelope", async () => {
    const { storefrontConfigResponseSchema } = await import("@ecom/contracts");
    const { GET } = await import("@/app/api/config/storefront/route");
    const { PREVIEW_METADATA } = await import("@/lib/config/preview");
    const { STOREFRONT_CONFIG_VERSION, STOREFRONT_CONFIG_VERSION_STRING } = await import(
      "@/lib/config/version"
    );
    const { cms, catalog } = mockServices();

    const response = await GET(
      new NextRequest("http://localhost/api/config/storefront?preview=draft-token"),
    );
    const text = await response.text();
    const body = JSON.parse(text) as Record<string, unknown>;

    expect(cms.mock.calls.at(-1)?.[0]).toMatchObject({ previewToken: "draft-token" });
    expect(text).not.toContain("draft-token");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(storefrontConfigResponseSchema.safeParse(body).success).toBe(true);
    expect(body.configVersion).toBe(STOREFRONT_CONFIG_VERSION_STRING);
    expect(body.revision).toBe(7);
    expect(body.version).toBe(STOREFRONT_CONFIG_VERSION);
    expect(body.palette).toEqual(THEME.theme.palette);
    expect(body.navigation).toEqual({});
    expect(body.footer).toEqual({});
    expect(body.badges).toEqual([]);
    expect(body.preview).toEqual(PREVIEW_METADATA);
    expect((body.theme as Record<string, unknown>)["--sf-color-brand"]).toBe("#123456");
    expect(catalog).toHaveBeenCalled();
  });

  it("honours x-preview-token and lets it win over the query", async () => {
    const { GET } = await import("@/app/api/config/storefront/route");
    const { cms } = mockServices();

    await GET(
      new NextRequest("http://localhost/api/config/storefront?preview=query-token", {
        headers: { "x-preview-token": " header-token " },
      }),
    );
    expect(cms.mock.calls.at(-1)?.[0]).toMatchObject({ previewToken: "header-token" });

    await GET(
      new NextRequest("http://localhost/api/config/storefront", {
        headers: { "x-preview-token": "header-only" },
      }),
    );
    expect(cms.mock.calls.at(-1)?.[0]).toMatchObject({ previewToken: "header-only" });

    await GET(new NextRequest("http://localhost/api/config/storefront"));
    expect(cms.mock.calls.at(-1)?.[0]).toMatchObject({ previewToken: null });
  });
});
