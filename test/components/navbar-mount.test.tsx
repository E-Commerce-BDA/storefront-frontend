// @vitest-environment jsdom
/**
 * NavbarMount contract — auth paths self-suppress, hamburger toggles
 * the drawer, search trigger opens the overlay, announcement dismisses.
 * next/navigation mocked (pathname per test); matchMedia stubbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import NavbarMount from "@/app/_components/NavbarMount";
import { DEFAULT_NAV_SETTINGS } from "@/lib/shell/navSettings";

const ANNOUNCED_NAV = {
  ...DEFAULT_NAV_SETTINGS,
  announcement: {
    ...DEFAULT_NAV_SETTINGS.announcement,
    items: [
      { text: "Free shipping over $75", cta: { label: "Details", href: "/shipping" }, countdownTo: "" },
      { text: "Diwali sale is live", cta: null, countdownTo: "" },
    ],
  },
};

afterEach(cleanup);

let mockPath = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPath,
}));

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

beforeEach(() => {
  mockPath = "/";
  stubMatchMedia(false);
  vi.useRealTimers();
});

describe("NavbarMount", () => {
  it("renders navbar chrome on shop paths", () => {
    render(<NavbarMount nav={DEFAULT_NAV_SETTINGS} />);
    expect(screen.getByRole("button", { name: "Search" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "SHOP" })).not.toBeNull();
  });

  it("self-suppresses on auth paths (chromeless conversion routes)", () => {
    mockPath = "/signin";
    const { container } = render(<NavbarMount nav={DEFAULT_NAV_SETTINGS} />);
    expect(container.querySelector(".sf-navbar")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("hamburger opens the drawer on mobile, Esc closes it", () => {
    stubMatchMedia(true);
    render(<NavbarMount nav={DEFAULT_NAV_SETTINGS} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Menu" })).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
  });

  it("search trigger opens the overlay shell on demand", async () => {
    render(<NavbarMount nav={DEFAULT_NAV_SETTINGS} />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    // Sheet is the classic fallback: searchbox proves the lazy chunk landed.
    expect(await screen.findByRole("dialog", { name: "Search" })).not.toBeNull();
  });

  it("dismiss collapses then removes the bar, arrows flip slides (ex-HomeChrome)", async () => {
    render(<NavbarMount nav={ANNOUNCED_NAV} />);
    expect(screen.getByText(/Free shipping/)).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Primary" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next announcement" }));
    expect(screen.getByText(/Diwali sale/)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    // Collapsing phase: bar still mounted with the attr (CSS animates it).
    expect(document.querySelector('[data-collapsed="true"]')).not.toBeNull();
    await waitFor(
      () => {
        expect(screen.queryByText(/Diwali sale/)).toBeNull();
        expect(screen.queryByText(/Free shipping/)).toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it("hides the bar on scroll only in hide-on-scroll mode", () => {
    const nav = {
      ...DEFAULT_NAV_SETTINGS,
      bar: { ...DEFAULT_NAV_SETTINGS.bar, sticky: "hide-on-scroll" as const },
    };
    const { container } = render(<NavbarMount nav={nav} />);
    const bar = container.querySelector(".sf-navbar") as HTMLElement;
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, configurable: true });
      fireEvent.scroll(window);
    });
    expect(bar.getAttribute("data-hidden")).toBe("true");
  });
});
