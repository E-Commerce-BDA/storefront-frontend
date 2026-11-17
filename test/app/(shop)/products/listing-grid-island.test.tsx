// @vitest-environment jsdom
/** Listing island contract: append, cursor use, dedupe, termination, error. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const harness = vi.hoisted(() => ({ bff: vi.fn() }));

vi.mock("@/lib/http/browser", () => ({ bff: harness.bff }));
vi.mock("@/components/commerce/ProductGridIsland", () => ({
  default: ({ items }: { items: Array<{ id: string }> }) => (
    <div data-testid="grid" data-ids={items.map((item) => item.id).join(",")} />
  ),
}));

import ListingGridIsland from "@/app/(shop)/products/_components/ListingGridIsland";

const card = (id: string) => ({
  id,
  name: id,
  image: "",
  price: 1,
  category: "",
  url: `/products/${id}`,
});

afterEach(() => {
  cleanup();
  harness.bff.mockReset();
});

describe("ListingGridIsland", () => {
  it("appends the next page without duplicating rows and stops at the last page", async () => {
    harness.bff.mockImplementation(async () => ({
      ok: true,
      data: { items: [card("p2"), card("p1")], nextCursor: null },
    }));
    render(
      <ListingGridIsland
        initialItems={[card("p1")]}
        initialCursor="cursor-1"
        queryKey="?sort=price_asc"
      />,
    );

    const grid = screen.getByTestId("grid");
    expect(grid.getAttribute("data-ids")).toBe("p1");
    fireEvent.click(screen.getByText("Load more"));

    await waitFor(() => expect(grid.getAttribute("data-ids")).toBe("p1,p2"));
    expect(harness.bff).toHaveBeenCalledWith(
      "/api/catalog/products?sort=price_asc&cursor=cursor-1",
    );
    await waitFor(() => expect(screen.queryByText("Load more")).toBeNull());
  });

  it("renders no load-more control when there is no cursor", () => {
    render(
      <ListingGridIsland
        initialItems={[card("p1")]}
        initialCursor={null}
        queryKey=""
      />,
    );
    expect(screen.queryByText("Load more")).toBeNull();
  });

  it("surfaces a failed page as an alert without dropping seen rows", async () => {
    harness.bff.mockResolvedValue({ ok: false, kind: "unavailable", status: 503, code: "CATALOG_UNAVAILABLE", message: null });
    render(
      <ListingGridIsland
        initialItems={[card("p1")]}
        initialCursor="cursor-1"
        queryKey=""
      />,
    );
    fireEvent.click(screen.getByText("Load more"));
    await waitFor(() => expect(screen.getByRole("alert")).not.toBeNull());
    expect(screen.getByTestId("grid").getAttribute("data-ids")).toBe("p1");
  });
});
