// @vitest-environment jsdom
/**
 * ProductGrid contract — maps cards, never fetches, carries quick-add state on
 * the cell (product.md §15; plan §12 block tier).
 *
 * The grid's whole job is arrangement: one card per item in order, the column
 * vars from the caller's theme numbers, and a `data-pending` / `data-added` hook
 * on the *cell* (the card must not learn about carts). An empty list is the
 * owner's EmptyState, not a blank region.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ProductGrid from "@/components/commerce/ProductGrid";
import type { ProductCardData } from "@/lib/commerce/productCard";

afterEach(cleanup);

const card = (over: Partial<ProductCardData> = {}): ProductCardData => ({
  id: "p1",
  name: "Ocean Linen Shirt",
  price: 40,
  image: "a.jpg",
  category: "Shirts",
  url: "/products/ocean-linen-shirt",
  ...over,
});

describe("ProductGrid", () => {
  it("renders one card per item, in order", () => {
    render(
      <ProductGrid
        items={[card({ id: "a", name: "First" }), card({ id: "b", name: "Second" })]}
      />,
    );

    const cells = screen.getAllByRole("listitem");
    expect(cells).toHaveLength(2);
    expect(cells[0].textContent).toContain("First");
    expect(cells[1].textContent).toContain("Second");
  });

  it("publishes the three column counts as inline vars, clamped", () => {
    const { container } = render(
      <ProductGrid items={[card()]} columns={{ desktop: 9, tablet: 2, phone: 1 }} />,
    );
    const grid = container.querySelector(".sf-grid") as HTMLElement;
    expect(grid.style.getPropertyValue("--grid-cols-desktop")).toBe("5");
    expect(grid.style.getPropertyValue("--grid-cols-tablet")).toBe("2");
    expect(grid.style.getPropertyValue("--grid-cols-phone")).toBe("1");
  });

  it("marks the cell, not the card, for a pending and an added quick-add", () => {
    const { container } = render(
      <ProductGrid
        items={[card({ id: "a", url: "/products/a" }), card({ id: "b", url: "/products/b" })]}
        pendingIds={["/products/a"]}
        addedIds={["/products/b"]}
      />,
    );

    const cells = container.querySelectorAll(".sf-grid__cell");
    expect(cells[0].getAttribute("data-pending")).toBe("true");
    expect(cells[0].getAttribute("data-added")).toBe("false");
    expect(cells[1].getAttribute("data-pending")).toBe("false");
    expect(cells[1].getAttribute("data-added")).toBe("true");
  });

  it("matches a pending id by the card id when the caller has no url", () => {
    const { container } = render(
      <ProductGrid items={[card({ id: "p9", url: undefined })]} pendingIds={["p9"]} />,
    );
    expect(container.querySelector(".sf-grid__cell")?.getAttribute("data-pending")).toBe("true");
  });

  it("reports the tapped card through onOpen and the quick-add through onQuickAdd", () => {
    const onOpen = vi.fn();
    const onQuickAdd = vi.fn();
    const item = card();
    render(<ProductGrid items={[item]} onOpen={onOpen} onQuickAdd={onQuickAdd} />);

    // Media and name are both "open" controls; the grid forwards to the card, so
    // tapping either must reach the owner's handler with the mapped product.
    for (const opener of screen.getAllByRole("button", { name: "Ocean Linen Shirt, $40" })) {
      fireEvent.click(opener);
    }
    expect(onOpen).toHaveBeenCalledWith(item);

    fireEvent.click(screen.getByRole("button", { name: "Add Ocean Linen Shirt to bag" }));
    expect(onQuickAdd).toHaveBeenCalledWith(item);
  });

  it("renders the owner's empty face instead of a blank grid", () => {
    render(<ProductGrid items={[]} empty={<p data-testid="blank">No products matched</p>} />);

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByTestId("blank")).not.toBeNull();
  });

  it("renders nothing for an empty grid with no empty face given", () => {
    const { container } = render(<ProductGrid items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("labels the list for a screen reader", () => {
    render(<ProductGrid items={[card()]} label="Running shoes" />);
    expect(screen.getByRole("list", { name: "Running shoes" })).not.toBeNull();
  });
});
