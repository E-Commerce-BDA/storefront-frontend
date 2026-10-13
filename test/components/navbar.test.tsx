// @vitest-environment jsdom
/**
 * Navbar contract — regions gating, callbacks fire, --nb-* vars inline,
 * mobile/desktop branches, drawer open/close/Esc, logo faces. No cart:
 * NavCartButton stays unmounted until the cart slice (scope lock).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import Navbar, { type NavbarProps } from "@/components/shell/Navbar";
import NavLogo from "@/components/shell/NavLogo";
import NavSearchTrigger from "@/components/shell/NavSearchTrigger";
import NavAccountButton from "@/components/shell/NavAccountButton";
import NavWishlistButton from "@/components/shell/NavWishlistButton";
import MobileDrawer from "@/components/shell/MobileDrawer";

afterEach(cleanup);

const BASE: NavbarProps = {
  regions: { announcement: false, logo: true, links: true, search: true },
  logo: { imageUrl: "", height: 24, wordmark: "SHOP" },
  bar: { height: 64, sticky: "always", shadow: "border", hidden: false },
  colors: {
    bg: "#ffffff",
    text: "#0a2540",
    hover: "#0077b6",
    badgeBg: "#0077b6",
    badgeText: "#ffffff",
    announceBg: "#0a2540",
    announceText: "#ffffff",
  },
  links: [],
  announcement: {
    items: [],
    showArrows: true,
    activeIndex: 0,
    countdownText: "",
    dismissible: true,
    collapsing: false,
    onDismiss: () => {},
    onPrev: () => {},
    onNext: () => {},
  },
  isMobile: false,
  mobileOpen: false,
  mobileSide: "left",
  onMenuOpen: () => {},
  onMenuClose: () => {},
  onSearchOpen: () => {},
  onSearchPreload: () => {},
};

describe("NavLogo", () => {
  it("renders wordmark when imageless, image otherwise", () => {
    const { unmount } = render(<NavLogo wordmark="SHOP" />);
    expect(screen.getByRole("link", { name: "SHOP" }).textContent).toBe("SHOP");
    unmount();
    render(<NavLogo imageUrl="/logo.png" height={32} wordmark="SHOP" />);
    const img = screen.getByRole("link", { name: "SHOP" }).querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/logo.png");
    expect(img.style.height).toBe("32px");
    expect(img.getAttribute("alt")).toBe("");
  });
});

describe("triggers", () => {
  it("fire their callbacks with accessible labels", () => {
    const onSearch = vi.fn();
    const onAccount = vi.fn();
    const onWishlist = vi.fn();
    render(
      <>
        <NavSearchTrigger onOpen={onSearch} />
        <NavAccountButton onAccount={onAccount} />
        <NavWishlistButton onWishlist={onWishlist} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    fireEvent.click(screen.getByRole("button", { name: "Wishlist" }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onAccount).toHaveBeenCalledTimes(1);
    expect(onWishlist).toHaveBeenCalledTimes(1);
  });

  it("caps count badges, hides them at zero", () => {
    const { unmount } = render(<NavWishlistButton count={0} onWishlist={() => {}} />);
    expect(screen.getByRole("button", { name: "Wishlist" }).textContent).not.toMatch(/\d/);
    unmount();
    render(<NavWishlistButton count={25} badgeCap={9} onWishlist={() => {}} />);
    expect(screen.getByRole("button", { name: /Wishlist, 9\+ items/ })).not.toBeNull();
  });
});

describe("MobileDrawer", () => {
  it("renders nothing closed; dialog + links + close when open", () => {
    const onClose = vi.fn();
    const { unmount } = render(<MobileDrawer open={false} links={[]} onClose={onClose} />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    unmount();
    render(<MobileDrawer open side="right" links={[]} onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(dialog.getAttribute("data-side")).toBe("right");
    expect(dialog.getAttribute("data-trap")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("Navbar", () => {
  it("inlines --nb-* vars and state hooks", () => {
    const { container } = render(<Navbar {...BASE} />);
    const bar = container.querySelector(".sf-navbar") as HTMLElement;
    expect(bar.style.getPropertyValue("--nb-bg")).toBe("#ffffff");
    expect(bar.style.getPropertyValue("--nb-height")).toBe("64px");
    expect(bar.getAttribute("data-sticky")).toBe("always");
    expect(bar.getAttribute("data-shadow")).toBe("border");
    expect(bar.getAttribute("data-hidden")).toBe("false");
  });

  it("gates regions (logo/search off hides them)", () => {
    render(<Navbar {...BASE} regions={{ ...BASE.regions, logo: false, search: false }} />);
    expect(screen.queryByRole("link", { name: "SHOP" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
  });

  it("shows hamburger on mobile, links on desktop; preloads on trigger hover", () => {
    const onMenuOpen = vi.fn();
    const onPreload = vi.fn();
    const { unmount } = render(<Navbar {...BASE} isMobile onMenuOpen={onMenuOpen} onSearchPreload={onPreload} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(onMenuOpen).toHaveBeenCalledTimes(1);
    fireEvent.mouseOver(screen.getByRole("button", { name: "Search" }));
    expect(onPreload).toHaveBeenCalledTimes(1);
    unmount();
    render(<Navbar {...BASE} isMobile={false} links={[]} />);
    expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
  });

  it("renders no cart (scope lock — cart slice owns it)", () => {
    const { container } = render(<Navbar {...BASE} />);
    expect(container.querySelector(".sf-navcart")).toBeNull();
  });
});
