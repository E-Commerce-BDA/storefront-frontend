/**
 * Theme resolver-unit — builtins out of nothing, garbage misses, "" kept
 * as no-override, clamps, union checks, animation forwarded unresolved.
 * Pure in → complete out.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, resolveThemeSettings } from "@/lib/cms/themeSettings";

describe("resolveThemeSettings", () => {
  it("resolves today's look out of nothing (builtins = rendered look)", () => {
    expect(resolveThemeSettings({})).toEqual(DEFAULT_THEME);
    expect(resolveThemeSettings({ settings: null })).toEqual(DEFAULT_THEME);
    expect(DEFAULT_THEME.button).toMatchObject({ defaultVariant: "primary", defaultSize: "md", borderRadius: 8 });
    expect(DEFAULT_THEME.input.borderRadius).toBe(10);
    expect(DEFAULT_THEME.checkbox).toMatchObject({ size: 20, tickColor: "#FFFFFF", borderRadius: 6 });
    expect(DEFAULT_THEME.toggle).toMatchObject({ width: 44, height: 24, knobColor: "#FFFFFF" });
  });

  it("keeps empty-string colors (no-override decisions, not misses)", () => {
    const r = resolveThemeSettings({ settings: { button: { bg: "" }, input: { textColor: "" } } });
    expect(r.button.bg).toBe("");
    expect(r.input.textColor).toBe("");
  });

  it("treats wrong-typed values as misses, clamps numerics, checks unions", () => {
    const r = resolveThemeSettings({
      settings: {
        button: {
          defaultVariant: "mega" as unknown as "primary",
          defaultSize: "xl" as unknown as "md",
          borderRadius: 99,
          bg: 42 as unknown as string,
        },
        input: { borderRadius: -5 },
        checkbox: { size: 999, borderRadius: 99 },
        toggle: { width: 1, height: 999 },
      },
    });
    expect(r.button.defaultVariant).toBe("primary");
    expect(r.button.defaultSize).toBe("md");
    expect(r.button.borderRadius).toBe(24);
    expect(r.button.bg).toBe("");
    expect(r.input.borderRadius).toBe(0);
    expect(r.checkbox.size).toBe(28);
    expect(r.checkbox.borderRadius).toBe(12);
    expect(r.toggle.width).toBe(32);
    expect(r.toggle.height).toBe(32);
  });

  it("applies admin values and forwards animation unresolved", () => {
    const r = resolveThemeSettings({
      settings: {
        button: { defaultVariant: "sale", bg: "#111111", animation: { peaks: 3 } },
        toggle: { onColor: "#222222", knobColor: "#333333" },
      },
    });
    expect(r.button.defaultVariant).toBe("sale");
    expect(r.button.bg).toBe("#111111");
    // Forwarded as the global layer (internals resolve at the Button
    // with variant colors — never here).
    expect(r.button.animation).toEqual({ peaks: 3 });
    expect(r.toggle.onColor).toBe("#222222");
    expect(r.toggle.knobColor).toBe("#333333");
    expect(r.checkbox.size).toBe(20);
  });
});
