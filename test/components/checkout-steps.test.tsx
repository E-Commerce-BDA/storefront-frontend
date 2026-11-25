// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CheckoutSteps from "@/components/shell/CheckoutSteps";
import { resolveCheckoutSteps } from "@/lib/checkout/steps";

afterEach(cleanup);

describe("CheckoutSteps contract (sf-058)", () => {
  it("renders the steps in order with one aria-current step", () => {
    const { container } = render(<CheckoutSteps steps={resolveCheckoutSteps(2)} />);
    const nav = screen.getByRole("navigation", { name: "Checkout progress" });
    expect(nav).not.toBeNull();
    const items = container.querySelectorAll(".sf-checkoutsteps__step");
    expect([...items].map((item) => item.textContent)).toEqual([
      "1Cart", "2Details", "3Payment", "4Done",
    ]);
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  });

  it("exposes state only through data-state", () => {
    const { container } = render(<CheckoutSteps steps={resolveCheckoutSteps(1)} />);
    const states = [...container.querySelectorAll(".sf-checkoutsteps__step")].map((item) =>
      item.getAttribute("data-state"),
    );
    expect(states).toEqual(["done", "active", "upcoming", "upcoming"]);
  });
});
