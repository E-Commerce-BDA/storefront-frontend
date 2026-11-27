import { themeSettingsSchema } from "@ecom/contracts";
import { describe, expect, it } from "vitest";
import {
  COMPONENT_GROUP_LIMITS,
  DEFAULT_PALETTE,
  PALETTE_LIMITS,
  defaultComponentGroups,
  resolveComponentGroups,
  resolvePalette,
  type ComponentGroupFlat,
  type PaletteLayer,
  type ResolvedPalette,
} from "@/lib/theme/palette";

describe("resolvePalette", () => {
  it("returns the locked builtin primitives with no input", () => {
    expect(resolvePalette()).toEqual(DEFAULT_PALETTE);
    expect(DEFAULT_PALETTE.brand).toBe("#0077B6");
    expect(DEFAULT_PALETTE.brandHover).toBe("#023E8A");
    expect(DEFAULT_PALETTE.onBrand).toBe("#FFFFFF");
    expect(DEFAULT_PALETTE.brandWash).toBe("#E6F7FB");
    expect(DEFAULT_PALETTE.surfaceSunken).toBe("#F5FAFC");
    expect(DEFAULT_PALETTE.imagePlaceholder).toBe("#CAF0F8");
    expect(DEFAULT_PALETTE.saleFill).toBe("#FF6B4A");
    expect(DEFAULT_PALETTE.saleText).toBe("#B9381C");
  });

  it("merges per key: flat > component > section > global > builtin", () => {
    const result = resolvePalette({
      global: { brand: { brand: "#111111" }, ink: { ink: "#222222" } },
      section: { brand: { brandHover: "#333333" } },
      component: { brand: { brand: "#444444", onBrand: "#555555" } },
      flat: { brand: "#666666", brandWash: "#777777" },
    });
    expect(result.brand).toBe("#666666");
    expect(result.brandHover).toBe("#333333");
    expect(result.brandWash).toBe("#777777");
    expect(result.ink).toBe("#222222");
    expect(result.onBrand, "onBrand is locked").toBe(DEFAULT_PALETTE.onBrand);
  });

  it("resets delete keys instead of writing null", () => {
    const result = resolvePalette({
      global: {
        brand: { brand: "#111111", brandHover: "#222222" },
        ink: { muted: "#333333" },
      },
      section: { brand: { brand: null, brandHover: null } },
      component: { ink: { muted: "" } },
      flat: { surface: null },
    });
    expect(result.brand, "section reset deletes its key, exposing global").toBe("#111111");
    expect(result.brandHover, "section reset exposes the global value").toBe("#222222");
    expect(result.muted, "empty string deletes the component key, exposing global").toBe("#333333");
    expect(result.surface, "flat reset with no lower override reaches the builtin").toBe(DEFAULT_PALETTE.surface);
    expect(JSON.stringify(result)).not.toContain("null");
  });

  it("clamps numerics to the contracts 2.2.0 bounds", () => {
    const result = resolvePalette({
      global: {
        radii: { radiusButton: 999, radiusCard: -5, radiusSm: 7.6, radiusMd: 4 },
        type: { fsDisplay1: 1, fsDisplay2: 999, fsDisplay3: 33, fsBody: 99, fsCaption: 2 },
      },
    });
    expect(result.radiusButton).toBe(PALETTE_LIMITS.radiusButton.max);
    expect(result.radiusCard).toBe(PALETTE_LIMITS.radiusCard.min);
    expect(result.radiusSm).toBe(PALETTE_LIMITS.radiusSm.max);
    expect(result.radiusMd).toBe(4);
    expect(result.fsDisplay1).toBe(PALETTE_LIMITS.fsDisplay1.min);
    expect(result.fsDisplay2).toBe(PALETTE_LIMITS.fsDisplay2.max);
    expect(result.fsDisplay3).toBe(33);
    expect(result.fsBody).toBe(PALETTE_LIMITS.fsBody.max);
    expect(result.fsCaption).toBe(PALETTE_LIMITS.fsCaption.min);
  });

  it("treats wrong-typed paint, geometry and font stacks as misses", () => {
    const result = resolvePalette({
      global: {
        brand: { brand: "red" as never },
        radii: { radiusButton: "8" as never },
        type: { fontSans: "Inter; background:url(evil)", fsBody: Number.NaN },
      },
    });
    expect(result.brand).toBe(DEFAULT_PALETTE.brand);
    expect(result.radiusButton).toBe(DEFAULT_PALETTE.radiusButton);
    expect(result.fontSans).toBe(DEFAULT_PALETTE.fontSans);
    expect(result.fsBody).toBe(DEFAULT_PALETTE.fsBody);
  });

  it("accepts translucent scrims and every contract hex length, not named colors", () => {
    const result = resolvePalette({
      global: {
        scrim: { soft: "rgba(0, 0, 0, 0.4)" },
        brand: { brandWash: "#eef" },
        sale: { saleText: "blue" as never },
      },
    });
    expect(result.scrimSoft).toBe("rgba(0, 0, 0, 0.4)");
    expect(result.brandWash).toBe("#eef");
    expect(result.saleText, "named colors are not contract colors").toBe(DEFAULT_PALETTE.saleText);
  });

  it("locks focus, disabled, status foregrounds and on-colors against every layer", () => {
    const bad = "#000000";
    const result = resolvePalette({
      flat: {
        focusOutline: bad, focusHalo: bad,
        disabledBg: bad, disabledText: bad, disabledBorder: bad,
        onBrand: bad, onSale: bad,
        successFg: bad, warningFg: bad, errorFg: bad,
        onSuccess: bad, onWarning: bad, onError: bad,
        successFill: "#123456",
      },
      global: {
        state: {
          focusOutline: bad, focusHalo: bad,
          disabledBg: bad, disabledText: bad, disabledBorder: bad,
        },
        success: { fg: bad, fill: "#123456" },
        warning: { fg: bad },
        error: { fg: bad },
      },
    });
    for (const key of [
      "focusOutline", "focusHalo", "disabledBg", "disabledText", "disabledBorder",
      "onBrand", "onSale", "successFg", "warningFg", "errorFg",
      "onSuccess", "onWarning", "onError",
    ] as Array<keyof ResolvedPalette>) {
      expect(result[key], `${key} must be locked`).toBe(DEFAULT_PALETTE[key]);
    }
    expect(result.successFill, "status fill stays admin-editable").toBe("#123456");
  });

  it("resolves a contract-validated 2.2.0 palette read", () => {
    const parsed = themeSettingsSchema.parse({
      palette: {
        brand: { brand: "#123456" },
        radii: { radiusCard: 9 },
        type: { fsDisplay1: 80 },
      },
    });
    const result = resolvePalette({ global: parsed.palette as PaletteLayer | undefined });
    expect(result.brand).toBe("#123456");
    expect(result.radiusCard).toBe(9);
    expect(result.fsDisplay1).toBe(80);
  });
});

