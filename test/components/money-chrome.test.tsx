// @vitest-environment jsdom
/**
 * sf-093 contract tier — the new money chrome reports intent and paints
 * resolved values. No component validates a coupon or decides a payment.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PaymentPill from "@/components/commerce/PaymentPill";
import QuickPromos from "@/components/commerce/QuickPromos";

afterEach(cleanup);

describe("PaymentPill", () => {
  it("is a radio for the selectable method and inert for brand marks", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <div role="radiogroup" aria-label="Payment provider">
        <PaymentPill id="mock" label="Card (demo)" icon="visa" selectable selected onSelect={onSelect} />
        <PaymentPill id="upi" label="UPI" icon="upi" selectable={false} />
      </div>,
    );
    const card = screen.getByRole("radio", { name: "Card (demo)" });
    expect(card.getAttribute("aria-checked")).toBe("true");
    expect(card.dataset.selected).toBe("true");
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledTimes(1);

    const upi = container.querySelector('[aria-disabled="true"]') as HTMLElement;
    expect(upi.tagName).toBe("SPAN");
    expect(upi.getAttribute("data-selected")).toBe("false");
  });
});

describe("QuickPromos", () => {
  it("reports the clicked code and marks the applied one", () => {
    const onPick = vi.fn();
    const { container } = render(<QuickPromos applied="WELCOME15" onPick={onPick} />);
    expect(screen.getByRole("group", { name: "Suggested promo codes" })).not.toBeNull();
    const pill = screen.getByRole("button", { name: "WELCOME15" });
    expect(pill.dataset.active).toBe("true");
    fireEvent.click(pill);
    expect(onPick).toHaveBeenCalledWith("WELCOME15");
    expect(container.querySelectorAll(".sf-pill")).toHaveLength(3);
  });
});
