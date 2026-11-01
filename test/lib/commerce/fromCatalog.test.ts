/**
 * fromCatalog resolver-unit — the mapping decisions, not the JSON shuffle.
 * (product.md §11 + §15; plan §12 model tier)
 *
 * These assert the four rules the header claims: the effective price wins,
 * compare-at only shows when it is a real saving, one stock cut, and money is
 * read as a number (a string would be a bug the mapper must not swallow).
 */
import { describe, expect, it } from "vitest";
import {
  fromCatalog,
  fromCatalogList,
  GRID_COLUMN_LIMITS,
  toGridColumns,
  toProductStock,
} from "@/lib/commerce/fromCatalog";
import type { ProductListItemDto } from "@/lib/catalog/schemas";

const listRow = (over: Partial<ProductListItemDto> = {}): ProductListItemDto => ({
  id: "p1",
  name: "Ocean Linen Shirt",
  slug: "ocean-linen-shirt",
  price: 40,
  stock: 12,
  categoryName: "Shirts",
  ...over,
});

describe("toProductStock", () => {
  it("uses the card's own cut: out at zero, low below 5, else in", () => {
    expect(toProductStock(0)).toBe("out");
    expect(toProductStock(-3)).toBe("out");
    expect(toProductStock(4)).toBe("low");
    expect(toProductStock(5)).toBe("in");
  });

  it("treats a missing or non-finite number as out, never in", () => {
    expect(toProductStock(null)).toBe("out");
    expect(toProductStock(undefined)).toBe("out");
    expect(toProductStock(Number.NaN)).toBe("out");
  });
});

describe("toGridColumns", () => {
  it("falls back to the theme defaults when nothing is given", () => {
    expect(toGridColumns()).toEqual({
      desktop: GRID_COLUMN_LIMITS.desktop.fallback,
      tablet: GRID_COLUMN_LIMITS.tablet.fallback,
      phone: GRID_COLUMN_LIMITS.phone.fallback,
    });
  });

  it("clamps each breakpoint to the range the contract allows", () => {
    expect(toGridColumns({ desktop: 9, tablet: 1, phone: 9 })).toEqual({
      desktop: GRID_COLUMN_LIMITS.desktop.max,
      tablet: GRID_COLUMN_LIMITS.tablet.min,
      phone: GRID_COLUMN_LIMITS.phone.max,
    });
  });

  it("ignores a non-number instead of painting a broken column count", () => {
    expect(toGridColumns({ desktop: "4" as unknown as number }).desktop).toBe(
      GRID_COLUMN_LIMITS.desktop.fallback,
    );
  });
});

