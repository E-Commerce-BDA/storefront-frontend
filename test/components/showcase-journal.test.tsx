// @vitest-environment jsdom
/**
 * CategoryShowcaseSection + BlogTeaserSection contracts — sections.md §2 (sf-060).
 *
 * Both blocks are rows of links, so the tests are about the links and about what
 * is *not* invented: a tile's href is the listing's own filter vocabulary, a post
 * card's href is the real post route, a cover the CMS did not provide paints no
 * box, and `showPhotos: false` is a deliberate face rather than a missing image.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CategoryShowcaseSection from "@/components/sections/CategoryShowcaseSection";
import BlogTeaserSection from "@/components/sections/BlogTeaserSection";
import type {
  BlogTeaserViewModel,
  CategoryShowcaseViewModel,
} from "@/lib/sections/viewModels";

afterEach(cleanup);

const showcase = (over: Partial<CategoryShowcaseViewModel> = {}): CategoryShowcaseViewModel =>
  ({
    key: "shop-by-category",
    type: "category_showcase",
    title: "Shop by category",
    showPhotos: true,
    categories: [
      { id: "c1", name: "Shirts", href: "/products?category=shirts", image: "/media/seed/cat-1.jpg" },
      { id: "c2", name: "Bags", href: "/products?category=bags" },
    ],
    ...over,
  }) as CategoryShowcaseViewModel;

const journal = (over: Partial<BlogTeaserViewModel> = {}): BlogTeaserViewModel =>
  ({
    key: "journal",
    type: "blog_teaser",
    title: "From the journal",
    posts: [
      {
        slug: "field-notes",
        title: "Field notes",
        href: "/blog/field-notes",
        excerpt: "What survived a winter of travel.",
        cover: "/media/seed/blog-1.jpg",
        publishedAt: "2026-01-09T00:00:00.000Z",
      },
      { slug: "gear-test", title: "Gear test", href: "/blog/gear-test" },
    ],
    ...over,
  }) as BlogTeaserViewModel;

describe("CategoryShowcaseSection", () => {
  it("makes every tile a link into the listing's category filter", () => {
    render(<CategoryShowcaseSection model={showcase()} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/products?category=shirts",
      "/products?category=bags",
    ]);
    expect(document.querySelectorAll(".sf-showcase__grid > li")).toHaveLength(2);
  });

  it("paints artwork only where the CMS has a picture", () => {
    render(<CategoryShowcaseSection model={showcase()} />);
    const imgs = document.querySelectorAll(".sf-showcase__img");
    expect(imgs).toHaveLength(1);
    // A decorative tile image carries an empty alt; the name is the link text.
    expect((imgs[0] as HTMLImageElement).getAttribute("alt")).toBe("");
    expect((imgs[0] as HTMLImageElement).getAttribute("loading")).toBe("lazy");
  });

  it("turns showPhotos off into a name-only row, not a broken layout", () => {
    render(<CategoryShowcaseSection model={showcase({ showPhotos: false })} />);
    const section = document.querySelector(".sf-showcase") as HTMLElement;
    expect(section.dataset.photos).toBe("false");
    expect(document.querySelectorAll(".sf-showcase__media")).toHaveLength(0);
    expect(screen.getAllByText(/Shirts|Bags/)).toHaveLength(2);
  });

  it("passes the gutter and background to CSS as vars, only when the admin set them", () => {
    const section = () => document.querySelector(".sf-showcase") as HTMLElement;
    render(<CategoryShowcaseSection model={showcase()} />);
    expect(section().style.getPropertyValue("--grid-gap")).toBe("");
    cleanup();
    render(<CategoryShowcaseSection model={showcase({ gutterPx: 8, bgColor: "#f5fafc" })} />);
    expect(section().style.getPropertyValue("--grid-gap")).toBe("8px");
    expect(section().style.getPropertyValue("--section-bg")).toBe("#f5fafc");
  });
});

describe("BlogTeaserSection", () => {
  it("links each card to the post route with the CMS title", () => {
    render(<BlogTeaserSection model={journal()} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/blog/field-notes", "/blog/gear-test"]);
    expect(screen.getByText("Field notes")).toBeDefined();
  });

  it("renders the published date as a <time> and never the raw stamp", () => {
    render(<BlogTeaserSection model={journal()} />);
    const time = document.querySelector(".sf-blog-card__date") as HTMLTimeElement;
    expect(time.textContent).toBe("Jan 2026");
    expect(time.dateTime).toBe("2026-01-09T00:00:00.000Z");
    cleanup();
    render(<BlogTeaserSection model={journal({ posts: [{ slug: "x", title: "X", href: "/blog/x" }] })} />);
    expect(document.querySelector("time")).toBeNull();
  });

  it("paints a text card when the post has no cover, and no excerpt the CMS did not write", () => {
    render(<BlogTeaserSection model={journal()} />);
    expect(document.querySelectorAll(".sf-blog-card__media")).toHaveLength(1);
    expect(document.querySelectorAll(".sf-blog-card__excerpt")).toHaveLength(1);
  });

  it("keeps the cover decorative — the title is the card's name", () => {
    render(<BlogTeaserSection model={journal()} />);
    const card = screen.getByRole("link", { name: /Field notes/ });
    expect(card.querySelector(".sf-blog-card__img")?.getAttribute("alt")).toBe("");
  });
});
