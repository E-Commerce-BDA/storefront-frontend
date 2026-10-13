// @vitest-environment jsdom
/**
 * SearchMount contract — closed mounts nothing, open renders the
 * admin-selected variant (lazy), classic falls back to sheet, preload
 * warms without opening, close plays the exit then unmounts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, act } from "@testing-library/react";
import SearchMount, { preloadSearchOverlay } from "@/components/shell/SearchMount";
import { DEFAULT_NAV_SETTINGS } from "@/lib/shell/navSettings";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const SHEET_SEARCH = {
  ...DEFAULT_NAV_SETTINGS.search,
  overlayVariant: "sheet" as const,
};

describe("SearchMount", () => {
  it("mounts nothing while closed (chunk + DOM absent)", () => {
    const onClose = vi.fn();
    const { container } = render(<SearchMount search={SHEET_SEARCH} open={false} onClose={onClose} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the sheet variant on open", async () => {
    render(<SearchMount search={SHEET_SEARCH} open onClose={() => {}} />);
    expect(await screen.findByRole("dialog", { name: "Search" })).not.toBeNull();
    expect(screen.getByLabelText("Search products")).not.toBeNull();
  });

  it("renders the editorial variant on open", async () => {
    render(
      <SearchMount
        search={{ ...DEFAULT_NAV_SETTINGS.search, overlayVariant: "editorial" }}
        open
        onClose={() => {}}
      />,
    );
    expect(await screen.findByLabelText("Search the archive")).not.toBeNull();
  });

  it("renders the palette variant on open", async () => {
    render(
      <SearchMount
        search={{ ...DEFAULT_NAV_SETTINGS.search, overlayVariant: "palette" }}
        open
        onClose={() => {}}
      />,
    );
    expect(await screen.findByLabelText("Search products, materials, or categories")).not.toBeNull();
  });

  it("falls back to sheet for classic (no classic production file)", async () => {
    render(
      <SearchMount
        search={{ ...DEFAULT_NAV_SETTINGS.search, overlayVariant: "classic" }}
        open
        onClose={() => {}}
      />,
    );
    expect(await screen.findByRole("dialog", { name: "Search" })).not.toBeNull();
  });

  it("preloads without opening (no throw, chunk warms)", () => {
    expect(() => {
      preloadSearchOverlay("palette");
      preloadSearchOverlay("palette");
    }).not.toThrow();
  });

  it("plays the exit then unmounts on close", async () => {
    const onClose = vi.fn();
    const { unmount } = render(<SearchMount search={SHEET_SEARCH} open onClose={onClose} />);
    // findBy* polls on real timers — fake only after the dialog lands.
    expect(await screen.findByRole("dialog", { name: "Search" })).not.toBeNull();
    vi.useFakeTimers();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });
});
