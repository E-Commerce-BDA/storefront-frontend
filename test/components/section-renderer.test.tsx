// @vitest-environment jsdom
/**
 * SectionRenderer contract — sections.md §2 (sf-060).
 *
 * The registry is the only place that knows which block belongs to which CMS
 * type, so the test is the mapping itself: every model reaches its own block, a
 * multi-slide hero becomes the carousel island while a single slide stays the
 * plain painter, and the order of the page is the resolver's order untouched.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import SectionRenderer from "@/components/sections/SectionRenderer";
import type { HeroViewModel, SectionViewModel } from "@/lib/sections/viewModels";

// The grid island needs the cart context; this file is about dispatch, not
// about quick-add (which has its own island test).
vi.mock("@/components/commerce/ProductGridIsland", () => ({
  default: () => <div data-testid="grid-island" />,
}));

afterEach(cleanup);

// The carousel island reads the motion preference on mount; "reduce" also keeps
// it from advancing on a timer during these dispatch assertions.
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: true,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

const heroOne: HeroViewModel = {
  key: "hero-one",
  type: "hero",
  height: "auto",
  slides: [{ id: "s1", headline: "One", ctas: [] }],
};

const models: SectionViewModel[] = [
  heroOne,
  { key: "collection", type: "product_collection", cards: [], layout: "grid" },
  {
    key: "categories",
    type: "category_showcase",
    showPhotos: true,
    categories: [{ id: "c1", name: "Shirts", href: "/products?category=shirts" }],
  },
  {
    key: "brands",
    type: "brand_strip",
    motion: "static",
    speed: 60,
    direction: "left",
    pauseOnHover: true,
    brands: [{ id: "b1", name: "Northwind", href: "/products?brand=northwind" }],
  },
  {
    key: "quotes",
    type: "testimonial",
    layout: "grid",
    speed: 60,
    pauseOnHover: true,
    items: [{ id: "t1", quote: "Good.", name: "Ada" }],
  },
  {
    key: "journal",
    type: "blog_teaser",
    posts: [{ slug: "field-notes", title: "Field notes", href: "/blog/field-notes" }],
  },
];

describe("SectionRenderer", () => {
  it("renders every registered block, in the resolver's order", () => {
    const { container } = render(<SectionRenderer models={models} />);
    expect(container.querySelector(".sf-hero")).not.toBeNull();
    expect(container.querySelector(".sf-collection")).not.toBeNull();
    expect(container.querySelector(".sf-showcase")).not.toBeNull();
    expect(container.querySelector(".sf-strip")).not.toBeNull();
    expect(container.querySelector(".sf-testimonials")).not.toBeNull();
    expect(container.querySelector(".sf-blog-teaser")).not.toBeNull();
    // The renderer maps the model list straight through — no sorting, no
    // re-ordering, because the CMS `sortOrder` is the page's order.
    expect((container.firstElementChild as HTMLElement).className).toContain("sf-hero");
  });

  it("keeps a single-slide hero as the plain painter — no island, no dots", () => {
    const { container } = render(<SectionRenderer models={[models[0]]} />);
    expect(container.querySelector(".sf-slideshow")).toBeNull();
    expect(container.querySelectorAll(".sf-hero")).toHaveLength(1);
  });

  it("hands a multi-slide hero to the carousel island", () => {
    const multi: HeroViewModel = {
      ...heroOne,
      slides: [
        { id: "s1", headline: "One", ctas: [] },
        { id: "s2", headline: "Two", ctas: [] },
      ],
    };
    const { container } = render(<SectionRenderer models={[multi]} />);
    expect(container.querySelector(".sf-slideshow")).not.toBeNull();
    expect(container.querySelectorAll(".sf-hero")).toHaveLength(2);
  });

  it("mounts the collection's grid island — one client boundary for quick-add", () => {
    const { container } = render(<SectionRenderer models={[models[1]]} />);
    expect(container.querySelector('[data-testid="grid-island"]')).not.toBeNull();
  });

  it("renders nothing at all for an empty section list", () => {
    const { container } = render(<SectionRenderer models={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
