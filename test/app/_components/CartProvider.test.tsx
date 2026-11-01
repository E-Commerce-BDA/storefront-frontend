// @vitest-environment jsdom
/**
 * CartProvider — the one store behind the badge, the drawer, `/cart` and
 * `/checkout`.
 *
 * Five behaviours are pinned here, and only the first is about fetching:
 *
 * 1. one read on mount, and the store speaks the shopper's language (count is
 *    units, not lines);
 * 2. an add is visible **before** the BFF answers — the placeholder line lands
 *    synchronously, then the server's line replaces it (same quantity, real
 *    price);
 * 3. a refused write snaps back to exactly `before` and raises one toast — a
 *    quantity that looks applied but was rejected is the worst outcome;
 * 4. a pending line (no server id yet) ignores qty/remove, because cart-svc has
 *    never seen that id and the write would 404;
 * 5. clear is optimistic and restores the cart on failure.
 *
 * `fetch` is stubbed at the BFF boundary, which is the real contract: the paths
 * and bodies asserted below are what `app/api/**` answers to.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import CartProvider, { useCart } from "@/app/_components/CartProvider";
import type { CartItemDto } from "@/lib/cart/schemas";

interface Call {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

type Reply = Response | Promise<Response>;

function stubBff(handler: (call: Call) => Reply): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown, init: RequestInit = {}) => {
      const call: Call = {
        method: init.method ?? "GET",
        path: String(input),
        body: typeof init.body === "string" ? JSON.parse(init.body) : null,
        headers: (init.headers ?? {}) as Record<string, string>,
      };
      calls.push(call);
      return handler(call);
    }),
  );
  return calls;
}

function ok(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** The BFF's failure envelope, which is cart-svc's envelope. */
function fail(status: number, code: string): Response {
  return new Response(JSON.stringify({ error: { code } }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function line(overrides: Partial<CartItemDto> = {}): CartItemDto {
  return {
    id: "i1",
    productId: "p1",
    variantId: null,
    qty: 1,
    unitPrice: 10,
    productName: "Mug",
    ...overrides,
  } as CartItemDto;
}

/** What `GET /api/cart` answers: cart rows can be absent, items never null. */
function snapshot(items: CartItemDto[] = []) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  return {
    cart: items.length === 0 ? null : { id: "c1" },
    items,
    totals: {
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
      lineCount: items.length,
    },
  };
}

function mount() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

const methods = (calls: Call[]) => calls.map((call) => `${call.method} ${call.path}`);

const toast = () => document.body.querySelector('[role="status"]')?.textContent ?? "";

describe("mount", () => {
  it("reads the cart once and reports units, not lines", async () => {
    const calls = stubBff(() =>
      ok(snapshot([line({ id: "i1", qty: 3 }), line({ id: "i2", productId: "p2", unitPrice: 5 })])),
    );

    const { result } = mount();
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(methods(calls)).toEqual(["GET /api/cart"]);
    expect(result.current.count).toBe(4);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.subtotal).toBe(35);
    expect(result.current.empty).toBe(false);
  });

  it("stays empty rather than erroring when the BFF answers zeros", async () => {
    // The signed-out answer: 200 with no cart, not a 401 — so a first visit
    // never paints an error in the header.
    stubBff(() => ok(snapshot()));

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.empty).toBe(true);
    expect(result.current.count).toBe(0);
  });

  it("surfaces an unreachable BFF as status error without throwing", async () => {
    stubBff(() => Promise.resolve(fail(503, "CART_UNAVAILABLE")));

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.items).toEqual([]);
    expect(toast()).toBe("");
  });
});

