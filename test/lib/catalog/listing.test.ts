/**
 * parseListingParams / buildListingQuery — resolver-unit tier (plan §12).
 *
 * The query string is untrusted, so the interesting behaviour is all in what
 * gets *rejected*: a sort off the whitelist, a limit above the catalog cap,
 * whitespace that must not become a `q=""` filter. If these pass, the page body
 * is one fetch call.
 */
import { describe, expect, it } from "vitest";
import {
  LISTING_LIMIT,
  LISTING_MAX_LIMIT,
  buildListingQuery,
  parseListingParams,
} from "@/lib/catalog/listing";

describe("parseListingParams", () => {
  it("gives an empty query string the default limit and nothing else", () => {
    const { categorySlug, query } = parseListingParams({});
    expect(categorySlug).toBeUndefined();
    expect(query).toEqual({ limit: LISTING_LIMIT });
  });

  it("keeps a whitelisted sort and rejects one catalog does not offer", () => {
    expect(parseListingParams({ sort: "price_asc" }).query.sort).toBe("price_asc");
    expect(parseListingParams({ sort: "price_high" }).query.sort).toBeUndefined();
    expect(parseListingParams({ sort: "RECENT" }).query.sort).toBeUndefined();
  });

  it("trims q and treats whitespace as absence", () => {
    expect(parseListingParams({ q: "  linen  " }).query.q).toBe("linen");
    expect(parseListingParams({ q: "   " }).query.q).toBeUndefined();
    expect(parseListingParams({ q: "" }).query.q).toBeUndefined();
  });

  it("passes the cursor through untouched", () => {
    expect(parseListingParams({ cursor: "abc123" }).query.cursor).toBe("abc123");
  });

  it("clamps the limit to the catalog cap and falls to the default on junk", () => {
    expect(parseListingParams({ limit: "10" }).query.limit).toBe(10);
    expect(parseListingParams({ limit: "5000" }).query.limit).toBe(LISTING_MAX_LIMIT);
    expect(parseListingParams({ limit: "0" }).query.limit).toBe(LISTING_LIMIT);
    expect(parseListingParams({ limit: "-3" }).query.limit).toBe(LISTING_LIMIT);
    expect(parseListingParams({ limit: "abc" }).query.limit).toBe(LISTING_LIMIT);
    expect(parseListingParams({ limit: "12.7" }).query.limit).toBe(13);
  });

  it("reports a category slug without inventing an id", () => {
    const { categorySlug, query } = parseListingParams({ category: " shoes " });
    expect(categorySlug).toBe("shoes");
    // The slug is not a `categoryId` — that resolution is the page's fetch.
    expect(query).not.toHaveProperty("categoryId");
  });

  it("reports a brand slug the same way (the marquee links on it)", () => {
    const { brandSlug, query } = parseListingParams({ brand: " northwind " });
    expect(brandSlug).toBe("northwind");
    expect(query).not.toHaveProperty("brandId");
    expect(parseListingParams({}).brandSlug).toBeUndefined();
    expect(parseListingParams({ brand: "  " }).brandSlug).toBeUndefined();
  });

  it("keeps category and brand as independent filters", () => {
    const parsed = parseListingParams({ category: "shoes", brand: "northwind" });
    expect(parsed.categorySlug).toBe("shoes");
    expect(parsed.brandSlug).toBe("northwind");
  });

  it("takes the first value when a key is repeated", () => {
    expect(parseListingParams({ sort: ["name_asc", "price_desc"] }).query.sort).toBe("name_asc");
    expect(parseListingParams({ q: ["shoes", "boots"] }).query.q).toBe("shoes");
  });

  it("never carries an undefined key the transport would have to drop", () => {
    const query = parseListingParams({}).query;
    expect(Object.keys(query)).toEqual(["limit"]);
  });
});

describe("buildListingQuery", () => {
  it("emits nothing for an unfiltered first page", () => {
    expect(buildListingQuery({})).toBe("");
    expect(buildListingQuery({ cursor: null })).toBe("");
  });

  it("keeps every filter and swaps in the cursor, in a fixed order", () => {
    expect(
      buildListingQuery({ categorySlug: "shoes", q: "linen", sort: "price_asc", cursor: "c1" }),
    ).toBe("?category=shoes&q=linen&sort=price_asc&cursor=c1");
  });

  it("carries a brand filter beside the others, in the same fixed order", () => {
    expect(buildListingQuery({ brandSlug: "northwind" })).toBe("?brand=northwind");
    expect(
      buildListingQuery({ categorySlug: "shoes", brandSlug: "northwind", cursor: "c1" }),
    ).toBe("?category=shoes&brand=northwind&cursor=c1");
  });

  it("drops the cursor for the first page but keeps the filters", () => {
    expect(buildListingQuery({ categorySlug: "shoes", cursor: null })).toBe("?category=shoes");
  });

  it("encodes a query that needs it", () => {
    expect(buildListingQuery({ q: "running shoes" })).toBe("?q=running+shoes");
  });

  it("parses tags from a comma-separated or repeated value", () => {
    expect(parseListingParams({ tags: "linen, summer" }).tags).toEqual(["linen", "summer"]);
    expect(parseListingParams({ tags: ["linen", "summer"] }).tags).toEqual(["linen", "summer"]);
    expect(parseListingParams({ tags: "   " }).tags).toBeUndefined();
    expect(parseListingParams({}).tags).toBeUndefined();
  });

  it("parses discounted only when it is the literal 'true'", () => {
    expect(parseListingParams({ discounted: "true" }).discounted).toBe(true);
    expect(parseListingParams({ discounted: "false" }).discounted).toBeUndefined();
    expect(parseListingParams({ discounted: "1" }).discounted).toBeUndefined();
  });

  it("round-trips tags and discounted through buildListingQuery", () => {
    expect(
      buildListingQuery({ tags: ["linen", "summer"], discounted: true }),
    ).toBe("?tags=linen%2Csummer&discounted=true");
  });

  it("parses non-negative price bounds and drops junk", () => {
    expect(parseListingParams({ minPrice: "10", maxPrice: "50" }).query).toMatchObject({
      minPrice: 10,
      maxPrice: 50,
    });
    expect(parseListingParams({ minPrice: "-3", maxPrice: "abc" }).query).not.toHaveProperty(
      "minPrice",
    );
    expect(parseListingParams({ minPrice: "-3", maxPrice: "abc" }).query).not.toHaveProperty(
      "maxPrice",
    );
  });

  it("keeps price bounds in the canonical query", () => {
    expect(buildListingQuery({ minPrice: 10, maxPrice: 50, sort: "price_asc" })).toBe(
      "?sort=price_asc&minPrice=10&maxPrice=50",
    );
  });
});
