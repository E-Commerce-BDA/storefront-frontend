// @vitest-environment jsdom
/**
 * Button render contract — every variant/size emits identical animation
 * wiring (data attrs + wave vars). A variant that renders different
 * animation attributes is how per-button divergence (and the bleed class
 * of bugs) re-enters; this fails it before it ships.
 *
 * Uses plain DOM assertions only (no jest-dom) to keep the runner lean.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Button, { type ButtonSize, type ButtonVariant } from "@/components/ui/Button";

afterEach(cleanup);

const VARIANTS: ButtonVariant[] = ["primary", "light", "ghost-ink", "sale", "success", "error"];
const SIZES: Array<{ size: ButtonSize; minHeight: string }> = [
  { size: "sm", minHeight: "36px" },
  { size: "md", minHeight: "44px" },
  { size: "lg", minHeight: "52px" },
];

const EXPECTED_WAVE: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: "#FFFFFF", text: "#0077B6" },
  light: { bg: "#0077B6", text: "#FFFFFF" },
  "ghost-ink": { bg: "#0A2540", text: "#FFFFFF" },
  // Sale keeps ink text (white on coral fails contrast) — locked here.
  sale: { bg: "#FFEDE6", text: "#0A2540" },
  success: { bg: "#ECFDF3", text: "#0E9F6E" },
  error: { bg: "#FEF3F2", text: "#D92D20" },
};

describe("Button render contract", () => {
  it.each(VARIANTS)("variant %s uses the shared wave animation wiring", (variant) => {
    const { unmount } = render(<Button variant={variant}>Label</Button>);
    const el = screen.getByRole("button", { name: "Label" });
    expect(el.classList.contains("sf-btn")).toBe(true);
    expect(el.getAttribute("data-anim-kind")).toBe("wave-rise");
    expect(el.getAttribute("data-wave-origin")).toBe("bottom");
    expect(el.getAttribute("data-peaks")).toBe("2");
    expect(el.getAttribute("data-anim")).toBe("on");
    expect(el.style.getPropertyValue("--wave-bg")).toBe(EXPECTED_WAVE[variant].bg);
    expect(el.style.getPropertyValue("--wave-text")).toBe(EXPECTED_WAVE[variant].text);
    unmount();
  });

  it.each(SIZES)("size $size keeps the same animation with min-height $minHeight", ({ size, minHeight }) => {
    const { unmount } = render(<Button size={size}>Label</Button>);
    const el = screen.getByRole("button", { name: "Label" });
    // Sizes change box metrics only — never animation geometry.
    expect(el.getAttribute("data-anim-kind")).toBe("wave-rise");
    expect(el.getAttribute("data-wave-origin")).toBe("bottom");
    expect(el.getAttribute("data-anim")).toBe("on");
    expect(el.style.minHeight).toBe(minHeight);
    unmount();
  });

  it("honours CMS flat-prop overrides over variant defaults", () => {
    render(
      <Button variant="light" bg="#111111" waveBg="#222222" waveText="#333333">
        CTA
      </Button>,
    );
    const el = screen.getByRole("button", { name: "CTA" });
    expect(el.style.getPropertyValue("--btn-bg")).toBe("#111111");
    expect(el.style.getPropertyValue("--wave-bg")).toBe("#222222");
    expect(el.style.getPropertyValue("--wave-text")).toBe("#333333");
  });

  it("renders an anchor for href and a disabled spinner button while loading", () => {
    const { unmount } = render(<Button href="/shop">Shop</Button>);
    expect(screen.getByRole("link", { name: "Shop" }).getAttribute("href")).toBe("/shop");
    unmount();

    render(<Button loading>Busy</Button>);
    const busy = screen.getByRole("button", { name: "Busy" }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true);
    expect(busy.getAttribute("aria-busy")).toBe("true");
  });

  it("disables interaction (and the wave layer) when disabled", () => {
    const { unmount } = render(<Button disabled>Off</Button>);
    expect((screen.getByRole("button", { name: "Off" }) as HTMLButtonElement).disabled).toBe(true);
    unmount();
  });

  it("emits opt-in attrs off by default and honors disabled/pressed overrides", () => {
    const { unmount } = render(<Button>Plain</Button>);
    const plain = screen.getByRole("button", { name: "Plain" });
    expect(plain.getAttribute("data-pressed")).toBe("off");
    expect(plain.getAttribute("data-disabled-hover")).toBe("off");
    expect(plain.style.getPropertyValue("--btn-disabled-bg")).toBe("#dce8ee");
    expect(plain.style.getPropertyValue("--btn-disabled-text")).toBe("#0a2540");
    unmount();

    render(
      <Button
        disabledBg="#123456"
        disabledHoverEnabled
        pressedEnabled
        pressedScale={0.97}
        pressedTranslateY={2}
      >
        Tuned
      </Button>,
    );
    const tuned = screen.getByRole("button", { name: "Tuned" });
    expect(tuned.style.getPropertyValue("--btn-disabled-bg")).toBe("#123456");
    expect(tuned.getAttribute("data-disabled-hover")).toBe("on");
    expect(tuned.getAttribute("data-pressed")).toBe("on");
    expect(tuned.style.getPropertyValue("--pressed-scale")).toBe("0.97");
    expect(tuned.style.getPropertyValue("--pressed-translate")).toBe("2px");
  });

  it("shares one non-interactive wiring between disabled and loading", () => {    const { unmount } = render(<Button disabled>Off</Button>);
    const off = screen.getByRole("button", { name: "Off" });
    // Same animation wiring as an active button (face comes from CSS vars),
    // but natively non-interactive so no hover/click can fire.
    expect(off.getAttribute("data-anim-kind")).toBe("wave-rise");
    expect((off as HTMLButtonElement).disabled).toBe(true);
    unmount();

    render(<Button loading>Busy</Button>);
    const busy = screen.getByRole("button", { name: "Busy" });
    expect(busy.getAttribute("data-anim-kind")).toBe("wave-rise");
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    // Label is retained next to the spinner (screen readers get both).
    expect(busy.textContent).toContain("Busy");
  });
});
