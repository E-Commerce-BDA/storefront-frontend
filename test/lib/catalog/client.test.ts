/**
 * Catalog client — URL, query, and unwrapping. The transport's own contract is
 * tested elsewhere; what matters here is that a page gets `{ items }` and never
 * sees catalog's envelope, and that `status=active` is not something a caller
 * can override.
 */
import { describe, expect, it } from "vitest";
import { catalogClient, createCatalogClient } from "@/lib/catalog/client";
import type { Perform, RequestOptions, ServiceResult, ServiceFailure } from "@/lib/http/result";
import type { ProductDetailDto, ProductListItemDto } from "@/lib/catalog/schemas";

function stub<R>(response: R) {
  const calls: RequestOptions<unknown>[] = [];
  const perform: Perform = async <T,>(req: RequestOptions<T>): Promise<ServiceResult<T>> => {
    calls.push(req as unknown as RequestOptions<unknown>);
    return { ok: true, data: response as unknown as T };
  };
  return { perform, calls };
}

function failing(failure: ServiceFailure) {
  const calls: RequestOptions<unknown>[] = [];
  const perform: Perform = async <T,>(req: RequestOptions<T>): Promise<ServiceResult<T>> => {
    calls.push(req as unknown as RequestOptions<unknown>);
    return failure;
  };
  return { perform, calls };
}

const LIST_ITEM: ProductListItemDto = {
  id: "p1",
  name: "Blue shirt",
  slug: "blue-shirt",
  status: "active",
  price: 40,
  compareAtPrice: null,
  effectivePrice: 36,
  stock: 12,
  categoryId: "c1",
  categoryName: "Shirts",
  categorySlug: "shirts",
  brandId: null,
  brandName: null,
  primaryImageUrl: "/img/p1.jpg",
  tags: ["new"],
};

const DETAIL: ProductDetailDto = {
  id: "p1",
  name: "Blue shirt",
  slug: "blue-shirt",
  status: "active",
  price: 40,
  compareAtPrice: null,
  effectivePrice: 36,
  stock: 12,
  images: [],
  options: [],
  variants: [],
};

describe("listProducts", () => {
  it("pins status=active and asks for the 60 s cache", async () => {
    const { perform, calls } = stub({ data: [LIST_ITEM], nextCursor: null });

    const result = await createCatalogClient(perform).listProducts();

    expect(result.ok).toBe(true);
    const request = calls[0];
    expect(request.path).toBe("/api/v1/catalog/products");
    expect(request.query).toMatchObject({ status: "active" });
    expect(request.cache).toEqual({ revalidate: 60, tags: ["catalog:listings", "catalog:products"] });
  });

  it("forwards every filter the listing route knows", async () => {
    const { perform, calls } = stub({ data: [], nextCursor: null });

    await createCatalogClient(perform).listProducts({
      limit: 24,
      cursor: "c-2",
      categoryId: "c1",
      brandId: "b1",
      q: "shirt",
      sort: "price_asc",
      minPrice: 10,
      maxPrice: 100,
    });

    expect(calls[0].query).toEqual({
      status: "active",
      limit: 24,
      cursor: "c-2",
      categoryId: "c1",
      brandId: "b1",
      q: "shirt",
      sort: "price_asc",
      minPrice: 10,
      maxPrice: 100,
      ids: undefined,
    });
  });

  it("sends manual picks as one comma-joined ids param, in order", async () => {
    const { perform, calls } = stub({ data: [], nextCursor: null });

    await createCatalogClient(perform).listProducts({
      ids: ["3f2a1b6c-0000-4000-8000-000000000001", "9e8d7c6b-0000-4000-8000-000000000002"],
    });

    expect(calls[0].query).toMatchObject({
      ids: "3f2a1b6c-0000-4000-8000-000000000001,9e8d7c6b-0000-4000-8000-000000000002",
    });
  });

  it("drops an empty ids array instead of sending ids= (that would ask for nothing)", async () => {
    const { perform, calls } = stub({ data: [], nextCursor: null });

    await createCatalogClient(perform).listProducts({ ids: [], limit: 8 });

    expect(calls[0].query).toMatchObject({ ids: undefined, limit: 8 });
  });

  it("unwraps catalog's envelope into { items, nextCursor }", async () => {
    const { perform } = stub({ data: [LIST_ITEM], nextCursor: "c-2" });

    const result = await createCatalogClient(perform).listProducts();

    expect(result).toEqual({ ok: true, data: { items: [LIST_ITEM], nextCursor: "c-2" } });
  });

  it("normalises a missing nextCursor to null", async () => {
    const { perform } = stub({ data: [] });

    const result = await createCatalogClient(perform).listProducts();

    expect(result).toEqual({ ok: true, data: { items: [], nextCursor: null } });
  });
});

