/**
 * The cart reducer — the arithmetic behind every optimistic update.
 *
 * Nothing here touches React or fetch, which is the point: the provider's job
 * is to call these and revert on failure, so the behaviour that can actually be
 * wrong (merged quantities, cent rounding, a placeholder line collapsing into
 * the real one) is provable without a DOM.
 */
import { describe, expect, it } from "vitest";
import type { CartItemDto } from "@/lib/cart/schemas";
import {
  applyAdd,
  applyItem,
  applyQty,
  applyRemove,
  applyRemoveMany,
  emptyCart,
  fromSnapshot,
  isPendingId,
  lineKey,
  lineTotal,
  pendingItemId,
  reconcile,
  toView,
} from "@/lib/cart/state";

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

describe("emptyCart", () => {
  it("is all zeros with no cart row", () => {
    expect(emptyCart()).toEqual({
      cartId: null,
      items: [],
      totals: { subtotal: 0, itemCount: 0, lineCount: 0 },
    });
  });

  it("hands out a fresh array each time", () => {
    expect(emptyCart().items).not.toBe(emptyCart().items);
  });
});

describe("applyAdd", () => {
  it("appends a new line and derives the totals", () => {
    const state = applyAdd(emptyCart(), line({ qty: 2, unitPrice: 12.5 }));

    expect(state.items).toHaveLength(1);
    expect(state.totals).toEqual({ subtotal: 25, itemCount: 2, lineCount: 1 });
  });

  it("adds to the quantity when the same product and variant is already there", () => {
    const once = applyAdd(emptyCart(), line({ qty: 1 }));
    const twice = applyAdd(once, line({ qty: 1 }));

    expect(twice.items).toHaveLength(1);
    expect(twice.items[0].qty).toBe(2);
    expect(twice.totals.itemCount).toBe(2);
  });

  it("keeps a different variant as its own line", () => {
    const red = applyAdd(emptyCart(), line({ id: "i1", variantId: "red" }));
    const blue = applyAdd(red, line({ id: "i2", variantId: "blue" }));

    expect(blue.items).toHaveLength(2);
    expect(blue.totals.lineCount).toBe(2);
  });

  it("keeps the id already on the line, so the server's later replace works", () => {
    const pending: CartItemDto = line({ id: pendingItemId("p1:"), unitPrice: 0, productName: "" });
    const state = applyAdd(emptyCart(), pending);

    expect(state.items[0].id).toBe(pending.id);
  });
});

describe("applyItem", () => {
  it("replaces the pending line with the server's version", () => {
    const pending: CartItemDto = line({
      id: pendingItemId("p1:"),
      qty: 1,
      unitPrice: 0,
      productName: "",
    });
    const optimistic = applyAdd(emptyCart(), pending);

    // The server's qty is the *total*, not a delta.
    const settled = applyItem(optimistic, line({ id: "i9", qty: 3, unitPrice: 12.5 }));

    expect(settled.items).toHaveLength(1);
    expect(settled.items[0]).toMatchObject({ id: "i9", qty: 3, productName: "Mug" });
    expect(settled.totals).toEqual({ subtotal: 37.5, itemCount: 3, lineCount: 1 });
  });

  it("appends when the line is not there yet", () => {
    const state = applyItem(emptyCart(), line());

    expect(state.items).toHaveLength(1);
  });
});

describe("applyQty", () => {
  it("sets the quantity and recomputes the subtotal", () => {
    const state = applyQty(applyAdd(emptyCart(), line({ unitPrice: 12.5 })), "i1", 4);

    expect(state.items[0].qty).toBe(4);
    expect(state.totals).toEqual({ subtotal: 50, itemCount: 4, lineCount: 1 });
  });

  it("clamps to at least one — removal is its own action", () => {
    const state = applyQty(applyAdd(emptyCart(), line()), "i1", 0);

    expect(state.items[0].qty).toBe(1);
  });

  it("truncates a fractional quantity", () => {
    const state = applyQty(applyAdd(emptyCart(), line()), "i1", 2.9);

    expect(state.items[0].qty).toBe(2);
  });

  it("ignores an id that is not in the cart", () => {
    const before = applyAdd(emptyCart(), line());

    expect(applyQty(before, "nope", 5)).toEqual(before);
  });
});

describe("applyRemove / applyRemoveMany", () => {
  it("drops one line and fixes the totals", () => {
    const two = applyAdd(applyAdd(emptyCart(), line({ id: "i1" })), line({ id: "i2", productId: "p2" }));
    const one = applyRemove(two, "i1");

    expect(one.items).toHaveLength(1);
    expect(one.totals.lineCount).toBe(1);
  });

  it("drops a batch in one pass", () => {
    const three = applyAdd(
      applyAdd(applyAdd(emptyCart(), line({ id: "i1" })), line({ id: "i2", productId: "p2" })),
      line({ id: "i3", productId: "p3" }),
    );

    const left = applyRemoveMany(three, ["i1", "i3"]);

    expect(left.items.map((item) => item.id)).toEqual(["i2"]);
    expect(left.totals.itemCount).toBe(1);
  });
});

describe("money", () => {
  it("rounds to cents so an optimistic subtotal matches the server's", () => {
    const state = applyAdd(
      applyAdd(emptyCart(), line({ id: "i1", unitPrice: 0.1 })),
      line({ id: "i2", productId: "p2", unitPrice: 0.2 }),
    );

    expect(state.totals.subtotal).toBe(0.3);
  });

  it("derives a line total from the unit price, never a stale field", () => {
    expect(lineTotal(line({ unitPrice: 3.33, qty: 3 }))).toBe(9.99);
  });
});

describe("reconcile / fromSnapshot", () => {
  it("takes the server's totals verbatim", () => {
    // cart-svc prices at write time; its numbers win over anything local.
    const state = reconcile({
      cart: { id: "c1" },
      items: [line({ qty: 2, unitPrice: 5 })],
      totals: { subtotal: 12, itemCount: 2, lineCount: 1 },
    });

    expect(state.cartId).toBe("c1");
    expect(state.totals.subtotal).toBe(12);
  });

  it("accepts a null cart — the answer before the first item", () => {
    const state = fromSnapshot({
      cart: null,
      items: [],
      totals: { subtotal: 0, itemCount: 0, lineCount: 0 },
    });

    expect(state.cartId).toBeNull();
    expect(state.items).toEqual([]);
  });
});

describe("toView", () => {
  it("reports units as the count, not lines", () => {
    const state = applyAdd(applyAdd(emptyCart(), line({ id: "i1", qty: 3 })), line({ id: "i2", productId: "p2" }));
    const view = toView(state);

    expect(view.count).toBe(4);
    expect(view.lines).toHaveLength(2);
    expect(view.empty).toBe(false);
  });

  it("is empty when there are no lines", () => {
    expect(toView(emptyCart()).empty).toBe(true);
  });
});

describe("pending ids", () => {
  it("marks a line that has no server id yet", () => {
    const id = pendingItemId(lineKey({ productId: "p1", variantId: "red" }));

    expect(isPendingId(id)).toBe(true);
    expect(isPendingId("i1")).toBe(false);
    expect(id).toBe("pending:p1:red");
  });
});
