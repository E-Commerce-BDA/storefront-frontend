import { describe, expect, it } from "vitest";
import { trackingAllowed } from "@/lib/analytics/consent";

describe("trackingAllowed", () => {
  it("allows tracking with no signals", () => {
    expect(trackingAllowed({}, undefined)).toBe(true);
  });

  it("respects Do Not Track and Global Privacy Control", () => {
    expect(trackingAllowed({ doNotTrack: "1" }, undefined)).toBe(false);
    expect(trackingAllowed({ doNotTrack: "0" }, undefined)).toBe(true);
    expect(trackingAllowed({ globalPrivacyControl: true }, undefined)).toBe(false);
  });

  it("respects an explicit opt-out cookie", () => {
    expect(trackingAllowed({}, "1")).toBe(false);
    expect(trackingAllowed({}, "")).toBe(true);
  });

  it("denies wins when signals conflict", () => {
    expect(trackingAllowed({ doNotTrack: "0" }, "1")).toBe(false);
  });
});
