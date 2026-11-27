// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PdpTabs from "@/components/commerce/PdpTabs";
import type { PdpTabView } from "@/components/commerce/PdpTabs";

afterEach(cleanup);

const tabs: PdpTabView[] = [
  { id: "description", label: "Description", content: <p>Catalog copy</p> },
  { id: "reviews", label: "Reviews", content: <p>Great</p> },
];

describe("PdpTabs contract (sf-092)", () => {
  it("paints a tab per group and keeps every panel in the DOM", () => {
    const { container } = render(<PdpTabs tabs={tabs} active="description" onChange={vi.fn()} />);
    expect(screen.getByRole("tablist", { name: "Product information" })).not.toBeNull();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(2);
    expect(container.querySelector("#sf-pdp-panel-reviews")?.hasAttribute("hidden")).toBe(true);
    expect(screen.getByText("Catalog copy")).not.toBeNull();
  });

  it("reports a tab press and marks the selected tab", () => {
    const onChange = vi.fn();
    render(<PdpTabs tabs={tabs} active="description" onChange={onChange} />);
    const reviews = screen.getByRole("tab", { name: "Reviews" });
    expect(reviews.getAttribute("aria-selected")).toBe("false");
    fireEvent.click(reviews);
    expect(onChange).toHaveBeenCalledWith("reviews");
  });

  it("mounts nothing when the CMS gave the PDP no tabbable sections", () => {
    const { container } = render(<PdpTabs tabs={[]} active="description" onChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
