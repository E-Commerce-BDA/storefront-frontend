// @vitest-environment jsdom
/**
 * VariantSelector contract — one row per option, unavailable values stay put.
 *
 * The block receives availability, it never computes it, so these assertions are
 * about the face: pressed state, `aria-disabled` instead of removal, swatches
 * named for a screen reader, and a no-op tap on a dead value.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import VariantSelector from "@/components/commerce/VariantSelector";
import type { VariantOptionView } from "@/lib/commerce/variants";

afterEach(cleanup);

const options: VariantOptionView[] = [
  {
    id: "o-color",
    name: "Color",
    displayType: "swatch",
    values: [
      { id: "v-red", value: "Red", swatchHex: "#c00", swatchImageUrl: null, available: true },
      { id: "v-navy", value: "Navy", swatchHex: "#003", swatchImageUrl: null, available: false },
    ],
  },
  {
    id: "o-size",
    name: "Size",
    displayType: "pill",
    values: [
      { id: "v-s", value: "S", swatchHex: null, swatchImageUrl: null, available: true },
      { id: "v-m", value: "M", swatchHex: null, swatchImageUrl: null, available: true },
    ],
  },
];

const selected = { Color: "v-red", Size: "v-s" };

describe("VariantSelector", () => {
  it("renders one labelled group per option", () => {
    render(<VariantSelector options={options} selected={selected} onSelect={() => {}} />);

    expect(screen.getByRole("group", { name: "Color" })).not.toBeNull();
    expect(screen.getByRole("group", { name: "Size" })).not.toBeNull();
  });

  it("marks the current value pressed and shows the picked label", () => {
    render(<VariantSelector options={options} selected={selected} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: "Red" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "S" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "M" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("names swatches for assistive tech and paints them from the admin hex", () => {
    render(<VariantSelector options={options} selected={selected} onSelect={() => {}} />);
    const navy = screen.getByRole("button", { name: "Navy" }) as HTMLButtonElement;

    expect(navy.dataset.display).toBe("swatch");
    expect(navy.style.background).toBeTruthy();
    // No visible text to announce, hence the aria-label.
    expect(navy.textContent).toBe("");
  });

  it("keeps an unavailable value in the row and refuses the tap", () => {
    const onSelect = vi.fn();
    render(<VariantSelector options={options} selected={selected} onSelect={onSelect} />);
    const navy = screen.getByRole("button", { name: "Navy" });

    expect(navy.getAttribute("aria-disabled")).toBe("true");
    // Still focusable — a keyboard shopper must be able to hear why not.
    expect((navy as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(navy);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("reports the option name and value id on a real pick", () => {
    const onSelect = vi.fn();
    render(<VariantSelector options={options} selected={selected} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(onSelect).toHaveBeenCalledWith("Size", "v-m");
  });

  it("freezes every value when the caller is busy", () => {
    const onSelect = vi.fn();
    render(<VariantSelector options={options} selected={selected} onSelect={onSelect} disabled />);

    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(
      (document.querySelector(".sf-variants") as HTMLElement).dataset.disabled,
    ).toBe("true");
  });

  it("shows a swatch image when the admin uploaded one", () => {
    render(
      <VariantSelector
        options={[
          {
            ...options[0],
            values: [
              {
                id: "v-print",
                value: "Palm print",
                swatchHex: null,
                swatchImageUrl: "print.jpg",
                available: true,
              },
            ],
          },
        ]}
        selected={{}}
        onSelect={() => {}}
      />,
    );

    const swatch = screen.getByRole("button", { name: "Palm print" });
    expect(swatch.querySelector("img")?.getAttribute("src")).toBe("print.jpg");
  });
});
