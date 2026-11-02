/**
 * `lib/blog/present.ts` — sf-063.
 *
 * The list route and the home teaser share these helpers, so what they encode —
 * "blank is not content", "a null date renders nothing", "reading time is whole
 * minutes" — is exactly what must not drift between the two faces.
 */
import { describe, expect, it } from "vitest";
import type { Blog } from "@ecom/contracts";
import {
  blogHref,
  blogToCardModel,
  blogToCardModels,
  formatFullDate,
  readingMinutes,
} from "@/lib/blog/present";

function blog(over: Partial<Blog> = {}): Blog {
  return {
    id: "b1",
    slug: "field-notes",
    title: "Field notes",
    content: [{ type: "paragraph", id: "p1", text: "hello world" }],
    categoryId: "c1",
    status: "published",
    ...over,
  } as Blog;
}

describe("blogToCardModel", () => {
  it("builds the href from the slug", () => {
    expect(blogHref("field-notes")).toBe("/blog/field-notes");
    expect(blogToCardModel(blog()).href).toBe("/blog/field-notes");
  });

  it("omits cover/excerpt/publishedAt when absent, and when blank", () => {
    const card = blogToCardModel(
      blog({ coverUrl: "", excerpt: "   ", publishedAt: null }),
    );
    expect("cover" in card).toBe(false);
    expect("excerpt" in card).toBe(false);
    expect("publishedAt" in card).toBe(false);
  });

  it("keeps real values", () => {
    const card = blogToCardModel(
      blog({ coverUrl: "/media/x.jpg", excerpt: "A line", publishedAt: "2026-11-04T00:00:00.000Z" }),
    );
    expect(card).toMatchObject({
      cover: "/media/x.jpg",
      excerpt: "A line",
      publishedAt: "2026-11-04T00:00:00.000Z",
    });
  });

  it("maps a list in order", () => {
    const models = blogToCardModels([blog({ slug: "a" }), blog({ slug: "b" })]);
    expect(models.map((m) => m.slug)).toEqual(["a", "b"]);
  });
});

describe("formatFullDate", () => {
  it("renders a UTC calendar date, not the raw string", () => {
    expect(formatFullDate("2026-11-04T00:00:00.000Z")).toBe("November 4, 2026");
  });

  it("returns undefined for null, blank, or an unparseable value", () => {
    expect(formatFullDate(null)).toBeUndefined();
    expect(formatFullDate("")).toBeUndefined();
    expect(formatFullDate("not a date")).toBeUndefined();
  });
});

describe("readingMinutes", () => {
  it("is undefined for an empty post", () => {
    expect(readingMinutes([])).toBeUndefined();
  });

  it("rounds up and never shows a fraction", () => {
    const long = Array.from({ length: 246 }, (_, i) => `w${i}`).join(" ");
    expect(readingMinutes([{ type: "paragraph", id: "p", text: long }])).toBe(2);
  });

  it("counts quote text but ignores an image block", () => {
    const words = Array.from({ length: 10 }, (_, i) => `w${i}`).join(" ");
    expect(
      readingMinutes([
        { type: "quote", id: "q", quote: words },
        { type: "image", id: "i", url: "/x.jpg" },
      ]),
    ).toBe(1);
  });
});
