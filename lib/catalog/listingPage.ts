/**
 * Listing page loader — sf-054
 *
 * The one place that turns an untrusted query string into everything the
 * listing needs: resolved filters, one catalog page, facet values, and the
 * category breadcrumb. The RSC route and the catalog BFF both call it, so slug
 * resolution, mapping and the skip rules are never written twice.
 */

import { catalogClient } from "@/lib/catalog/client";
import {
  buildCategoryBreadcrumb,
  buildCategoryTree,
  categoryPath,
  type CategoryNode,
} from "@/lib/catalog/facets";
import { buildListingQuery, parseListingParams, type SearchParamValue } from "@/lib/catalog/listing";
import type { CatalogBrand, CatalogSort } from "@/lib/catalog/schemas";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import type { ProductCardData } from "@/lib/commerce/productCard";
import type { BreadcrumbItem } from "@/lib/shell/pageHeader";

export interface ListingFacets {
  categories: CategoryNode[];
  brands: CatalogBrand[];
  tags: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

export interface ListingPageData {
  title: string;
  categoryId?: string;
  brandId?: string;
  categorySlug?: string;
  brandSlug?: string;
  tags?: string[];
  discounted?: boolean;
  sort?: CatalogSort;
  q?: string;
  items: ProductCardData[];
  nextCursor: string | null;
  facets: ListingFacets;
  breadcrumb: BreadcrumbItem[];
}

export type ListingLoadResult =
  | { ok: true; data: ListingPageData }
  | {
      ok: false;
      kind: "not-found" | "unavailable";
      scope: "category" | "brand" | "products";
      slug?: string;
      retry: string;
    };

export function searchParamsToRecord(
  searchParams: URLSearchParams,
): Record<string, SearchParamValue> {
  const out: Record<string, SearchParamValue> = {};
  for (const key of new Set(searchParams.keys())) {
    const all = searchParams.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

export async function loadListingPage(
  params: Record<string, SearchParamValue>,
): Promise<ListingLoadResult> {
  const parsed = parseListingParams(params);
  const catalog = catalogClient();
  const retry = buildListingQuery({
    categorySlug: parsed.categorySlug,
    brandSlug: parsed.brandSlug,
    q: parsed.query.q,
    sort: parsed.query.sort,
    tags: parsed.tags,
    discounted: parsed.discounted,
    cursor: parsed.query.cursor,
  });

  const titles: string[] = [];
  let categoryId: string | undefined;
  let brandId: string | undefined;

  if (parsed.categorySlug !== undefined) {
    const category = await catalog.getCategory(parsed.categorySlug);
    if (!category.ok) {
      return category.kind === "not-found"
        ? { ok: false, kind: "not-found", scope: "category", slug: parsed.categorySlug, retry }
        : { ok: false, kind: "unavailable", scope: "category", slug: parsed.categorySlug, retry };
    }
    categoryId = category.data.id;
    titles.push(category.data.name);
  }

  if (parsed.brandSlug !== undefined) {
    const brand = await catalog.getBrand(parsed.brandSlug);
    if (!brand.ok) {
      return brand.kind === "not-found"
        ? { ok: false, kind: "not-found", scope: "brand", slug: parsed.brandSlug, retry }
        : { ok: false, kind: "unavailable", scope: "brand", slug: parsed.brandSlug, retry };
    }
    brandId = brand.data.id;
    titles.push(brand.data.name);
  }

  const page = await catalog.listProducts({
    ...parsed.query,
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),
    ...(parsed.tags && parsed.tags.length > 0 ? { tags: parsed.tags } : {}),
    ...(parsed.discounted ? { discounted: parsed.discounted } : {}),
  });
  if (!page.ok) {
    return { ok: false, kind: "unavailable", scope: "products", retry };
  }

  // Facets are a rail, not the page: a dead catalog read here degrades the
  // facet lists to empty but must not blank products already loaded.
  const [categories, brands, facetsResult] = await Promise.all([
    catalog.listCategories(),
    catalog.listBrands(),
    catalog.getFacets({ categoryId, brandId }),
  ]);
  const categoryTree = buildCategoryTree(categories.ok ? categories.data : []);
  const path = categoryPath(categoryTree, categoryId);

  return {
    ok: true,
    data: {
      title: titles.length > 0 ? titles.join(" · ") : "All products",
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {}),
      ...(parsed.categorySlug ? { categorySlug: parsed.categorySlug } : {}),
      ...(parsed.brandSlug ? { brandSlug: parsed.brandSlug } : {}),
      ...(parsed.tags ? { tags: parsed.tags } : {}),
      ...(parsed.discounted ? { discounted: parsed.discounted } : {}),
      ...(parsed.query.sort ? { sort: parsed.query.sort } : {}),
      ...(parsed.query.q ? { q: parsed.query.q } : {}),
      items: fromCatalogList(page.data.items),
      nextCursor: page.data.nextCursor ?? null,
      facets: {
        categories: categoryTree,
        brands: brands.ok ? brands.data : [],
        tags: facetsResult.ok ? facetsResult.data.tags : [],
        minPrice: facetsResult.ok ? facetsResult.data.minPrice ?? null : null,
        maxPrice: facetsResult.ok ? facetsResult.data.maxPrice ?? null : null,
      },
      breadcrumb: buildCategoryBreadcrumb(path),
    },
  };
}
