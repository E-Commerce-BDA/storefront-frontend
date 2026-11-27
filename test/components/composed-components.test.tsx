// @vitest-environment jsdom
/**
 * sf-088 contract tier — the four composed artifacts paint resolved values
 * and report interactions; they never own the data they display.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MegaMenu, OrderSummaryCard, PaginatedRail, Timeline } from "@/components/ui";
import type { MegaMenuGroup } from "@ecom/contracts";

afterEach(cleanup);

describe("PaginatedRail", () => {
  it("reports dots, arrows and a left drag to the owner", () => {
    const onIndexChange = vi.fn();
    const { container } = render(
      <PaginatedRail
        items={[<span key="a">A</span>, <span key="b">B</span>]}
        index={1}
        pageCount={3}
        onIndexChange={onIndexChange}
        loop
      />,
    );
    const rail = container.querySelector(".sf-rail") as HTMLElement;
    expect(rail.getAttribute("data-loop")).toBe("true");
    expect(screen.getByRole("tab", { name: "Page 2 of 3" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole("tab", { name: "Page 1 of 3" }));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    const track = container.querySelector(".sf-rail__track") as HTMLElement;
    fireEvent.pointerDown(track, { clientX: 120 });
    fireEvent.pointerUp(track, { clientX: 40 });
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    expect(container.querySelector('[data-motion="on"]')).not.toBeNull();
  });

  it("stays inert with a single page", () => {
    const { container } = render(
      <PaginatedRail items={[<span key="a">A</span>]} index={0} pageCount={1} onIndexChange={vi.fn()} />,
    );
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(container.querySelector(".sf-rail__cells") ?? container.querySelector(".sf-rail__track")).not.toBeNull();
  });
});

describe("MegaMenu", () => {
  const groups: MegaMenuGroup[] = [
    {
      title: "Women",
      columns: 2,
      items: [{ label: "Tops", href: "/products/tops", description: "Everyday layers" }],
      promo: { title: "New season", href: "/products/new" },
    },
  ];

  it("renders CMS groups as links and marks the active group", () => {
    const { container } = render(<MegaMenu groups={groups} open activeLabel="Women" />);
    expect(screen.getByRole("navigation", { name: "Browse" })).not.toBeNull();
    expect(screen.getByRole("link", { name: /New season/ }).getAttribute("href")).toBe("/products/new");
    expect((container.querySelector('[data-columns="2"]') as HTMLElement).getAttribute("data-active")).toBe("true");
    expect(screen.getByRole("link", { name: /Tops/ }).getAttribute("href")).toBe("/products/tops");
  });

  it("mounts nothing while closed", () => {
    const { container } = render(<MegaMenu groups={groups} open={false} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("OrderSummaryCard", () => {
  it("paints the free-ship progress, coupon and total", () => {
    const onRemoveCoupon = vi.fn();
    const { container } = render(
      <OrderSummaryCard
        subtotal={100}
        discount={10}
        freeShipThreshold={120}
        coupon={{ code: "SAVE10", discount: 10 }}
        onRemoveCoupon={onRemoveCoupon}
      />,
    );
    expect(container.querySelector('[data-free-ship="false"]')).not.toBeNull();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("75");
    expect((container.querySelector(".sf-summary") as HTMLElement).style.getPropertyValue("--summary-progress")).toBe("75%");
    expect(screen.getByText("$90")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove coupon" }));
    expect(onRemoveCoupon).toHaveBeenCalledTimes(1);
  });
});

describe("Timeline", () => {
  it("marks the resolved stage current and earlier ones done", () => {
    const { container } = render(<Timeline status="shipped" />);
    expect(container.querySelector('[data-stage="shipped"]')).not.toBeNull();
    const states = Array.from(container.querySelectorAll(".sf-timeline__step")).map((step) =>
      step.getAttribute("data-state"),
    );
    expect(states).toEqual(["done", "done", "done", "active", "upcoming"]);
    expect(screen.getByText("Shipped")).not.toBeNull();
    expect(screen.getByText("Current").closest("li")?.getAttribute("data-state")).toBe("active");
  });
});
