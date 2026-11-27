import { themeVarsSchema } from "@ecom/contracts";
import { describe, expect, it } from "vitest";
import { DEFAULT_PALETTE, resolvePalette } from "@/lib/theme/palette";
import { paletteToThemeVars } from "@/lib/theme/vars";

describe("paletteToThemeVars", () => {
  it("produces a complete, deterministic map that contracts validate", () => {
    const vars = paletteToThemeVars(DEFAULT_PALETTE);
    expect(themeVarsSchema.safeParse(vars).success).toBe(true);
    expect(Object.keys(vars).length).toBeGreaterThan(100);
    expect(Object.values(vars).every((value) => value !== "" && value !== null)).toBe(true);
    expect(JSON.stringify(vars)).toBe(JSON.stringify(paletteToThemeVars(resolvePalette())));
    expect(JSON.stringify(Object.keys(vars))).toBe(
      JSON.stringify(Object.keys(paletteToThemeVars(DEFAULT_PALETTE))),
    );
  });

  it("emits effective semantics and aliases that point at the new tokens", () => {
    const vars = paletteToThemeVars(DEFAULT_PALETTE);
    expect(vars["--sf-color-brand"]).toBe("#0077B6");
    expect(vars["--sf-color-on-brand"]).toBe("#FFFFFF");
    expect(vars["--sf-color-success-fg"]).toBe(DEFAULT_PALETTE.successFg);
    expect(vars["--sf-state-focus-halo"]).toBe(DEFAULT_PALETTE.focusHalo);
    expect(vars["--sf-radius-card"]).toBe("12px");
    expect(vars["--sf-type-fs-body"]).toBe("15px");
    expect(vars["--sf-comp-button-bg"]).toBe("var(--sf-color-brand)");
    expect(vars["--color-accent"]).toBe("var(--sf-color-brand)");
    expect(vars["--color-card"]).toBeUndefined();
  });

  it("carries an admin change into the semantic token, not into a literal alias", () => {
    const changed = resolvePalette({ global: { brand: { brand: "#123456" } } });
    const vars = paletteToThemeVars(changed);
    expect(vars["--sf-color-brand"]).toBe("#123456");
    expect(vars["--color-accent"]).toBe("var(--sf-color-brand)");
    expect(themeVarsSchema.safeParse(vars).success).toBe(true);
  });

  it("never emits empty strings or nulls for a reset palette", () => {
    const reset = resolvePalette({ global: { brand: { brand: "" }, ink: { ink: null } } });
    const vars = paletteToThemeVars(reset);
    expect(vars["--sf-color-brand"]).toBe(DEFAULT_PALETTE.brand);
    expect(vars["--sf-color-ink"]).toBe(DEFAULT_PALETTE.ink);
    expect(Object.values(vars).every((value) => typeof value === "string" || typeof value === "number")).toBe(true);
  });
});
