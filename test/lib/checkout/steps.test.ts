import { describe, expect, it } from "vitest";
import { CHECKOUT_STEPS, resolveCheckoutSteps } from "@/lib/checkout/steps";

describe("resolveCheckoutSteps (sf-058)", () => {
  it("labels exactly one active step and marks earlier ones done", () => {
    const steps = resolveCheckoutSteps(1);
    expect(steps.map((step) => step.label)).toEqual(["Cart", "Details", "Payment", "Done"]);
    expect(steps.map((step) => step.state)).toEqual(["done", "active", "upcoming", "upcoming"]);
    expect(steps[1].id).toBe(CHECKOUT_STEPS[1].id);
  });

  it("clamps out-of-range and malformed indices instead of trusting the caller", () => {
    expect(resolveCheckoutSteps(-5).map((s) => s.state)).toEqual([
      "active", "upcoming", "upcoming", "upcoming",
    ]);
    expect(resolveCheckoutSteps(99).map((s) => s.state)).toEqual([
      "done", "done", "done", "active",
    ]);
    expect(resolveCheckoutSteps(Number.NaN)[0].state).toBe("active");
  });
});
