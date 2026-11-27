// @vitest-environment jsdom
/**
 * sf-091 contract tier — the CMS `carousel` layout must reach the composed
 * PaginatedRail while `grid` keeps the one grid island. The page itself adds no
 * section markup: this test asserts the renderer's choice, not prototype HTML.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ProductCollectionViewModel } from "@/lib/sections/viewModels";

const h = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock("@/components/commerce/ProductCard", () => ({
  default: ({ product }: { product: { name: string } }) => (
    <article className="card-stub">{product.name}</article>
  ),
}));
vi.mock("@/components/commerce/ProductGridIsland", () => ({
  default: () => <div data-testid="grid-island" />,
}));

import ProductCollectionSection from "@/components/sections/ProductCollectionSection";

afterEach(() => {
  cleanup();
  h.push.mockClear();
});

const cards = [
  { id: "p1", name: "First", price: 10, image: "", url: "/products/first" },
  { id: "p2", name: "Second", price: 20, image: "", url: "/products/second" },
  { id: "p3", name: "Third", price: 30, image: "", url: "/products/third" },
] as ProductCollectionViewModel["cards"];

const model = (layout: "grid" | "carousel"): ProductCollectionViewModel => ({
  key: "new-this-week",
  type: "product_collection",
  title: "New this week",
  cards,
  layout,
});

describe("ProductCollectionSection carousel wiring (sf-091)", () => {
  it("paints the grid layout through the single grid island", () => {
    const { container } = render(<ProductCollectionSection model={model("grid")} />);
    expect(container.querySelector('[data-testid="grid-island"]')).not.toBeNull();
    expect(container.querySelector(".sf-collection__rail")).toBeNull();
  });

  it("paints the carousel layout through PaginatedRail with one dot per card", () => {
    const { container } = render(<ProductCollectionSection model={model("carousel")} />);
    const rail = container.querySelector(".sf-collection__rail") as HTMLElement;
    expect(rail.getAttribute("data-layout")).toBe("carousel");
    expect(container.querySelector(".sf-rail")).not.toBeNull();
    expect(container.querySelectorAll(".sf-rail__dot")).toHaveLength(3);
    expect(container.querySelectorAll(".card-stub")).toHaveLength(3);
    expect(container.querySelector('[data-testid="grid-island"]')).toBeNull();
  });

  it("moves the current page from a dot press and from a left drag", () => {
    const { container } = render(<ProductCollectionSection model={model("carousel")} />);
    fireEvent.click(screen.getByRole("tab", { name: "Page 3 of 3" }));
    expect(
      screen.getByRole("tab", { name: "Page 3 of 3" }).getAttribute("aria-selected"),
    ).toBe("true");

    const track = container.querySelector(".sf-rail__track") as HTMLElement;
    fireEvent.pointerDown(track, { clientX: 120 });
    fireEvent.pointerUp(track, { clientX: 40 });
    // Loop wraps page 3 → page 1.
    expect(
      screen.getByRole("tab", { name: "Page 1 of 3" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("names the rail from the section, not from an invented heading", () => {
    const { container } = render(<ProductCollectionSection model={model("carousel")} />);
    expect(
      container.querySelector('.sf-rail[aria-label="New this week"]'),
    ).not.toBeNull();
  });
});
