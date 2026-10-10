/**
 * Overlay motion resolver-unit — preset mapping, custom clamp + allowlist,
 * builtin defaults. Pure in → concrete out; no mocks.
 */
import { describe, expect, it } from "vitest";
import { MOTION_PRESETS, resolveOverlayMotion } from "@/lib/search/motion";

describe("resolveOverlayMotion", () => {
  it("defaults to enabled smooth-240 (builtin)", () => {
    expect(resolveOverlayMotion(undefined)).toEqual({ enabled: true, durationMs: 240, easing: "ease-out", travel: "full" });
    expect(resolveOverlayMotion(null)).toEqual({ enabled: true, durationMs: 240, easing: "ease-out", travel: "full" });
  });

  it("maps presets to concrete ms+easing+travel (components never see names)", () => {
    expect(resolveOverlayMotion({ preset: "snappy" })).toEqual({
      enabled: true,
      durationMs: MOTION_PRESETS.snappy.durationMs,
      easing: MOTION_PRESETS.snappy.easing,
      travel: "full",
    });
    expect(resolveOverlayMotion({ preset: "smooth", enabled: false })).toEqual({
      enabled: false,
      durationMs: 240,
      easing: "ease-out",
      travel: "full",
    });
  });

  it("keeps legacy smooth/snappy byte-identical (additive change)", () => {
    expect(resolveOverlayMotion({ preset: "smooth" })).toEqual({ enabled: true, durationMs: 240, easing: "ease-out", travel: "full" });
    expect(resolveOverlayMotion({ preset: "snappy" })).toEqual({
      enabled: true,
      durationMs: 180,
      easing: "cubic-bezier(0.32, 0.72, 0.32, 1)",
      travel: "full",
    });
  });

  it("maps new oceanic/fast/flat families", () => {
    expect(resolveOverlayMotion({ preset: "oceanic" })).toEqual({
      enabled: true,
      durationMs: 320,
      easing: "cubic-bezier(0.32, 0.72, 0.32, 1)",
      travel: "full",
    });
    expect(resolveOverlayMotion({ preset: "fast" })).toEqual({ enabled: true, durationMs: 160, easing: "ease-out", travel: "full" });
    expect(resolveOverlayMotion({ preset: "flat" })).toEqual({ enabled: true, durationMs: 140, easing: "ease-out", travel: "minimal" });
  });

  it("clamps custom duration 150–500 and rejects unknown easings", () => {
    expect(resolveOverlayMotion({ preset: "custom", durationMs: 9999, easing: "bogus" })).toEqual({
      enabled: true,
      durationMs: 500,
      easing: "ease-out",
      travel: "full",
    });
    expect(resolveOverlayMotion({ preset: "custom", durationMs: 200, easing: "linear" })).toEqual({
      enabled: true,
      durationMs: 200,
      easing: "linear",
      travel: "full",
    });
  });
});
