/**
 * Overlay motion resolver-unit — preset mapping, custom clamp + allowlist,
 * builtin defaults. Pure in → concrete out; no mocks.
 */
import { describe, expect, it } from "vitest";
import { MOTION_PRESETS, resolveOverlayMotion } from "@/lib/search/motion";

describe("resolveOverlayMotion", () => {
  it("defaults to enabled smooth-240 (builtin)", () => {
    expect(resolveOverlayMotion(undefined)).toEqual({ enabled: true, durationMs: 240, easing: "ease-out" });
    expect(resolveOverlayMotion(null)).toEqual({ enabled: true, durationMs: 240, easing: "ease-out" });
  });

  it("maps presets to concrete ms+easing (components never see names)", () => {
    expect(resolveOverlayMotion({ preset: "snappy" })).toEqual({
      enabled: true,
      durationMs: MOTION_PRESETS.snappy.durationMs,
      easing: MOTION_PRESETS.snappy.easing,
    });
    expect(resolveOverlayMotion({ preset: "smooth", enabled: false })).toEqual({
      enabled: false,
      durationMs: 240,
      easing: "ease-out",
    });
  });

  it("clamps custom duration 150–500 and rejects unknown easings", () => {
    expect(resolveOverlayMotion({ preset: "custom", durationMs: 9999, easing: "bogus" })).toEqual({
      enabled: true,
      durationMs: 500,
      easing: "ease-out",
    });
    expect(resolveOverlayMotion({ preset: "custom", durationMs: 200, easing: "linear" })).toEqual({
      enabled: true,
      durationMs: 200,
      easing: "linear",
    });
  });
});
