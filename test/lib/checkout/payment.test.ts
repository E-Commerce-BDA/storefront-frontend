import { describe, expect, it } from "vitest";
import { resolvePaymentMethods } from "@/lib/checkout/payment";

describe("payment pills resolver (sf-093)", () => {
  it("exposes exactly one selectable method — the honest mock provider", () => {
    const methods = resolvePaymentMethods(undefined);
    expect(methods.filter((method) => method.selectable).map((method) => method.id)).toEqual(["mock"]);
    expect(methods[0]?.selected).toBe(true);
  });

  it("marks an explicit selection and keeps brand marks informational", () => {
    const methods = resolvePaymentMethods("paypal");
    expect(methods.find((method) => method.id === "paypal")?.selected).toBe(true);
    expect(methods.find((method) => method.id === "mock")?.selected).toBe(false);
    expect(methods.find((method) => method.id === "upi")?.selectable).toBe(false);
  });
});
