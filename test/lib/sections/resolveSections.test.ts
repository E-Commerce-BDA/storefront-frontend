/**
 * Section resolver — the home page's only data logic (plan §6, sections.md §2).
 *
 * The blocks are dumb, so everything that could be wrong lives here, and these
 * tests are the interesting ones: the CMS order, the two kinds of skip (inactive
 * and empty), the outage rule (a dead service costs *its* section only), the
 * curated order surviving a shuffled DB answer, and the sparse style keys that
 * must stay sparse so the theme tokens still win where the admin said nothing.
 */
import { describe, expect, it, vi } from "vitest";
import type { Blog, Section } from "@ecom/contracts";
import {
  DEFAULT_PRODUCT_LIMIT,
  DEFAULT_TEASER_COUNT,
  HOME_PAGE_KEY,
  resolveSections,
  type SectionResolveDeps,
} from "@/lib/sections/resolveSections";
import type { ProductListItemDto } from "@/lib/catalog/schemas";

const B1 = "00000000-0000-4000-8000-0000000000b1";
const B2 = "00000000-0000-4000-8000-0000000000b2";
const B3 = "00000000-0000-4000-8000-0000000000b3";
const C1 = "00000000-0000-4000-8000-0000000000c1";
const C2 = "00000000-0000-4000-8000-0000000000c2";
const P1 = "00000000-0000-4000-8000-0000000000a1";
const P2 = "00000000-0000-4000-8000-0000000000a2";

/* ── fixtures: schema-valid Section documents ─────────────────────────────── */

const heroSection = (over: Partial<Extract<Section, { type: "hero" }>> = {}) =>
  ({
    key: "hero-home",
    pageKey: HOME_PAGE_KEY,
    type: "hero",
    sortOrder: 0,
    isActive: true,
    content: {
      slides: [{ id: "slide-1", headline: "Winter drop", image: "/media/seed/hero-1.jpg" }],
    },
    ...over,
  }) satisfies Section;

const featuredSection = (over: Record<string, unknown> = {}) =>
  ({
    key: "new-arrivals",
    pageKey: HOME_PAGE_KEY,
    type: "featured_products",
    sortOrder: 1,
    isActive: true,
    content: { title: "New arrivals" },
    ...over,
  }) as Section;

const categorySection = (over: Record<string, unknown> = {}) =>
  ({
    key: "shop-by-category",
    pageKey: HOME_PAGE_KEY,
    type: "category_showcase",
    sortOrder: 2,
    isActive: true,
    content: { title: "Shop by category" },
    ...over,
  }) as Section;

const brandSection = (over: Record<string, unknown> = {}) =>
  ({
    key: "brand-strip",
    pageKey: HOME_PAGE_KEY,
    type: "brand_strip",
    sortOrder: 3,
    isActive: true,
    content: { title: "Brands we carry" },
    ...over,
  }) as Section;

const testimonialSection = (over: Record<string, unknown> = {}) =>
  ({
    key: "reviews",
    pageKey: HOME_PAGE_KEY,
    type: "testimonial",
    sortOrder: 4,
    isActive: true,
    content: {
      title: "What shoppers say",
      items: [{ id: "t1", quote: "Well made.", name: "Ada" }],
    },
    ...over,
  }) as Section;

const blogSection = (over: Record<string, unknown> = {}) =>
  ({
    key: "journal",
    pageKey: HOME_PAGE_KEY,
    type: "blog_teaser",
    sortOrder: 5,
    isActive: true,
    content: { title: "From the journal" },
    ...over,
  }) as Section;

const productRow = (over: Partial<ProductListItemDto> = {}): ProductListItemDto => ({
  id: P1,
  name: "Ocean Linen Shirt",
  slug: "ocean-linen-shirt",
  status: "active",
  price: 40,
  stock: 12,
  categoryName: "Shirts",
  ...over,
});

const blogRow = (over: Partial<Blog> = {}): Blog =>
  ({
    id: "b1",
    slug: "field-notes",
    title: "Field notes",
    content: [{ type: "paragraph", id: "blk-1", text: "Hello." }],
    categoryId: C1,
    status: "published",
    ...over,
  }) as Blog;

