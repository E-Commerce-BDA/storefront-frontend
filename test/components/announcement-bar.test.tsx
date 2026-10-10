// @vitest-environment jsdom
/**
 * AnnouncementBar contract — active slide render, arrow gating, dismiss
 * callback, empty renders nothing. Controlled carousel shell: state lives
 * outside, this file proves the shell honors props and nothing else.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import AnnouncementBar from "@/components/shell/AnnouncementBar";

afterEach(cleanup);

const ITEMS = [
  { text: "Free shipping over $75", cta: { label: "Details", href: "/shipping" }, countdownTo: "" },
  { text: "Diwali sale", cta: null, countdownTo: "2026-10-20T00:00:00Z" },
];

describe("AnnouncementBar", () => {
  it("renders the active slide with CTA, hides arrows for a single item", () => {
    render(<AnnouncementBar items={[ITEMS[0]]} />);
    expect(screen.getByText(/Free shipping/)).not.toBeNull();
    expect(screen.getByText("Details").getAttribute("href")).toBe("/shipping");
    expect(screen.queryByRole("button", { name: "Previous announcement" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next announcement" })).toBeNull();
  });

  it("renders arrows for 2..n items and fires slide callbacks", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(<AnnouncementBar items={ITEMS} activeIndex={1} onPrev={onPrev} onNext={onNext} countdownText="ends in 2d" />);
    expect(screen.getByText(/Diwali sale/)).not.toBeNull();
    expect(screen.getByText("ends in 2d")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Previous announcement" }));
    fireEvent.click(screen.getByRole("button", { name: "Next announcement" }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("hides arrows when showArrows is false, even with many items", () => {
    render(<AnnouncementBar items={ITEMS} showArrows={false} />);
    expect(screen.queryByRole("button", { name: "Next announcement" })).toBeNull();
  });

  it("fires dismiss exactly once, and offers no dismiss when not dismissible", () => {
    const onDismiss = vi.fn();
    const { unmount } = render(<AnnouncementBar items={ITEMS} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    unmount();
    render(<AnnouncementBar items={ITEMS} dismissible={false} />);
    expect(screen.queryByRole("button", { name: "Dismiss announcement" })).toBeNull();
  });

  it("renders nothing for empty items (absent data, absent UI)", () => {
    const { container } = render(<AnnouncementBar items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("exposes the collapsing phase for the collapse animation", () => {
    const { container } = render(<AnnouncementBar items={ITEMS} collapsing />);
    expect(container.firstElementChild?.getAttribute("data-collapsed")).toBe("true");
  });
});
