/**
 * CMS document loader — sf-063
 * (plan §7)
 *
 * The three reads the journal and the page routes share, in one file, because
 * `generateMetadata` and the page body ask for the *same* document and Next
 * dedupes only identical fetches (same URL, same `next` options). Two hand-rolled
 * call sites would drift in tag or timeout within a week and the revalidation
 * would silently stop covering one of them.
 *
 * `null` is the client's whole error vocabulary (network, timeout, non-2xx, a
 * body the contracts schema rejects, or a genuine 404 — cms-svc's public reads
 * filter to `status: "published"` / `isActive: true` and 404 otherwise). The
 * routes decide what a `null` means for them: a detail page calls `notFound()`,
 * a list page shows its empty or degraded face. That is the honest reading of an
 * envelope that cannot tell outage from absence — pretending otherwise with a
 * second error channel would need a client that throws, which is the design the
 * nav/footer/settings cascade already rejected.
 */

import type { Blog, Page } from "@ecom/contracts";
import { cmsBaseUrl, createCmsClient, type CmsBlogListQuery } from "@/lib/cms/client";

/** The page routes that resolve to a CMS document, and the slug each uses.
 *  Exported so a test (and the footer's fallback link list) can check the route
 *  table against what the app actually mounts. */
export const CMS_PAGE_ROUTES = {
  "/about": "about",
  "/privacy": "privacy",
  "/terms": "terms",
} as const;

export type CmsPageRoute = keyof typeof CMS_PAGE_ROUTES;

function client() {
  return createCmsClient({ baseUrl: cmsBaseUrl() });
}

/** Published posts, newest first as cms-svc orders them. `nextCursor` is carried
 *  but not followed yet — the seed is three posts, and a "load more" button with
 *  no page state machine behind it would be a fake control (plan §11). */
export interface BlogListResult {
  blogs: Blog[];
  nextCursor: string | null;
}

export async function loadPublishedBlogs(query?: CmsBlogListQuery): Promise<BlogListResult | null> {
  const list = await client().listBlogs(query);
  // A well-formed but empty list is a fact; `null` is the outage. Both are
  // returned as-is and the route distinguishes them.
  return list === null ? null : { blogs: list.data, nextCursor: list.nextCursor };
}

export async function loadBlog(slug: string): Promise<Blog | null> {
  return client().getBlog(slug);
}

export async function loadPage(slug: string): Promise<Page | null> {
  return client().getPage(slug);
}

/**
 * `generateStaticParams` for `/blog/[slug]`.
 *
 * On a CMS outage this returns `[]`, which is correct and not a silent failure:
 * Next then renders each requested slug on demand (ISR), and a post nobody has
 * requested yet simply has no prerendered HTML. Prerendering an empty list is a
 * slower site, not a broken one.
 */
export async function blogStaticParams(): Promise<Array<{ slug: string }>> {
  const listed = await loadPublishedBlogs({ limit: 50 });
  if (listed === null) return [];
  return listed.blogs.map((blog) => ({ slug: blog.slug }));
}
