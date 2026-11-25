// @vitest-environment jsdom
/**
 * Wishlist store — sf-056. The grid/PDP toggles only paint what this provider
 * decides, so the optimism and the guest prompt are pinned here rather than in
 * a component that just forwards `toggle`.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const port = vi.hoisted(() => ({
  fetchWishlist: vi.fn(),
  postConsumePending: vi.fn(),
  postWishlistItem: vi.fn(),
  deleteWishlistItem: vi.fn(),
}));

vi.mock("@/lib/wishlist/port", () => port);

import { WishlistProvider, useWishlist } from "@/app/_components/WishlistProvider";

function Probe() {
  const { has, count, toggle, guestPromptProductId, dismissGuestPrompt } = useWishlist();
  return (
    <div>
      <output data-testid="count">{count}</output>
      <output data-testid="saved">{has("p1") ? "saved" : "not-saved"}</output>
      <output data-testid="prompt">{guestPromptProductId ?? "none"}</output>
      <button onClick={() => void toggle("p1")}>Toggle</button>
      <button onClick={dismissGuestPrompt}>Dismiss</button>
    </div>
  );
}

const ENTRY = {
  id: "w1",
  productId: "p1",
  addedAt: "2026-11-25T00:00:00Z",
  product: { id: "p1", name: "Linen Shirt", slug: "linen-shirt", price: 42 },
};

beforeEach(() => {
  port.postConsumePending.mockResolvedValue({ ok: true, data: { consumed: false } });
  port.fetchWishlist.mockResolvedValue({ ok: true, data: { items: [] } });
  port.postWishlistItem.mockResolvedValue({
    ok: true,
    data: { item: { id: "w1", productId: "p1", addedAt: ENTRY.addedAt } },
  });
  port.deleteWishlistItem.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(cleanup);

describe("WishlistProvider (sf-056)", () => {
  it("paints an optimistic add before the write settles and keeps it on success", async () => {
    let resolveAdd: (value: unknown) => void = () => {};
    port.postWishlistItem.mockImplementation(
      () => new Promise((resolve) => { resolveAdd = resolve; }),
    );
    render(<WishlistProvider><Probe /></WishlistProvider>);
    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("0"));

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    await waitFor(() => expect(screen.getByTestId("saved").textContent).toBe("saved"));
    expect(screen.getByTestId("count").textContent).toBe("1");

    await act(async () => {
      port.fetchWishlist.mockResolvedValue({ ok: true, data: { items: [ENTRY] } });
      resolveAdd({ ok: true, data: { item: ENTRY } });
    });
    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("1"));
    expect(screen.getByTestId("saved").textContent).toBe("saved");
  });

  it("reverts the optimistic add when the write fails", async () => {
    port.postWishlistItem.mockResolvedValue({
      ok: false,
      kind: "unavailable",
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message: null,
    });
    render(<WishlistProvider><Probe /></WishlistProvider>);
    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("0"));

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    await waitFor(() => expect(screen.getByTestId("saved").textContent).toBe("not-saved"));
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("prompts a guest instead of navigating away, and keeps the product in the prompt", async () => {
    port.postWishlistItem.mockResolvedValue({
      ok: false,
      kind: "unauthorized",
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Please sign in to save items to your wishlist",
    });
    render(<WishlistProvider><Probe /></WishlistProvider>);
    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("0"));

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Sign in to save this item" })).not.toBeNull(),
    );
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByText(/We'll keep your pick ready/)).not.toBeNull();
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toContain("/signin?next=");

    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