const CATEGORY_ROWS = [
  { id: C1, name: "Shirts", slug: "shirts", imageUrl: "/media/seed/cat-1.jpg" },
  { id: C2, name: "Bags", slug: "bags", imageUrl: null },
];

const BRAND_ROWS = [
  { id: B1, name: "Northwind", slug: "northwind", logoUrl: "/media/seed/brand-1.png" },
  { id: B2, name: "Cove", slug: "cove", logoUrl: null },
  { id: B3, name: "Atlas", slug: "atlas", logoUrl: "/media/seed/brand-3.png", sortOrder: 1 },
];

function deps(over: Partial<SectionResolveDeps> = {}): SectionResolveDeps {
  return {
    products: async () => [],
    categories: async () => [],
    brands: async () => [],
    blogs: async () => [],
    ...over,
  };
}

/* ── the orchestration rules ──────────────────────────────────────────────── */

describe("resolveSections", () => {
  it("keeps the CMS sortOrder, not the array order it was handed", async () => {
    const models = await resolveSections(
      [blogSection(), heroSection(), featuredSection()],
      deps({
        products: async () => [productRow()],
        blogs: async () => [blogRow()],
      }),
    );
    expect(models.map((m) => m.key)).toEqual(["hero-home", "new-arrivals", "journal"]);
  });

  it("skips an inactive section without asking its service", async () => {
    const products = vi.fn(async () => [productRow()]);
    const models = await resolveSections([featuredSection({ isActive: false })], deps({ products }));
    expect(models).toEqual([]);
    expect(products).not.toHaveBeenCalled();
  });

  it("renders a section whose isActive is simply absent", async () => {
    const section = heroSection({ isActive: undefined });
    const models = await resolveSections([section], deps());
    expect(models.map((m) => m.key)).toEqual(["hero-home"]);
  });

  it("refuses a banner rather than painting a half-understood strip", async () => {
    const banner = {
      key: "promo",
      pageKey: HOME_PAGE_KEY,
      type: "banner",
      content: { image: "/media/seed/promo.jpg" },
    } as unknown as Section;
    expect(await resolveSections([banner], deps())).toEqual([]);
  });

  it("lets one dead service cost one section, and never the page", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const models = await resolveSections(
      [heroSection(), featuredSection(), brandSection()],
      deps({
        products: async () => null, // catalog down
        brands: async () => {
          throw new Error("socket hang up");
        },
      }),
    );
    expect(models.map((m) => m.key)).toEqual(["hero-home"]);
    spy.mockRestore();
  });

  it("survives content shaped differently than this renderer knows", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = heroSection({ content: {} as never });
    const models = await resolveSections(
      [broken, featuredSection()],
      deps({ products: async () => [productRow()] }),
    );
    // The unknown section is logged and lost; the page keeps everything else.
    expect(models.map((m) => m.key)).toEqual(["new-arrivals"]);
    expect(spy).toHaveBeenCalledWith('[sections] skipped "hero-home"', expect.anything());
    spy.mockRestore();
  });
});

/* ── hero ─────────────────────────────────────────────────────────────────── */

describe("hero sections", () => {
  it("skips a hero with no slides and a slide with no headline", async () => {
    expect(
      await resolveSections([heroSection({ content: { slides: [] } })], deps()),
    ).toEqual([]);

    const models = await resolveSections(
      [heroSection({ content: { slides: [{ id: "s", headline: "   ", image: "/a.jpg" }] } })],
      deps(),
    );
    expect(models).toEqual([]);
  });

  it("carries the viewport height knob and the section background down", async () => {
    const models = await resolveSections(
      [heroSection({ settings: { height: "viewport", bgColor: "#0a2540" } })],
      deps(),
    );
    expect(models[0]).toMatchObject({
      type: "hero",
      height: "viewport",
      bgColor: "#0a2540",
    });
  });

  it("inherits the section ratio, and turns `custom` into the number CSS wants", async () => {
    const enumered = await resolveSections([heroSection({ settings: { ratio: "16:9" } })], deps());
    expect(enumered[0]).toMatchObject({ slides: [{ ratio: "16:9" }] });

    const custom = await resolveSections(
      [heroSection({ settings: { ratio: "custom", customRatio: 1.5 } })],
      deps(),
    );
    expect(custom[0]).toMatchObject({ slides: [{ ratio: "1.5" }] });
  });

  it("lets a slide outrank the section ratio it sits in", async () => {
    const models = await resolveSections(
      [
        heroSection({
          settings: { ratio: "4:3" },
          content: { slides: [{ id: "s", headline: "Big", image: "/a.jpg", ratio: "1:1" }] },
        }),
      ],
      deps(),
    );
    expect(models[0]).toMatchObject({ slides: [{ ratio: "1:1" }] });
  });

  it("turns the CMS `link` into the href the anchor takes, and caps three CTAs", async () => {
    const ctas = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, text: `C${i}`, link: `/c/${i}` }));
    const models = await resolveSections(
      [heroSection({ content: { slides: [{ id: "s", headline: "H", image: "/a.jpg", ctas }] } })],
      deps(),
    );
    const slide = (models[0] as { slides: { ctas: { href: string; variant: string }[] }[] }).slides[0];
    expect(slide.ctas).toHaveLength(3);
    expect(slide.ctas.map((c) => c.href)).toEqual(["/c/0", "/c/1", "/c/2"]);
    expect(slide.ctas.map((c) => c.variant)).toEqual(["primary", "light", "ghost-ink"]);
  });
});

