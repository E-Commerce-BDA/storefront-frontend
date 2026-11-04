// @vitest-environment jsdom
/**
 * PaymentIcon — the footer's dumb brand-mark block.
 *
 * A known CMS key paints a committed SVG; an unknown key must degrade to its
 * label rather than a broken image, so a newly-added payment method never shows
 * a blank chip.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import PaymentIcon, { PAYMENT_ICON_ASSETS } from "@/components/shell/PaymentIcon";

describe("PaymentIcon", () => {
  it("renders a committed brand mark for a known key", () => {
    const { container } = render(<PaymentIcon icon="visa" className="sf-footer__pay-img" />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/media/pay/visa.svg");
    expect(img?.getAttribute("alt")).toBe("Visa");
    expect(img?.getAttribute("class")).toBe("sf-footer__pay-img");
  });

  it("renders the Google Pay mark for the gpay key", () => {
    const { container } = render(<PaymentIcon icon="gpay" className="sf-footer__pay-img" />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/media/pay/gpay.svg");
    expect(img?.getAttribute("alt")).toBe("Google Pay");
  });

  it("falls back to the label text for an unknown key", () => {
    const { container } = render(<PaymentIcon icon="amex" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("amex");
  });

  it("maps every documented key to its asset path", () => {
    for (const key of ["visa", "mastercard", "paypal", "applepay", "gpay", "upi"]) {
      expect(PAYMENT_ICON_ASSETS[key]).toBe(`/media/pay/${key}.svg`);
    }
  });
});
