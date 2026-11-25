// @vitest-environment jsdom
/**
 * CartView — the `/cart` island (plan §12 islands tier).
 *
 * The headline behaviour this test exists for is the **per-line qty debounce**
 * (shell-cart.md §4): repeated taps on one line must collapse into a single
 * `setQty` carrying the final number, not one PATCH per tap. The rest pins the
 * wiring a shopper feels — a line renders, remove fires, checkout navigates, and
 * an empty cart is an EmptyState rather than a blank page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CartItemDto } from "@/lib/cart/schemas";

const cart = vi.hoisted(() => ({
  items: [] as unknown[],
  count: 0,
  subtotal: 0,
  status: "ready" as string,
  setQty: vi.fn(async () => true),
  remove: vi.fn(async () => true),
  clear: vi.fn(async () => true),
}));
const push = vi.fn();
const bff = vi.hoisted(() => vi.fn());
const wishlistToggle = vi.hoisted(() => vi.fn(async () => true));

vi.mock("@/app/_components/WishlistProvider", () => ({
  useWishlist: () => ({ toggle: wishlistToggle, has: () => false, items: [] }),
}));

vi.mock("@/lib/http/browser", () => ({ bff }));

vi.mock("@/app/_components/CartProvider", () => ({
  useCart: () => ({
    items: cart.items,
    count: cart.count,
    subtotal: cart.subtotal,
    status: cart.status,
    setQty: cart.setQty,
    remove: cart.remove,
    clear: cart.clear,
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import CartView, { CART_QTY_DEBOUNCE_MS } from "@/app/(shop)/_components/CartView";

const line = (over: Partial<CartItemDto> = {}): CartItemDto => ({
  id: "i1",
  productId: "p1",
  qty: 1,
  unitPrice: 10,
  productName: "Mug",
  ...over,
});

function setCart(items: CartItemDto[], over: Partial<{ count: number; subtotal: number; status: string }> = {}) {
  cart.items = items;
  cart.count = over.count ?? items.reduce((n, i) => n + i.qty, 0);
  cart.subtotal = over.subtotal ?? items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  cart.status = over.status ?? "ready";
}

beforeEach(() => {
  cart.setQty.mockClear();
  cart.remove.mockClear();
  cart.clear.mockClear();
  push.mockClear();
  bff.mockReset();
  wishlistToggle.mockClear();
  setCart([]);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CartView", () => {
  it("shows an empty state when there are no lines", () => {
    setCart([]);
    render(<CartView />);
    expect(screen.queryByText("Your cart is empty")).not.toBeNull();
  });

  it("renders a row per line with the line total", () => {
    setCart([line({ id: "i1", productName: "Mug" }), line({ id: "i2", productName: "Plate", qty: 2, unitPrice: 5 })]);
    render(<CartView />);
    expect(screen.getAllByText("$20")).toHaveLength(2);
    expect(screen.queryByText("Plate")).not.toBeNull();
    expect(screen.getByRole("table")).not.toBeNull();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("collapses repeated qty taps on one line into a single debounced write", () => {
    vi.useFakeTimers();
    setCart([line({ id: "i1", qty: 1 })]);
    render(<CartView />);

    const plus = screen.getByLabelText("Increase quantity");
    // One tap per act() — each is its own discrete event, the way two real clicks
    // arrive with a repaint between them. Both stay inside one 350 ms window
    // (only 50 ms pass), which is exactly what the debounce must collapse.
    fireEvent.click(plus); // → 2
    act(() => void vi.advanceTimersByTime(50));
    fireEvent.click(plus); // → 3

    // Nothing leaves the island until the quiet window closes.
    expect(cart.setQty).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(CART_QTY_DEBOUNCE_MS));
    expect(cart.setQty).toHaveBeenCalledTimes(1);
    expect(cart.setQty).toHaveBeenCalledWith("i1", 3);
  });

  it("caps a typed quantity at the line's stock ceiling (A4.2)", () => {
    vi.useFakeTimers();
    setCart([line({ id: "i1", qty: 1, stock: 3 })]);
    const { container } = render(<CartView />);
    expect(screen.getByText("Only 3 left")).not.toBeNull();
    expect(container.querySelector('[data-stock-capped="true"]')).not.toBeNull();

    const plus = screen.getByLabelText("Increase quantity");
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(plus);
      act(() => void vi.advanceTimersByTime(10));
    }
    act(() => void vi.advanceTimersByTime(CART_QTY_DEBOUNCE_MS));
    expect(cart.setQty).toHaveBeenCalledTimes(1);
    expect(cart.setQty).toHaveBeenCalledWith("i1", 3);
  });

  it("batch-removes selected lines and moves them to the wishlist (A4.3)", async () => {
    setCart([
      line({ id: "i1", productId: "p1", productName: "Mug" }),
      line({ id: "i2", productId: "p2", productName: "Plate" }),
    ]);
    render(<CartView />);

    fireEvent.click(screen.getByLabelText("Select Mug"));
    fireEvent.click(screen.getByLabelText("Select Plate"));
    expect(screen.getByText("2 selected")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove selected" }));
    await waitFor(() => expect(cart.remove).toHaveBeenCalledTimes(2));
    expect(cart.remove).toHaveBeenCalledWith("i1");
    expect(cart.remove).toHaveBeenCalledWith("i2");

    fireEvent.click(screen.getByLabelText("Select all cart items"));
    fireEvent.click(screen.getByRole("button", { name: "Move selected to wishlist" }));
    await waitFor(() => expect(wishlistToggle).toHaveBeenCalledWith("p1"));
    expect(wishlistToggle).toHaveBeenCalledWith("p2");
  });

  it("removes a line through the store", () => {
    setCart([line({ id: "i1", productName: "Mug" })]);
    render(<CartView />);
    fireEvent.click(screen.getByLabelText("Remove Mug from cart"));
    expect(cart.remove).toHaveBeenCalledWith("i1");
  });

  it("previews, then cleanly removes an applied coupon (A4.5)", async () => {
    bff.mockResolvedValue({
      ok: true,
      data: { valid: true, code: "SAVE10", discountType: "percent", value: 10 },
    });
    setCart([line({ qty: 2, unitPrice: 10 })], { subtotal: 20 });
    render(<CartView />);

    fireEvent.change(screen.getByPlaceholderText("Enter code"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => expect(screen.getByText(/Coupon \(SAVE10\)/)).not.toBeNull());
    expect(screen.getByText("-$2")).not.toBeNull();
    expect(screen.getByText("$18")).not.toBeNull();
    // The code rides to checkout, not a client-computed dollar amount.
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(push).toHaveBeenCalledWith("/checkout?coupon=SAVE10");

    fireEvent.click(screen.getByRole("button", { name: "Remove coupon" }));
    expect(screen.queryByText(/Coupon \(SAVE10\)/)).toBeNull();
    expect(screen.getAllByText("$20").length).toBeGreaterThan(0);
  });

  it("sends the shopper to checkout", () => {
    setCart([line()]);
    render(<CartView />);
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(push).toHaveBeenCalledWith("/checkout");
  });
});
