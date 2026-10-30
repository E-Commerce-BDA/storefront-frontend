/**
 * ProductCard model and style resolver unit tests.
 *
 * Verifies pure resolution logic: defaults, clamps, union validations,
 * fallback rules, and CSS variable generation.
 * Pure unit tests. No React, no DOM.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCT_CARD_STYLES,
  PRODUCT_CARD_LIMITS,
  type ProductCardData,
  isDarkHex,
  resolveProductCardCssVars,
  resolveProductCardStyles,
  resolveSelectedVariant,
} from "@/lib/commerce/productCard";

describe("resolveProductCardStyles", () => {
  it("returns default styles when no input is provided", () => {
    const res = resolveProductCardStyles();
    expect(res).toEqual(DEFAULT_PRODUCT_CARD_STYLES);
  });

  it("merges custom styles over defaults with boundary clamps", () => {
    const res = resolveProductCardStyles({
      borderRadius: -10,
      imageBorderRadius: 99,
      cardPad: 100,
      nameSize: 50,
      priceSize: 5,
    });

    expect(res.borderRadius).toBe(PRODUCT_CARD_LIMITS.radius.min); // 0
    expect(res.imageBorderRadius).toBe(PRODUCT_CARD_LIMITS.radius.max); // 24
    expect(res.cardPad).toBe(PRODUCT_CARD_LIMITS.pad.max); // 24
    expect(res.nameSize).toBe(PRODUCT_CARD_LIMITS.nameSize.max); // 22
    expect(res.priceSize).toBe(PRODUCT_CARD_LIMITS.priceSize.min); // 12
  });

  it("defaults imageBorderRadius to borderRadius when imageBorderRadius is not set", () => {
    const res = resolveProductCardStyles({
      borderRadius: 16,
    });
    expect(res.borderRadius).toBe(16);
    expect(res.imageBorderRadius).toBe(16);
  });

  it("allows imageBorderRadius to differ from borderRadius independently", () => {
    const res = resolveProductCardStyles({
      borderRadius: 0,
      imageBorderRadius: 14,
    });
    expect(res.borderRadius).toBe(0);
    expect(res.imageBorderRadius).toBe(14);
  });

  it("validates cardType and falls back to default on invalid values", () => {
    const valid = resolveProductCardStyles({ cardType: "horizontal" });
    expect(valid.cardType).toBe("horizontal");

    const invalid = resolveProductCardStyles({ cardType: "unsupported" as never });
    expect(invalid.cardType).toBe("standard");
  });

  it("validates mediaRatio and falls back on invalid values", () => {
    const valid = resolveProductCardStyles({ mediaRatio: "1:1" });
    expect(valid.mediaRatio).toBe("1:1");

    const invalid = resolveProductCardStyles({ mediaRatio: "2:1" as never });
    expect(invalid.mediaRatio).toBe("4:5");
  });

  it("validates imageBlendMode and falls back on invalid values", () => {
    const multiply = resolveProductCardStyles({ imageBlendMode: "multiply" });
    expect(multiply.imageBlendMode).toBe("multiply");

    const invalid = resolveProductCardStyles({ imageBlendMode: "invalid-blend" as never });
    expect(invalid.imageBlendMode).toBe("normal");
  });

  it("validates hoverMode, textAlign, and clamps ctaSet to 3 items", () => {
    const res = resolveProductCardStyles({
      hoverMode: "zoom",
      textAlign: "center",
      ctaSet: ["share", "bogus" as never, "wishlist", "add-to-cart", "quick-view"],
    });
    expect(res.hoverMode).toBe("zoom");
    expect(res.textAlign).toBe("center");
    expect(res.ctaSet).toEqual(["share", "wishlist", "add-to-cart"]);
  });

  it("generates CSS custom properties dictionary correctly", () => {
    const styles = resolveProductCardStyles({
      mediaRatio: "1:1",
      borderRadius: 12,
      imageBorderRadius: 8,
      cardPad: 6,
      imageBlendMode: "multiply",
      imageFit: "contain",
      cardBg: "#FFFFFF",
      borderColor: "#E2E8F0",
      hoverCardBg: "#F8FAFC",
      hoverBorderColor: "#CBD5E1",
      mediaBg: "#F1F5F9",
      nameSize: 16,
      priceSize: 14,
      textAlign: "center",
    });

    const vars = resolveProductCardCssVars(styles) as Record<string, string>;
    expect(vars["--pc-ratio"]).toBe("1 / 1");
    expect(vars["--pc-radius"]).toBe("12px");
    expect(vars["--pc-media-radius"]).toBe("8px");
    expect(vars["--pc-pad"]).toBe("6px");
    expect(vars["--pc-image-blend"]).toBe("multiply");
    expect(vars["--pc-image-fit"]).toBe("contain");
    expect(vars["--pc-bg"]).toBe("#FFFFFF");
    expect(vars["--pc-border"]).toBe("#E2E8F0");
    expect(vars["--pc-hover-bg"]).toBe("#F8FAFC");
    expect(vars["--pc-hover-border"]).toBe("#CBD5E1");
    expect(vars["--pc-media-bg"]).toBe("#F1F5F9");
    expect(vars["--pc-name-size"]).toBe("16px");
    expect(vars["--pc-price-size"]).toBe("14px");
    expect(vars["--pc-align"]).toBe("center");
  });

  it("validates ctaVariant and ctaStyle options with fallback to default", () => {
    const below = resolveProductCardStyles({ ctaVariant: "below", ctaStyle: "icon-label" });
    expect(below.ctaVariant).toBe("below");
    expect(below.ctaStyle).toBe("icon-label");

    const invalid = resolveProductCardStyles({
      ctaVariant: "bogus" as never,
      ctaStyle: "unknown" as never,
    });
    expect(invalid.ctaVariant).toBe("overlay");
    expect(invalid.ctaStyle).toBe("icon");
  });

  it("applies contrast safety fallbacks when dark background is selected", () => {
    // Dark background with no explicit text color -> automatically sets safe light text
    const darkCard = resolveProductCardStyles({ cardBg: "#0f172a" });
    expect(darkCard.textColor).toBe("#f8fafc");
    expect(darkCard.mutedTextColor).toBe("#94a3b8");
    expect(darkCard.priceColor).toBe("#38bdf8");

    // Dark background with explicit text color -> honors user choice
    const customDark = resolveProductCardStyles({
      cardBg: "#000000",
      textColor: "#ffd700",
    });
    expect(customDark.textColor).toBe("#ffd700");

    // Light background -> leaves empty for css cascade default
    const lightCard = resolveProductCardStyles({ cardBg: "#ffffff" });
    expect(lightCard.textColor).toBe("");
  });

  it("isDarkHex correctly identifies brightness", () => {
    expect(isDarkHex("#000000")).toBe(true);
    expect(isDarkHex("#0f172a")).toBe(true);
    expect(isDarkHex("#1e293b")).toBe(true);
    expect(isDarkHex("#ffffff")).toBe(false);
    expect(isDarkHex("#f8fafc")).toBe(false);
    expect(isDarkHex("#e2e8f0")).toBe(false);
  });

  it("emits text and price css vars when set", () => {
    const styles = resolveProductCardStyles({
      cardBg: "#111827",
      textColor: "#f8fafc",
      mutedTextColor: "#94a3b8",
      priceColor: "#38bdf8",
      comparePriceColor: "#64748b",
    });
    const vars = resolveProductCardCssVars(styles) as Record<string, string>;
    expect(vars["--pc-bg"]).toBe("#111827");
    expect(vars["--pc-text"]).toBe("#f8fafc");
    expect(vars["--pc-muted"]).toBe("#94a3b8");
    expect(vars["--pc-price"]).toBe("#38bdf8");
    expect(vars["--pc-compare-price"]).toBe("#64748b");
  });

  it("validates eyebrow, carousel and selection config options", () => {
    const custom = resolveProductCardStyles({
      eyebrow: "brand",
      imageNav: "always",
      imageIndicator: "bars",
      imageIndicatorPosition: "top",
      imageLoop: false,
      imageLimit: 8,
      selectionMode: "commit-only",
      selectionEffects: ["image", "stock"],
    });
    expect(custom.eyebrow).toBe("brand");
    expect(custom.imageNav).toBe("always");
    expect(custom.imageIndicator).toBe("bars");
    expect(custom.imageIndicatorPosition).toBe("top");
    expect(custom.imageLoop).toBe(false);
    expect(custom.imageLimit).toBe(8);
    expect(custom.selectionMode).toBe("commit-only");
    expect(custom.selectionEffects).toEqual(["image", "stock"]);

    const fallbacks = resolveProductCardStyles({
      eyebrow: "invalid" as never,
      imageNav: "bogus" as never,
      imageIndicator: "unknown" as never,
      imageLimit: 99,
      selectionMode: "nope" as never,
    });
    expect(fallbacks.eyebrow).toBe("category");
    expect(fallbacks.imageNav).toBe("hover");
    expect(fallbacks.imageIndicator).toBe("dots");
    expect(fallbacks.imageLimit).toBe(10); // clamped to max 10
    expect(fallbacks.selectionMode).toBe("preview");
  });
});

describe("resolveSelectedVariant", () => {
  const sampleProduct: ProductCardData = {
    id: "prod-1",
    name: "Classic Tee",
    price: 30,
    compareAt: 40,
    category: "Apparel",
    image: "default-front.jpg",
    stock: "in",
    images: [{ url: "default-front.jpg" }, { url: "default-back.jpg" }],
    cardVariants: [
      {
        id: "v-teal",
        sku: "TEE-TEAL-M",
        price: 35,
        compareAtPrice: 45,
        stock: 3,
        imageUrl: "teal-front.jpg",
        optionValues: { Color: "Teal", Size: "M" },
      },
      {
        id: "v-black",
        sku: "TEE-BLACK-M",
        price: 32,
        stock: 0,
        imageUrl: "black-front.jpg",
        optionValues: { Color: "Black", Size: "M" },
      },
    ],
  };

  it("returns base product when no options are selected", () => {
    const res = resolveSelectedVariant(sampleProduct);
    expect(res.activeVariant).toBeNull();
    expect(res.displayImage).toBe("default-front.jpg");
    expect(res.displayPrice).toBe(30);
    expect(res.displayCompareAt).toBe(40);
    expect(res.displayStock).toBe("in");
    expect(res.isOutOfStock).toBe(false);
  });

  it("matches variant and applies image, price and stock effects", () => {
    const res = resolveSelectedVariant(
      sampleProduct,
      { Color: "Teal", Size: "M" },
      null,
      0,
      ["image", "price", "stock"],
    );
    expect(res.activeVariant?.id).toBe("v-teal");
    expect(res.displayImage).toBe("teal-front.jpg");
    expect(res.displayPrice).toBe(35);
    expect(res.displayCompareAt).toBe(45);
    expect(res.displayStock).toBe("low"); // stock 3 < 5 -> "low"
    expect(res.isOutOfStock).toBe(false);
  });

  it("marks out of stock when matched variant stock is 0", () => {
    const res = resolveSelectedVariant(
      sampleProduct,
      { Color: "Black", Size: "M" },
      null,
      0,
      ["image", "price", "stock"],
    );
    expect(res.activeVariant?.id).toBe("v-black");
    expect(res.displayStock).toBe("out");
    expect(res.isOutOfStock).toBe(true);
  });

  it("previews override selected options", () => {
    const res = resolveSelectedVariant(
      sampleProduct,
      { Color: "Black", Size: "M" },
      { Color: "Teal" }, // hovering Teal overrides Color
      0,
      ["image", "price"],
    );
    expect(res.activeVariant?.id).toBe("v-teal");
    expect(res.displayImage).toBe("teal-front.jpg");
    expect(res.displayPrice).toBe(35);
  });

  it("selects carousel image when activeImageIndex changes without variant match", () => {
    const res = resolveSelectedVariant(sampleProduct, undefined, null, 1);
    expect(res.displayImage).toBe("default-back.jpg");
  });
});

