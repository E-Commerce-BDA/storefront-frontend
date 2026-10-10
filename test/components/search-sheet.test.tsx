// @vitest-environment jsdom
/**
 * SearchSheet contract — regions, dept filter, empty/no-match, close paths,
 * arrow-cycle + Enter callbacks. Fully controlled: every behavior arrives
 * as props, no timers, no fetch.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import SearchSheet from "@/components/shell/SearchSheet";
import type { SearchResult } from "@/lib/search/source";

afterEach(cleanup);

const ROWS: SearchResult[] = [
  { id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts", tag: "Bestseller", rating: 4.8 },
  { id: "p2", name: "Raw Hem Trouser", price: 94, image: "", category: "Pants" },
];

const BASE = {
  dept: "All",
  departments: ["All", "Shirts", "Pants"],
  placeholder: "Search products…",
  activeIndex: 0,
  onQuery: () => {},
  onDept: () => {},
  onActive: () => {},
  onSelect: () => {},
  onClose: () => {},
};

describe("SearchSheet", () => {
  it("renders bar, departments, meta and cards", () => {
    render(<SearchSheet query="linen" results={ROWS} {...BASE} />);
    expect(screen.getByRole("dialog", { name: "Search" })).not.toBeNull();
    expect(screen.getByLabelText("Search products").getAttribute("placeholder")).toBe("Search products…");
    expect(screen.getByText("Ocean Linen Shirt")).not.toBeNull();
    expect(screen.getByText("Bestseller")).not.toBeNull();
    expect(screen.getByText(/Instant Suggestions \(2\)/)).not.toBeNull();
  });

  it("dept pills call back with the department", () => {
    const onDept = vi.fn();
    render(<SearchSheet query="linen" results={ROWS} {...BASE} onDept={onDept} />);
    fireEvent.click(screen.getByRole("button", { name: "Shirts" }));
    expect(onDept).toHaveBeenCalledWith("Shirts");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("empty query invites typing; no match states the query", () => {
    const { unmount } = render(<SearchSheet query="" results={[]} {...BASE} />);
    expect(screen.getByText(/Type 2\+ characters/)).not.toBeNull();
    unmount();
    render(<SearchSheet query="xyz" results={[]} {...BASE} />);
    expect(screen.getByRole("status").textContent).toContain("xyz");
  });

  it("loading skeleton, Cancel closes, backdrop closes, Esc closes", () => {
    const onClose = vi.fn();
    const { unmount } = render(<SearchSheet query="li" results={[]} status="loading" {...BASE} onClose={onClose} />);
    expect(screen.getByText("Searching…")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    const second = render(<SearchSheet query="li" results={[]} {...BASE} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
    second.unmount();
  });

  it("traps Tab inside (locked feel-test verdict), Esc closes", () => {
    const onClose = vi.fn();
    render(<SearchSheet query="linen" results={ROWS} {...BASE} onClose={onClose} />);
    expect(document.querySelector('[data-trap="true"]')).not.toBeNull();
    const input = screen.getByLabelText("Search products");
    input.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    // Shift+Tab from the first element wraps to the last (second result).
    expect(document.activeElement?.textContent).toContain("Raw Hem Trouser");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("emits motion vars + closing hook (slide, never fade)", () => {
    const { container } = render(
      <SearchSheet
        query="linen"
        results={ROWS}
        {...BASE}
        motion={{ enabled: true, durationMs: 180, easing: "linear" }}
        closing
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--searchsheet-duration")).toBe("180ms");
    expect(root.style.getPropertyValue("--searchsheet-easing")).toBe("linear");
    expect(root.getAttribute("data-closing")).toBe("true");
    expect(root.getAttribute("data-motion")).toBe("on");
  });

  it("arrow keys cycle with wrap, Enter selects the active row", () => {
    const onActive = vi.fn();
    const onSelect = vi.fn();
    render(<SearchSheet query="linen" results={ROWS} {...BASE} activeIndex={1} onActive={onActive} onSelect={onSelect} />);
    const input = screen.getByLabelText("Search products");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(onActive).toHaveBeenCalledWith(0);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(ROWS[1]);
    fireEvent.click(screen.getByText("Ocean Linen Shirt"));
    expect(onSelect).toHaveBeenCalledWith(ROWS[0]);
  });
});
