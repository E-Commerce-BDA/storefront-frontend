import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * `/sitemap.xml` — Next 16 app-router metadata file convention (see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
 * 01-metadata/sitemap.md). One default export returning `MetadataRoute.Sitemap`;
 * Next owns the XML serialisation and caching, so there is no route handler here.
 *
 * Only stable public routes are listed. Rejected alternative: fetching CMS page
 * slugs here would turn a CMS outage into a missing or partial sitemap — the
 * crawler-facing file should stay as available as the shell itself.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
