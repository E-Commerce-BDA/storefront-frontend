// @vitest-environment jsdom
/** Order detail — sf-059 (A6.4 + A3.10): one order, its timeline, and reviews on delivered orders. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const bff = vi.hoisted(() => vi.fn());
vi.mock("@/lib/http/browser", () => ({ bff }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import OrderConfirmation from "@/app/(shop)/_components/OrderConfirmation";

const order = (over: Record<string, unknown> = {}) => ({
  id: "o1",
  order_number: "ORD-1",
  status: "paid",
  subtotal: 20,
  shipping_fee: 0,
  tax: 0,
  discount: 0,
  grand_total: 20,
  shipping_address: { line1: "1 Main", city: "S", postalCode: "1", country: "US" },
  created_at: "2026-11-01T10:00:00Z",
  items: [{ id: "li1", product_id: "p1", product_name: "Linen Shirt", sku: "LS-1", unit_price: 20, qty: 1, line_total: 20 }],
  status_history: [
    { id: "h1", to_status: "paid", note: "Payment captured", created_at: "2026-11-01T10:00:00Z" },
    { id: "h2", to_status: "shipped", note: "Handed to carrier", created_at: "2026-11-02T10:00:00Z" },
  ],
  ...over,
});

beforeEach(() => {
  bff.mockReset();
  bff.mockResolvedValue({ ok: true, data: order() });
});

afterEach(cleanup);

describe("order detail (sf-059)", () => {
  it("renders one order with its status timeline", async () => {
    render(<OrderConfirmation orderId="o1" />);
    await screen.findByText("Order ORD-1");
    expect(screen.getByRole("region", { name: "Order timeline" })).not.toBeNull();
    expect(screen.getByText("Payment captured")).not.toBeNull();
    expect(screen.getByText("Handed to carrier")).not.toBeNull();
  });

  it("offers a write-review form only for delivered orders", async () => {
    bff.mockResolvedValue({ ok: true, data: order({ status: "delivered" }) });
    render(<OrderConfirmation orderId="o1" />);
    await screen.findByText("Order ORD-1");
    expect(
      screen.getByRole("button", { name: "Write a review for Linen Shirt" }),
    ).not.toBeNull();
  });

  it("does not offer reviews while the order is still in flight", async () => {
    render(<OrderConfirmation orderId="o1" />);
    await screen.findByText("Order ORD-1");
    expect(screen.queryByRole("button", { name: /Write a review/ })).toBeNull();
  });
});
