import { themeVarsSchema } from "@ecom/contracts";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PALETTE,
  defaultComponentGroups,
  resolveComponentGroups,
  resolvePalette,
} from "@/lib/theme/palette";
import { componentGroupsToThemeVars, paletteToThemeVars } from "@/lib/theme/vars";

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

describe("componentGroupsToThemeVars", () => {
  const groups = () => resolveComponentGroups({ palette: DEFAULT_PALETTE });

  it("emits the existing CSS families with concrete values", () => {
    const vars = componentGroupsToThemeVars(groups());
    expect(themeVarsSchema.safeParse(vars).success).toBe(true);
    expect(vars["--nb-height"]).toBe("64px");
    expect(vars["--nb-bg"]).toBe(DEFAULT_PALETTE.navbarBg);
    expect(vars["--facet-title-size"]).toBe("18px");
    expect(vars["--minicart-width"]).toBe("380px");
    expect(vars["--minicart-motion"]).toBe("slide");
    expect(vars["--strip-cell-bg"]).toBe("var(--sf-color-surface)");
    expect(vars["--marquee-direction"]).toBe("normal");
    expect(vars["--pc-cta-border"]).toBe(DEFAULT_PALETTE.border);
    expect(JSON.stringify(vars)).toBe(JSON.stringify(componentGroupsToThemeVars(defaultComponentGroups(DEFAULT_PALETTE))));
  });

  it("leaves per-section fallback families absent until admin retunes them", () => {
    const vars = componentGroupsToThemeVars(groups());
    expect(vars["--grid-gap"]).toBeUndefined();
    expect(vars["--marquee-duration"]).toBeUndefined();
  });

  it("carries group overrides into the same families, including the marquee clock", () => {
    const changed = resolveComponentGroups({
      palette: DEFAULT_PALETTE,
      global: {
        navbar: { height: 80 },
        filterRail: { gap: 24 },
        drawer: { width: 420, motion: "fade" },
        marquee: { speed: 120, direction: "right", pauseOnHover: false },
        grid: { gap: 12 },
        productCard: { ctaBg: "#123456" },
      },
    });
    const vars = componentGroupsToThemeVars(changed);
    expect(vars["--nb-height"]).toBe("80px");
    expect(vars["--facet-gap"]).toBe("24px");
    expect(vars["--minicart-width"]).toBe("420px");
    expect(vars["--minicart-motion"]).toBe("fade");
    expect(vars["--marquee-duration"]).toBe("15s");
    expect(vars["--marquee-direction"]).toBe("reverse");
    expect(vars["--marquee-play-state"]).toBe("running");
    expect(vars["--grid-gap"]).toBe("12px");
    expect(vars["--pc-cta-bg"]).toBe("#123456");
    expect(themeVarsSchema.safeParse(vars).success).toBe(true);
  });

  it("merges palette and group vars into one validated body map", () => {
    const palette = resolvePalette({ global: { brand: { brand: "#123456" } } });
    const vars = paletteToThemeVars(palette, resolveComponentGroups({ palette, global: { grid: { gap: 8 } } }));
    expect(themeVarsSchema.safeParse(vars).success).toBe(true);
    expect(vars["--sf-color-brand"]).toBe("#123456");
    expect(vars["--nb-bg"]).toBe(DEFAULT_PALETTE.navbarBg);
    expect(vars["--grid-gap"]).toBe("8px");
    expect(Object.keys(vars).length).toBeGreaterThan(150);
  });
});
