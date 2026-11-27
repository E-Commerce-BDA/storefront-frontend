// @vitest-environment jsdom
/**
 * sf-092 contract tier — the listing shell owns only disclosure + column
 * machines; filters and sort still round-trip through the URL via one push.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const h = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push }),
  usePathname: () => "/products",
}));
vi.mock("@/app/(shop)/products/_components/ListingGridIsland", () => ({
  default: ({ columns }: { columns?: { desktop?: number } }) => (
    <div data-testid="grid" data-desktop={columns?.desktop ?? "unset"} />
  ),
}));

import ListingShell from "@/app/(shop)/products/_components/ListingShell";

afterEach(() => {
  cleanup();
  h.push.mockClear();
});

const base = {
  categories: [],
  brands: [],
  tags: ["linen"],
  priceBounds: { min: null, max: null },
  selected: { categorySlug: "shirts", sort: "price_asc" as const, tags: ["linen"] },
  initialItems: [],
  initialCursor: null,
  queryKey: "?category=shirts&sort=price_asc",
};

describe("ListingShell (sf-092)", () => {
  it("renders the toolbar, chips, desktop rail and the grid island", () => {
    const { container } = render(<ListingShell {...base} resultCount={4} />);
    expect(container.querySelector(".sf-shop-toolbar")).not.toBeNull();
    expect(container.querySelector(".sf-listing__rail .sf-filter-rail")).not.toBeNull();
    expect(container.querySelector('[data-testid="grid"]')).not.toBeNull();
    expect(screen.getByText("Category: shirts")).not.toBeNull();
    expect(screen.getByText("4 results")).not.toBeNull();
  });

  it("opens and closes the mobile drawer without touching the URL", () => {
    const { container } = render(<ListingShell {...base} />);
    expect(container.querySelector(".sf-filter-drawer")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(container.querySelector('.sf-filter-drawer [role="dialog"][aria-label="Filters"]')).not.toBeNull();
    expect(h.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close Filters" }));
    expect(container.querySelector(".sf-filter-drawer")).toBeNull();
  });

  it("switches the grid columns to one on mobile and keeps filters in the URL", () => {
    const { container } = render(<ListingShell {...base} columns={{ desktop: 3 }} />);
    expect((container.querySelector('[data-testid="grid"]') as HTMLElement).dataset.desktop).toBe("3");
    fireEvent.click(screen.getByRole("button", { name: "One column" }));
    expect((container.querySelector('[data-testid="grid"]') as HTMLElement).dataset.desktop).toBe("1");
    expect(h.push).not.toHaveBeenCalled();
  });

  it("pushes one canonical URL when a chip is cleared", () => {
    render(<ListingShell {...base} />);
    fireEvent.click(screen.getByRole("button", { name: "Category: shirts" }));
    expect(h.push).toHaveBeenCalledWith(
      "/products?sort=price_asc&tags=linen",
    );
  });

  it("maps Featured back to no sort in the URL", () => {
    render(<ListingShell {...base} />);
    const select = screen.getByLabelText("Sort by") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "featured" } });
    expect(h.push).toHaveBeenCalledWith("/products?category=shirts&tags=linen");
  });
});
