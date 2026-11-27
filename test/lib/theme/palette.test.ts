import { themeSettingsSchema } from "@ecom/contracts";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PALETTE,
  PALETTE_LIMITS,
  resolvePalette,
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
