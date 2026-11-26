import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE_FACE_COPY,
  resolveStateFace,
  resolveStateFaceCopy,
} from "@/lib/ui/stateFaces";

describe("state face model", () => {
  it("owns one copy default per face", () => {
    expect(resolveStateFaceCopy("loading")).toBe(DEFAULT_STATE_FACE_COPY.loading.title);
    expect(resolveStateFaceCopy("error")).toBe(DEFAULT_STATE_FACE_COPY.error.title);
    expect(resolveStateFaceCopy("degraded")).toBe(DEFAULT_STATE_FACE_COPY.degraded.title);
  });

  it("treats an empty override as absent rather than a blank heading", () => {
    expect(resolveStateFaceCopy("error", "  ")).toBe(DEFAULT_STATE_FACE_COPY.error.title);
    expect(resolveStateFaceCopy("error", "Bag unavailable")).toBe("Bag unavailable");
  });

  it("resolves regular by default and clamps unknown sizes", () => {
    expect(resolveStateFace()).toEqual({ size: "regular" });
    expect(resolveStateFace({ options: { size: "compact" } })).toEqual({ size: "compact" });
    expect(resolveStateFace({ size: "huge" as never })).toEqual({ size: "regular" });
  });

  it("lets the flat prop beat the options object", () => {
    expect(resolveStateFace({ size: "regular", options: { size: "compact" } })).toEqual({ size: "regular" });
  });

  it("accepts a per-component fallback (degraded is compact)", () => {
    expect(resolveStateFace({}, "compact")).toEqual({ size: "compact" });
    expect(resolveStateFace({ size: "regular" }, "compact")).toEqual({ size: "regular" });
    expect(resolveStateFace({ size: "nope" as never }, "compact")).toEqual({ size: "compact" });
  });
});
