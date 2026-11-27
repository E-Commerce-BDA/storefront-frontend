// @vitest-environment jsdom
/**
 * sf-087 contract tier — the five shop primitives render only what the owner
 * passed. Every callback is forwarded; no component owns state.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  FilterDrawer,
  GridModeToggle,
  Menu,
  SegmentedToggle,
  ShopToolbar,
} from "@/components/ui";

afterEach(cleanup);

describe("SegmentedToggle", () => {
  it("paints the selected hook and reports changes", () => {
    const onChange = vi.fn();
    render(
      <SegmentedToggle
        ariaLabel="Columns"
        value="two"
        options={[
          { value: "two", label: "Two" },
          { value: "one", label: "One" },
        ]}
        onChange={onChange}
      />,
    );
    const group = screen.getByRole("group", { name: "Columns" });
    expect(group.getAttribute("data-size")).toBe("md");
    const buttons = screen.getAllByRole("button");
    expect(buttons[0].getAttribute("data-selected")).toBe("true");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(buttons[1]);
    expect(onChange).toHaveBeenCalledWith("one");
  });
});

describe("Menu", () => {
  it("is a controlled disclosure: open comes from props, close is a callback", () => {
    const onOpenChange = vi.fn();
    const { container, rerender } = render(
      <Menu open={false} onOpenChange={onOpenChange} ariaLabel="Account" trigger="Open">
        <a href="/account">Account</a>
      </Menu>,
    );
    expect(screen.getByRole("button", { name: "Account" }).getAttribute("aria-expanded")).toBe("false");
    expect((container.querySelector('[role="menu"]') as HTMLElement).hasAttribute("hidden")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    rerender(
      <Menu open onOpenChange={onOpenChange} ariaLabel="Account" trigger="Open">
        <a href="/account">Account</a>
      </Menu>,
    );
    expect(screen.getByRole("menu", { name: "Account" }).hasAttribute("hidden")).toBe(false);
    expect(document.querySelector('.sf-menu[data-open="true"][data-align="start"]')).not.toBeNull();
  });
});

describe("FilterDrawer", () => {
  it("renders a labelled dialog with a close callback and footer slot", () => {
    const onClose = vi.fn();
    const { container } = render(
      <FilterDrawer open onClose={onClose} width={360} footer={<button>Show 9</button>}>
        <p>Facet body</p>
      </FilterDrawer>,
    );
    expect(screen.getByRole("dialog", { name: "Filters" })).not.toBeNull();
    expect(container.querySelector('[data-side="left"]')).not.toBeNull();
    expect((container.querySelector(".sf-filter-drawer") as HTMLElement).style.getPropertyValue("--drawer-width")).toBe("360px");
    fireEvent.click(screen.getByRole("button", { name: "Close Filters" }));
    fireEvent.click(container.querySelector(".sf-filter-drawer__scrim") as Element);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Show 9" })).not.toBeNull();
  });

  it("mounts nothing when closed", () => {
    const { container } = render(
      <FilterDrawer open={false} onClose={() => {}}>
        <p>Hidden</p>
      </FilterDrawer>,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("ShopToolbar", () => {
  it("wires sort, filters, grid mode and chips to the owner", () => {
    const onSortChange = vi.fn();
    const onOpenFilters = vi.fn();
    const onModeChange = vi.fn();
    const onClear = vi.fn();
    render(
      <ShopToolbar
        sortValue="newest"
        sortOptions={[{ value: "newest", label: "Newest" }]}
        onSortChange={onSortChange}
        onOpenFilters={onOpenFilters}
        mode="two"
        onModeChange={onModeChange}
        resultCount={9}
        activeFilters={[{ label: "Linen", onClear }]}
      />,
    );
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "newest" } });
    expect(onSortChange).toHaveBeenCalledWith("newest");
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(onOpenFilters).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "One column" }));
    expect(onModeChange).toHaveBeenCalledWith("one");
    expect(screen.getByRole("status").textContent).toContain("9 results");
    fireEvent.click(screen.getByRole("button", { name: "Linen" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe("GridModeToggle", () => {
  it("uses the shared segmented control with two fixed values", () => {
    const onChange = vi.fn();
    render(<GridModeToggle value="one" onChange={onChange} />);
    const group = screen.getByRole("group", { name: "Grid columns" });
    expect(group.className).toContain("sf-gridmode");
    expect(screen.getByRole("button", { name: "One column" }).getAttribute("data-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Two columns" }));
    expect(onChange).toHaveBeenCalledWith("two");
  });
});
