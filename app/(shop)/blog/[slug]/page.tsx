import type { Metadata } from "next";
import Breadcrumbs from "@/components/shell/Breadcrumbs";
import DegradedState from "@/components/ui/DegradedState";
import PostBlocks from "@/components/blog/PostBlocks";
import { blogStaticParams, loadBlog } from "@/lib/cms/loadDocuments";
import { notFound } from "next/navigation";
import { formatFullDate, readingMinutes } from "@/lib/blog/present";
import { SITE_NAME } from "@/lib/site";
import type { Blog } from "@ecom/contracts";

/**
 * `/blog/[slug]` — one published post, from cms-svc — sf-063
 * (plan §7)
 *
 * The body is the document's `content` blocks, in order, through `PostBlocks`;
 * there is no fallback article in this file. A slug that is unpublished, missing
 * or malformed is a 404 (`loadBlog` returns `null` for all three, which is the
 * client's documented envelope) — the same rule the legal pages follow.
 *
 * `generateStaticParams` prerenders the current published set; on a CMS outage it
 * yields `[]` and every post falls back to ISR on request, so a cold deploy with
 * the CMS down produces a slow site rather than a broken one.
 */

export const revalidate = 300;

export function generateStaticParams() {
  return blogStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadBlog(slug);
  if (result.data === null) {
    return { title: result.missing ? "Post not found" : "Post temporarily unavailable" };
  }
  const blog = result.data;

  return {
    title: blog.seo?.title ?? blog.title,
    description: blog.seo?.description ?? blog.excerpt ?? undefined,
    alternates: { canonical: `/blog/${blog.slug}` },
    openGraph: {
      type: "article",
      title: blog.title,
      ...(blog.excerpt !== undefined ? { description: blog.excerpt } : {}),
      ...(blog.coverUrl !== undefined ? { images: [blog.coverUrl] } : {}),
      ...(typeof blog.publishedAt === "string"
        ? { publishedTime: blog.publishedAt }
        : {}),
    },
  };
}

/** `BlogPosting`-plus-publisher, from the document only. A field with no CMS
 *  value is left out rather than guessed — an invented date is worse than none. */
function buildBlogJsonLd(blog: Blog, url: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    url,
    ...(blog.excerpt !== undefined ? { description: blog.excerpt } : {}),
    ...(blog.coverUrl !== undefined ? { image: blog.coverUrl } : {}),
    ...(blog.author !== undefined ? { author: { "@type": "Person", name: blog.author } } : {}),
    ...(typeof blog.publishedAt === "string" ? { datePublished: blog.publishedAt } : {}),
    ...(typeof blog.updatedAt === "string" ? { dateModified: blog.updatedAt } : {}),
    publisher: { "@type": "Organization", name: SITE_NAME, url: "/" },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadBlog(slug);
  // I-16: a 404 means the post genuinely does not exist; an outage does not.
  if (result.data === null && result.missing) notFound();
  if (result.data === null) {
    return (
      <section className="sf-section sf-degraded" aria-label="Post unavailable">
        <DegradedState
          title="This post is temporarily unavailable"
          body="The content service could not be reached. Please try again shortly."
        />
      </section>
    );
  }
  const blog = result.data;

  const date = formatFullDate(blog.publishedAt);
  const minutes = readingMinutes(blog.content);
  const url = `/blog/${blog.slug}`;

  return (
    <article className="sf-post">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Journal", href: "/blog" }, { label: blog.title }]}
      />

      <header className="sf-post__head">
        <h1 className="sf-title sf-post__title">{blog.title}</h1>
        {blog.excerpt !== undefined && blog.excerpt !== "" ? (
          <p className="sf-post__standfirst">{blog.excerpt}</p>
        ) : null}
        {date !== undefined || blog.author !== undefined || minutes !== undefined ? (
          <div className="sf-post__byline">
            {blog.author !== undefined && blog.author !== "" ? (
              <span className="sf-post__author">{blog.author}</span>
            ) : null}
            {date !== undefined ? (
              <time className="sf-post__date" dateTime={blog.publishedAt ?? undefined}>
                {date}
              </time>
            ) : null}
            {minutes !== undefined ? (
              <span className="sf-post__read">{minutes} min read</span>
            ) : null}
          </div>
        ) : null}
      </header>

      {blog.coverUrl !== undefined && blog.coverUrl !== "" ? (
        <figure className="sf-post__cover">
          {/* Eager, but unimportant: the CSS gives this image a fixed box, so
              lazy-loading bought no layout stability and only left a grey band
              where the cover belongs, just above the first line of prose. */}
          <img
            className="sf-post__cover-img"
            src={blog.coverUrl}
            alt=""
            fetchPriority="low"
            decoding="async"
          />
        </figure>
      ) : null}

      <PostBlocks blocks={blog.content} />

      <script
        type="application/ld+json"
        // JSON-LD is inert text, not markup; Next requires the raw insertion here.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBlogJsonLd(blog, url)) }}
      />
    </article>
  );
}
