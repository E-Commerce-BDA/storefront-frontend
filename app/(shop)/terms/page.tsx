import { createCmsPageRoute } from "../_components/cmsPageRoute";

/**
 * `/terms` — the terms of sale, from cms-svc — sf-063 (plan §7)
 *
 * Same shape as `/about` and `/privacy`: one route call, the document is blocks in
 * the `terms` page. A long policy renders inside the prose measure (text capped,
 * page full-bleed — design-system §4), so a 50 000-character terms page stays
 * readable without reintroducing a page-width cap.
 */
export const revalidate = 300;

const route = createCmsPageRoute({
  slug: "terms",
  title: "Terms of sale",
  description: "The agreement between you and foreafcbeta when you buy something here.",
});

export const generateMetadata = route.generateMetadata;
export default route.Page;
