// @vitest-environment jsdom
/**
 * sf-090 contract tier — every integrated overlay surface uses the shared
 * state faces and the shared drawer/scrim contract. Disclosure and dismissal
 * stay with the owner; the surfaces only render and call back.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SearchSheet from "@/components/shell/SearchSheet";
import SearchPalette from "@/components/shell/SearchPalette";
import SearchEditorial from "@/components/shell/SearchEditorial";
import MiniCartDrawer from "@/components/shell/MiniCartDrawer";
import MobileDrawer from "@/components/shell/MobileDrawer";
import FilterDrawer from "@/components/ui/FilterDrawer";
import Toast from "@/components/ui/Toast";
import Footer from "@/components/shell/Footer";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";

afterEach(cleanup);

const searchBase = {
  dept: "All",
  departments: ["All", "Shirts"],
  placeholder: "Search…",
  activeIndex: 0,
  onQuery: () => {},
  onClose: () => {},
};

describe("search overlays use shared state faces (sf-090)", () => {
  it("SearchSheet renders loading/error/empty faces", () => {
    const { unmount, container } = render(
      <SearchSheet query="li" results={[]} status="loading" {...searchBase} onDept={() => {}} onActive={() => {}} onSelect={() => {}} />,
    );
    expect(container.querySelector(".sf-state--loading")).not.toBeNull();
    unmount();
    const error = render(
      <SearchSheet query="li" results={[]} status="error" {...searchBase} onDept={() => {}} onActive={() => {}} onSelect={() => {}} />,
    );
    expect(error.container.querySelector(".sf-state--error")).not.toBeNull();
    expect(screen.getByRole("alert")).not.toBeNull();
    error.unmount();
    const empty = render(
      <SearchSheet query="xyz" results={[]} {...searchBase} onDept={() => {}} onActive={() => {}} onSelect={() => {}} />,
    );
    expect(empty.container.querySelector(".sf-empty")).not.toBeNull();
  });

  it("SearchPalette and SearchEditorial share the same faces", () => {
    const palette = render(
      <SearchPalette query="li" results={[]} status="loading" {...searchBase} onDept={() => {}} onActive={() => {}} onSelect={() => {}} />,
    );
    expect(palette.container.querySelector(".sf-state--loading")).not.toBeNull();
    palette.unmount();
    const editorial = render(
      <SearchEditorial query="li" results={[]} status="error" {...searchBase} onDept={() => {}} onActive={() => {}} onSelect={() => {}} />,
    );
    expect(editorial.container.querySelector(".sf-state--error")).not.toBeNull();
    editorial.unmount();
    const empty = render(
      <SearchEditorial query="" results={[]} curated={[]} {...searchBase} onDept={() => {}} onActive={() => {}} onSelect={() => {}} />,
    );
    expect(empty.container.querySelector(".sf-empty")).not.toBeNull();
  });
});

describe("drawer surfaces (sf-090)", () => {
  it("MiniCartDrawer paints shared faces and owns the drawer contract attrs", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MiniCartDrawer
        open
        onClose={onClose}
        items={[]}
        totals={{ subtotal: 0, itemCount: 0 }}
        status="loading"
        onQty={() => {}}
        onRemove={() => {}}
        onCheckout={() => {}}
      />,
    );
    expect(container.querySelector(".sf-state--loading")).not.toBeNull();
    const panel = container.querySelector(".sf-minicart__panel") as HTMLElement;
    expect(panel.className).toContain("sf-drawer");
    expect(panel.getAttribute("data-side")).toBe("right");
    expect(panel.getAttribute("data-open")).toBe("true");
    expect(panel.getAttribute("data-motion")).toBe("on");
    expect(container.querySelector(".sf-minicart__overlay")?.className).toContain("sf-scrim");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("MobileDrawer traps Tab and keeps Escape/overlay as callbacks", () => {
    const onClose = vi.fn();
    const links: ResolvedNavLink[] = [
      { kind: "custom", label: "Shop", href: "/products", categoryId: "", icon: "", badge: null, highlight: "none", schedule: { startsAt: "", endsAt: "" }, current: false },
    ];
    const { container } = render(<MobileDrawer open side="left" links={links} onClose={onClose} />);
    const panel = container.querySelector(".sf-mobiledrawer") as HTMLElement;
    expect(panel.className).toContain("sf-drawer");
    expect(panel.getAttribute("data-side")).toBe("left");
    expect(panel.getAttribute("data-open")).toBe("true");
    expect(container.querySelector('[data-trap="true"]')).not.toBeNull();
    expect(document.activeElement).toBe(panel);
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>("button, a[href]"));
    focusables[focusables.length - 1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(focusables[0]);
    fireEvent.click(container.querySelector(".sf-scrim") as HTMLElement);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("FilterDrawer joins the shared drawer/scrim contract", () => {
    const onClose = vi.fn();
    const { container } = render(
      <FilterDrawer open side="right" title="Filters" onClose={onClose}>
        <p>Body</p>
      </FilterDrawer>,
    );
    const panel = container.querySelector(".sf-filter-drawer__panel") as HTMLElement;
    expect(panel.className).toContain("sf-drawer");
    expect(panel.getAttribute("data-side")).toBe("right");
    expect(container.querySelector(".sf-filter-drawer__scrim")?.className).toContain("sf-scrim");
    fireEvent.click(container.querySelector(".sf-filter-drawer__scrim") as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("toast + footer faces (sf-090)", () => {
  it("a Toast in the wrap stays a polite status card", () => {
    const { container } = render(
      <div className="sf-toast-wrap">
        <Toast open title="Added to bag" onClose={() => {}} />
      </div>,
    );
    expect(screen.getByRole("status").className).toContain("sf-toast");
    expect(container.querySelector(".sf-toast-wrap .sf-toast")).not.toBeNull();
  });

  it("Footer renders its dark oceanic face from CMS data", () => {
    const { container } = render(
      <Footer
        footer={{
          version: 1,
          wordmark: "Next.7",
          columns: [{ title: "Shop", links: [{ label: "All", href: "/products" }] }],
          social: [],
          legal: [],
          contact: {},
          paymentIcons: [],
        } as never}
      />,
    );
    expect(container.querySelector('.sf-footer[data-face="cms"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: "All" }).getAttribute("href")).toBe("/products");
  });
});
