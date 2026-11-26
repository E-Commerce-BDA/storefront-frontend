import { notFound } from "next/navigation";
import type { Page } from "@ecom/contracts";
import Breadcrumbs from "@/components/shell/Breadcrumbs";
import PageBlocks from "@/components/pages/PageBlocks";

/**
 * CmsPage — one resolved CMS document, painted — sf-063
 * (plan §7: `/about`, `/privacy`, `/terms` share the renderer)
 *
 * A server component rather than three near-identical route bodies: the routes
 * differ only in the slug they ask for, and that difference belongs in the route
 * file (one line each), not in duplicated markup. The branch table is one line:
 * the document is there, or it is not.
 *
 * `null` calls `notFound()`. The client cannot tell "the CMS is down" from "this
 * page was never published" (both are a `null` envelope, `lib/cms/client.ts`),
 * and for a legal page the two answers must not be a wall of text about a service:
 * a 404 is correct for the missing case, and for the outage case it is a page that
 * re-renders as soon as the service answers — `revalidate: 300` on the route makes
 * that at most five minutes, and the ISR cache keeps the last good render until it.
 */
export interface CmsPageProps {
  page: Page | null;
}

export default function CmsPage({ page }: CmsPageProps) {
  if (page === null) notFound();

  return (
    <article className="sf-page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: page.title }]} />
      <header className="sf-page__head">
        <h1 className="sf-title sf-page__title">{page.title}</h1>
      </header>
      <PageBlocks blocks={page.blocks} />
    </article>
  );
}
