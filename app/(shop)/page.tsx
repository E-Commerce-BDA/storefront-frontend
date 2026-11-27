import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import SectionRenderer from "@/components/sections/SectionRenderer";
import DegradedState from "@/components/ui/DegradedState";
import { previewTokenFromPage, type PageSearchParams } from "@/lib/admin/guard";
import { adminOrigin } from "@/lib/preview/origin";
import PreviewDraftBridge from "./_components/PreviewDraftBridge";
import { cmsBaseUrl, createCmsClient } from "@/lib/cms/client";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings, toBadgeTones } from "@/lib/cms/themeSettings";
import { HOME_PAGE_KEY, resolveSectionsWithDiagnostics } from "@/lib/sections/resolveSections";
import { buildHomeJsonLd, serializeJsonLd, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

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
 * get through. `searchParams` opts the page into request-time rendering so an
 * admin preview sees its own draft sections; the `(shop)` layout's `connection()`
 * already keeps the published shell fresh on every other request.
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
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "foreafcbeta — everything for every day",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  // sf-096: the preview token is read on the server and used only for the CMS
  // fetch. It is never placed in a component prop, so no island can see it.
  const [query, requestHeaders] = await Promise.all([searchParams, headers()]);
  const previewToken = previewTokenFromPage(requestHeaders, query);
  // The bridge is mounted only for a preview request; a shopper never loads a
  // postMessage listener and never receives the admin origin as a prop.
  const previewAdminOrigin = previewToken === null ? null : adminOrigin();
  const cms = createCmsClient({ baseUrl: cmsBaseUrl(), previewToken });
  // The published theme is read once for both the rendered tone face and the
  // draft merge; a preview token never reaches this fallback read.
  const [read, themeResult] = await Promise.all([
    cms.getSections(HOME_PAGE_KEY),
    fetchThemeSettings(),
  ]);
  const list = read.data;
  let content: React.ReactNode;

  if (list === null) {
    content = (
      <section className="sf-section sf-degraded" aria-label="Storefront unavailable">
        <DegradedState
          title="The shop is up, the content service is not"
          body="This page builds itself from the CMS, and the CMS could not be reached just now. The catalog has its own service, so the product listing may already be fine."
          action={
            <Link className="sf-degraded__link" href="/products">
              Browse products
            </Link>
          }
        />
      </section>
    );
  } else {
    const resolution = await resolveSectionsWithDiagnostics(list.sections);
    const models = resolution.models;
    const theme = resolveThemeSettings({ settings: themeResult.theme });
    const cardTheme = theme.productCard;

    // I-02/I-17: the CMS state is authoritative; older responses fall back to
    // the resolved count. Diagnostics make a silent skip visible in the DOM.
    const state = list.state ?? (models.length === 0 ? "empty" : "published");
    content =
      models.length === 0 ? (
        <section
          className="sf-section sf-degraded"
          aria-label={state === "missing" ? "Home not configured" : "Home not published yet"}
          data-cms-state={state}
          data-skipped={resolution.skipped.map((s) => s.key).join(",") || undefined}
        >
          <DegradedState
            title={
              state === "missing"
                ? "The home page has not been configured yet"
                : "Nothing is published on the home page yet"
            }
            body="Home sections are content, and the CMS has none enabled for this page. Products are still reachable through the catalog."
            action={
              <Link className="sf-degraded__link" href="/products">
                Browse products
              </Link>
            }
          />
        </section>
      ) : (
        <SectionRenderer
          models={models}
          columns={{
            desktop: cardTheme.colsDesktop,
            tablet: cardTheme.colsTablet,
            phone: cardTheme.colsPhone,
          }}
          themeFallback={cardTheme}
          tones={toBadgeTones(theme)}
        />
      );
  }

  return (
    <>
      {previewAdminOrigin !== null ? (
        <PreviewDraftBridge adminOrigin={previewAdminOrigin} publishedTheme={themeResult.theme} />
      ) : null}
      {content}
      {/* A native script is right for inert structured data; the payload is
          escaped by serializeJsonLd so no CMS string can close the tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildHomeJsonLd()) }}
      />
    </>
  );
}
