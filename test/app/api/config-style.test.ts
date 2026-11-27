/**
 * Style contract for the 2.2.0 storefront config (sf-096).
 *
 * Paint reaches the browser only as `--sf-*` / resolver-emitted vars. An admin
 * document is typed palette data, never CSS text: a raw `--adm-*` key or a
 * `cssText` string would bypass clamps and contrast locks and make preview and
 * published rendering disagree.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as cmsModule from "@/lib/cms/client";
import * as catalogModule from "@/lib/catalog/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const routeSource = readFileSync(
  join(root, "app", "api", "config", "storefront", "route.ts"),
  "utf8",
);
const layoutSource = readFileSync(join(root, "app", "layout.tsx"), "utf8");

const settings = {
  palette: { brand: { brand: "#123456" } },
  navbar: { height: 64 },
  // A hostile-looking admin payload must be projected away, not forwarded.
  cssText: "--adm-color: red;",
  "--adm-color": "red",
};

afterEach(() => vi.restoreAllMocks());

describe("config envelope style contract", () => {
  it("builds theme paint only from the typed resolvers", () => {
    expect(routeSource).toMatch(/themeToCssVars\(resolveThemeSettings\(\{ settings \}\)\)/);
    expect(routeSource).toMatch(/paletteToThemeVars\(palette, groups\)/);
    expect(routeSource).not.toMatch(/cssText|--adm-/);
    expect(layoutSource).toMatch(/themeToCssVars\(theme\)/);
    expect(layoutSource).toMatch(/paletteToThemeVars\(palette, groups\)/);
    expect(layoutSource).not.toMatch(/cssText|--adm-/);
  });

  it("emits no var the resolvers did not author", async () => {
    const { GET } = await import("@/app/api/config/storefront/route");
    const { resolveThemeSettings } = await import("@/lib/cms/themeSettings");
    const { themeToCssVars } = await import("@/lib/cms/themeVars");
    const { resolvePalette, resolveComponentGroups } = await import("@/lib/theme/palette");
    const { paletteToThemeVars } = await import("@/lib/theme/vars");

    vi.spyOn(cmsModule, "createCmsClient").mockReturnValue({
      getGlobalSettings: async () => ({ data: { theme: settings, version: 3 }, status: 200, code: null }),
      getNavigation: async () => ({ data: { navbar: {}, version: 1 }, status: 200, code: null }),
      getFooter: async () => ({ data: { footer: {}, version: 1 }, status: 200, code: null }),
    } as never);
    vi.spyOn(catalogModule, "catalogClient").mockReturnValue({
      listPublicBadges: async () => ({ ok: true, data: [] }),
    } as never);

    const response = await GET(new NextRequest("http://localhost/api/config/storefront"));
    const body = (await response.json()) as { theme: Record<string, string | number> };
    const theme = resolveThemeSettings({ settings });
    const palette = resolvePalette({ global: settings.palette });
    const groups = resolveComponentGroups({ palette, global: settings });
    const allowed = new Set([
      ...Object.keys(themeToCssVars(theme)),
      ...Object.keys(paletteToThemeVars(palette, groups)),
    ]);
    const unexpected = Object.keys(body.theme).filter((name) => !allowed.has(name));

    expect(unexpected).toEqual([]);
    expect(Object.keys(body.theme).some((name) => name.startsWith("--adm-"))).toBe(false);
    expect(body.theme["--sf-color-brand"]).toBe("#123456");
    expect(JSON.stringify(body)).not.toContain("cssText");
  });
});
