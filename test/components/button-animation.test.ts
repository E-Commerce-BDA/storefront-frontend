/**
 * resolveButtonAnimation unit tests — "same animation for every button".
 *
 * The resolver is the single P>S>G merge point feeding Button.tsx. These
 * tests pin the shared default and the override semantics so no variant,
 * size, or future CMS payload can silently diverge.
 */
import { describe, expect, it } from "vitest";
import {
  ANIMATION_LIMITS,
  DEFAULT_BUTTON_ANIMATION,
  resolveButtonAnimation,
} from "@/lib/cms/buttonAnimation";

const colors = { hoverBg: "#FFFFFF", hoverText: "#0077B6" };

describe("resolveButtonAnimation", () => {
  it("resolves the single shared default when nothing overrides", () => {
    expect(resolveButtonAnimation({ colors })).toEqual({
      enabled: true,
      useWave: true,
      waveOrigin: "bottom",
      peaks: 2,
      peakHeight: 12,
      hoverBg: "#FFFFFF",
      hoverText: "#0077B6",
      hoverBorderColor: "#FFFFFF",
      durationMs: 360,
      textDelayMs: 200,
      easing: DEFAULT_BUTTON_ANIMATION.easing,
      animationKind: "wave-rise",
      disabled: {
        bg: "#dce8ee",
        textColor: "#0a2540",
        borderColor: "#dce8ee",
        borderWidth: 1,
        hoverEnabled: false,
      },
      pressed: { enabled: false, scale: 1, translateY: 0, shadow: "none" },
    });
  });

  it("merges with cta > section > global > default precedence", () => {
    const resolved = resolveButtonAnimation({
      cta: { durationMs: 500 },
      section: { durationMs: 400, peaks: 3 },
      global: { durationMs: 300, peaks: 1, waveOrigin: "left" },
      colors,
    });
    expect(resolved.durationMs).toBe(500); // cta wins
    expect(resolved.peaks).toBe(3); // section wins where cta is absent
    expect(resolved.waveOrigin).toBe("left"); // global wins where both absent
  });

  it('falls back hoverBorderColor "auto"/empty/absent to hoverBg', () => {
    const base = { hoverBg: "#0077B6", hoverText: "#FFFFFF" };
    for (const hoverBorderColor of [undefined, "auto", ""]) {
      const resolved = resolveButtonAnimation({ cta: { ...base, hoverBorderColor }, colors });
      expect(resolved.hoverBorderColor).toBe("#0077B6");
    }
    const explicit = resolveButtonAnimation({
      cta: { ...base, hoverBorderColor: "#0A2540" },
      colors,
    });
    expect(explicit.hoverBorderColor).toBe("#0A2540");
  });

  it("clamps numeric knobs to documented limits", () => {
    const resolved = resolveButtonAnimation({
      cta: { peaks: 99, peakHeight: 999, durationMs: -5, textDelayMs: 9999 },
      colors,
    });
    expect(resolved.peaks).toBe(ANIMATION_LIMITS.peaks.max);
    expect(resolved.peakHeight).toBe(ANIMATION_LIMITS.peakHeight.max);
    expect(resolved.durationMs).toBe(ANIMATION_LIMITS.durationMs.min);
    expect(resolved.textDelayMs).toBe(ANIMATION_LIMITS.textDelayMs.max);
  });

  it('disables the wave when kind is "none"', () => {
    const resolved = resolveButtonAnimation({ cta: { animationKind: "none" }, colors });
    expect(resolved.enabled).toBe(false);
    expect(resolved.animationKind).toBe("none");
  });

  it("resolves the universal disabled face with hover killed by default", () => {
    const { disabled } = resolveButtonAnimation({ colors });
    expect(disabled).toEqual({
      bg: "#dce8ee",
      textColor: "#0a2540",
      borderColor: "#dce8ee",
      borderWidth: 1,
      hoverEnabled: false,
    });
  });

  it("merges disabled per-key through cta > section > global", () => {
    const resolved = resolveButtonAnimation({
      cta: { disabled: { bg: "#111111" } },
      section: { disabled: { bg: "#222222", textColor: "#333333" } },
      global: { disabled: { bg: "#444444", textColor: "#555555", hoverEnabled: true } },
      colors,
    });
    expect(resolved.disabled.bg).toBe("#111111");
    expect(resolved.disabled.textColor).toBe("#333333");
    expect(resolved.disabled.hoverEnabled).toBe(true);
  });

  it("clamps disabled borderWidth and pressed knobs to limits", () => {
    const resolved = resolveButtonAnimation({
      cta: {
        disabled: { borderWidth: 99 },
        pressed: { enabled: true, scale: 5, translateY: -3 },
      },
      colors,
    });
    expect(resolved.disabled.borderWidth).toBe(ANIMATION_LIMITS.disabledBorderWidth.max);
    expect(resolved.pressed.scale).toBe(ANIMATION_LIMITS.pressedScale.max);
    expect(resolved.pressed.translateY).toBe(ANIMATION_LIMITS.pressedTranslateY.min);
  });

  it("ships the pressed effect OFF to reproduce today (opt-in only)", () => {
    const { pressed } = resolveButtonAnimation({ colors });
    expect(pressed.enabled).toBe(false);
    expect(pressed).toMatchObject({ scale: 1, translateY: 0, shadow: "none" });
  });
});