/* ── featured products ────────────────────────────────────────────────────── */

describe("featured products", () => {
  it("asks the catalog for newest rows when the source is newest", async () => {
    const products = vi.fn(async () => [productRow()]);
    await resolveSections(
      [featuredSection({ content: { title: "New", source: "newest" } })],
      deps({ products }),
    );
    expect(products).toHaveBeenCalledWith({ limit: DEFAULT_PRODUCT_LIMIT, sort: "created_desc" });
  });

  it("passes manual ids through the `ids` filter instead of paging and slicing", async () => {
    const products = vi.fn(async () => [productRow()]);
    await resolveSections(
      [featuredSection({ content: { title: "Popular", source: "manual", productIds: [P1] } })],
      deps({ products }),
    );
    expect(products).toHaveBeenCalledWith({ ids: [P1] });
  });

  it("treats a manual section with no ids as newest — an empty pick is not a grid", async () => {
    const products = vi.fn(async () => [productRow()]);
    await resolveSections(
      [featuredSection({ content: { source: "manual", productIds: [] } })],
      deps({ products }),
    );
    expect(products).toHaveBeenCalledWith({ limit: DEFAULT_PRODUCT_LIMIT, sort: "created_desc" });
  });

  it("keeps the curated order even when the database answers shuffled", async () => {
    const models = await resolveSections(
      [featuredSection({ content: { source: "manual", productIds: [P2, P1] } })],
      deps({ products: async () => [productRow({ id: P1 }), productRow({ id: P2, slug: "second" })] }),
    );
    const cards = (models[0] as { cards: { id: string }[] }).cards;
    expect(cards.map((c) => c.id)).toEqual([P2, P1]);
  });

  it("skips the section when the curated ids no longer exist", async () => {
    const models = await resolveSections(
      [featuredSection({ content: { source: "manual", productIds: [P1] } })],
      deps({ products: async () => [] }),
    );
    expect(models).toEqual([]);
  });

  it("caps the grid at maxItems on both the query and the cards", async () => {
    const products = vi.fn(async () => Array.from({ length: 12 }, (_, i) => productRow({ id: `${i}` })));
    const models = await resolveSections(
      [featuredSection({ content: { source: "newest" }, settings: { maxItems: 4 } })],
      deps({ products }),
    );
    expect(products).toHaveBeenCalledWith({ limit: 4, sort: "created_desc" });
    expect((models[0] as { cards: unknown[] }).cards).toHaveLength(4);
  });

  it("hands the card its ratio and blend mode, but never a custom one", async () => {
    const models = await resolveSections(
      [featuredSection({ settings: { ratio: "3:4", blendMode: "multiply", gutter: 12 } })],
      deps({ products: async () => [productRow()] }),
    );
    expect(models[0]).toMatchObject({
      type: "product_collection",
      layout: "grid",
      gutterPx: 12,
      cardOverrides: { mediaRatio: "3:4", imageBlendMode: "multiply" },
    });

    const custom = await resolveSections(
      [featuredSection({ settings: { ratio: "custom", customRatio: 1.75 } })],
      deps({ products: async () => [productRow()] }),
    );
    // A custom thumbnail ratio is not something a product card can honour, so
    // the key is absent — not `undefined`, which would still shadow the theme.
    expect(Object.prototype.hasOwnProperty.call(custom[0], "cardOverrides")).toBe(false);
  });

  it("leaves the card overrides absent when the admin set nothing", async () => {
    const models = await resolveSections([featuredSection()], deps({ products: async () => [productRow()] }));
    expect(Object.prototype.hasOwnProperty.call(models[0], "cardOverrides")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(models[0], "bgColor")).toBe(false);
  });

  it("paints a carousel row when the CMS asked for one", async () => {
    const models = await resolveSections(
      [featuredSection({ content: { source: "newest", layout: "carousel" } })],
      deps({ products: async () => [productRow()] }),
    );
    expect(models[0]).toMatchObject({ layout: "carousel" });
  });
});

