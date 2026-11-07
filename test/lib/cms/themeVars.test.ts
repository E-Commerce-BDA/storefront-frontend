/**
 * Theme → CSS variables — zero-visual-change invariant.
 *
 * With the builtin theme the emitter must produce no variables, so every
 * component renders from its existing CSS fallbacks. A non-builtin admin value
 * emits exactly the changed token.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  resolveThemeSettings,
  toBadgeTones,
  type ThemeSettings,
} from "@/lib/cms/themeSettings";
import { themeToCssVars } from "@/lib/cms/themeVars";

describe("themeToCssVars", () => {
  it("emits nothing for the builtin/null theme", () => {
    expect(themeToCssVars(resolveThemeSettings({ settings: null }))).toEqual({});
    expect(themeToCssVars(DEFAULT_THEME)).toEqual({});
  });

  it("never emits an explicitly empty override", () => {
    const theme = resolveThemeSettings({
      settings: { button: { bg: "" } } as ThemeSettings,
    });
    expect(themeToCssVars(theme)).toEqual({});
  });

  it("emits changed paint and grid tokens", () => {
    const theme = resolveThemeSettings({
      settings: {
        button: { bg: "#10233f" },
        productCard: { colsDesktop: 5, colsTablet: 2, colsPhone: 1 },
      } as ThemeSettings,
    });
    const vars = themeToCssVars(theme) as Record<string, string | number>;
    expect(vars["--theme-btn-bg"]).toBe("#10233f");
    expect(vars["--theme-productcard-cols-desktop"]).toBe(5);
    expect(vars["--theme-productcard-cols-tablet"]).toBe(2);
    expect(vars["--theme-productcard-cols-phone"]).toBe(1);
  });

  it("converts resolved custom badges into Badge tones", () => {
    const theme = resolveThemeSettings({
      settings: {
        badges: {
          custom: [
            { id: "new-drop", label: "New drop", bg: "#10233f", textColor: "#ffffff", borderColor: "#10233f", borderStyle: "dashed" },
          ],
        },
      } as ThemeSettings,
    });
    expect(toBadgeTones(theme)).toEqual({
      "new-drop": { bg: "#10233f", text: "#ffffff", border: "#10233f", borderStyle: "dashed" },
    });
  });
});
