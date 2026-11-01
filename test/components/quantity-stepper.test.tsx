// @vitest-environment jsdom
/**
 * QuantityStepper contract — controlled, clamped, accessible.
 *
 * The component owns no state, so every assertion is about what it *asks* for:
 * the number it hands `onChange`, the button it disables, the field it leaves
 * alone. Clamping itself is proven in `test/lib/commerce/quantity.test.ts`;
 * here we only prove the block routes through it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import QuantityStepper from "@/components/ui/QuantityStepper";

afterEach(cleanup);

const field = () => screen.getByRole("textbox", { name: "Quantity" }) as HTMLInputElement;
const minus = () => screen.getByRole("button", { name: "Decrease quantity" }) as HTMLButtonElement;
const plus = () => screen.getByRole("button", { name: "Increase quantity" }) as HTMLButtonElement;

describe("QuantityStepper", () => {
  it("renders the value and hooks state through data attributes", () => {
    const { container } = render(<QuantityStepper value={3} onChange={() => {}} />);
    const root = container.firstElementChild as HTMLElement;

    expect(field().value).toBe("3");
    expect(root.className).toContain("sf-qty");
    expect(root.dataset.disabled).toBe("false");
    expect(root.dataset.pending).toBe("false");
  });

  it("steps by one and hands the new number up", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} onChange={onChange} />);

    fireEvent.click(plus());
    expect(onChange).toHaveBeenLastCalledWith(3);

    fireEvent.click(minus());
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("steps by a custom step", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} step={5} max={20} onChange={onChange} />);

    fireEvent.click(plus());
    expect(onChange).toHaveBeenLastCalledWith(7);
  });

  it("disables minus at the floor and plus at the ceiling", () => {
    render(<QuantityStepper value={1} min={1} max={3} onChange={() => {}} />);
    expect(minus().disabled).toBe(true);
    expect(plus().disabled).toBe(false);
    cleanup();

    render(<QuantityStepper value={3} min={1} max={3} onChange={() => {}} />);
    expect(plus().disabled).toBe(true);
    expect(minus().disabled).toBe(false);
  });

  it("turns typed text into a clamped number", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} max={10} onChange={onChange} />);

    fireEvent.change(field(), { target: { value: "99" } });
    expect(onChange).toHaveBeenLastCalledWith(10);

    fireEvent.change(field(), { target: { value: "4" } });
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it("ignores a cleared or unparseable field rather than resetting to min", () => {
    // Clearing "3" to retype it must not silently become 1 — the last good
    // number stays until the shopper types a new one.
    const onChange = vi.fn();
    render(<QuantityStepper value={3} onChange={onChange} />);

    fireEvent.change(field(), { target: { value: "" } });
    fireEvent.change(field(), { target: { value: "abc" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables both buttons and the field when the caller says so", () => {
    render(<QuantityStepper value={2} disabled onChange={() => {}} />);

    expect(minus().disabled).toBe(true);
    expect(plus().disabled).toBe(true);
    expect(field().disabled).toBe(true);
    expect((document.querySelector(".sf-qty") as HTMLElement).dataset.disabled).toBe("true");
  });

  it("marks pending without freezing the buttons — that is the caller's call", () => {
    render(<QuantityStepper value={2} pending onChange={() => {}} />);
    const root = document.querySelector(".sf-qty") as HTMLElement;

    expect(root.dataset.pending).toBe("true");
    expect(plus().disabled).toBe(false);
  });

  it("names the field for a row that has more than one stepper", () => {
    render(<QuantityStepper value={1} label="Mug quantity" onChange={() => {}} />);
    expect(screen.getByRole("textbox", { name: "Mug quantity" })).not.toBeNull();
  });
});
