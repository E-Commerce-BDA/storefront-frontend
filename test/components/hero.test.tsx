// @vitest-environment jsdom
/**
 * HeroSection contract — sections.md §1/§4.
 *
 * Proves the block renders what the resolver returns and routes every state
 * through a data-hook, never a class swap: heading is a real `<h1>`, CTAs are
 * anchors (not `onClick` nav), the image carries its alt and eager loading, and
 * the no-image / empty-CTA faces leave their markup out entirely.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import HeroSection from "@/components/sections/HeroSection";

afterEach(cleanup);

const section = () => document.querySelector(".sf-hero") as HTMLElement;

describe("HeroSection", () => {
  it("labels the landmark and renders the default face", () => {
    render(<HeroSection />);
    expect(section().getAttribute("aria-label")).toBe("Hero");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Everything for every day");
  });

  it("paints state through data attrs, not classes", () => {
    render(<HeroSection title="x" align="center" image={{ src: "/a.jpg", alt: "A" }} />);
    expect(section().dataset.align).toBe("center");
    expect(section().dataset.hasImage).toBe("true");
  });

  it("renders CTAs as real anchors with the resolved hrefs", () => {
    render(<HeroSection title="x" ctas={[{ text: "Shop now", href: "/products" }]} />);
    const link = screen.getByRole("link", { name: "Shop now" }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/products");
  });

  it("drops the whole CTA row when the caller passes an empty list", () => {
    render(<HeroSection title="x" ctas={[]} />);
    expect(document.querySelector(".sf-hero__ctas")).toBeNull();
  });

  it("omits the eyebrow and body when they are absent", () => {
    render(<HeroSection title="Solo" eyebrow="" body="" />);
    expect(document.querySelector(".sf-hero__eyebrow")).toBeNull();
    expect(document.querySelector(".sf-hero__body")).toBeNull();
  });

  it("renders no media box on the no-image face", () => {
    render(<HeroSection title="x" ctas={[]} />);
    expect(section().dataset.hasImage).toBe("false");
    expect(document.querySelector(".sf-hero__media")).toBeNull();
  });

  it("renders an eager image with its alt and a var-driven ratio", () => {
    render(<HeroSection title="x" image={{ src: "/hero.jpg", alt: "Summer range", ratio: "16:9" }} />);
    const img = screen.getByRole("img", { name: "Summer range" }) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/hero.jpg");
    expect(img.getAttribute("loading")).toBe("eager");
    const media = document.querySelector(".sf-hero__media") as HTMLElement;
    // The block hands the ratio to CSS as a var in the `4 / 3` form, never inline
    // aspect-ratio — the layout knob is themeable and the style contract reads it.
    expect(media.style.getPropertyValue("--hero-ratio")).toBe("16 / 9");
  });
});
