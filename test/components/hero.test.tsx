// @vitest-environment jsdom
/**
 * HeroSection contract — sections.md §1/§4.
 *
 * Proves the block renders what the resolver returns and routes every state
 * through a data-hook, never a class swap: heading is a real `<h1>` carrying the
 * CMS copy (there is no default hero to fall back to since sf-060), CTAs are
 * anchors (not `onClick` nav), the image carries its alt and its loading hint,
 * and the no-image / empty-CTA faces leave their markup out entirely.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import HeroSection from "@/components/sections/HeroSection";

afterEach(cleanup);

const section = () => document.querySelector(".sf-hero") as HTMLElement;

describe("HeroSection", () => {
  it("labels the landmark and paints the CMS headline", () => {
    render(<HeroSection title="Winter drop" />);
    expect(section().getAttribute("aria-label")).toBe("Hero");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Winter drop");
    expect(section().dataset.height).toBe("auto");
  });

  it("paints state through data attrs, not classes", () => {
    render(<HeroSection title="x" align="center" image={{ src: "/a.jpg", alt: "A" }} />);
    expect(section().dataset.align).toBe("center");
    expect(section().dataset.hasImage).toBe("true");
  });

  it("treats the viewport height knob as a data attr, never a class", () => {
    render(<HeroSection title="x" height="viewport" />);
    expect(section().dataset.height).toBe("viewport");
  });

  it("renders CTAs as real anchors with the resolved hrefs", () => {
    render(<HeroSection title="x" ctas={[{ text: "Shop now", href: "/products" }]} />);
    const link = screen.getByRole("link", { name: "Shop now" }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/products");
  });

  it("forwards the admin's per-CTA paint to the button vars", () => {
    render(
      <HeroSection
        title="x"
        ctas={[{ text: "Shop now", href: "/products", variant: "ghost-ink", bg: "#0077b6", borderRadius: 999 }]}
      />,
    );
    const link = screen.getByRole("link", { name: "Shop now" }) as HTMLElement;
    expect(link.style.getPropertyValue("--btn-bg")).toBe("#0077b6");
    // The Button's own pill rule: >=999 becomes the huge-value form, so the
    // hero is not free to invent a second rounding vocabulary.
    expect(link.style.getPropertyValue("--btn-radius")).toBe("9999px");
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
    // The block hands every paint knob to CSS as a var on the *section root*, so
    // one inline style covers both the slide and its media box — never an inline
    // aspect-ratio, which would put the layout decision in the markup.
    expect(section().style.getPropertyValue("--hero-ratio")).toBe("16 / 9");
    expect(section().style.getPropertyValue("--hero-bg")).toBe("");
  });

  it("sets only the paint vars the admin actually filled in", () => {
    render(<HeroSection title="x" bgColor="#f5fafc" />);
    expect(section().style.getPropertyValue("--hero-bg")).toBe("#f5fafc");
  });

  it("lazies a non-first slide so only the LCP face is eager", () => {
    render(<HeroSection title="x" image={{ src: "/b.jpg", alt: "B" }} loading="lazy" />);
    expect(screen.getByRole("img", { name: "B" }).getAttribute("loading")).toBe("lazy");
  });
});
