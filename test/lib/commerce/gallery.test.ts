/**
 * Gallery ordering — the part nobody notices until it is wrong.
 *
 * A PDP's first frame is the product, and a duplicated upload must not become a
 * thumb that reacts to a tap by changing nothing.
 */
import { describe, expect, it } from "vitest";
import type { ProductImageDto } from "@/lib/catalog/schemas";
import { clampIndex, stepIndex, toGalleryImages, GALLERY_MAX_IMAGES } from "@/lib/commerce/gallery";

function image(overrides: Partial<ProductImageDto> = {}): ProductImageDto {
  return { url: "a.jpg", alt: "A", ...overrides } as ProductImageDto;
}

const urls = (images: ReturnType<typeof toGalleryImages>) => images.map((image) => image.url);

describe("toGalleryImages", () => {
  it("puts the primary image first even when it was uploaded last", () => {
    const gallery = toGalleryImages([
      image({ url: "a.jpg", sortOrder: 0 }),
      image({ url: "b.jpg", sortOrder: 1 }),
      image({ url: "c.jpg", isPrimary: true, sortOrder: 2 }),
    ]);

    expect(urls(gallery)).toEqual(["c.jpg", "a.jpg", "b.jpg"]);
  });

  it("orders the rest by sortOrder, then by upload order", () => {
    const gallery = toGalleryImages([
      image({ url: "a.jpg", sortOrder: 2 }),
      image({ url: "b.jpg", sortOrder: 1 }),
      image({ url: "c.jpg" }),
      image({ url: "d.jpg" }),
    ]);

    expect(urls(gallery)).toEqual(["b.jpg", "a.jpg", "c.jpg", "d.jpg"]);
  });

  it("dedupes by url, keeping the primary row's alt text", () => {
    const gallery = toGalleryImages([
      image({ url: "a.jpg", alt: "second copy", sortOrder: 2 }),
      image({ url: "a.jpg", alt: "the primary", isPrimary: true }),
    ]);

    expect(gallery).toHaveLength(1);
    expect(gallery[0].alt).toBe("the primary");
  });

  it("drops empty urls — an empty src re-requests the page", () => {
    const gallery = toGalleryImages([image({ url: "" }), image({ url: "  " }), image({ url: "ok.jpg" })]);
    expect(urls(gallery)).toEqual(["ok.jpg"]);
  });

  it("falls back to the caller's alt when the row has none", () => {
    const gallery = toGalleryImages([image({ alt: null })], "Ocean Linen Shirt");
    expect(gallery[0].alt).toBe("Ocean Linen Shirt");
  });

  it("answers an absent image list with nothing to paint", () => {
    expect(toGalleryImages(null)).toEqual([]);
    expect(toGalleryImages(undefined)).toEqual([]);
  });
});

describe("stepIndex", () => {
  it("wraps forward and backward", () => {
    expect(stepIndex(2, 1, 3)).toBe(0);
    expect(stepIndex(0, -1, 3)).toBe(2);
    expect(stepIndex(1, 1, 3)).toBe(2);
  });

  it("is a no-op for an empty gallery", () => {
    expect(stepIndex(0, 1, 0)).toBe(0);
  });
});

describe("clampIndex", () => {
  it("keeps a stale index inside the gallery", () => {
    expect(clampIndex(9, 3)).toBe(2);
    expect(clampIndex(-4, 3)).toBe(0);
    expect(clampIndex(1.7, 3)).toBe(1);
  });

  it("answers 0 for an empty gallery or an unusable index", () => {
    expect(clampIndex(2, 0)).toBe(0);
    expect(clampIndex(Number.NaN, 3)).toBe(0);
  });
});

describe("GALLERY_MAX_IMAGES", () => {
  it("caps the PDP thumb rail at six frames", () => {
    expect(GALLERY_MAX_IMAGES).toBe(6);
  });
});
