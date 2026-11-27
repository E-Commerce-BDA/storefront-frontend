// @vitest-environment jsdom
/**
 * Final sweep component contract — sf-097.
 *
 * The focus-visible rules added in this task only help if the painted controls
 * are genuinely keyboard-reachable. This asserts that new invariant: each
 * control that now carries a fixed ring is a native button/anchor with an
 * accessible name and is not removed from the tab order. Existing per-component
 * tests already cover roles, callbacks and state; this file deliberately adds
 * only the reachability check they did not make.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NavLinks from "@/components/shell/NavLinks";
import ProductCard from "@/components/commerce/ProductCard";
import SearchPalette from "@/components/shell/SearchPalette";
import SearchSheet from "@/components/shell/SearchSheet";
import type { ProductCardData } from "@/lib/commerce/productCard";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";
import type { SearchResult } from "@/lib/search/source";

afterEach(cleanup);

const LINKS: ResolvedNavLink[] = [
  {
    kind: "custom",
    label: "New in",
    href: "/new",
    categoryId: "",
    icon: "",
    badge: null,
    highlight: "none",
    schedule: { startsAt: "", endsAt: "" },
    current: false,
  },
];

const PRODUCT: ProductCardData = {
  id: "p1",
  name: "Ocean Linen Shirt",
  price: 48,
  image: "",
  category: "Shirts",
  images: [{ url: "a.jpg" }, { url: "b.jpg" }],
};

const RESULTS: SearchResult[] = [
  { id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts" },
];

const PALETTE = {
  dept: "All",
  departments: ["All", "Shirts"],
  trending: ["Linen shirts"],
  recent: ["ocean linen shirt"],
  curated: RESULTS,
  activeIndex: 0,
  onQuery: () => {},
  onDept: () => {},
  onActive: () => {},
  onSelect: () => {},
  onQuickAdd: () => {},
  onTrending: () => {},
  onClearRecent: () => {},
  onClose: () => {},
};

const SHEET = {
  query: "linen",
  results: RESULTS,
  dept: "All",
  departments: ["All", "Shirts"],
  placeholder: "Search products…",
  activeIndex: 0,
  onQuery: () => {},
  onDept: () => {},
  onActive: () => {},
  onSelect: () => {},
  onClose: () => {},
};

function reachable(el: HTMLElement): boolean {
  // Icon-only arrows are named by aria-label, not text content.
  const named =
    (el.getAttribute("aria-label")?.trim().length ?? 0) > 0 ||
    (el.textContent?.trim().length ?? 0) > 0;
  return (
    (el.tagName === "BUTTON" || el.tagName === "A") &&
    el.getAttribute("tabindex") !== "-1" &&
    !el.hasAttribute("disabled") &&
    named
  );
}

describe("focus-painted controls are keyboard reachable", () => {
  it("primary-nav links and disclosure triggers stay in the tab order", () => {
    const { container } = render(<NavLinks links={LINKS} />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).not.toBeNull();
    const controls = Array.from(container.querySelectorAll(".sf-navlinks a, .sf-navlinks button"));
    expect(controls.length).toBeGreaterThan(0);
    for (const el of controls as HTMLElement[]) expect(reachable(el)).toBe(true);
  });

  it("product-card image arrows are named buttons in the tab order", () => {
    render(<ProductCard product={PRODUCT} imageNav="always" />);
    for (const name of ["Previous image", "Next image"]) {
      const arrow = screen.getByRole("button", { name }) as HTMLElement;
      expect(reachable(arrow)).toBe(true);
      expect(arrow.getAttribute("aria-label")).toBe(name);
    }
  });

  it("search-palette Clear all and recent rows are named buttons in the tab order", () => {
    render(<SearchPalette query="" results={[]} {...PALETTE} />);
    for (const name of ["Clear all", /ocean linen shirt/]) {
      const button = screen.getByRole("button", { name }) as HTMLElement;
      expect(reachable(button)).toBe(true);
    }
  });

  it("search-sheet Cancel is a named button in the tab order", () => {
    render(<SearchSheet {...SHEET} />);
    expect(reachable(screen.getByRole("button", { name: "Cancel" }) as HTMLElement)).toBe(true);
  });
});
