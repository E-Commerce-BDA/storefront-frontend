// @vitest-environment jsdom
/**
 * AccountView — the `/account` island (plan §12 islands tier).
 *
 * The states worth pinning are the ones the BFF's partial degradation creates:
 * a history failure must still render the *profile* (that is the whole promise
 * of `ordersError`), an empty history is an EmptyState not a blank list, and
 * sign-out is a POST plus a cart drop plus a route — in that order the badge
 * never lies after the session ends.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { OrderDto } from "@/lib/order/schemas";

const bff = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
const clear = vi.hoisted(() => vi.fn(async () => true));
const logoutFetch = vi.hoisted(() => vi.fn(async () => new Response(null, { status: 204 })));
const wishlistItems = vi.hoisted(() => ({ value: [] as Array<{ id: string; productId: string; product: { name: string; slug: string; price: number } }> }));

vi.mock("@/app/_components/WishlistProvider", () => ({
  useWishlist: () => ({
    items: wishlistItems.value,
    ids: wishlistItems.value.map((i) => i.productId),
    count: wishlistItems.value.length,
    has: () => false,
    toggle: async () => false,
    remove: async () => false,
  }),
}));
vi.mock("@/lib/http/browser", () => ({ bff }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/app/_components/CartProvider", () => ({ useCart: () => ({ clear }) }));

import AccountView from "@/app/(shop)/_components/AccountView";

const user = { id: "u1", email: "shopper@example.com", firstName: "Ada", lastName: "Lovelace" };
const order = (over: Partial<OrderDto> = {}): OrderDto => ({
  id: "o1",
  order_number: "ORD-1001",
  status: "paid",
  subtotal: 42,
  shipping_fee: 5,
  tax: 3.36,
  discount: 0,
  grand_total: 50.36,
  shipping_address: { line1: "1 Main St", city: "Springfield", postalCode: "12345", country: "US" },
  created_at: "2026-10-01T10:00:00Z",
  items: [],
  ...over,
});

beforeEach(() => {
  wishlistItems.value = [];
  bff.mockReset();
  push.mockClear();
  clear.mockClear();
  logoutFetch.mockClear();
  vi.stubGlobal("fetch", logoutFetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AccountView", () => {
  it("renders the profile and one row per order", async () => {
    bff.mockResolvedValue({ ok: true, data: { user, orders: [order(), order({ id: "o2", order_number: "ORD-1002" })], ordersError: null } });
    render(<AccountView />);

    await waitFor(() => expect(screen.queryByText("Ada Lovelace")).not.toBeNull());
    expect(screen.queryByText("ORD-1001")).not.toBeNull();
    expect(screen.queryByText("ORD-1002")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    // Money renders as the raw number, the same face as every other surface —
    // once per row (both rows share the fixture total on purpose).
    expect(screen.getAllByText("$50.36")).toHaveLength(2);
  });

  it("renders saved wishlist items on /account with a link to the full list", async () => {
    wishlistItems.value = [
      { id: "w1", productId: "p1", product: { name: "Linen Shirt", slug: "linen-shirt", price: 42 } },
    ];
    bff.mockResolvedValue({ ok: true, data: { user, orders: [], ordersError: null } });
    render(<AccountView />);

    await waitFor(() => expect(screen.queryByText("Ada Lovelace")).not.toBeNull());
    expect(screen.getByText("Linen Shirt").closest("a")?.getAttribute("href")).toBe("/products/linen-shirt");
    expect(screen.getByRole("button", { name: "View all" })).not.toBeNull();
  });

  it("keeps the profile when the order history failed (partial degradation)", async () => {
    bff.mockResolvedValue({ ok: true, data: { user, orders: [], ordersError: { code: "SERVICE_UNAVAILABLE", status: 503 } } });
    render(<AccountView />);

    await waitFor(() => expect(screen.queryByText("Ada Lovelace")).not.toBeNull());
    expect(screen.queryByText("Your orders are unavailable right now — the profile above is still yours.")).not.toBeNull();
    // Not the empty state — history failed, it is not provably empty.
    expect(screen.queryByText("No orders yet")).toBeNull();
  });

  it("shows the empty state when the account genuinely has no orders", async () => {
    bff.mockResolvedValue({ ok: true, data: { user, orders: [], ordersError: null } });
    render(<AccountView />);
    await waitFor(() => expect(screen.queryByText("No orders yet")).not.toBeNull());
  });

  it("routes a dead session to sign-in, back to /account", async () => {
    bff.mockResolvedValue({ ok: false, kind: "unauthorized", status: 401, code: "TOKEN_EXPIRED", message: null });
    render(<AccountView />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/signin?next=%2Faccount"));
  });

  it("signs out: POST the BFF, drop the local cart, land on /signin", async () => {
    bff.mockResolvedValue({ ok: true, data: { user, orders: [order()], ordersError: null } });
    render(<AccountView />);
    await waitFor(() => expect(screen.queryByText("ORD-1001")).not.toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/signin"));
    expect(logoutFetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
    expect(clear).toHaveBeenCalled();
  });
});
