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

/** A perform that records the request and answers with `response`. */
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
    expect(request.cache).toEqual({ revalidate: 60 });
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
    });
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

describe("catalogClient()", () => {
  it("builds a client over the real transport without touching the network", () => {
    const client = catalogClient();
    expect(typeof client.listProducts).toBe("function");
    expect(typeof client.getProduct).toBe("function");
  });
});