describe("fromCatalog", () => {
  it("shows the effective price, not the list price", () => {
    const card = fromCatalog(listRow({ price: 40, effectivePrice: 32 }));
    expect(card.price).toBe(32);
  });

  it("keeps a compare-at only when it is above the displayed price", () => {
    expect(fromCatalog(listRow({ price: 40, compareAtPrice: 55 })).compareAt).toBe(55);
    // A sale price above the compare-at is not a sale — no strikethrough.
    expect(fromCatalog(listRow({ price: 40, effectivePrice: 45, compareAtPrice: 42 })).compareAt).toBeUndefined();
    expect(fromCatalog(listRow({ price: 40 })).compareAt).toBeUndefined();
  });

  it("compares against the effective price, not the raw one", () => {
    // compareAt 40 > effective 32 is a real saving even though list price is 40.
    const card = fromCatalog(listRow({ price: 40, effectivePrice: 32, compareAtPrice: 40 }));
    expect(card.price).toBe(32);
    expect(card.compareAt).toBe(40);
  });

  it("routes the card to the slug url without inventing a slug field", () => {
    const card = fromCatalog(listRow({ slug: "ocean-linen-shirt" }));
    expect(card.url).toBe("/products/ocean-linen-shirt");
    expect("slug" in card).toBe(false);
  });

  it("encodes a slug with reserved characters", () => {
    expect(fromCatalog(listRow({ slug: "a b" })).url).toBe("/products/a%20b");
  });

  it("passes the denormalised cover through and orders the carousel primary-first", () => {
    const card = fromCatalog(
      listRow({
        primaryImageUrl: "cover.jpg",
        images: [
          { url: "third.jpg", sortOrder: 3 },
          { url: "first.jpg", isPrimary: true, sortOrder: 9 },
          { url: "second.jpg", sortOrder: 1 },
        ],
      }),
    );
    expect(card.image).toBe("first.jpg");
    expect(card.hoverImage).toBe("second.jpg");
    expect(card.images?.map((image) => image.url)).toEqual([
      "first.jpg",
      "second.jpg",
      "third.jpg",
    ]);
  });

  it("falls back to the cover when there is no image array", () => {
    expect(fromCatalog(listRow({ primaryImageUrl: "cover.jpg" })).image).toBe("cover.jpg");
  });

  it("dedupes a repeated url so a card never paints the same frame twice", () => {
    const card = fromCatalog(
      listRow({ images: [{ url: "a.jpg" }, { url: "a.jpg" }, { url: "b.jpg" }] }),
    );
    expect(card.images?.map((image) => image.url)).toEqual(["a.jpg", "b.jpg"]);
  });

  it("renders the placeholder face for a product with no image at all", () => {
    const card = fromCatalog(listRow());
    expect(card.image).toBe("");
    expect(card.images).toBeUndefined();
  });

  it("carries the brand and category the row names", () => {
    const card = fromCatalog(listRow({ brandName: "Northwind", categoryName: "Shirts" }));
    expect(card.brand).toEqual({ name: "Northwind" });
    expect(card.category).toBe("Shirts");
  });

  it("uses an empty category rather than a fabricated folder when the row has none", () => {
    expect(fromCatalog(listRow({ categoryName: null })).category).toBe("");
  });

  it("maps centralized badges but leaves an absent border unset", () => {
    const card = fromCatalog(
      listRow({
        badges: [
          { key: "new", label: "New", bg: "#000", textColor: "#fff" },
          { key: "sale", label: "Sale", bg: "#f00", textColor: "#fff", borderColor: "#900", borderStyle: "dashed" },
        ],
      }),
    );
    expect(card.badges?.[0]).toEqual({ key: "new", label: "New", bg: "#000", textColor: "#fff" });
    expect(card.badges?.[1]).toMatchObject({ borderColor: "#900", borderStyle: "dashed" });
  });

  it("keeps cardVariants only for a projected list row, keyed by option name", () => {
    const card = fromCatalog(
      listRow({
        cardVariants: [
          { id: "v1", sku: "S-RED", price: 40, stock: 3, optionValues: { Color: "Red" } },
        ],
      }),
    );
    expect(card.cardVariants?.[0]?.optionValues).toEqual({ Color: "Red" });
  });

  it("passes sparse cardSettings through raw so the card keeps the theme in precedence", () => {
    const card = fromCatalog(listRow({ cardSettings: { mediaRatio: "1:1", showRatings: false } }));
    expect(card.cardSettings).toEqual({ mediaRatio: "1:1", showRatings: false });
    // An empty dict is not an override — it must not shadow the theme.
    expect(fromCatalog(listRow({ cardSettings: {} })).cardSettings).toBeUndefined();
  });

  it("reads money as a number and does not coerce a string", () => {
    // The services parse DECIMAL at their DB boundary; a string here is a bug.
    const card = fromCatalog(listRow({ price: 39.99 }));
    expect(typeof card.price).toBe("number");
    expect(card.price).toBe(39.99);
  });

  it("maps a whole list in order", () => {
    const cards = fromCatalogList([listRow({ id: "a" }), listRow({ id: "b" })]);
    expect(cards.map((card) => card.id)).toEqual(["a", "b"]);
  });
});
