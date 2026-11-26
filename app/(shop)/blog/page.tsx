import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import DegradedState from "@/components/ui/DegradedState";
import EmptyState from "@/components/ui/EmptyState";
import BlogCard from "@/components/sections/BlogCard";
import { blogToCardModels } from "@/lib/blog/present";
import { loadPublishedBlogs } from "@/lib/cms/loadDocuments";
import { SITE_NAME } from "@/lib/site";

/**
 * `/blog` — the published journal list — sf-063
 * (plan §7; `pages/routing.md` §1)
 *
 * No post copy lives in this file. The list is whatever cms-svc returns from
 * `GET /cms/blogs`, which already filters to `status: "published"`, and each card
 * is the same `BlogCard` the home teaser paints — so a post appears in both
 * places or neither, never in two designs.
 *
 * ISR 300 + the `cms:blogs` tag: publishing a post fires the outbox →
 * `POST /api/revalidate` → `revalidateTag('cms:blogs')`, so the list updates on
 * the write, not on the clock. The window is the fallback for a dropped webhook.
 *
 * Two empty states, because they are different facts: nothing published yet is a
 * real, correct page (and the seed makes it the normal one before the first
 * post); an unreachable CMS is a temporary outage. Neither invents a card.
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Journal — ${SITE_NAME}`,
  description: `Field notes, buying guides and stories from the ${SITE_NAME} team. Published by the store, straight from the CMS.`,
  alternates: { canonical: "/blog" },
};

export default async function BlogListPage() {
  const listed = await loadPublishedBlogs({ limit: 24 });

  if (listed === null) {
    return (
      <>
        <PageHeader eyebrow="Journal" title="The journal is resting" />
        <DegradedState
          title="Posts are temporarily unavailable"
          body="The content service could not be reached just now. Published posts will appear here as soon as it answers."
        />
      </>
    );
  }

  if (listed.blogs.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Journal" title="Journal" />
        <EmptyState
          title="Nothing published yet"
          body="Writing goes through the CMS, so the first post is one publish away."
        />
      </>
    );
  }

  const cards = blogToCardModels(listed.blogs);

  return (
    <>
      <PageHeader eyebrow="Journal" title="Field notes from the store" />
      <ul className="sf-blog__grid sf-bloglist" role="list">
        {cards.map((card) => (
          <li key={card.slug} className="sf-blog__item">
            <BlogCard post={card} />
          </li>
        ))}
      </ul>
    </>
  );
}
