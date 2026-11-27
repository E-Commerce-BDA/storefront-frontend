// @vitest-environment jsdom
/** sf-094 contract tier — tab and diff controls report intent, never own data. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AccountTabs from "@/components/commerce/AccountTabs";
import CompareView from "@/app/(shop)/compare/_components/CompareView";

afterEach(cleanup);

describe("AccountTabs", () => {
  it("marks the active tab and reports a press", () => {
    const onSelect = vi.fn();
    const { container } = render(<AccountTabs active="overview" onSelect={onSelect} />);
    expect(screen.getByRole("tablist", { name: "Account sections" })).not.toBeNull();
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(5);
    expect(screen.getByRole("tab", { name: "Overview" }).dataset.active).toBe("true");
    expect(screen.getByRole("tab", { name: "Orders" }).dataset.active).toBe("false");
    fireEvent.click(screen.getByRole("tab", { name: "Wishlist" }));
    expect(onSelect).toHaveBeenCalledWith("wishlist");
  });
});

describe("CompareView", () => {
  const items = [
    { id: "a", name: "A", price: 10, image: "", category: "Shirts", url: "/products/a" },
    { id: "b", name: "B", price: 20, image: "", category: "Pants", url: "/products/b" },
  ];

  it("starts with every row and filters to differences on a checkbox press", () => {
    const { container } = render(<CompareView items={items} />);
    expect(container.querySelector('[data-face="all"]')).not.toBeNull();
    expect(container.querySelector('[data-differences-only="false"]')).not.toBeNull();
    const allRows = container.querySelectorAll(".sf-compare__rowhead").length;

    fireEvent.click(screen.getByLabelText("Differences only"));
    expect(container.querySelector('[data-face="differences"]')).not.toBeNull();
    expect(container.querySelector('[data-differences-only="true"]')).not.toBeNull();
    expect(container.querySelectorAll(".sf-compare__rowhead").length).toBeLessThan(allRows);
  });
});
