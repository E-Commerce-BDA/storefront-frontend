// @vitest-environment jsdom
/**
 * TestimonialSection contract — sections.md §2 (sf-060).
 *
 * The point of this block is that nothing is invented: a quote with no rating
 * paints no star row, a row the CMS did not mark `verified` paints no pill, and
 * the stars a shopper sees are the number the admin typed — never a rounded-up
 * average. `layout: marquee` is the strip's mechanism again, with the same
 * hidden loop copy.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import TestimonialSection from "@/components/sections/TestimonialSection";
import type { TestimonialViewModel } from "@/lib/sections/viewModels";

afterEach(cleanup);

const reviews = (over: Partial<TestimonialViewModel> = {}): TestimonialViewModel =>
  ({
    key: "reviews",
    type: "testimonial",
    title: "What shoppers say",
    layout: "grid",
    speed: 60,
    pauseOnHover: true,
    items: [
      {
        id: "t1",
        quote: "The shirt is still perfect after two winters.",
        name: "Ada Shepherd",
        role: "Designer",
        rating: 4,
        verified: true,
        date: "2026-01-09T00:00:00.000Z",
      },
      { id: "t2", quote: "Fits as described.", name: "Kit" },
    ],
    ...over,
  }) as TestimonialViewModel;

const section = () => document.querySelector(".sf-testimonials") as HTMLElement;
const quotes = () => Array.from(document.querySelectorAll(".sf-quote"));

describe("TestimonialSection", () => {
  it("paints one figure per CMS row, with the quote and the name", () => {
    render(<TestimonialSection model={reviews()} />);
    expect(quotes()).toHaveLength(2);
    expect(screen.getByText("The shirt is still perfect after two winters.")).toBeDefined();
    expect(screen.getByText("Ada Shepherd")).toBeDefined();
    expect(screen.getByText("Kit")).toBeDefined();
  });

  it("stars exactly the rating the admin typed and says it in words", () => {
    render(<TestimonialSection model={reviews()} />);
    const rated = screen.getByRole("img", { name: "Rated 4 out of 5" });
    expect(rated.querySelectorAll(".sf-stars__star[data-on='true']")).toHaveLength(4);
    expect(rated.querySelectorAll(".sf-stars__star")).toHaveLength(5);
  });

  it("leaves the star row out entirely when there is no rating", () => {
    render(<TestimonialSection model={reviews()} />);
    const second = quotes()[1] as HTMLElement;
    expect(second.querySelector(".sf-stars")).toBeNull();
  });

  it("marks a verified quote and never marks one that is absent", () => {
    render(<TestimonialSection model={reviews()} />);
    expect((quotes()[0] as HTMLElement).querySelector(".sf-pill")?.textContent).toBe("Verified");
    expect((quotes()[1] as HTMLElement).querySelector(".sf-pill")).toBeNull();
  });

  it("renders the date as month and year in a <time>, not the raw timestamp", () => {
    render(<TestimonialSection model={reviews()} />);
    const time = (quotes()[0] as HTMLElement).querySelector("time") as HTMLTimeElement;
    expect(time.textContent).toBe("Jan 2026");
    expect(time.dateTime).toBe("2026-01-09T00:00:00.000Z");
    expect((quotes()[1] as HTMLElement).querySelector("time")).toBeNull();
  });

  it("keeps the role line only when the CMS supplied one", () => {
    render(<TestimonialSection model={reviews()} />);
    expect(screen.getByText("Designer")).toBeDefined();
    expect(document.querySelectorAll(".sf-quote__role")).toHaveLength(1);
  });

  it("paints an avatar only when there is one to show", () => {
    render(<TestimonialSection model={reviews({ items: [{ id: "t1", quote: "Q", name: "N", avatar: "/a.jpg" }] })} />);
    const img = document.querySelector(".sf-quote__avatar") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/a.jpg");
    expect(img.getAttribute("alt")).toBe("");
    cleanup();
    render(<TestimonialSection model={reviews({ items: [{ id: "t1", quote: "Q", name: "N" }] })} />);
    expect(document.querySelector(".sf-quote__avatar")).toBeNull();
  });

  it("lays the quotes out as a grid by default", () => {
    render(<TestimonialSection model={reviews()} />);
    expect(section().dataset.layout).toBe("grid");
    expect(document.querySelector(".sf-testimonials__grid")).not.toBeNull();
    expect(document.querySelector(".sf-testimonials__track")).toBeNull();
  });

  it("switches to the duplicated marquee track and computes its duration from the quote width", () => {
    render(<TestimonialSection model={reviews({ layout: "marquee", speed: 60 })} />);
    expect(section().dataset.layout).toBe("marquee");
    expect(document.querySelector(".sf-testimonials__grid")).toBeNull();
    expect(quotes()).toHaveLength(4);
    // 2 quotes × (340 + 20)px = 720px at 60px/s = 12s — the strip's 180px cell
    // is not used here, or the quotes would crawl relative to the logos.
    expect(section().style.getPropertyValue("--marquee-duration")).toBe("12s");
    const loop = quotes()[2] as HTMLElement;
    expect(loop.getAttribute("aria-hidden")).toBe("true");
  });

  it("routes pause-on-hover through the same data attr the strip uses", () => {
    render(<TestimonialSection model={reviews({ layout: "marquee", pauseOnHover: false })} />);
    expect(section().dataset.pause).toBe("false");
  });

  it("labels the region with the CMS title or the house default", () => {
    render(<TestimonialSection model={reviews({ title: undefined })} />);
    expect(section().getAttribute("aria-label")).toBe("What shoppers say");
  });
});
