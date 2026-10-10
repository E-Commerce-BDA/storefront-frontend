// @vitest-environment jsdom
/**
 * SearchInspect shell contract — frame/backdrop/close render, trap + Esc,
 * motion vars + closing hook. Regions are intentionally absent (next
 * turns); this suite proves the shell, not the content.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import SearchInspect from "@/components/shell/SearchInspect";
import SpotlightButton from "@/components/shell/SpotlightButton";

afterEach(cleanup);

describe("SearchInspect", () => {
  it("renders frame, backdrop and close with no regions yet", () => {
    const { container } = render(<SearchInspect onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Search" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Close search" })).not.toBeNull();
    // Shell only: frame carries no list/preview/actions markup.
    expect(container.querySelector(".sf-inspect")?.children.length).toBe(1);
  });

  it("emits oceanic motion vars + closing hook", () => {
    const { container } = render(
      <SearchInspect
        onClose={() => {}}
        motion={{ enabled: true, durationMs: 320, easing: "cubic-bezier(0.32, 0.72, 0.32, 1)", travel: "full" }}
        closing
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--inspect-duration")).toBe("320ms");
    expect(root.getAttribute("data-closing")).toBe("true");
    expect(root.getAttribute("data-motion")).toBe("on");
  });

  it("backdrop click and Esc close; trap cycles inside", () => {
    const onClose = vi.fn();
    const { container } = render(<SearchInspect onClose={onClose} />);
    const backdrop = container.querySelector(".sf-inspect__backdrop") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
    const close = screen.getByRole("button", { name: "Close search" });
    close.focus();
    // Single focusable: Tab wraps to itself without leaving.
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("SpotlightButton", () => {
  it("renders the accent trigger and fires once", () => {
    const onOpen = vi.fn();
    render(<SpotlightButton onOpen={onOpen} />);
    const btn = screen.getByRole("button", { name: "Search" });
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