/* ── categories, brands, blogs, quotes ────────────────────────────────────── */

describe("category showcase", () => {
  it("links each tile to the listing's own category filter", async () => {
    const models = await resolveSections([categorySection()], deps({ categories: async () => CATEGORY_ROWS }));
    const tiles = (models[0] as { categories: { href: string; name: string }[] }).categories;
    expect(tiles.map((t) => t.href)).toEqual(["/products?category=shirts", "/products?category=bags"]);
  });

  it("keeps the admin's order and drops a category that is gone", async () => {
    const models = await resolveSections(
      [categorySection({ content: { categoryIds: [C2, C1, "00000000-0000-4000-8000-0000000000zz"] } })],
      deps({ categories: async () => CATEGORY_ROWS }),
    );
    const tiles = (models[0] as { categories: { name: string }[] }).categories;
    expect(tiles.map((t) => t.name)).toEqual(["Bags", "Shirts"]);
  });

  it("falls back to active rows and respects showPhotos: false", async () => {
    const models = await resolveSections(
      [categorySection({ settings: { showPhotos: false, maxItems: 1 } })],
      deps({
        categories: async () => [{ id: C1, name: "Inactive", slug: "off", isActive: false }, ...CATEGORY_ROWS],
      }),
    );
    expect(models[0]).toMatchObject({ showPhotos: false, categories: [{ name: "Shirts" }] });
  });

  it("skips the section when no tile survives", async () => {
    expect(await resolveSections([categorySection()], deps({ categories: async () => [] }))).toEqual([]);
  });
});

describe("brand strip", () => {
  it("uses `items` as the ordered selection and keeps the label beside the logo", async () => {
    const models = await resolveSections(
      [
        brandSection({
          content: {
            items: [
              { brandId: B2, label: "Cove Studio" },
              { brandId: B1, label: "  " },
              { brandId: B3 },
            ],
          },
        }),
      ],
      deps({ brands: async () => BRAND_ROWS }),
    );
    const strip = models[0] as { brands: { id: string; name: string; label?: string; logo?: string }[] };
    expect(strip.brands.map((b) => b.id)).toEqual([B2, B1, B3]);
    expect(strip.brands[0]).toMatchObject({ label: "Cove Studio", name: "Cove" });
    // B2 has no logo, so the cell falls back to the wordmark; B1 keeps its art.
    expect(strip.brands[0].logo).toBeUndefined();
    expect(strip.brands[1].logo).toBe("/media/seed/brand-1.png");
    expect(Object.prototype.hasOwnProperty.call(strip.brands[1], "label")).toBe(false);
  });

  it("still honours the legacy `brandIds` shape", async () => {
    const models = await resolveSections(
      [brandSection({ content: { brandIds: [B3, B1] } })],
      deps({ brands: async () => BRAND_ROWS }),
    );
    const strip = models[0] as { brands: { id: string }[] };
    expect(strip.brands.map((b) => b.id)).toEqual([B3, B1]);
  });

  it("falls back to active brands that have artwork, in catalog order", async () => {
    const models = await resolveSections(
      [brandSection()],
      deps({
        brands: async () => [
          { id: B1, name: "Northwind", slug: "northwind", logoUrl: "/a.png", isActive: true, sortOrder: 2 },
          { id: B3, name: "Atlas", slug: "atlas", logoUrl: "/c.png", isActive: true, sortOrder: 1 },
          { id: B2, name: "Cove", slug: "cove", logoUrl: null, isActive: true },
          { id: "x", name: "Gone", slug: "gone", logoUrl: "/x.png", isActive: false },
        ],
      }),
    );
    const strip = models[0] as { brands: { name: string; href: string }[] };
    expect(strip.brands.map((b) => b.name)).toEqual(["Atlas", "Northwind"]);
    expect(strip.brands[0].href).toBe("/products?brand=atlas");
  });

  it("carries the motion knobs with the documented defaults", async () => {
    const models = await resolveSections(
      [brandSection({ settings: { motion: "marquee", speed: 90, direction: "right", pauseOnHover: false } })],
      deps({ brands: async () => BRAND_ROWS }),
    );
    expect(models[0]).toMatchObject({ motion: "marquee", speed: 90, direction: "right", pauseOnHover: false });

    const quiet = await resolveSections([brandSection()], deps({ brands: async () => BRAND_ROWS }));
    expect(quiet[0]).toMatchObject({ motion: "static", speed: 60, direction: "left", pauseOnHover: true });
  });
});

