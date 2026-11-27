import { describe, expect, it } from "vitest";
import { buildListingQuery, parseListingParams } from "@/lib/catalog/listing";

describe("prototype listing URL compatibility (sf-092)", () => {
  it("reads ?cat as the canonical category filter", () => {
    expect(parseListingParams({ cat: " shirts " }).categorySlug).toBe("shirts");
  });

  it("reads ?sale as the canonical discounted filter", () => {
    expect(parseListingParams({ sale: "true" }).discounted).toBe(true);
  });

  it("prefers the canonical key when both spellings are present", () => {
    expect(parseListingParams({ category: "shoes", cat: "boots" }).categorySlug).toBe("shoes");
    expect(parseListingParams({ discounted: "false", sale: "true" }).discounted).toBeUndefined();
  });

  it("writes only canonical keys so two spellings cannot fork a cache entry", () => {
    expect(buildListingQuery({ categorySlug: "shirts", discounted: true, sort: "price_asc" })).toBe(
      "?category=shirts&sort=price_asc&discounted=true",
    );
  });
});
