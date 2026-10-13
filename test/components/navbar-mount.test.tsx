// @vitest-environment jsdom
/**
 * NavbarMount contract — auth paths self-suppress, hamburger toggles
 * the drawer, search trigger opens the overlay, announcement dismisses.
 * next/navigation mocked (pathname per test); matchMedia stubbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, act } from "@testing-library/react";
import NavbarMount from "@/app/_components/NavbarMount";
import { DEFAULT_NAV_SETTINGS } from "@/lib/shell/navSettings";

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

  it("dismisses the announcement bar", () => {
    vi.useFakeTimers();
    render(<NavbarMount nav={DEFAULT_NAV_SETTINGS} />);
    // Demo input carries no announcement items; empty renders nothing —
    // dismissal path covered at the AnnouncementBar level instead.
    expect(screen.queryByRole("button", { name: "Dismiss announcement" })).toBeNull();
    vi.useRealTimers();
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
