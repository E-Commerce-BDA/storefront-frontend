import { describe, expect, it } from "vitest";
import {
  mapTrendingToPalette,
  trendingResponseSchema,
  type TrendingResponse,
} from "@/lib/search/trendingModel";

const body: TrendingResponse = {
  terms: ["Linen shirts", "Chelsea boots"],
  items: [
    {
      id: "p1",
      type: "product",
      title: "Linen Shirt",
      slug: "linen-shirt",
      image: "/img/p1.jpg",
      price: 40,
      effectivePrice: 36,
      popularity: 99,
      updatedAt: "2026-11-25T00:00:00Z",
    },
    { id: "b1", type: "blog", title: "Winter care", slug: "winter-care" },
    { id: "p2", type: "product", title: "Canvas Tote", slug: "canvas-tote", price: 20, image: null },
  ],
  generatedAt: "2026-11-25T00:00:00Z",
};

describe("trending model (sf-066)", () => {
  it("accepts the srch-006 response shape", () => {
    expect(trendingResponseSchema.safeParse(body).success).toBe(true);
    expect(trendingResponseSchema.safeParse({ terms: [], items: [] }).success).toBe(false);
  });

  it("maps terms verbatim and filters curated to products only", () => {
    const mapped = mapTrendingToPalette(body);
    expect(mapped.terms).toEqual(["Linen shirts", "Chelsea boots"]);
    expect(mapped.curated).toHaveLength(2);
    expect(mapped.curated[0]).toEqual({
      id: "p1",
      name: "Linen Shirt",
      price: 36,
      image: "/img/p1.jpg",
      category: "Products",
      url: "/products/linen-shirt",
    });
    expect(mapped.curated.map((item) => item.name)).toEqual(["Linen Shirt", "Canvas Tote"]);
  });

  it("falls back to list price and an empty image when absent", () => {
    const mapped = mapTrendingToPalette(body);
    expect(mapped.curated[1]).toMatchObject({ price: 20, image: "", category: "Products" });
  });
});