describe("detail reads", () => {
  it("reads a product by slug and unwraps `product`", async () => {
    const { perform, calls } = stub({ product: DETAIL });

    const result = await createCatalogClient(perform).getProduct("blue shirt");

    expect(calls[0].path).toBe("/api/v1/catalog/products/blue%20shirt");
    expect(result).toEqual({ ok: true, data: DETAIL });
  });

  it("reads a product by id on the id sub-route", async () => {
    const { perform, calls } = stub({ product: DETAIL });

    await createCatalogClient(perform).getProductById("p1");

    expect(calls[0].path).toBe("/api/v1/catalog/products/id/p1");
  });

  it("returns a 404 unchanged so the page can render not-found", async () => {
    const { perform } = failing({
      ok: false,
      kind: "not-found",
      status: 404,
      code: "PRODUCT_NOT_FOUND",
      message: "no such product",
    });

    const result = await createCatalogClient(perform).getProduct("ghost");

    expect(result).toEqual({
      ok: false,
      kind: "not-found",
      status: 404,
      code: "PRODUCT_NOT_FOUND",
      message: "no such product",
    });
  });
});

describe("categories", () => {
  it("lists categories and unwraps `data`", async () => {
    const { perform, calls } = stub({ data: [{ id: "c1", name: "Shirts", slug: "shirts" }] });

    const result = await createCatalogClient(perform).listCategories();

    expect(calls[0].path).toBe("/api/v1/catalog/categories");
    expect(result.ok && result.data[0].slug).toBe("shirts");
  });

  it("reads one category by slug", async () => {
    const { perform, calls } = stub({ category: { id: "c1", name: "Shirts", slug: "shirts" } });

    const result = await createCatalogClient(perform).getCategory("shirts");

    expect(calls[0].path).toBe("/api/v1/catalog/categories/shirts");
    expect(result.ok && result.data.name).toBe("Shirts");
  });
});

describe("brands", () => {
  it("lists brands and unwraps `data` on the 60 s cache", async () => {
    const brand = { id: "b1", name: "Northwind", slug: "northwind", logoUrl: "/media/seed/brand-1.png" };
    const { perform, calls } = stub({ data: [brand] });

    const result = await createCatalogClient(perform).listBrands();

    expect(calls[0].path).toBe("/api/v1/catalog/brands");
    expect(calls[0].cache).toEqual({ revalidate: 60 });
    expect(result.ok && result.data).toEqual([brand]);
  });

  it("reads one brand by slug and unwraps `brand`", async () => {
    const { perform, calls } = stub({ brand: { id: "b1", name: "Northwind", slug: "northwind" } });

    const result = await createCatalogClient(perform).getBrand("north wind");

    expect(calls[0].path).toBe("/api/v1/catalog/brands/north%20wind");
    expect(result.ok && result.data.name).toBe("Northwind");
  });
});

describe("catalog cache tags (sf-061)", () => {
  it("tags listings and PDP reads so one webhook drops both caches", async () => {
    const list = stub({ data: [], nextCursor: null });
    await createCatalogClient(list.perform).listProducts();
    expect(list.calls[0].cache).toMatchObject({
      tags: ["catalog:listings", "catalog:products"],
      revalidate: 60,
    });

    const detail = stub({ product: DETAIL });
    await createCatalogClient(detail.perform).getProduct("blue-shirt");
    expect(detail.calls[0].cache).toMatchObject({
      tags: ["catalog:product:blue-shirt", "catalog:products"],
    });

    const byId = stub({ product: DETAIL });
    await createCatalogClient(byId.perform).getProductById(DETAIL.id);
    expect(byId.calls[0].cache).toMatchObject({
      tags: ["catalog:product:p1", "catalog:products"],
    });
  });
});

describe("catalogClient()", () => {
  it("builds a client over the real transport without touching the network", () => {
    const client = catalogClient();
    expect(typeof client.listProducts).toBe("function");
    expect(typeof client.getProduct).toBe("function");
    expect(typeof client.listBrands).toBe("function");
  });
});
