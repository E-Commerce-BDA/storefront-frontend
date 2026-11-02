import type { Metadata } from "next";
import Link from "next/link";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { cmsBaseUrl, createCmsClient } from "@/lib/cms/client";
import { HOME_PAGE_KEY, resolveSections } from "@/lib/sections/resolveSections";

/**
 * `/` — the CMS-composed home page — sf-060
 * (plan §6; routing.md §2; sections.md §2)
 *
 * There is no home content in this file any more. The section list, their
 * order, their copy and their styling knobs all come from cms-svc, and the
 * product/category/brand/blog rows they name come from catalog-svc — so
 * "editing the homepage" is an admin API call, never a redeploy.
 *
 * `revalidate: 300` is the ceiling, not the cadence: every CMS write fires the
 * outbox → `POST /api/revalidate` with `cms:sections:homepage`, which drops the
 * tag long before five minutes. The window only matters if the webhook cannot
 * get through.
 *
 * Degradation is honest, not decorative. If cms-svc is unreachable the page
 * still renders a 200 with a real link to the catalog (`/products` reads a
 * different service and may well be fine) — no scaffold hero, no invented
 * strip. And because `resolveSections` skips a section whose own service is
 * down, one dead catalog cannot blank a page whose content is otherwise fine.
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: "foreafcbeta — everything for every day",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const cms = createCmsClient({ baseUrl: cmsBaseUrl() });
  const list = await cms.getSections(HOME_PAGE_KEY);

  if (list === null) {
    return (
      <section className="sf-section sf-degraded" aria-label="Storefront unavailable">
        <h1 className="sf-section__title">The shop is up, the content service is not</h1>
        <p className="sf-degraded__body">
          This page builds itself from the CMS, and the CMS could not be reached just now. The
          catalog has its own service, so the product listing may already be fine.
        </p>
        <p>
          <Link className="sf-degraded__link" href="/products">
            Browse products
          </Link>
        </p>
      </section>
    );
  }

  const models = await resolveSections(list.sections);

  if (models.length === 0) {
    return (
      <section className="sf-section sf-degraded" aria-label="Home not published yet">
        <h1 className="sf-section__title">Nothing is published on the home page yet</h1>
        <p className="sf-degraded__body">
          Home sections are content, and the CMS has none enabled for this page. Products are
          still reachable through the catalog.
        </p>
        <p>
          <Link className="sf-degraded__link" href="/products">
            Browse products
          </Link>
        </p>
      </section>
    );
  }

  return <SectionRenderer models={models} />;
}