describe("testimonials", () => {
  it("paints only the rows the CMS wrote", async () => {
    const models = await resolveSections(
      [
        testimonialSection({
          settings: { layout: "marquee", speed: 45 },
          content: {
            items: [
              { id: "t1", quote: "Well made.", name: "Ada", role: "Designer", rating: 5, verified: true, date: "2026-01-09T00:00:00.000Z" },
              { id: "t2", quote: "Fits perfectly.", name: "Kit" },
            ],
          },
        }),
      ],
      deps(),
    );
    expect(models[0]).toMatchObject({
      type: "testimonial",
      layout: "marquee",
      speed: 45,
      pauseOnHover: true,
      items: [
        { id: "t1", rating: 5, verified: true, role: "Designer" },
        { id: "t2" },
      ],
    });
    const model = models[0];
    if (model === undefined || model.type !== "testimonial") {
      throw new Error("expected a testimonial view model");
    }
    expect(Object.prototype.hasOwnProperty.call(model.items[1], "rating")).toBe(false);
  });

  it("skips a quote block with no quotes in it", async () => {
    expect(await resolveSections([testimonialSection({ content: { items: [] } })], deps())).toEqual([]);
  });
});

describe("blog teaser", () => {
  it("links each card to the post route and keeps the published order", async () => {
    const models = await resolveSections(
      [blogSection()],
      deps({
        blogs: async () => [blogRow(), blogRow({ id: "b2", slug: "gear-test", title: "Gear test" })],
      }),
    );
    const posts = (models[0] as { posts: { href: string; title: string }[] }).posts;
    expect(posts.map((p) => p.href)).toEqual(["/blog/field-notes", "/blog/gear-test"]);
    expect(posts).toHaveLength(2);
  });

  it("defaults to three cards when neither count nor maxItems is set", async () => {
    const rows = Array.from({ length: 5 }, (_, i) => blogRow({ id: `b${i}`, slug: `post-${i}` }));
    const models = await resolveSections([blogSection()], deps({ blogs: async () => rows }));
    expect((models[0] as { posts: unknown[] }).posts).toHaveLength(DEFAULT_TEASER_COUNT);
  });

  it("caps at content.count before settings.maxItems", async () => {
    const rows = Array.from({ length: 6 }, (_, i) => blogRow({ id: `b${i}`, slug: `post-${i}` }));
    const models = await resolveSections(
      [blogSection({ content: { count: 2 }, settings: { maxItems: 5 } })],
      deps({ blogs: async () => rows }),
    );
    expect((models[0] as { posts: unknown[] }).posts).toHaveLength(2);
  });

  it("orders a curated post list and drops one that was unpublished", async () => {
    const models = await resolveSections(
      [blogSection({ content: { postIds: ["b2", "b1"] } })],
      deps({ blogs: async () => [blogRow({ id: "b1" }), blogRow({ id: "b2", slug: "second" })] }),
    );
    const posts = (models[0] as { posts: { slug: string }[] }).posts;
    expect(posts.map((p) => p.slug)).toEqual(["second", "field-notes"]);
  });

  it("skips the section when nothing is published", async () => {
    expect(await resolveSections([blogSection()], deps({ blogs: async () => [] }))).toEqual([]);
  });
});
