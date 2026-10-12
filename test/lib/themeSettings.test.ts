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

  it("filters custom badges (incomplete = miss), caps, defaults border/style", () => {
    const r = resolveThemeSettings({
      settings: {
        badges: {
          custom: [
            { id: "vip", bg: "#111111", textColor: "#222222", borderStyle: "dashed" },
            { id: "", bg: "#111111", textColor: "#222222" },
            { id: "half", bg: "#111111" },
            { id: "wavy", bg: "#111111", textColor: "#222222", borderStyle: "wavy" as never },
          ],
        },
      },
    });
    expect(r.badges.custom).toEqual([
      { id: "vip", label: "vip", bg: "#111111", textColor: "#222222", borderColor: "#111111", borderStyle: "dashed" },
      { id: "wavy", label: "wavy", bg: "#111111", textColor: "#222222", borderColor: "#111111", borderStyle: "solid" },
    ]);
  });

  it("resolves icon house defaults and textarea group with clamps", () => {
    const empty = resolveThemeSettings({});
    expect(empty.badges).toEqual({ custom: [] });
    expect(empty.icon).toEqual({ size: 20, strokeWidth: 2, filled: false, color: "" });
    expect(empty.textarea).toMatchObject({ borderRadius: 10, rows: 4 });
    const r = resolveThemeSettings({
      settings: {
        icon: { size: 999, strokeWidth: 0.2, filled: true, color: "#123456" },
        textarea: { borderRadius: 99, rows: 0, bg: "#111111" },
      },
    });
    expect(r.icon).toEqual({ size: 32, strokeWidth: 1, filled: true, color: "#123456" });
    expect(r.textarea.borderRadius).toBe(24);
    expect(r.textarea.rows).toBe(2);
    expect(r.textarea.bg).toBe("#111111");
  });

  it("resolves select builtins, clamps, checks the branch union (sf-033)", () => {
    const empty = resolveThemeSettings({});
    expect(empty.select.variant).toBe("native");
    expect(empty.select).toMatchObject({ borderRadius: 10, optionPaddingY: 8, arrowPadding: 12 });
    expect(empty.select.dropdownAnimation).toEqual({
      enabled: true,
      durationMs: 180,
      easing: "ease-out",
      travel: "minimal",
    });
    const r = resolveThemeSettings({
      settings: {
        select: {
          variant: "drawer" as unknown as "native",
          borderRadius: 99,
          optionPaddingY: 0,
          arrowPadding: 999,
          arrowIconUrl: 42 as unknown as string,
          dropdownAnimation: { preset: "oceanic" },
        },
      },
    });
    expect(r.select.variant).toBe("native");
    expect(r.select.borderRadius).toBe(24);
    expect(r.select.optionPaddingY).toBe(4);
    expect(r.select.arrowPadding).toBe(24);
    expect(r.select.arrowIconUrl).toBe("");
    expect(r.select.dropdownAnimation.durationMs).toBe(320);
    const custom = resolveThemeSettings({ settings: { select: { variant: "custom" } } });
    expect(custom.select.variant).toBe("custom");
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
