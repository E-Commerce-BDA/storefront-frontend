// @vitest-environment jsdom
/**
 * BrandStripSection contract — sections.md §2 (sf-060).
 *
 * The two product rules and the two a11y rules, all of them visible in markup:
 * a label only appears when the admin wrote one, a logoless brand paints its
 * name instead of an empty cell, the marquee's loop copy is never announced or
 * tabbed into, and a static strip does not ship a duration it cannot use.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import BrandStripSection from "@/components/sections/BrandStripSection";
import type { BrandStripViewModel } from "@/lib/sections/viewModels";

afterEach(cleanup);

const strip = (over: Partial<BrandStripViewModel> = {}): BrandStripViewModel =>
  ({
    key: "brand-strip",
    type: "brand_strip",
    title: "Brands we carry",
    motion: "static",
    speed: 60,
    direction: "left",
    pauseOnHover: true,
    brands: [
      { id: "b1", name: "Northwind", logo: "/media/seed/brand-1.png", href: "/products?brand=northwind" },
      { id: "b2", name: "Cove", href: "/products?brand=cove" },
    ],
    ...over,
  }) as BrandStripViewModel;

const section = () => document.querySelector(".sf-strip") as HTMLElement;
const cells = () => Array.from(document.querySelectorAll(".sf-strip__cell"));

describe("BrandStripSection", () => {
  it("paints the name on one line with the logo as a decorative icon beside it", () => {
    render(<BrandStripSection model={strip()} />);
    const first = cells()[0] as HTMLElement;
    // The wordmark carries the name, and the link's accessible name is that text.
    expect(first.querySelector(".sf-strip__wordmark")?.textContent).toBe("Northwind");
    expect(screen.getByRole("link", { name: "Northwind" }).getAttribute("href")).toBe(
      "/products?brand=northwind",
    );
    // The logo is an admin-customizable mark beside the name, not its replacement.
    const img = first.querySelector(".sf-strip__logo") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/media/seed/brand-1.png");
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows the name alone for a logoless brand, so a cell is never empty", () => {
    render(<BrandStripSection model={strip()} />);
    const second = cells()[1] as HTMLElement;
    expect(second.querySelector(".sf-strip__wordmark")?.textContent).toBe("Cove");
    expect(second.querySelector(".sf-strip__logo")).toBeNull();
    // Only the brand that has artwork paints an icon.
    expect(document.querySelectorAll(".sf-strip__logo")).toHaveLength(1);
  });

  it("uses the admin's label as the displayed name override, with the logo beside it", () => {
    const model = strip({
      brands: [
        { id: "b1", name: "Northwind", logo: "/a.png", label: "Northwind Outdoor", href: "/products?brand=northwind" },
        { id: "b2", name: "Cove", href: "/products?brand=cove" },
      ],
    });
    render(<BrandStripSection model={model} />);
    const first = cells()[0] as HTMLElement;
    // The label replaces the name text (never a second string beside it)…
    expect(first.querySelector(".sf-strip__wordmark")?.textContent).toBe("Northwind Outdoor");
    expect(first.querySelectorAll(".sf-strip__wordmark")).toHaveLength(1);
    // …and the logo is the icon next to it.
    expect(first.querySelector(".sf-strip__logo")).not.toBeNull();
    // A brand with no label falls back to its real name.
    expect((cells()[1] as HTMLElement).querySelector(".sf-strip__wordmark")?.textContent).toBe("Cove");
  });

  it("keeps one copy of the track and no duration when the strip is static", () => {
    render(<BrandStripSection model={strip()} />);
    expect(cells()).toHaveLength(2);
    expect(section().dataset.motion).toBe("static");
    expect(section().style.getPropertyValue("--marquee-duration")).toBe("");
  });

  it("duplicates the track for the marquee loop and hides the copy from readers", () => {
    render(<BrandStripSection model={strip({ motion: "marquee" })} />);
    expect(cells()).toHaveLength(4);
    const loop = cells().slice(2);
    for (const cell of loop) {
      expect((cell as HTMLElement).getAttribute("aria-hidden")).toBe("true");
      expect((cell as HTMLElement).getAttribute("tabindex")).toBe("-1");
    }
    // The first copy stays reachable.
    expect((cells()[0] as HTMLElement).getAttribute("aria-hidden")).toBeNull();
  });

  it("puts the px/s conversion on the element the animation runs on", () => {
    render(<BrandStripSection model={strip({ motion: "marquee", speed: 60 })} />);
    // 2 cells × (180 + 32)px at 60px/s = 7.07s
    expect(section().style.getPropertyValue("--marquee-duration")).toBe("7.07s");
  });

  it("routes motion, direction and pause through data attrs", () => {
    render(<BrandStripSection model={strip({ motion: "marquee", direction: "right", pauseOnHover: false })} />);
    expect(section().dataset.motion).toBe("marquee");
    expect(section().dataset.direction).toBe("right");
    expect(section().dataset.pause).toBe("false");
  });

  it("hands the section background to CSS as a var, and stays out of the paint otherwise", () => {
    render(<BrandStripSection model={strip()} />);
    expect(section().style.getPropertyValue("--section-bg")).toBe("");
    cleanup();
    render(<BrandStripSection model={strip({ bgColor: "#f5fafc" })} />);
    expect(section().style.getPropertyValue("--section-bg")).toBe("#f5fafc");
  });

  it("labels the landmark with the CMS title, with a house default underneath", () => {
    render(<BrandStripSection model={strip()} />);
    expect(section().getAttribute("aria-label")).toBe("Brands we carry");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Brands we carry");
    cleanup();
    render(<BrandStripSection model={strip({ title: undefined })} />);
    expect(section().getAttribute("aria-label")).toBe("Brands");
    // No title in the CMS means no invented heading — the landmark label still
    // tells a screen reader what the region is.
    expect(document.querySelector(".sf-section__title")).toBeNull();
  });
});
