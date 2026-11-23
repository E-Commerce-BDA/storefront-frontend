import { describe, expect, it, vi } from "vitest";
import type { Section } from "@ecom/contracts";
import type { ProductDetailDto } from "@/lib/catalog/schemas";
import {
  buildPdpFallbackSections,
  catalogDetailRows,
  pdpPageKey,
  summarizePdpReviews,
} from "@/lib/sections/pdp";
import {
  resolveSections,
  type SectionResolveDeps,
} from "@/lib/sections/resolveSections";
import type { SectionViewModel } from "@/lib/sections/viewModels";

const PID = "00000000-0000-4000-8000-0000000000a1";
const PAGE = `pdp-${PID}`;
const CATEGORY_ID = "00000000-0000-4000-8000-0000000000c1";
const OTHER = "00000000-0000-4000-8000-0000000000b1";

const product: ProductDetailDto = {
  id: PID,
  name: "Ocean Linen Shirt",
  slug: "ocean-linen-shirt",
  status: "active",
  description: "Breathable linen, garment-washed.",
  price: 40,
  stock: 12,
  category: { id: CATEGORY_ID, name: "Shirts", slug: "shirts" },
  attributes: {
    Fit: "Relaxed",
    Care: { nested: true },
    Weight: 128,
  },
  images: [],
  options: [],
  variants: [],
};

const section = (over: Record<string, unknown>): Section =>
  ({
    key: "pdp-x",
    pageKey: PAGE,
    sortOrder: 0,
    isActive: true,
    content: {},
    ...over,
  }) as Section;

function deps(over: Partial<SectionResolveDeps> = {}): SectionResolveDeps {
  return {
    products: async () => [],
    categories: async () => [],
    brands: async () => [],
    blogs: async () => [],
    ...over,
  };
}

describe("pdpPageKey", () => {
  it("builds the id-only key and lowercases it", () => {
    expect(pdpPageKey(PID)).toBe(PAGE);
    expect(pdpPageKey("ABC-123")).toBe("pdp-abc-123");
  });

  it("rejects ids that cannot form a valid key", () => {
    expect(pdpPageKey("../admin")).toBeNull();
    expect(pdpPageKey("has space")).toBeNull();
  });
});

describe("PDP description", () => {
  it("uses the catalog description when the CMS body is absent", async () => {
    const models = await resolveSections(
      [section({ type: "pdp_description", content: {} })],
      deps(),
      { product },
    );
    expect(models).toMatchObject([{ type: "pdp_description", text: product.description }]);
  });

  it("sanitizes a custom body and prefers it over the catalog", async () => {
    const models = await resolveSections(
      [
        section({
          type: "pdp_description",
          content: { body: '<p>Hello <script>alert(1)</script><strong>world</strong></p>' },
        }),
      ],
      deps(),
      { product },
    );
    const [model] = models as Extract<SectionViewModel, { type: "pdp_description" }>[];
    expect(model.html).toContain("Hello");
    expect(model.html).toContain("<strong>world</strong>");
    expect(model.html).not.toContain("script");
    expect(model.text).toBeUndefined();
  });

  it("skips when neither CMS body nor catalog description exists", async () => {
    const bare = { ...product, description: null };
    const models = await resolveSections(
      [section({ type: "pdp_description", content: {} })],
      deps(),
      { product: bare },
    );
    expect(models).toEqual([]);
  });
});

describe("PDP details", () => {
  it("uses scalar catalog attributes by default", () => {
    expect(catalogDetailRows(product)).toEqual([
      { label: "Fit", value: "Relaxed" },
      { label: "Weight", value: "128" },
    ]);
  });

  it("prefers custom rows in admin order", async () => {
    const models = await resolveSections(
      [
        section({
          type: "pdp_details",
          content: {
            rows: [
              { label: "Zeta", value: "1" },
              { label: "Alpha", value: "2" },
            ],
          },
          settings: { columns: 1 },
        }),
      ],
      deps(),
      { product },
    );
    expect(models).toMatchObject([
      {
        type: "pdp_details",
        rows: [
          { label: "Zeta", value: "1" },
          { label: "Alpha", value: "2" },
        ],
        columns: 1,
      },
    ]);
  });
});