describe("add", () => {
  it("shows the optimistic line before the server answers, then the real one", async () => {
    let release!: (response: Response) => void;
    stubBff((call) => {
      if (call.method === "GET") return ok(snapshot());
      return new Promise<Response>((resolve) => {
        release = resolve;
      });
    });

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => {
      void result.current.add("p1", { qty: 2 });
    });

    // Visible immediately: the count is the feedback a grid card can give.
    expect(result.current.count).toBe(2);
    expect(result.current.items[0].id).toContain("pending:");

    await act(async () => {
      release(
        ok({
          item: line({ id: "i9", qty: 2, unitPrice: 12.5 }),
          totals: { subtotal: 25, itemCount: 2, lineCount: 1 },
        }),
      );
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ id: "i9", qty: 2, unitPrice: 12.5 });
    expect(result.current.subtotal).toBe(25);
  });

  it("sends the variant with the add and reverts a sold-out line with a toast", async () => {
    const calls = stubBff((call) => {
      if (call.method === "GET") return ok(snapshot());
      return fail(422, "CART_PRODUCT_UNAVAILABLE");
    });

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    let added = true;
    await act(async () => {
      added = await result.current.add("p1", { variantId: "red", qty: 1 });
    });

    expect(added).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(calls[calls.length - 1].body).toEqual({ productId: "p1", qty: 1, variantId: "red" });
    expect(toast()).toContain("sold out");
  });
});

describe("setQty / remove", () => {
  it("reverts to the previous quantity when the BFF refuses", async () => {
    stubBff((call) => {
      if (call.method === "GET") return ok(snapshot([line({ qty: 1, unitPrice: 10 })]));
      return fail(409, "CART_CONFLICT");
    });

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    let applied = true;
    await act(async () => {
      applied = await result.current.setQty("i1", 5);
    });

    expect(applied).toBe(false);
    expect(result.current.items[0].qty).toBe(1);
    expect(result.current.subtotal).toBe(10);
    expect(toast()).toContain("could not update your cart");
  });

  it("keeps the server's quantity when the write succeeds", async () => {
    const calls = stubBff((call) => {
      if (call.method === "GET") return ok(snapshot([line({ qty: 1 })]));
      // cart-svc answers with the line's new total, which wins over the
      // optimistic guess.
      return ok({
        item: line({ qty: 4, unitPrice: 10 }),
        totals: { subtotal: 40, itemCount: 4, lineCount: 1 },
      });
    });

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.setQty("i1", 4);
    });

    expect(result.current.items[0].qty).toBe(4);
    expect(result.current.subtotal).toBe(40);
    expect(methods(calls)).toEqual(["GET /api/cart", "PATCH /api/cart/items/i1"]);
  });

  it("ignores a write to a line the server has not confirmed yet", async () => {
    let release!: (response: Response) => void;
    const calls = stubBff((call) => {
      if (call.method === "GET") return ok(snapshot());
      return new Promise<Response>((resolve) => {
        release = resolve;
      });
    });

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => {
      void result.current.add("p1");
    });
    const pendingId = result.current.items[0].id;

    let changed = true;
    await act(async () => {
      // A pending id would 404 at cart-svc — refuse locally instead.
      changed = await result.current.setQty(pendingId, 5);
    });

    expect(changed).toBe(false);
    expect(methods(calls)).toEqual(["GET /api/cart", "POST /api/cart/items"]);

    // Let the add settle so nothing updates after unmount.
    await act(async () => {
      release(
        ok({
          item: line({ id: "i9" }),
          totals: { subtotal: 10, itemCount: 1, lineCount: 1 },
        }),
      );
    });
  });

  it("restores the line when a remove fails", async () => {
    stubBff((call) => {
      if (call.method === "GET") return ok(snapshot([line({ qty: 2 })]));
      return fail(503, "CART_UNAVAILABLE");
    });

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.remove("i1");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(2);
    expect(toast()).toContain("not responding");
  });
});

describe("clear", () => {
  it("empties the store, then restores it when the BFF refuses", async () => {
    stubBff((call) => {
      if (call.method === "GET") return ok(snapshot([line({ qty: 2 })]));
      return fail(503, "CART_UNAVAILABLE");
    });

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    let cleared = true;
    await act(async () => {
      cleared = await result.current.clear();
    });

    expect(cleared).toBe(false);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(2);
  });

  it("leaves an empty store empty on success", async () => {
    stubBff((call) => (call.method === "DELETE" ? ok(null, 204) : ok(snapshot([line()]))));

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.clear();
    });

    expect(result.current.empty).toBe(true);
    expect(result.current.count).toBe(0);
  });
});

describe("drawer", () => {
  it("is closed until asked, and closes again", async () => {
    stubBff(() => ok(snapshot()));

    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.drawerOpen).toBe(false);
    act(() => result.current.openDrawer());
    expect(result.current.drawerOpen).toBe(true);
    act(() => result.current.closeDrawer());
    expect(result.current.drawerOpen).toBe(false);
  });
});
