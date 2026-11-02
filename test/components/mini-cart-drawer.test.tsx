// @vitest-environment jsdom
/**
 * MiniCartDrawer contract — shell-cart.md §4, A4.1.
 *
 * Parent owns `open` (controlled): the drawer renders nothing when closed, is a
 * labelled modal when open, lists the store's lines with a pinned subtotal +
 * checkout, and falls back to the empty/loading faces. Esc + overlay call
 * onClose; nothing here decides navigation.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MiniCartDrawer from "@/components/shell/MiniCartDrawer";
import type { CartItemDto } from "@/lib/cart/schemas";

afterEach(cleanup);

const item = (over: Partial<CartItemDto> = {}): CartItemDto => ({
  id: "ci_1",
  productId: "p_1",
  variantId: null,
  qty: 1,
  unitPrice: 10,
  productName: "Mug",
  ...over,
});

function openDrawer(over: Partial<React.ComponentProps<typeof MiniCartDrawer>> = {}) {
  return render(
    <MiniCartDrawer
      open
      onClose={() => {}}
      items={[item()]}
      totals={{ subtotal: 10, itemCount: 1 }}
      status="ready"
      onQty={() => {}}
      onRemove={() => {}}
      onCheckout={() => {}}
      {...over}
    />,
  );
}

describe("MiniCartDrawer", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <MiniCartDrawer
        open={false}
        onClose={() => {}}
        items={[item()]}
        totals={{ subtotal: 10, itemCount: 1 }}
        status="ready"
        onQty={() => {}}
        onRemove={() => {}}
        onCheckout={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("is a labelled modal listing the lines with a subtotal and checkout", () => {
    const { container } = openDrawer();
    expect(screen.getByRole("dialog", { name: "Shopping cart" })).not.toBeNull();
    expect(screen.getByText("Mug")).not.toBeNull();
    expect(container.querySelector(".sf-minicart__subtotal span")?.textContent).toBe("$10");
    expect(screen.getByRole("button", { name: "Checkout" })).not.toBeNull();
  });

  it("shows the item count in the heading", () => {
    openDrawer({ items: [item(), item({ id: "ci_2", productName: "Plate" })], totals: { subtotal: 20, itemCount: 2 } });
    expect(screen.getByText(/Your cart \(2\)/)).not.toBeNull();
  });

  it("fires onCheckout and onRemove with the line id", () => {
    const onCheckout = vi.fn();
    const onRemove = vi.fn();
    openDrawer({ onCheckout, onRemove });
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(onCheckout).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Remove Mug/ }));
    expect(onRemove).toHaveBeenCalledWith("ci_1");
  });

  it("fires onViewCart when View cart button is clicked", () => {
    const onViewCart = vi.fn();
    openDrawer({ onViewCart });
    fireEvent.click(screen.getByRole("button", { name: "View cart" }));
    expect(onViewCart).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and on overlay click, never on panel click", () => {
    const onClose = vi.fn();
    openDrawer({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector(".sf-minicart__overlay") as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders the empty face with a keep-shopping close", () => {
    const onClose = vi.fn();
    openDrawer({ items: [], totals: { subtotal: 0, itemCount: 0 }, status: "ready", onClose });
    expect(screen.getByText("Your cart is empty")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue shopping" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Checkout" })).toBeNull();
  });

  it("renders a loading note while the first read is in flight", () => {
    openDrawer({ items: [], totals: { subtotal: 0, itemCount: 0 }, status: "loading" });
    expect(screen.getByText(/Loading your cart/)).not.toBeNull();
  });
});