describe("PDP reviews", () => {
  it("maps authored items and anchors only the first section", async () => {
    const models = await resolveSections(
      [
        section({
          key: "pdp-x-reviews",
          type: "pdp_reviews",
          sortOrder: 0,
          content: {
            items: [{ id: "r1", quote: "Love it", name: "Sam", rating: 5 }],
          },
        }),
        section({
          key: "pdp-x-reviews-2",
          type: "pdp_reviews",
          sortOrder: 1,
          content: {
            items: [{ id: "r2", quote: "Solid", name: "Jo", rating: 3 }],
          },
        }),
      ],
      deps(),
      { product },
    );
    expect(
      models.filter((m) => m.type === "pdp_reviews" && m.anchorId === "reviews"),
    ).toHaveLength(1);
    expect(summarizePdpReviews(models)).toEqual({ rating: 4, count: 2 });
  });

  it("never invents a rating from unrated quotes", async () => {
    const models = await resolveSections(
      [
        section({
          type: "pdp_reviews",
          content: { items: [{ id: "r1", quote: "Nice", name: "Sam" }] },
        }),
      ],
      deps(),
      { product },
    );
    expect(models).toHaveLength(1);
    expect(summarizePdpReviews(models)).toEqual({ rating: null, count: null });
  });

  it("skips an empty reviews section", async () => {
    const models = await resolveSections(
      [section({ type: "pdp_reviews", content: { items: [] } })],
      deps(),
      { product },
    );
    expect(models).toEqual([]);
  });
});

describe("PDP related", () => {
  const row = (id: string) => ({
    id,
    name: `Product ${id.slice(-2)}`,
    slug: `product-${id.slice(-2)}`,
    status: "active" as const,
    price: 10,
    stock: 3,
  });

  it("fetches the product category and excludes the current product", async () => {
    const products = vi.fn(async () => [row(PID), row(OTHER), row("00000000-0000-4000-8000-0000000000b2")]);
    const models = await resolveSections(
      [section({ type: "pdp_related", content: { source: "category" }, settings: { maxItems: 1 } })],
      deps({ products: products as SectionResolveDeps["products"] }),
      { product },
    );
    expect(products).toHaveBeenCalledWith({ categoryId: CATEGORY_ID, limit: 2 });
    expect(models).toHaveLength(1);
    const model = models[0] as Extract<SectionViewModel, { type: "product_collection" }>;
    expect(model.cards).toHaveLength(1);
    expect(model.cards[0].id).toBe(OTHER);
    expect(model.ariaLabel).toBe("Related products");
  });

  it("pins manual order", async () => {
    const a = "00000000-0000-4000-8000-0000000000b2";
    const models = await resolveSections(
      [
        section({
          type: "pdp_related",
          content: { source: "manual", productIds: [a, OTHER] },
        }),
      ],
      deps({ products: async () => [row(OTHER), row(a)] }),
      { product },
    );
    const model = models[0] as Extract<SectionViewModel, { type: "product_collection" }>;
    expect(model.cards.map((card) => card.id)).toEqual([a, OTHER]);
  });

  it("skips when the product has no category", async () => {
    const products = vi.fn(async () => [row(OTHER)]);
    const models = await resolveSections(
      [section({ type: "pdp_related", content: { source: "category" } })],
      deps({ products: products as SectionResolveDeps["products"] }),
      { product: { ...product, category: null } },
    );
    expect(models).toEqual([]);
    expect(products).not.toHaveBeenCalled();
  });

  it("queries by brand when source is brand", async () => {
    const brandId = "00000000-0000-4000-8000-0000000000d1";
    const products = vi.fn(async () => [row(PID), row(OTHER)]);
    const models = await resolveSections(
      [section({ type: "pdp_related", content: { source: "brand" }, settings: { maxItems: 1 } })],
      deps({ products: products as SectionResolveDeps["products"] }),
      { product: { ...product, brand: { id: brandId, name: "Acme", slug: "acme" } } as never },
    );
    expect(products).toHaveBeenCalledWith({ brandId, limit: 2 });
    expect(models).toHaveLength(1);
    const model = models[0] as Extract<SectionViewModel, { type: "product_collection" }>;
    expect(model.cards.map((card) => card.id)).toEqual([OTHER]);
  });

  it("skips brand source when the product has no brand", async () => {
    const products = vi.fn(async () => [row(OTHER)]);
    const models = await resolveSections(
      [section({ type: "pdp_related", content: { source: "brand" } })],
      deps({ products: products as SectionResolveDeps["products"] }),
      { product: { ...product, brand: null } },
    );
    expect(models).toEqual([]);
    expect(products).not.toHaveBeenCalled();
  });
});

