// @vitest-environment jsdom
/**
 * SearchEditorial contract — header/close, serif input, dept tabs, curated
 * grid before typing, live results after, empty/no-match, close paths,
 * arrow-cycle + Enter callbacks. Fully controlled: props in, no timers.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import SearchEditorial from "@/components/shell/SearchEditorial";
import type { SearchResult } from "@/lib/search/source";

afterEach(cleanup);

const ROWS: SearchResult[] = [
  { id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts", tag: "Bestseller", rating: 4.8 },
  { id: "p2", name: "Raw Hem Trouser", price: 94, image: "", category: "Pants", tag: "Organic" },
];

const BASE = {
  dept: "All",
  departments: ["All", "Shirts", "Pants"],
  curated: ROWS,
  activeIndex: 0,
  onQuery: () => {},
  onDept: () => {},
  onActive: () => {},
  onSelect: () => {},
  onClose: () => {},
};

describe("SearchEditorial", () => {
  it("renders header, archive input, tabs and the curated grid before typing", () => {
    render(<SearchEditorial query="" results={[]} {...BASE} />);
    expect(screen.getByRole("dialog", { name: "Editorial search" }).getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Atelier editorial search")).not.toBeNull();
    expect(screen.getByText("Search the atelier archive")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Curated this season" })).not.toBeNull();
    expect(screen.getByLabelText("Search the archive").getAttribute("placeholder")).toContain("Linen");
    expect(screen.getByText("Ocean Linen Shirt")).not.toBeNull();
    expect(screen.getByText("Bestseller")).not.toBeNull();
    expect(screen.getByText("2 items")).not.toBeNull();
  });

  it("dept tabs filter the curated grid and call back", () => {
    const onDept = vi.fn();
    render(<SearchEditorial query="" results={[]} {...BASE} onDept={onDept} />);
    fireEvent.click(screen.getByRole("button", { name: "Shirts" }));
    expect(onDept).toHaveBeenCalledWith("Shirts");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("typing switches the grid to live results; no match states the query", () => {
    const { unmount } = render(<SearchEditorial query="linen" results={ROWS} {...BASE} />);
    expect(screen.getByText(/2 items/)).not.toBeNull();
    unmount();
    render(<SearchEditorial query="xyz" results={[]} {...BASE} />);
    expect(screen.getByRole("status").textContent).toContain("xyz");
  });

  it("flat copy wins over theme; empty curated states the archive", () => {
    const { unmount } = render(
      <SearchEditorial query="" results={[]} {...BASE} eyebrow="Maison search" title="This week" />,
    );
    expect(screen.getByText("Maison search")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "This week" })).not.toBeNull();
    unmount();
    render(<SearchEditorial query="" results={[]} {...BASE} curated={[]} />);
    expect(screen.getByText("The archive is empty.")).not.toBeNull();
  });

  it("loading skeleton, X closes, Esc closes", () => {
    const onClose = vi.fn();
    const { unmount } = render(<SearchEditorial query="li" results={[]} status="loading" {...BASE} onClose={onClose} />);
    expect(screen.getByText("Searching…")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close search" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    const second = render(<SearchEditorial query="li" results={[]} {...BASE} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
    second.unmount();
  });

  it("traps Tab inside (locked verdict), Esc closes", () => {
    const onClose = vi.fn();
    render(<SearchEditorial query="" results={[]} {...BASE} onClose={onClose} />);
    expect(document.querySelector('[data-trap="true"]')).not.toBeNull();
    // DOM order: X close is the first focusable — Shift+Tab wraps to the
    // last card (second curated row).
    screen.getByRole("button", { name: "Close search" }).focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement?.textContent).toContain("Raw Hem Trouser");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("emits theme + motion vars, variant hooks and closing hook", () => {
    const { container } = render(
      <SearchEditorial
        query=""
        results={[]}
        {...BASE}
        motion={{ enabled: true, durationMs: 320, easing: "linear", travel: "full" }}
        closing
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--ed-duration")).toBe("320ms");
    expect(root.style.getPropertyValue("--ed-easing")).toBe("linear");
    expect(root.style.getPropertyValue("--ed-bg")).toBe("#f5fafc");
    expect(root.style.getPropertyValue("--ed-alpha")).toBe("100%");
    expect(root.getAttribute("data-closing")).toBe("true");
    expect(root.getAttribute("data-motion")).toBe("on");
    expect(root.getAttribute("data-tabshape")).toBe("pill");
    expect(root.getAttribute("data-card")).toBe("standard");
  });

  it("arrow keys cycle with wrap, Enter selects the active card", () => {
    const onActive = vi.fn();
    const onSelect = vi.fn();
    render(
      <SearchEditorial query="" results={[]} {...BASE} activeIndex={1} onActive={onActive} onSelect={onSelect} />,
    );
    const input = screen.getByLabelText("Search the archive");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(onActive).toHaveBeenCalledWith(0);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(ROWS[1]);
    fireEvent.click(screen.getByText("Ocean Linen Shirt"));
    expect(onSelect).toHaveBeenCalledWith(ROWS[0]);
  });
});
