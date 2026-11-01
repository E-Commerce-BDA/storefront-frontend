// @vitest-environment jsdom
/**
 * CartLineItem contract — shell-cart.md §4, A4.1/A4.2.
 *
 * Proves the row shows the store's numbers and routes writes up by id: name +
 * variant + a stepper at the line qty + `unitPrice × qty` total, and the
 * placeholder/pending faces lock the controls the provider would ignore anyway.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CartLineItem from "@/components/shell/CartLineItem";
import { pendingItemId } from "@/lib/cart/state";
import type { CartItemDto } from "@/lib/cart/schemas";

afterEach(cleanup);

const line = (over: Partial<CartItemDto> = {}): CartItemDto => ({
  id: "ci_1",
  productId: "p_1",
  variantId: "v_red",
  qty: 2,
  unitPrice: 24.5,
  productName: "Trail Runner",
  productSlug: "trail-runner",
  imageUrl: "/t.jpg",
  variantLabel: "Red / M",
  ...over,
});

const plus = () => screen.getByRole("button", { name: "Increase quantity" }) as HTMLButtonElement;

describe("CartLineItem", () => {
  it("shows name, variant and the computed line total", () => {
    render(<CartLineItem line={line()} onQty={() => {}} onRemove={() => {}} />);
    expect(screen.getByText("Trail Runner")).not.toBeNull();
    expect(screen.getByText("Red / M")).not.toBeNull();
    expect(screen.getByText("$49")).not.toBeNull(); // 24.5 × 2, house raw-number face
  });

  it("routes a qty step up to the owner with the item id", () => {
    const onQty = vi.fn();
    render(<CartLineItem line={line({ qty: 2 })} onQty={onQty} onRemove={() => {}} />);
    fireEvent.click(plus());
    expect(onQty).toHaveBeenCalledWith("ci_1", 3);
  });

  it("routes remove with the item id", () => {
    const onRemove = vi.fn();
    render(<CartLineItem line={line()} onQty={() => {}} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: /Remove Trail Runner/ }));
    expect(onRemove).toHaveBeenCalledWith("ci_1");
  });

  it("locks the controls on a pending mutation", () => {
    const { container } = render(<CartLineItem line={line()} pending onQty={() => {}} onRemove={() => {}} />);
    expect((container.querySelector(".sf-cartline") as HTMLElement).dataset.pending).toBe("true");
    expect(plus().disabled).toBe(true);
    expect(screen.getByRole("button", { name: /Remove/ }).hasAttribute("disabled")).toBe(true);
  });

  it("locks an optimistic placeholder even without the pending flag", () => {
    const placeholder = line({ id: pendingItemId("p_1:v_red"), productName: "", unitPrice: 0 });
    render(<CartLineItem line={placeholder} onQty={() => {}} onRemove={() => {}} />);
    expect(plus().disabled).toBe(true);
    expect(screen.getByText("Adding…")).not.toBeNull();
  });
});
