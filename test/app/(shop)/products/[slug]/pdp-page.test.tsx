// @vitest-environment jsdom
/**
 * `/products/[slug]` — the per-product section seams.
 *
 * The route reads exactly one CMS page key, `pdp-<id>`. These tests prove
 * the three faces: CMS sections render, a CMS outage builds the fallback,
 * and an empty successful response renders no sections (never the fallback).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const PID = "00000000-0000-4000-8000-0000000000a1";

const harness = vi.hoisted(() => ({
  sections: null as { sections: unknown[]; version: number } | null,
  models: [] as any[],
  requestedPageKeys: [] as string[],
  resolveCalls: [] as any[],
  product: {
    id: "00000000-0000-4000-8000-0000000000a1",
    name: "Ocean Linen Shirt",
    slug: "ocean-linen-shirt",
    status: "active",
    description: "Catalog description.",
    price: 40,
    stock: 5,
    category: { id: "00000000-0000-4000-8000-0000000000c1", name: "Shirts", slug: "shirts" },
    attributes: { Fit: "Relaxed" },
    images: [{ url: "/media/a.jpg", alt: "Shirt" }],
    options: [],
    variants: [],
  } as any,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not-found");
  },
}));

vi.mock("@/lib/catalog/client", () => ({
  catalogClient: () => ({
    getProduct: async () => ({ ok: true, data: harness.product }),
  }),
}));

vi.mock("@/lib/cms/client", () => ({
  cmsBaseUrl: () => "http://cms.test",
  createCmsClient: () => ({
    getSections: async (pageKey: string) => {
      harness.requestedPageKeys.push(pageKey);
      return harness.sections;
    },
  }),
}));

vi.mock("@/lib/cms/theme", () => ({
  fetchThemeSettings: async () => ({ theme: null, stale: false, fallback: true }),
}));

vi.mock("@/lib/sections/resolveSections", () => ({
  resolveSections: async (sections: unknown[], deps: unknown, context: unknown) => {
    harness.resolveCalls.push({ sections, context });
    return harness.models;
  },
}));

vi.mock("@/components/shell/PageHeader", () => ({
  default: () => <div data-testid="page-header" />,
}));

vi.mock("@/lib/commerce/jsonLd", () => ({
  buildProductJsonLd: () => ({}),
}));

vi.mock("@/app/_components/CartProvider", () => ({
  useCart: () => ({ add: vi.fn(async () => true), openDrawer: vi.fn() }),
}));

vi.mock("@/app/_components/WishlistProvider", () => ({
  useWishlist: () => ({ has: () => false, toggle: vi.fn(), pendingIds: [] }),
}));

vi.mock("../../../../_components/RecentlyViewed", () => ({
  default: () => <div data-testid="recently-viewed" />,
}));

vi.mock("@/components/sections/SectionRenderer", () => ({
  default: ({ models }: { models: readonly any[] }) => (
    <div data-testid="section-renderer" data-models={models.map((m) => m.type).join(",")} />
  ),
}));

import ProductPage from "@/app/(shop)/products/[slug]/page";

afterEach(() => {
  cleanup();
  harness.sections = null;
  harness.models = [];
  harness.requestedPageKeys = [];
  harness.resolveCalls = [];
});

const renderPage = async () =>
  render(await ProductPage({ params: Promise.resolve({ slug: "ocean-linen-shirt" }) }));

describe("PDP page section seams", () => {
  it("reads exactly pdp-<id>, never the slug", async () => {
    harness.sections = { sections: [], version: 1 };
    harness.models = [];
    await renderPage();
    expect(harness.requestedPageKeys).toEqual([`pdp-${PID}`]);
  });

  it("renders resolved CMS sections and the authored rating", async () => {
    harness.sections = {
      sections: [
        {
          key: `${PID}-reviews`,
          pageKey: `pdp-${PID}`,
          type: "pdp_reviews",
          content: { items: [{ id: "r1", quote: "Great", name: "Sam", rating: 4 }] },
        },
      ],
      version: 2,
    };
    harness.models = [
      {
        key: `${PID}-reviews`,
        type: "pdp_reviews",
        anchorId: "reviews",
        layout: "grid",
        speed: 60,
        pauseOnHover: true,
        items: [{ id: "r1", quote: "Great", name: "Sam", rating: 4 }],
      },
    ];
    await renderPage();
    expect(screen.getByTestId("section-renderer")).not.toBeNull();
    expect(screen.queryByText("4.0")).not.toBeNull();
    expect(screen.queryByText("(1 review)")).not.toBeNull();
  });

  it("builds the fallback only on a CMS outage", async () => {
    harness.sections = null;
    harness.models = [
      { key: "pdp-fallback-description", type: "pdp_description", layout: "prose", text: "Catalog description." },
    ];
    await renderPage();
    expect(harness.resolveCalls).toHaveLength(1);
    const [call] = harness.resolveCalls;
    expect(call.sections.map((s: any) => s.type)).toEqual([
      "pdp_description",
      "pdp_details",
      "pdp_trust",
      "pdp_related",
    ]);
    expect(call.context.product.id).toBe(PID);
    // No authored reviews exist on the outage path, so the buy box must not
    // invent a rating link.
    expect(screen.queryByText("(1 review)")).toBeNull();
  });

  it("renders no sections for an empty successful response", async () => {
    harness.sections = { sections: [], version: 5 };
    harness.models = [];
    await renderPage();
    expect(harness.resolveCalls).toHaveLength(1);
    expect(harness.resolveCalls[0].sections).toEqual([]);
    expect(screen.queryByTestId("section-renderer")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).not.toBeNull();
  });
});
