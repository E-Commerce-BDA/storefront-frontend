// @vitest-environment jsdom
/**
 * SearchPalette contract — search row, filter Pills, trending + recent
 * columns (empty query only), curated-before-typing grid, live results
 * after, ratings, quick-add states, close paths, arrow-cycle + Enter.
 * Fully controlled: every behavior arrives as props, no timers, no fetch.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import SearchPalette from "@/components/shell/SearchPalette";
import type { SearchResult } from "@/lib/search/source";

afterEach(cleanup);

const ROWS: SearchResult[] = [
  { id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts", tag: "Bestseller", rating: 4.8, ratingCount: 142 },
  { id: "p2", name: "Raw Hem Trouser", price: 94, image: "", category: "Pants", tag: "Organic", rating: 4.7 },
];

const BASE = {
  dept: "All",
  departments: ["All", "Shirts", "Pants"],
  trending: ["Linen shirts", "Chelsea boots"],
  recent: ["ocean linen shirt"],
  curated: ROWS,
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

describe("SearchPalette", () => {
  it("renders search row, filters, columns, products and footer", () => {
    render(<SearchPalette query="" results={[]} {...BASE} />);
    expect(screen.getByRole("dialog", { name: "Search products" }).getAttribute("aria-modal")).toBe("true");
    expect(screen.getByLabelText("Search products, materials, or categories").getAttribute("placeholder")).toContain("linen");
    expect(screen.getByText("Filters:")).not.toBeNull();
    expect(screen.getByText("Trending right now")).not.toBeNull();
    expect(screen.getByText("Recent searches")).not.toBeNull();
    expect(screen.getByText("Clear all")).not.toBeNull();
    expect(screen.getByText("Matching Products (2)")).not.toBeNull();
    expect(screen.getByText("Bestseller")).not.toBeNull();
    expect(screen.getByText("4.8")).not.toBeNull();
    expect(screen.getByText("(142)")).not.toBeNull();
    expect(screen.getByText("2 available items")).not.toBeNull();
  });

  it("filter Pills call back with the department", () => {
    const onDept = vi.fn();
    render(<SearchPalette query="" results={[]} {...BASE} onDept={onDept} />);
    fireEvent.click(screen.getByRole("button", { name: "Shirts" }));
    expect(onDept).toHaveBeenCalledWith("Shirts");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("trending chips + recent rows search; clear-all clears; columns hide while typing", () => {
    const onTrending = vi.fn();
    const onClearRecent = vi.fn();
    const { unmount } = render(<SearchPalette query="" results={[]} {...BASE} onTrending={onTrending} onClearRecent={onClearRecent} />);
    fireEvent.click(screen.getByRole("button", { name: /Linen shirts/ }));
    expect(onTrending).toHaveBeenCalledWith("Linen shirts");
    fireEvent.click(screen.getByRole("button", { name: /ocean linen shirt/ }));
    expect(onTrending).toHaveBeenCalledWith("ocean linen shirt");
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onClearRecent).toHaveBeenCalledTimes(1);
    unmount();
    render(<SearchPalette query="linen" results={ROWS} {...BASE} />);
    expect(screen.queryByText("Trending right now")).toBeNull();
    expect(screen.queryByText("Recent searches")).toBeNull();
  });

  it("typing switches to live results; no match states the query", () => {
    const { unmount } = render(<SearchPalette query="linen" results={ROWS} {...BASE} />);
    expect(screen.getByText("Matching Products (2)")).not.toBeNull();
    unmount();
    render(<SearchPalette query="xyz" results={[]} {...BASE} />);
    expect(screen.getByRole("status").textContent).toContain("xyz");
    unmount();
    render(<SearchPalette query="" results={[]} {...BASE} curated={[]} />);
    expect(screen.getByText("No products to show.")).not.toBeNull();
  });

  it("quick-add fires per row; added ids flip to Added; pending disables", () => {
    const onQuickAdd = vi.fn();
    const { unmount } = render(
      <SearchPalette query="" results={[]} {...BASE} addedIds={["p1"]} pendingIds={["p2"]} onQuickAdd={onQuickAdd} />,
    );
    const added = screen.getByRole("button", { name: "Ocean Linen Shirt added to bag" });
    expect(added.getAttribute("data-state")).toBe("added");
    expect(added.textContent).toContain("Added");
    // Pending disables (the attr is the assertion — browsers, not tests,
    // enforce disabled; programmatic clicks bypass it).
    const pending = screen.getByRole("button", { name: "Quick add Raw Hem Trouser to bag" });
    expect(pending.hasAttribute("disabled")).toBe(true);
    expect(onQuickAdd).not.toHaveBeenCalled();
    unmount();
    render(<SearchPalette query="" results={[]} {...BASE} onQuickAdd={onQuickAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Quick add Ocean Linen Shirt to bag" }));
    expect(onQuickAdd).toHaveBeenCalledWith(ROWS[0]);
  });

  it("loading skeleton, X closes, backdrop closes, Esc closes", () => {
    const onClose = vi.fn();
    const { container, unmount } = render(
      <SearchPalette query="li" results={[]} status="loading" {...BASE} onClose={onClose} />,
    );
    expect(screen.getByText("Searching…")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close search" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    (container.querySelector(".sf-searchpalette__backdrop") as HTMLElement | null)?.click();
    // Backdrop has aria-hidden (decorative layer) — clicked directly here.
    expect(onClose).toHaveBeenCalledTimes(2);
    unmount();
    const second = render(<SearchPalette query="li" results={[]} {...BASE} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
    second.unmount();
  });

  it("traps Tab inside (locked verdict)", () => {
    const onClose = vi.fn();
    render(<SearchPalette query="" results={[]} {...BASE} onClose={onClose} />);
    expect(document.querySelector('[data-trap="true"]')).not.toBeNull();
    // DOM order: the input is first — Shift+Tab wraps to the last control
    // (second row's Quick Add).
    screen.getByLabelText("Search products, materials, or categories").focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement?.textContent).toContain("Quick Add");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("emits theme + motion vars, variant hooks and closing hook", () => {
    const { container } = render(
      <SearchPalette
        query=""
        results={[]}
        {...BASE}
        motion={{ enabled: true, durationMs: 200, easing: "linear", travel: "full" }}
        closing
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--pl-duration")).toBe("200ms");
    expect(root.style.getPropertyValue("--pl-easing")).toBe("linear");
    expect(root.style.getPropertyValue("--pl-card")).toBe("#ffffff");
    expect(root.style.getPropertyValue("--pill-bg")).toBe("#0a2540");
    expect(root.getAttribute("data-closing")).toBe("true");
    expect(root.getAttribute("data-motion")).toBe("on");
    expect(root.getAttribute("data-card")).toBe("row");
  });

  it("arrow keys cycle with wrap, Enter selects the active row", () => {
    const onActive = vi.fn();
    const onSelect = vi.fn();
    render(
      <SearchPalette query="" results={[]} {...BASE} activeIndex={1} onActive={onActive} onSelect={onSelect} />,
    );
    const input = screen.getByLabelText("Search products, materials, or categories");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(onActive).toHaveBeenCalledWith(0);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(ROWS[1]);
    fireEvent.click(screen.getByText("Ocean Linen Shirt"));
    expect(onSelect).toHaveBeenCalledWith(ROWS[0]);
  });
});
