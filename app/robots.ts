import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * `/robots.txt` — the app-router metadata file convention (see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
 * 01-metadata/robots.md). The sitemap line points crawlers at the generated
 * sitemap instead of duplicating a host literal here.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
