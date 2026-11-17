/**
 * Catalog client — sf-051
 * (catalog-svc `products.controller.ts`, read from source)
 *
 * Server-only: imported by server components, never by an island (AGENTS.md §2
 * — islands talk to `app/api/**`). Every method is a path plus a schema; the
 * transport owns the URL, the budget, and the failure mapping.
 *
 * Two decisions baked in here:
 *
 * 1. **`status: "active"` is not a parameter.** Pages must not be able to ask
 *    for drafts or archived rows: a `?status=draft` leaking into a listing is a
 *    silent catalog leak with no error to notice. Admin surfaces are a different
 *    app and a different client.
 * 2. **`revalidate: 60`** — the same number for every read. Catalog data is
 *    public and changes slowly; time-based revalidation is honest until
 *    catalog-svc can invalidate a tag (sf-061), and an unused tag would only be
 *    decoration.
 */

import { createServiceClient } from "@/lib/http/client";
import type { Perform, ServiceResult } from "@/lib/http/result";
import {
  brandListResponseSchema,
  brandResponseSchema,
  categoryListResponseSchema,
  categoryResponseSchema,
  productFacetsSchema,
  productListResponseSchema,
  productResponseSchema,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogSort,
  type ProductFacets,
  type ProductDetailDto,
  type ProductListItemDto,
} from "@/lib/catalog/schemas";

export const CATALOG_REVALIDATE_SECONDS = 60;

/** Anything catalog can filter on. `status` is deliberately absent. */
export interface CatalogQuery {
  limit?: number;
  cursor?: string;
  categoryId?: string;
  brandId?: string;
  q?: string;
  sort?: CatalogSort;
  minPrice?: number;
  maxPrice?: number;
  /**
   * AND filter: products that have **all** listed tags.
   */
  tags?: string[];
  /**
   * Only products with an active discount row.
   */
  discounted?: boolean;
  /**
   * Manual curation (sf-060 "Most Popular"): fetch exactly these products,
   * in this order, as long as they are active. Sent as a comma-joined list;
   * catalog-svc splits it and pins the row order with `array_position`.
   */
  ids?: string[];
}

export interface CatalogPage {
  items: ProductListItemDto[];
  nextCursor: string | null;
}

export interface CatalogClient {
  listProducts(query?: CatalogQuery): Promise<ServiceResult<CatalogPage>>;
  getFacets(filter?: {
    categoryId?: string;
    brandId?: string;
  }): Promise<ServiceResult<ProductFacets>>;
  getProduct(slug: string): Promise<ServiceResult<ProductDetailDto>>;
  getProductById(id: string): Promise<ServiceResult<ProductDetailDto>>;
  listCategories(): Promise<ServiceResult<CatalogCategory[]>>;
  getCategory(slug: string): Promise<ServiceResult<CatalogCategory>>;
  listBrands(): Promise<ServiceResult<CatalogBrand[]>>;
  getBrand(slug: string): Promise<ServiceResult<CatalogBrand>>;
}

const BASE = "/api/v1/catalog";

export function createCatalogClient(perform: Perform): CatalogClient {
  const cache = { revalidate: CATALOG_REVALIDATE_SECONDS } as const;

  return {
    async listProducts(query = {}) {
      const result = await perform({
        path: `${BASE}/products`,
        query: {
          status: "active",
          limit: query.limit,
          cursor: query.cursor,
          categoryId: query.categoryId,
          brandId: query.brandId,
          q: query.q,
          sort: query.sort,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          tags: query.tags?.length ? query.tags.join(",") : undefined,
          discounted: query.discounted ? "true" : undefined,
          ids: query.ids?.length ? query.ids.join(",") : undefined,
        },
        schema: productListResponseSchema,
        cache,
      });
      if (!result.ok) return result;
      return {
        ok: true,
        data: {
          items: result.data.data,
          nextCursor: result.data.nextCursor ?? null,
        },
      };
    },

    async getFacets(filter = {}) {
      const result = await perform({
        path: `${BASE}/products/facets`,
        query: {
          categoryId: filter.categoryId,
          brandId: filter.brandId,
        },
        schema: productFacetsSchema,
        cache,
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data };
    },

    async getProduct(slug) {
      const result = await perform({
        path: `${BASE}/products/${encodeURIComponent(slug)}`,
        schema: productResponseSchema,
        cache,
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data.product };
    },

    async getProductById(id) {
      const result = await perform({
        path: `${BASE}/products/id/${encodeURIComponent(id)}`,
        schema: productResponseSchema,
        cache,
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data.product };
    },

    async listCategories() {
      const result = await perform({
        path: `${BASE}/categories`,
        schema: categoryListResponseSchema,
        cache,
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data.data };
    },

    async getCategory(slug) {
      const result = await perform({
        path: `${BASE}/categories/${encodeURIComponent(slug)}`,
        schema: categoryResponseSchema,
        cache,
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data.category };
    },

    async listBrands() {
      const result = await perform({
        path: `${BASE}/brands`,
        schema: brandListResponseSchema,
        cache,
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data.data };
    },

    async getBrand(slug) {
      const result = await perform({
        path: `${BASE}/brands/${encodeURIComponent(slug)}`,
        schema: brandResponseSchema,
        cache,
      });
      if (!result.ok) return result;
      return { ok: true, data: result.data.brand };
    },
  };
}

/**
 * The wired client.
 *
 * Deliberately *not* memoised: `createServiceClient` resolves the base URL and
 * the timeout when it is constructed, so caching the client would freeze the
 * first `CATALOG_SVC_URL` it ever saw. Constructing per call is two object
 * allocations and keeps the registry's "read at call time" promise honest.
 */
export function catalogClient(): CatalogClient {
  return createCatalogClient(createServiceClient("catalog"));
}
