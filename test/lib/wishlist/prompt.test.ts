import { describe, expect, it } from "vitest";
import { resolveWishlistGuestPrompt } from "@/lib/wishlist/prompt";

describe("resolveWishlistGuestPrompt", () => {
  it("keeps the current page as the return target", () => {
    const model = resolveWishlistGuestPrompt("/products/linen-shirt?variant=2");
    expect(model.signInHref).toBe("/signin?next=%2Fproducts%2Flinen-shirt%3Fvariant%3D2");
    expect(model.title).toBe("Sign in to save this item");
    expect(model.dismissLabel).toBe("Not now");
  });

  it("falls back to the catalogue for a hostile or empty path", () => {
    expect(resolveWishlistGuestPrompt("//evil.test").signInHref).toBe("/signin?next=%2Fproducts");
    expect(resolveWishlistGuestPrompt("").signInHref).toBe("/signin?next=%2Fproducts");
  });

  it("names the pending product when the caller has it", () => {
    const model = resolveWishlistGuestPrompt("/products/linen-shirt", { productName: "Linen Shirt" });
    expect(model.productName).toBe("Linen Shirt");
    expect(resolveWishlistGuestPrompt("/").productName).toBeUndefined();
  });
});
