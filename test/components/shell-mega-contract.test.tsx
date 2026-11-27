// @vitest-environment jsdom
/**
 * sf-089 contract tier — the shell renders CMS mega-menu groups and drives
 * every disclosure through props/state owned above it (no prototype copy,
 * no local state in the island).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { MegaMenuGroup } from "@ecom/contracts";
import Navbar from "@/components/shell/Navbar";
import NavbarMount from "@/app/_components/NavbarMount";
import { DEFAULT_NAV_SETTINGS } from "@/lib/shell/navSettings";
import type { NavbarAnnouncement } from "@/components/shell/Navbar";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";

afterEach(cleanup);

const GROUPS: MegaMenuGroup[] = [
  {
    title: "Tops",
    columns: 2,
    items: [
      { label: "Tees", href: "/products/tees", description: "Everyday layers" },
      { label: "Knitwear", href: "/products/knitwear" },
    ],
    promo: { title: "New season", href: "/products/new" },
  },
  { title: "Bottoms", items: [{ label: "Trousers", href: "/products/trousers" }] },
];

const link = (over: Partial<ResolvedNavLink>): ResolvedNavLink => ({
  kind: "custom",
  label: "Clothing",
  href: "/products",
  categoryId: "",
  icon: "",
  badge: null,
  highlight: "none",
  schedule: { startsAt: "", endsAt: "" },
  current: false,
  groups: [],
  ...over,
});

const announcement: NavbarAnnouncement = {
  items: [
    { text: "Free shipping over $75", cta: null, countdownTo: "" },
    { text: "Diwali sale is live", cta: null, countdownTo: "" },
  ],
  showArrows: true,
  activeIndex: 0,
  countdownText: "",
  dismissible: true,
  collapsing: false,
  onDismiss: vi.fn(),
  onPrev: vi.fn(),
  onNext: vi.fn(),
};

function Harness({ links, announce = announcement, cartCount = 0 }: {
  links: ResolvedNavLink[];
  announce?: NavbarAnnouncement;
  cartCount?: number;
}) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <Navbar
      regions={DEFAULT_NAV_SETTINGS.regions}
      logo={DEFAULT_NAV_SETTINGS.logo}
      bar={{ ...DEFAULT_NAV_SETTINGS.bar, hidden: false }}
      colors={DEFAULT_NAV_SETTINGS.colors}
      links={links}
      megaMenu={{ activeLabel: active, onToggle: (label) => setActive((a) => (a === label ? null : label)) }}
      announcement={announce}
      isMobile={false}
      mobileOpen={false}
      mobileSide="left"
      onMenuOpen={vi.fn()}
      onMenuClose={vi.fn()}
      onSearchOpen={vi.fn()}
      onSearchPreload={vi.fn()}
      cart={{ count: cartCount, badgeCap: 9, onOpen: vi.fn() }}
    />
  );
}

describe("Navbar + MegaMenu (sf-089)", () => {
  it("opens the CMS groups from a nav trigger, with aria-expanded and active group", () => {
    const { container } = render(
      <Harness links={[link({ label: "Clothing", groups: GROUPS }), link({ label: "Sale", href: "/sale", highlight: "sale" })]} />,
    );
    const trigger = screen.getByRole("button", { name: /Clothing/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Clothing menu" })).toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('.sf-navbar[data-mega-open="true"]')).not.toBeNull();
    const menu = screen.getByRole("navigation", { name: "Clothing menu" });
    expect(menu.className).toContain("sf-megamenu--nav");
    expect(menu.querySelector(".sf-megamenu__title")?.textContent).toBe("Tops");
    expect(screen.getByRole("link", { name: /Tees/ }).getAttribute("href")).toBe("/products/tees");
    expect(screen.getByRole("link", { name: /New season/ }).getAttribute("href")).toBe("/products/new");
    fireEvent.click(trigger);
    expect(screen.queryByRole("navigation", { name: "Clothing menu" })).toBeNull();
  });

  it("keeps the sale link a link and caps the cart badge through passed knobs", () => {
    const { container } = render(
      <Harness
        links={[link({ label: "Sale", href: "/sale", highlight: "sale", current: true })]}
        cartCount={24}
      />,
    );
    const sale = screen.getByRole("link", { name: /Sale/ });
    expect(sale.getAttribute("data-highlight")).toBe("sale");
    expect(sale.getAttribute("data-current")).toBe("true");
    expect(sale.getAttribute("aria-current")).toBe("page");
    expect(container.querySelector(".sf-navcart__badge")?.textContent).toBe("9+");
  });

  it("renders the announcement the active index selects and reports arrow clicks", () => {
    const onNext = vi.fn();
    render(
      <Harness
        links={[]}
        announce={{ ...announcement, activeIndex: 1, onNext }}
      />,
    );
    expect(screen.getByText(/Diwali sale/)).not.toBeNull();
    expect(screen.queryByText(/Free shipping/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next announcement" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

let mockPath = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPath,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/_components/WishlistProvider", () => ({
  useWishlist: () => ({ count: 0, has: () => false, pendingIds: [] }),
}));
vi.mock("@/app/_components/CartProvider", () => ({
  useCart: () => ({ count: 0, openDrawer: vi.fn() }),
}));

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

beforeEach(() => {
  mockPath = "/";
  stubMatchMedia();
});

describe("NavbarMount mega wiring (sf-089)", () => {
  it("opens CMS groups from the mount and dismisses them with Escape", () => {
    const nav = {
      ...DEFAULT_NAV_SETTINGS,
      links: { ...DEFAULT_NAV_SETTINGS.links, items: [link({ label: "Clothing", groups: GROUPS })] },
    };
    render(<NavbarMount nav={nav} />);
    fireEvent.click(screen.getByRole("button", { name: /Clothing/ }));
    expect(screen.getByRole("link", { name: /Tees/ })).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("link", { name: /Tees/ })).toBeNull();
  });

  it("marks the current link for the active pathname", () => {
    mockPath = "/products/tees";
    const nav = {
      ...DEFAULT_NAV_SETTINGS,
      links: { ...DEFAULT_NAV_SETTINGS.links, items: [link({ label: "Clothing", href: "/products" })] },
    };
    const { container } = render(<NavbarMount nav={nav} />);
    expect(container.querySelector('.sf-navlinks a[data-current="true"]')?.textContent).toContain("Clothing");
    expect(screen.getByRole("link", { name: /Clothing/ }).getAttribute("aria-current")).toBe("page");
  });
});
