/**
 * Cart client — the two things cart-svc refuses without: an identity and an
 * idempotency key on every write. Both are asserted per method, because a
 * missing key is a 400 the UI would show as a mystery, and a missing identity
 * silently creates a second guest cart instead of adding to this one.
 */
import { describe, expect, it } from "vitest";
import { createCartClient } from "@/lib/cart/client";
import type { Perform, RequestOptions, ServiceResult } from "@/lib/http/result";

const IDENTITY = { "x-session-id": "guest-abc-123" };

const ITEM = {
  id: "i1",
  productId: "p1",
  variantId: null,
  qty: 2,
  unitPrice: 40,
  productName: "Blue shirt",
  productSlug: "blue-shirt",
  imageUrl: null,
  variantLabel: null,
};

const TOTALS = { subtotal: 80, itemCount: 2, lineCount: 1 };

function stub<R>(response: R) {
  const calls: RequestOptions<unknown>[] = [];
  const perform: Perform = async <T,>(req: RequestOptions<T>): Promise<ServiceResult<T>> => {
    calls.push(req as unknown as RequestOptions<unknown>);
    return { ok: true, data: response as unknown as T };
  };
  return { perform, calls };
}

function client(response: unknown) {
  const { perform, calls } = stub(response);
  return { calls, cart: createCartClient(perform, { newKey: () => "key-1" }) };
}

describe("getCart", () => {
  it("forwards the identity and never caches", async () => {
    const { cart, calls } = client({
      cart: { id: "c1" },
      items: [ITEM],
      totals: TOTALS,
    });

    const result = await cart.getCart(IDENTITY);

    expect(calls[0]).toMatchObject({
      path: "/api/v1/cart",
      headers: IDENTITY,
      cache: "no-store",
    });
    expect(result).toEqual({
      ok: true,
      data: { cart: { id: "c1" }, items: [ITEM], totals: TOTALS },
    });
  });
});

describe("addItem", () => {
  it("posts the item with a minted idempotency key", async () => {
    const { cart, calls } = client({ item: ITEM, cartTotals: TOTALS });

    const result = await cart.addItem(IDENTITY, { productId: "p1", qty: 2 });

    expect(calls[0]).toMatchObject({
      method: "POST",
      path: "/api/v1/cart/items",
      body: { productId: "p1", qty: 2 },
      headers: { ...IDENTITY, "x-idempotency-key": "key-1" },
      cache: "no-store",
    });
    expect(result).toEqual({ ok: true, data: { item: ITEM, totals: TOTALS } });
  });

  it("omits variantId when the product has no variant", async () => {
    const { cart, calls } = client({ item: ITEM, cartTotals: TOTALS });

    await cart.addItem(IDENTITY, { productId: "p1", qty: 1, variantId: "" });

    expect(calls[0].body).toEqual({ productId: "p1", qty: 1 });
  });

  it("sends variantId when a variant was chosen", async () => {
    const { cart, calls } = client({ item: ITEM, cartTotals: TOTALS });

    await cart.addItem(IDENTITY, { productId: "p1", variantId: "v9", qty: 1 });

    expect(calls[0].body).toEqual({ productId: "p1", variantId: "v9", qty: 1 });
  });

  it("honours the caller's key so a retry is not a second line", async () => {
    const { cart, calls } = client({ item: ITEM, cartTotals: TOTALS });

    await cart.addItem(IDENTITY, { productId: "p1", qty: 1 }, { idempotencyKey: "caller-key" });

    expect(calls[0].headers).toMatchObject({ "x-idempotency-key": "caller-key" });
  });

  it("passes a 422 through untouched for the island to explain", async () => {
    const perform: Perform = async () => ({
      ok: false,
      kind: "invalid",
      status: 422,
      code: "CART_PRODUCT_UNAVAILABLE",
      message: "unavailable",
    });
    const cart = createCartClient(perform);

    const result = await cart.addItem(IDENTITY, { productId: "p1", qty: 1 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CART_PRODUCT_UNAVAILABLE");
  });
});

describe("updateItem", () => {
  it("patches quantity on the encoded item path", async () => {
    const { cart, calls } = client({ item: ITEM, cartTotals: TOTALS });

    await cart.updateItem(IDENTITY, "i 1", 5);

    expect(calls[0]).toMatchObject({
      method: "PATCH",
      path: "/api/v1/cart/items/i%201",
      body: { qty: 5 },
      headers: { ...IDENTITY, "x-idempotency-key": "key-1" },
    });
  });
});

describe("removals", () => {
  it("removes one line", async () => {
    const { cart, calls } = client(undefined);

    const result = await cart.removeItem(IDENTITY, "i1");

    expect(calls[0]).toMatchObject({
      method: "DELETE",
      path: "/api/v1/cart/items/i1",
      headers: { ...IDENTITY, "x-idempotency-key": "key-1" },
    });
    expect(result).toEqual({ ok: true, data: undefined });
  });

  it("batch removes by id list", async () => {
    const { cart, calls } = client(undefined);

    await cart.removeItems(IDENTITY, ["i1", "i2"]);

    expect(calls[0]).toMatchObject({
      method: "DELETE",
      path: "/api/v1/cart/items",
      body: { ids: ["i1", "i2"] },
    });
  });

  it("clears the whole cart", async () => {
    const { cart, calls } = client(undefined);

    await cart.clear(IDENTITY);

    expect(calls[0]).toMatchObject({ method: "DELETE", path: "/api/v1/cart" });
  });
});

describe("merge", () => {
  it("posts to /merge with both identity forms and returns the cart", async () => {
    const { cart, calls } = client({ cart: { id: "c2", userId: "u1" } });

    const result = await cart.merge({ authorization: "Bearer at", "x-session-id": "guest-abc-123" });

    expect(calls[0]).toMatchObject({
      method: "POST",
      path: "/api/v1/cart/merge",
      headers: {
        authorization: "Bearer at",
        "x-session-id": "guest-abc-123",
        "x-idempotency-key": "key-1",
      },
    });
    expect(result).toEqual({ ok: true, data: { id: "c2", userId: "u1" } });
  });
});

describe("idempotency key generation", () => {
  it("defaults to a UUID when no generator is injected", async () => {
    const calls: RequestOptions<unknown>[] = [];
    const perform: Perform = async <T,>(req: RequestOptions<T>): Promise<ServiceResult<T>> => {
      calls.push(req as unknown as RequestOptions<unknown>);
      return { ok: true, data: undefined as T };
    };

    await createCartClient(perform).removeItem(IDENTITY, "i1");

    expect(calls[0].headers?.["x-idempotency-key"]).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
