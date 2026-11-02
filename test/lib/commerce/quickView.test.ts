import { describe, expect, it } from "vitest";
import {
  getDefaultQuickViewOptions,
  resolveQuickViewSelection,
} from "@/lib/commerce/quickView";
import type { ProductCardData } from "@/lib/commerce/productCard";

describe("quickView pure utilities", () => {
  const sampleProduct: ProductCardData = {
    id: "prod-1",
    name: "Test Shirt",
    category: "Apparel",
    price: 45,
    compareAt: 60,
    image: "/shirt.jpg",
    options: [
      {
        name: "Color",
        displayType: "swatch",
        showOnCard: true,
        values: [
          { value: "Blue", swatchHex: "#0000ff" },
          { value: "Red", swatchHex: "#ff0000" },
        ],
      },
      {
        name: "Size",
        displayType: "pill",
        showOnCard: true,
        values: [{ value: "M" }, { value: "L" }],
      },
    ],
    cardVariants: [
      {
        id: "var-1",
        sku: "TS-BLU-M",
        price: 45,
        compareAtPrice: 60,
        stock: 10,
        imageUrl: "/shirt-blue.jpg",
        optionValues: { Color: "Blue", Size: "M" },
      },
      {
        id: "var-2",
        sku: "TS-RED-L",
        price: 50,
        compareAtPrice: 65,
        stock: 0,
        imageUrl: "/shirt-red.jpg",
        optionValues: { Color: "Red", Size: "L" },
      },
    ],
  };

  it("resolves default options preferring in-stock variant", () => {
    const defaults = getDefaultQuickViewOptions(sampleProduct);
    expect(defaults).toEqual({ Color: "Blue", Size: "M" });
  });

  it("resolves selected variant and updates prices & stock", () => {
    const resolvedInStock = resolveQuickViewSelection(sampleProduct, {
      Color: "Blue",
      Size: "M",
    });
    expect(resolvedInStock.matchedVariant?.id).toBe("var-1");
    expect(resolvedInStock.price).toBe(45);
    expect(resolvedInStock.compareAt).toBe(60);
    expect(resolvedInStock.imageUrl).toBe("/shirt-blue.jpg");
    expect(resolvedInStock.inStock).toBe(true);

    const resolvedOutOfStock = resolveQuickViewSelection(sampleProduct, {
      Color: "Red",
      Size: "L",
    });
    expect(resolvedOutOfStock.matchedVariant?.id).toBe("var-2");
    expect(resolvedOutOfStock.price).toBe(50);
    expect(resolvedOutOfStock.inStock).toBe(false);
  });

  it("falls back to product base fields when no variant matches", () => {
    const fallback = resolveQuickViewSelection(sampleProduct, {
      Color: "Green",
      Size: "XL",
    });
    expect(fallback.matchedVariant).toBeNull();
    expect(fallback.price).toBe(45);
    expect(fallback.compareAt).toBe(60);
    expect(fallback.imageUrl).toBe("/shirt.jpg");
    expect(fallback.inStock).toBe(true);
  });
});
