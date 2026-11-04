import { createCmsPageRoute } from "../_components/cmsPageRoute";

/**
 * `/about` — the company page, entirely from cms-svc — sf-063 (plan §7)
 *
 * One line of content authorship, on purpose: the story, the banner, the FAQ and
 * the "how to reach us" copy are `rich_text`/`image`/`cta`/`faq` blocks in the
 * `about` page document. Editing this page is an admin write; the revalidation tag
 * (`cms:pages:about`) drops the cache on that write, so a change is live without a
 * redeploy. Nothing here is a scaffold.
 */
export const revalidate = 300;

const route = createCmsPageRoute({
  slug: "about",
  title: "About Next.7",
  description: "Who we are, how we pick what to stock, and how to reach the team.",
});

export const generateMetadata = route.generateMetadata;
export default route.Page;
