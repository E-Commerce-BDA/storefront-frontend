// @vitest-environment jsdom
/**
 * Inspect regions contract — list (pills, rows, affordance), preview
 * (skeleton/null/full, sizes, stock), actions (dynamic label, gates).
 * All props, all dumb; data shapes mirror the demo PDP map.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import SearchInspectList from "@/components/shell/SearchInspectList";
import SearchInspectPreview from "@/components/shell/SearchInspectPreview";
import SearchInspectActions from "@/components/shell/SearchInspectActions";
import type { SearchResult } from "@/lib/search/source";

afterEach(cleanup);

const ROWS: SearchResult[] = [
  { id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts", tag: "Bestseller", rating: 4.8 },
  { id: "p2", name: "Raw Hem Trouser", price: 94, image: "", category: "Pants" },
];

const DETAIL = {
  id: "p1",
  name: "Ocean Linen Shirt",
  price: 48,
  image: "",
  category: "Shirts",
  tag: "Bestseller",
  rating: 4.8,
  description: "Ethically manufactured.",
  sizes: ["S", "M", "L", "XL"],
  stock: 14,
};

describe("SearchInspectList", () => {
  it("renders pills, rows with ratings, inspect affordance and hint", () => {
    const onInspect = vi.fn();
    render(
      <SearchInspectList
        results={ROWS}
        departments={["All", "Shirts", "Pants"]}
        dept="All"
        activeId="p1"
        onInspect={onInspect}
      />,
    );
    expect(screen.getByRole("button", { name: "Shirts" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/4\.8/)).not.toBeNull();
    expect(screen.getAllByText(/Inspect/).length).toBeGreaterThan(0);
    fireEvent.mouseEnter(screen.getByText("Raw Hem Trouser"));
    expect(onInspect).toHaveBeenCalledWith("p2");
    expect(screen.getByText(/Hover or use/)).not.toBeNull();
  });

  it("empty results render the empty state (absent data, absent rows)", () => {
    render(<SearchInspectList results={[]} />);
    expect(screen.getByRole("status").textContent).toMatch(/No products match/);
    expect(screen.queryByText(/Hover or use/)).toBeNull();
  });
});

describe("SearchInspectPreview", () => {
  it("skeleton on loading, null on absent (never invents content)", () => {
    const { container, unmount } = render(<SearchInspectPreview detail={null} status="loading" />);
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
    unmount();
    const empty = render(<SearchInspectPreview detail={null} status="done" />);
    expect(empty.container.firstChild).toBeNull();
  });

  it("renders badge, lookbook chip, dept, price, desc, sizes and stock", () => {
    const onSize = vi.fn();
    render(<SearchInspectPreview detail={DETAIL} status="done" selectedSize="M" onSize={onSize} />);
    expect(screen.getByText("Bestseller")).not.toBeNull();
    expect(screen.getByText("Live Lookbook Preview")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Ocean Linen Shirt" })).not.toBeNull();
    expect(screen.getByText("$48")).not.toBeNull();
    expect(screen.getByText(/In Stock/)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "L" }));
    expect(onSize).toHaveBeenCalledWith("L");
    expect(screen.getByRole("button", { name: "M" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("hides the selector for single-size products, flags out of stock", () => {
    render(
      <SearchInspectPreview
        detail={{ ...DETAIL, sizes: ["One Size"], stock: 0 }}
        status="done"
      />,
    );
    expect(screen.queryByRole("group", { name: "Select size" })).toBeNull();
    expect(screen.getByText(/Out of stock/)).not.toBeNull();
  });
});

describe("SearchInspectActions", () => {
  it("labels dynamically, gates on pick and stock", () => {
    const onAdd = vi.fn();
    const { unmount } = render(
      <SearchInspectActions price={78} size={null} sizesExist inStock onAdd={onAdd} onFullPage={() => {}} />,
    );
    const pick = screen.getByRole("button", { name: /Select a size/ });
    expect(pick.hasAttribute("disabled")).toBe(true);
    fireEvent.click(pick);
    expect(onAdd).not.toHaveBeenCalled(); // dead button never fires
    unmount();
    render(<SearchInspectActions price={78} size="S" sizesExist inStock onAdd={onAdd} onFullPage={() => {}} />);
    const add = screen.getByRole("button", { name: /Add Size S to Bag/ });
    fireEvent.click(add);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("disables Add when out of stock, sizes optional when single", () => {
    render(<SearchInspectActions price={48} size={null} sizesExist={false} inStock={false} />);
    expect(screen.getByRole("button", { name: /Add to Bag/ }).hasAttribute("disabled")).toBe(true);
  });
});
