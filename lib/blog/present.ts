/**
 * Blog presentation helpers — sf-063
 * (plan §7)
 *
 * A contract row becomes the card model the shared `BlogCard` painter already
 * speaks, so `/blog` and the home teaser cannot disagree about what "has a
 * cover" or "has an excerpt" means: a blank string is not content, and a draft
 * is never listed here because cms-svc's public read already filtered to
 * `status: "published"`.
 */

import type { Blog } from "@ecom/contracts";
import type { BlogTeaserCardModel } from "@/lib/sections/viewModels";

/** The one route a post is reachable at. Slugs are `pageKeySchema`-validated by
 * the contracts parse in `lib/cms/client.ts`, so no extra encoding is needed. */
export function blogHref(slug: string): string {
  return `/blog/${slug}`;
}

export function blogToCardModel(blog: Blog): BlogTeaserCardModel {
  const cover = blog.coverUrl?.trim();
  const excerpt = blog.excerpt?.trim();
  const publishedAt =
    typeof blog.publishedAt === "string" && blog.publishedAt.trim() !== ""
      ? blog.publishedAt
      : undefined;
  return {
    slug: blog.slug,
    title: blog.title,
    href: blogHref(blog.slug),
    ...(cover ? { cover } : {}),
    ...(excerpt ? { excerpt } : {}),
    ...(publishedAt !== undefined ? { publishedAt } : {}),
  };
}

export function blogToCardModels(blogs: readonly Blog[]): BlogTeaserCardModel[] {
  return blogs.map(blogToCardModel);
}

const FULL_DATE = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * `4 November 2026`, or `undefined`.
 *
 * A post article shows the day (a journal entry is dated, not monthly), and the
 * `undefined` case is what keeps an unpublished `publishedAt: null` from
 * rendering the string "null" next to an author name. UTC so the date does not
 * roll over with the server's timezone — the same reason the section cards pin a
 * locale.
 */
export function formatFullDate(value: string | null | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return FULL_DATE.format(parsed);
}

/** Reading time, rounded up, 1 minute minimum — `undefined` for an empty post.
 * A 246-word read is shown as "2 min", never "1.02 min": a fractional figure
 * implies a precision nobody measured. */
const WORDS_PER_MINUTE = 220;

export function readingMinutes(content: Blog["content"]): number | undefined {
  let words = 0;
  for (const block of content) {
    const text =
      block.type === "quote" ? block.quote : block.type === "image" ? undefined : block.text;
    if (typeof text !== "string") continue;
    words += text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  }
  if (words === 0) return undefined;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
