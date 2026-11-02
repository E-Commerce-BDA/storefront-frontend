// @vitest-environment jsdom
/**
 * HeroCarousel contract — sections.md §3 (sf-060).
 *
 * The island owns *one* thing: the active index. So the tests are about exactly
 * that, plus the promises the header makes — inactive slides are `hidden`
 * (which keeps them out of the a11y tree and leaves one `<h1>` on the page),
 * auto-advance stops for hover, focus, a hidden tab and `reduced-motion`, and
 * only the LCP face is eager.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import HeroCarousel, { HERO_SLIDE_MS } from "@/components/sections/HeroCarousel";
import type { HeroSlideModel } from "@/lib/sections/viewModels";

const slides: HeroSlideModel[] = [
  { id: "s1", headline: "First drop", ctas: [], media: { src: "/a.jpg", alt: "A" } },
  { id: "s2", headline: "Second drop", ctas: [], media: { src: "/b.jpg", alt: "B" } },
];

const panels = () =>
  Array.from(document.querySelectorAll(".sf-slideshow__slide")) as HTMLElement[];

const visible = () => panels().filter((p) => !p.hasAttribute("hidden"));

function stubMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => {
  stubMotion(false);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("HeroCarousel", () => {
  it("paints one hero per slide and shows only the first", () => {
    render(<HeroCarousel slides={slides} height="auto" />);
    expect(panels()).toHaveLength(2);
    expect(visible()).toHaveLength(1);
    expect(visible()[0].textContent).toContain("First drop");
  });

  it("keeps exactly one h1 for a screen reader", () => {
    render(<HeroCarousel slides={slides} height="auto" />);
    // `hidden` removes the inactive slides from the accessibility tree, so the
    // page still has one top-level heading — the promise the shell exists for.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("advances on its own and wraps at the end", () => {
    render(<HeroCarousel slides={slides} height="auto" />);
    act(() => {
      vi.advanceTimersByTime(HERO_SLIDE_MS);
    });
    expect(visible()[0].textContent).toContain("Second drop");
    act(() => {
      vi.advanceTimersByTime(HERO_SLIDE_MS);
    });
    expect(visible()[0].textContent).toContain("First drop");
  });

  it("stops for a shopper who is hovering or tabbing through the CTAs", () => {
    const { container } = render(<HeroCarousel slides={slides} height="auto" />);
    fireEvent.mouseEnter(container.querySelector(".sf-slideshow") as Element);
    act(() => {
      vi.advanceTimersByTime(HERO_SLIDE_MS * 3);
    });
    expect(visible()[0].textContent).toContain("First drop");

    fireEvent.mouseLeave(container.querySelector(".sf-slideshow") as Element);
    fireEvent.focus(container.querySelector(".sf-slideshow") as Element);
    act(() => {
      vi.advanceTimersByTime(HERO_SLIDE_MS * 3);
    });
    expect(visible()[0].textContent).toContain("First drop");
  });

  it("never moves for reduced motion, but still offers the dots", () => {
    stubMotion(true);
    render(<HeroCarousel slides={slides} height="auto" />);
    act(() => {
      vi.advanceTimersByTime(HERO_SLIDE_MS * 3);
    });
    expect(visible()[0].textContent).toContain("First drop");
    fireEvent.click(screen.getByRole("tab", { name: "Slide 2 of 2" }));
    expect(visible()[0].textContent).toContain("Second drop");
  });

  it("navigates from the dots and marks the selected one", () => {
    render(<HeroCarousel slides={slides} height="auto" />);
    const dots = screen.getAllByRole("tab");
    expect(dots).toHaveLength(2);
    expect(dots[0].getAttribute("aria-selected")).toBe("true");
    fireEvent.click(dots[1]);
    expect(dots[1].getAttribute("aria-selected")).toBe("true");
    expect(visible()[0].textContent).toContain("Second drop");
  });

  it("loads slide 1 eagerly and the rest lazily", () => {
    render(<HeroCarousel slides={slides} height="auto" />);
    const imgs = document.querySelectorAll(".sf-hero__img");
    expect((imgs[0] as HTMLImageElement).getAttribute("loading")).toBe("eager");
    expect((imgs[1] as HTMLImageElement).getAttribute("loading")).toBe("lazy");
  });

  it("inherits the section's height knob into every slide", () => {
    render(<HeroCarousel slides={slides} height="viewport" />);
    for (const hero of document.querySelectorAll(".sf-hero")) {
      expect((hero as HTMLElement).dataset.height).toBe("viewport");
    }
  });

  it("renders a single slide without a dot row and without a timer", () => {
    render(<HeroCarousel slides={[slides[0]]} height="auto" />);
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(HERO_SLIDE_MS * 2);
    });
    expect(visible()).toHaveLength(1);
  });
});
