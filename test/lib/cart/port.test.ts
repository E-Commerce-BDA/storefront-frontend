/**
 * The cart port — `QuickAddPort` over our own BFF.
 *
 * Two contracts are pinned here: the request shape (path, body, idempotency key
 * minted by the transport) and the three-value error mapping the cards can
 * speak. The abort case is the subtle one — `useQuickAdd` treats an abort as
 * silence, so it has to stay a rejection with a recognisable message rather
 * than a resolved failure.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCartPort, deleteCartItem, getCart, patchCartQty, postCartItem } from "@/lib/cart/port";

const MUTATION = {
  item: { id: "i1", productId: "p1", qty: 1, unitPrice: 12.5, productName: "Mug" },
  totals: { subtotal: 12.5, itemCount: 1, lineCount: 1 },
};

const SNAPSHOT = {
  cart: null,
  items: [],
  totals: { subtotal: 0, itemCount: 0, lineCount: 0 },
};

function stubFetch(status: number, body: unknown) {
  const fetchFn = vi.fn(async () =>
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

function callOf(fetchFn: ReturnType<typeof stubFetch>, index = 0): [string, RequestInit] {
  return fetchFn.mock.calls[index] as unknown as [string, RequestInit];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postCartItem", () => {
  it("posts to the items endpoint with the BFF's mutation schema", async () => {
    const fetchFn = stubFetch(201, MUTATION);

    const result = await postCartItem({ productId: "p1", variantId: "v1", qty: 2 });

    expect(result).toEqual({ ok: true, data: MUTATION });
    const [path, init] = callOf(fetchFn);
    expect(path).toBe("/api/cart/items");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ productId: "p1", variantId: "v1", qty: 2 });
    // Minted by `bff()` before the first attempt, so a 401 replay reuses it.
    expect((init.headers as Record<string, string>)["x-idempotency-key"]).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(init.credentials).toBe("same-origin");
  });

  it("omits an absent variant rather than sending null", async () => {
    const fetchFn = stubFetch(201, MUTATION);

    await postCartItem({ productId: "p1" });

    expect(JSON.parse(String(callOf(fetchFn)[1].body))).toEqual({ productId: "p1", qty: 1 });
  });

  it("rejects a body the schema does not recognise", async () => {
    stubFetch(201, { item: {}, totals: {} });

    const result = await postCartItem({ productId: "p1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("CONTRACT_MISMATCH");
  });
});

describe("patchCartQty / deleteCartItem / getCart", () => {
  it("encodes the item id", async () => {
    const fetchFn = stubFetch(200, MUTATION);

    await patchCartQty("a/b", 2);

    expect(callOf(fetchFn)[0]).toBe("/api/cart/items/a%2Fb");
    expect(callOf(fetchFn)[1].method).toBe("PATCH");
    expect(JSON.parse(String(callOf(fetchFn)[1].body))).toEqual({ qty: 2 });
  });

  it("deletes without a schema — a 204 has no body to validate", async () => {
    const fetchFn = stubFetch(204, null);

    const result = await deleteCartItem("i1");

    expect(result).toEqual({ ok: true, data: undefined });
    expect(callOf(fetchFn)[1].method).toBe("DELETE");
  });

  it("accepts the empty-cart answer with a null cart", async () => {
    stubFetch(200, SNAPSHOT);

    const result = await getCart();

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.cart).toBeNull();
  });
});

describe("createCartPort", () => {
  it("reports a successful add and hands back the server line", async () => {
    stubFetch(201, MUTATION);
    const onAdded = vi.fn();
    const port = createCartPort({ onAdded });

    const result = await port.add("p1", new AbortController().signal);

    expect(result).toEqual({ ok: true });
    expect(onAdded).toHaveBeenCalledWith(MUTATION);
  });

  it("maps 422 to out-of-stock, the one error with its own copy", async () => {
    stubFetch(422, { error: { code: "CART_PRODUCT_UNAVAILABLE" } });

    const result = await createCartPort().add("p1", new AbortController().signal);

    expect(result).toEqual({ ok: false, error: "out-of-stock" });
  });

  it("maps anything else to unavailable", async () => {
    stubFetch(503, { error: { code: "CART_UNAVAILABLE" } });

    const result = await createCartPort().add("p1", new AbortController().signal);

    expect(result).toEqual({ ok: false, error: "unavailable" });
  });

  it("rejects an already-aborted call instead of adding it", async () => {
    const fetchFn = stubFetch(201, MUTATION);
    const controller = new AbortController();
    controller.abort();

    await expect(createCartPort().add("p1", controller.signal)).rejects.toThrow("aborted");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("rejects with 'aborted' when the request is cancelled mid-flight", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("aborted", "AbortError");
      }),
    );

    await expect(
      createCartPort().add("p1", new AbortController().signal),
    ).rejects.toThrow("aborted");
  });
});
