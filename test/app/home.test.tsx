// @vitest-environment jsdom
/**
 * Home chrome island — banner + nav landmarks, dismiss removes the bar,
 * arrows flip slides. Route-owned test (AGENTS.md §3.7).
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomeChrome from "@/app/_components/HomeChrome";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";

afterEach(cleanup);

const ANNOUNCEMENT = {
  items: [
    { text: "Free shipping over $75", cta: { label: "Details", href: "/shipping" }, countdownTo: "" },
    { text: "Diwali sale is live", cta: null, countdownTo: "" },
  ],
  showArrows: true,
  dismissible: true,
  collapseAnimation: true,
};

const LINKS: ResolvedNavLink[] = [
  { kind: "custom", label: "New in", href: "/new", categoryId: "", icon: "", badge: null, highlight: "none", schedule: { startsAt: "", endsAt: "" }, current: false },
  { kind: "custom", label: "Sale", href: "/sale", categoryId: "", icon: "", badge: null, highlight: "sale", schedule: { startsAt: "", endsAt: "" }, current: false },
];

describe("HomeChrome", () => {
  it("renders announcement landmark and nav landmark", () => {
    render(<HomeChrome announcement={ANNOUNCEMENT} links={LINKS} />);
    expect(screen.getByText(/Free shipping/)).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Primary" })).not.toBeNull();
    expect(screen.getByText("Sale").getAttribute("href")).toBe("/sale");
  });

  it("dismiss collapses then removes the bar, arrows flip slides", async () => {
    render(<HomeChrome announcement={ANNOUNCEMENT} links={[]} />);
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
});
