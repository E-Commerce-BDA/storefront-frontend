/**
 * buildProductJsonLd — resolver-unit tier (plan §12, routing.md §5.4).
 *
 * The whole point of the module is that every *variant* becomes an offer and a
 * variant's availability cannot contradict the page it points at, so the tests
 * pin those two rules plus the no-variant fallback.
 */
import { describe, expect, it } from "vitest";
import { buildProductJsonLd, PDP_PRICE_CURRENCY } from "@/lib/commerce/jsonLd";
import type { ProductDetailDto } from "@/lib/catalog/schemas";

const detail = (over: Partial<ProductDetailDto> = {}): ProductDetailDto => ({
  id: "p1",
  name: "Ocean Linen Shirt",
  slug: "ocean-linen-shirt",
  status: "active",
  price: 40,
  stock: 10,
  images: [],
  options: [],
  variants: [],
  ...over,
});

const offersOf = (ld: Record<string, unknown>) =>
  ld.offers as Record<string, unknown>[];

describe("buildProductJsonLd", () => {
  it("emits a Product node with the canonical context and name", () => {
    const ld = buildProductJsonLd(detail());
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Ocean Linen Shirt");
  });

  it("gives a variantless product one offer at the effective price", () => {
    const ld = buildProductJsonLd(detail({ effectivePrice: 32, price: 40, stock: 0 }));
    const offers = offersOf(ld);
    expect(offers).toHaveLength(1);
    expect(offers[0]!.price).toBe(32);
    expect(offers[0]!.priceCurrency).toBe(PDP_PRICE_CURRENCY);
    expect(offers[0]!.availability).toBe("https://schema.org/OutOfStock");
  });

  it("carries one offer per variant, each with its own availability and image", () => {
    const ld = buildProductJsonLd(
      detail({
        variants: [
          { id: "v1", sku: "S-BLUE", price: 40, stock: 5, options: [], imageUrl: "blue.jpg" },
          { id: "v2", sku: "S-RED", price: 45, stock: 0, options: [] },
        ],
      }),
    );
    const offers = offersOf(ld);
    expect(offers).toHaveLength(2);
    expect(offers[0]).toMatchObject({
      price: 40,
      sku: "S-BLUE",
      availability: "https://schema.org/InStock",
      image: "blue.jpg",
    });
    expect(offers[1]).toMatchObject({ price: 45, sku: "S-RED", availability: "https://schema.org/OutOfStock" });
    expect(offers[1]!.image).toBeUndefined();
  });

  it("lists images and a brand only when they exist", () => {
    const bare = buildProductJsonLd(detail());
    expect(bare.image).toBeUndefined();
    expect(bare.brand).toBeUndefined();

    const full = buildProductJsonLd(
      detail({ images: [{ url: "a.jpg" }, { url: "  " }, { url: "b.jpg" }], brand: { id: "b1", name: "Acme" } }),
    );
    expect(full.image).toEqual(["a.jpg", "b.jpg"]);
    expect(full.brand).toEqual({ "@type": "Brand", name: "Acme" });
  });

  it("serialises to valid JSON (a script tag cannot hold a live cycle)", () => {
    const ld = buildProductJsonLd(detail());
    expect(() => JSON.stringify(ld)).not.toThrow();
  });
});
