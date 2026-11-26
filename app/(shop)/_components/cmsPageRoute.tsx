import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CmsPage from "@/components/pages/CmsPage";
import { loadPage } from "@/lib/cms/loadDocuments";

/**
 * `createCmsPageRoute` — the factory behind `/about`, `/privacy` and `/terms` —
 * sf-063 (plan §7)
 *
 * A route that renders a CMS document should contain no document. Each of the
 * three files is one call to this function, so "the privacy page has 40 lines of
 * hardcoded legalese in `page.tsx`" is structurally impossible, and adding a
 * fourth policy page is one slug and one title — no new renderer, no new fetch,
 * no new fallback path to forget.
 *
 * Why a factory and not a single `[slug]` route: the three paths are stable,
 * linkable and named (the footer, the checkout consent copy and `proxy.ts` all
 * reference them literally). A dynamic segment would trade that explicitness for
 * nothing, and would let *any* slug in the CMS mint a public page — including one
 * an admin marked internal.
 */
export interface CmsPageRouteConfig {
  /** The CMS `pageKeySchema` slug, and the canonical path's last segment. */
  slug: string;
  /** Browser-tab title when the document carries no `seo.title`. */
  title: string;
  /** Search-description fallback when the document carries no `seo.description`. */
  description?: string;
}

export function createCmsPageRoute({
  slug,
  title,
  description,
}: CmsPageRouteConfig) {
  const path = `/${slug}`;

  async function Page() {
    const result = await loadPage(slug);
    // I-16: only a real 404 is absence; a CMS outage is not "no such page".
    if (result.data === null && result.missing) notFound();
    if (result.data === null) {
      return (
        <section className="sf-section sf-degraded" aria-label="Content unavailable">
          <h1 className="sf-section__title">This page is temporarily unavailable</h1>
          <p className="sf-degraded__body">
            The content service could not be reached. Please try again shortly.
          </p>
        </section>
      );
    }
    return <CmsPage page={result.data} />;
  }

  async function generateMetadata(): Promise<Metadata> {
    const result = await loadPage(slug);
    const page = result.data;
    if (page === null) return { title, alternates: { canonical: path } };
    return {
      title: page.seo?.title ?? title,
      description: page.seo?.description ?? description,
      alternates: { canonical: path },
      ...(page.seo?.ogImage !== undefined ? { openGraph: { images: [page.seo.ogImage] } } : {}),
    };
  }

  const route = { Page, generateMetadata };
  // The route file re-exports these as `export default route.Page` and
  // `export const generateMetadata = route.generateMetadata`. It must NOT export
  // a binding literally named `Page`: Next's page type allows the component only
  // as the `default` export, and a stray named `Page` fails the build's
  // "unexpected export" check. Returning an object (not `export *`) keeps that
  // choice in the route's hands.
  return route;
}
