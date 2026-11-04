import { createCmsPageRoute } from "../_components/cmsPageRoute";

/**
 * `/privacy` — the privacy policy, from cms-svc — sf-063 (plan §7)
 *
 * The whole document is the `privacy` page's blocks; `rich_text` HTML is rendered
 * through the allowlist sanitizer (`lib/pages/richText.ts`), so an admin's markup
 * is safe without a dependency. Serving this from the CMS rather than hardcoded
 * TSX is what makes "editable through the CMS" literally true.
 */
export const revalidate = 300;

const route = createCmsPageRoute({
  slug: "privacy",
  title: "Privacy policy",
  description: "What Next.7 collects, why we collect it, and how to ask us to remove it.",
});

export const generateMetadata = route.generateMetadata;
export default route.Page;