describe("PDP trust, story, and FAQ", () => {
  it("maps typed trust items and honours showIcons", async () => {
    const models = await resolveSections(
      [
        section({
          type: "pdp_trust",
          content: {
            items: [
              { id: "ship", icon: "truck", title: "Shipping", description: "Fast" },
            ],
          },
          settings: { showIcons: false, layout: "rows" },
        }),
      ],
      deps(),
      { product },
    );
    expect(models).toMatchObject([
      { type: "pdp_trust", showIcons: false, layout: "rows" },
    ]);
  });

  it("skips an empty trust section", async () => {
    const models = await resolveSections(
      [section({ type: "pdp_trust", content: { items: [] } })],
      deps(),
      { product },
    );
    expect(models).toEqual([]);
  });

  it("builds a story with sanitized body, media, and layout", async () => {
    const models = await resolveSections(
      [
        section({
          type: "pdp_story",
          content: {
            title: "Our story",
            body: "<p>Made slowly.</p>",
            image: "/media/story.jpg",
            imageAlt: "Atelier",
          },
          settings: { layout: "image-left" },
        }),
      ],
      deps(),
      { product },
    );
    expect(models).toMatchObject([
      {
        type: "pdp_story",
        layout: "image-left",
        media: { src: "/media/story.jpg", alt: "Atelier" },
      },
    ]);
  });

  it("builds FAQ in accordion and list modes", async () => {
    const accordion = await resolveSections(
      [
        section({
          type: "pdp_faq",
          content: { items: [{ question: "When?", answer: "Today." }] },
        }),
      ],
      deps(),
      { product },
    );
    expect(accordion).toMatchObject([{ type: "pdp_faq", layout: "accordion" }]);

    const list = await resolveSections(
      [
        section({
          type: "pdp_faq",
          content: { items: [{ question: "When?", answer: "Today." }] },
          settings: { layout: "list" },
        }),
      ],
      deps(),
      { product },
    );
    expect(list).toMatchObject([{ type: "pdp_faq", layout: "list" }]);
  });

  it("skips PDP sections without product context", async () => {
    const models = await resolveSections(
      [section({ type: "pdp_description", content: {} })],
      deps(),
    );
    expect(models).toEqual([]);
  });
});

describe("outage fallback", () => {
  it("builds description/details/trust/related and no reviews/story/faq", async () => {
    const models = await resolveSections(buildPdpFallbackSections(product), deps({
      products: async () => [
        {
          id: OTHER,
          name: "Other",
          slug: "other",
          status: "active",
          price: 10,
          stock: 3,
        } as never,
      ],
    }), { product });

    expect(models.map((m) => m.type)).toEqual([
      "pdp_description",
      "pdp_details",
      "pdp_trust",
      "product_collection",
    ]);
    expect(models.some((m) => m.type === "pdp_reviews")).toBe(false);
    expect(summarizePdpReviews(models)).toEqual({ rating: null, count: null });
  });
});