describe("resolveComponentGroups", () => {
  const builtins = () => defaultComponentGroups(DEFAULT_PALETTE);

  it("mirrors the stylesheet fallbacks for every group", () => {
    const groups = resolveComponentGroups({ palette: DEFAULT_PALETTE });
    expect(groups).toEqual(builtins());
    expect(groups.navbarHeight).toBe(64);
    expect(groups.facetGap).toBe(20);
    expect(groups.drawerWidth).toBe(380);
    expect(groups.marqueeSpeed).toBe(60);
    expect(groups.gridGap).toBe(20);
    expect(groups.pcCtaBg).toBe(DEFAULT_PALETTE.surface);
  });

  it("follows the same per-key precedence and palette-derived defaults", () => {
    const palette = resolvePalette({ global: { navbar: { bg: "#123456" }, ink: { ink: "#0f0f0f" } } });
    const groups = resolveComponentGroups({
      palette,
      global: { navbar: { height: 70 }, filterRail: { gap: 12 } },
      section: { navbar: { text: "#abcdef" }, grid: { gap: 24 } },
      component: { filterRail: { gap: 14 }, productCard: { ctaBg: "#111111" } },
      flat: { navbarHeight: 80, gridGap: 32 },
    });
    expect(groups.navbarHeight).toBe(80);
    expect(groups.gridGap).toBe(32);
    expect(groups.facetGap).toBe(14);
    expect(groups.navbarText).toBe("#abcdef");
    expect(groups.navbarBg, "palette navbar color is the builtin").toBe("#123456");
    expect(groups.facetTitle, "palette ink is the builtin").toBe("#0f0f0f");
    expect(groups.pcCtaBg).toBe("#111111");
  });

  it("resets delete keys and never writes null", () => {
    const groups = resolveComponentGroups({
      palette: DEFAULT_PALETTE,
      global: { drawer: { width: 400, bg: "#123456" }, grid: { gap: 24 } },
      section: { drawer: { width: null, bg: "" } },
      component: { grid: { gap: null } },
    });
    expect(groups.drawerWidth, "section reset exposes global").toBe(400);
    expect(groups.drawerBg, "empty string deletes the section key").toBe("#123456");
    expect(groups.gridGap, "component reset exposes section").toBe(24);
    const resetOnly = resolveComponentGroups({
      palette: DEFAULT_PALETTE,
      global: { drawer: { width: null } },
    });
    expect(resetOnly.drawerWidth, "reset with no lower override reaches builtin").toBe(builtins().drawerWidth);
    expect(JSON.stringify(groups)).not.toContain("null");
  });

  it("clamps geometry and refuses wrong enums, booleans and colors", () => {
    const groups = resolveComponentGroups({
      palette: DEFAULT_PALETTE,
      global: {
        navbar: { height: 999 },
        filterRail: { radius: 99, titleSize: 1 },
        drawer: { width: 1000, durationMs: 1, motion: "bounce" as never, overlayColor: "url(evil)" as never },
        marquee: { speed: 999, direction: "up" as never, pauseOnHover: "yes" as never },
        grid: { gap: 999 },
        productCard: { ctaBg: "blue" as never },
      },
    });
    expect(groups.navbarHeight).toBe(COMPONENT_GROUP_LIMITS.navbarHeight.max);
    expect(groups.facetRadius).toBe(COMPONENT_GROUP_LIMITS.facetRadius.max);
    expect(groups.facetTitleSize).toBe(COMPONENT_GROUP_LIMITS.facetTitleSize.min);
    expect(groups.drawerWidth).toBe(COMPONENT_GROUP_LIMITS.drawerWidth.max);
    expect(groups.drawerDurationMs).toBe(COMPONENT_GROUP_LIMITS.drawerDurationMs.min);
    expect(groups.drawerMotion).toBe("slide");
    expect(groups.drawerOverlayColor).toBe(builtins().drawerOverlayColor);
    expect(groups.marqueeSpeed).toBe(COMPONENT_GROUP_LIMITS.marqueeSpeed.max);
    expect(groups.marqueeDirection).toBe("left");
    expect(groups.marqueePauseOnHover).toBe(true);
    expect(groups.gridGap).toBe(COMPONENT_GROUP_LIMITS.gridGap.max);
    expect(groups.pcCtaBg).toBe(builtins().pcCtaBg);
  });

  it("ignores locked palette keys arriving on the component flat layer", () => {
    const groups = resolveComponentGroups({
      palette: DEFAULT_PALETTE,
      flat: { onBrand: "#000000", focusOutline: "#000000" } as unknown as ComponentGroupFlat,
    });
    expect(JSON.stringify(groups)).not.toContain("#000000");
  });

  it("resolves contract-validated group reads from a 2.2.0 theme", () => {
    const parsed = themeSettingsSchema.parse({
      navbar: { height: 72, bg: "#ffffff" },
      filterRail: { gap: 24 },
      drawer: { width: 420, motion: "fade" },
      marquee: { speed: 90, direction: "right", pauseOnHover: false },
      grid: { gap: 0 },
      productCard: { ctaBg: "#0077b6", ctaTextColor: "#ffffff", ctaBorderColor: "" },
    });
    const groups = resolveComponentGroups({
      palette: DEFAULT_PALETTE,
      global: {
        navbar: parsed.navbar,
        filterRail: parsed.filterRail,
        drawer: parsed.drawer,
        marquee: parsed.marquee,
        grid: parsed.grid,
        productCard: parsed.productCard,
      },
    });
    expect(groups.navbarHeight).toBe(72);
    expect(groups.facetGap).toBe(24);
    expect(groups.drawerWidth).toBe(420);
    expect(groups.drawerMotion).toBe("fade");
    expect(groups.marqueeDirection).toBe("right");
    expect(groups.marqueePauseOnHover).toBe(false);
    expect(groups.gridGap).toBe(0);
    expect(groups.pcCtaBg).toBe("#0077b6");
    expect(groups.pcCtaBorder).toBe(DEFAULT_PALETTE.border);
  });
});
