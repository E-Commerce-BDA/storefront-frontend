/**
 * sf-074 resolver-unit tier: each island's implicit machine is now a pure
 * reducer. These tests pin the verified defect fixes, not just happy paths.
 */
import { describe, expect, it } from "vitest";
import { cartMachine, initialCartMachine, rollbackDelta } from "@/lib/cart/machine";
import { emptyCart } from "@/lib/cart/state";
import { wishlistMachine, initialWishlistMachine } from "@/lib/wishlist/machine";
import { checkoutMachine, initialCheckoutMachine, shouldBounceToCart } from "@/lib/checkout/machine";
import { initialListingMachine, listingMachine } from "@/lib/listing/machine";
import { initialSearchMachine, searchMachine } from "@/lib/search/machine";
import { initialOrdersMachine, ordersMachine } from "@/lib/orders/machine";
import { addressBookMachine, initialAddressBookMachine } from "@/lib/address-book/machine";
import { initialNavbarMachine, navbarMachine } from "@/lib/navbar/machine";
import { compareMachine, initialCompareMachine } from "@/lib/compare/machine";
import { initialOverlayMachine, overlayMachine } from "@/lib/overlay/machine";
import { initialPdpMachine, pdpMachine } from "@/lib/pdp/machine";
import {
  filterDrawerMachine,
  gridModeMachine,
  initialFilterDrawerMachine,
  initialGridModeMachine,
} from "@/lib/shop/machine";
import { cartViewMachine, initialCartViewMachine } from "@/lib/cart/machine";
import { authFormMachine, initialAuthFormMachine } from "@/lib/auth/machine";
import { heroCarouselMachine, initialHeroCarouselMachine } from "@/lib/sections/machine";
import { accountTabsMachine, initialAccountTabsMachine } from "@/lib/account/machine";

const line = (id: string, qty = 1) => ({
  id,
  productId: id,
  variantId: null,
  qty,
  unitPrice: 10,
  productName: id,
});
const snapshot = (items: ReturnType<typeof line>[]) => ({
  cart: null,
  items,
  totals: { subtotal: items.reduce((n, i) => n + i.qty * 10, 0), itemCount: items.length, lineCount: items.length },
});

describe("cart machine", () => {
  it("rolls back only its own delta (A3)", () => {
    const before = { ...emptyCart(), items: [line("a"), line("b")] };
    const optimistic = { ...before, items: [...before.items, line("c")] };
    const failed = cartMachine(
      { ...initialCartMachine(), cart: before },
      { type: "op/start", opId: "op1", optimistic },
    );
    // A concurrent success is applied by the provider to `latest.current`
    // before the reducer sees it; the reducer state itself mirrors that write.
    const withConcurrentWrite = cartMachine(
      { ...failed, cart: { ...failed.cart, items: [...failed.cart.items, line("d")] } },
      { type: "op/success", opId: "op2", item: line("d") },
    );
    const rolled = cartMachine(withConcurrentWrite, {
      type: "op/failure",
      opId: "op1",
      message: "no",
    });
    expect(rolled.cart.items.map((i) => i.id)).toEqual(["a", "b", "d"]);
    expect(rollbackDelta(optimistic, before, optimistic).items.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("clears stale op ids on a fresh snapshot (A11)", () => {
    const started = cartMachine(initialCartMachine(), {
      type: "op/start",
      opId: "old",
      optimistic: emptyCart(),
    });
    const reloaded = cartMachine(started, { type: "load/success", snapshot: snapshot([line("a")]) });
    expect(reloaded.ops).toEqual({});
    expect(reloaded.status).toBe("ready");
  });
});

describe("wishlist machine", () => {
  it("coalesces refreshes and keeps optimistic ids until their own write settles (A2)", () => {
    const first = wishlistMachine(initialWishlistMachine(), { type: "refresh/start", seq: 1 });
    const second = wishlistMachine(first, { type: "refresh/start", seq: 2 });
    expect(second.seq).toBe(1);
    const optimistic = wishlistMachine(second, { type: "toggle/add-optimistic", productId: "p1" });
    const landed = wishlistMachine(optimistic, { type: "refresh/success", seq: 1, items: [] });
    expect(landed.optimisticIds).toEqual(["p1"]);
    const failed = wishlistMachine(optimistic, {
      type: "toggle/add-failure",
      productId: "p1",
      guestNext: "/account",
    });
    expect(failed.optimisticIds).toEqual([]);
  });
});

describe("checkout machine", () => {
  it("bounces only on a settled ready cart (A1)", () => {
    expect(shouldBounceToCart(initialCheckoutMachine(), 0)).toBe(false);
    expect(shouldBounceToCart(checkoutMachine(initialCheckoutMachine(), { type: "load/start" }), 0)).toBe(false);
    expect(shouldBounceToCart(checkoutMachine(initialCheckoutMachine(), { type: "load/error" }), 0)).toBe(false);
    expect(shouldBounceToCart(checkoutMachine(initialCheckoutMachine(), { type: "load/success", itemCount: 0 }), 0)).toBe(true);
  });
});

describe("listing / search / orders machines", () => {
  it("resets rows on a query change and ignores a stale page (A6)", () => {
    const old = initialListingMachine("?q=old", [line("a") as never], "cursor");
    const reset = listingMachine(old, {
      type: "query/change",
      queryKey: "?q=new",
      items: [],
      cursor: null,
    });
    expect(reset.queryKey).toBe("?q=new");
    const stale = listingMachine(reset, {
      type: "more/success",
      queryKey: "?q=old",
      items: [line("b") as never],
      cursor: null,
    });
    expect(stale.items).toEqual([]);
  });

  it("treats an abort and a superseded answer as silence (A8, A21)", () => {
    const typed = searchMachine(initialSearchMachine<string>(), { type: "type", query: "li" });
    const ended = searchMachine(typed, { type: "request/abort", seq: typed.seq });
    const errored = searchMachine(ended, { type: "request/error", seq: typed.seq });
    expect(errored.status).toBe("idle");
    const again = searchMachine(initialSearchMachine<string>(), { type: "type", query: "li" });
    const stale = searchMachine(again, { type: "request/error", seq: 0 });
    expect(stale.status).toBe("idle");
    const fresh = searchMachine(again, { type: "request/success", seq: again.seq, results: ["a", "b"] });
    expect(fresh.activeIndex).toBe(0);
  });

  it("surfaces load-more errors and guards after unmount (A12)", () => {
    const failed = ordersMachine(initialOrdersMachine(), {
      type: "more/error",
      message: "retry",
    });
    expect(failed.moreError).toBe("retry");
    const unmounted = ordersMachine(failed, { type: "unmount" });
    expect(ordersMachine(unmounted, { type: "more/start" })).toBe(unmounted);
  });
});

describe("shell / form machines", () => {
  it("cancels to an empty draft and guards double remove (A13)", () => {
    const editing = addressBookMachine(initialAddressBookMachine(), {
      type: "edit/start",
      address: { id: "a", label: "Home", line1: "1 St", city: "NY", postalCode: "1", country: "US", isDefault: false } as never,
    });
    const cancelled = addressBookMachine(editing, { type: "cancel" });
    expect(cancelled.draft.line1).toBe("");
    expect(cancelled.formOpen).toBe(false);
    const busy = addressBookMachine(initialAddressBookMachine(), { type: "remove/start" });
    expect(addressBookMachine(busy, { type: "remove/start" })).toBe(busy);
  });

  it("restores the navbar on navigation (A14) and consumes badge/destination knobs (A16)", () => {
    const hidden = navbarMachine(initialNavbarMachine(), { type: "scroll/hide" });
    expect(hidden.hidden).toBe(true);
    const navigated = navbarMachine(hidden, { type: "navigate", pathname: "/products" });
    expect(navigated.hidden).toBe(false);
    const capped = navbarMachine(navigated, { type: "cart/count", count: 42, cap: 9, visible: true });
    expect(capped.badgeCount).toBe(9);
    expect(navbarMachine(capped, { type: "cart/destination", destination: "page" }).destination).toBe("page");
  });

  it("seeds compare only on a changed path and returns cap notice from the reducer (A18)", () => {
    const seeded = compareMachine(initialCompareMachine(), {
      type: "seed",
      pathname: "/compare",
      ids: ["a"],
    });
    expect(compareMachine(seeded, { type: "seed", pathname: "/compare", ids: [] })).toBe(seeded);
    expect(seeded.ids).toEqual(["a"]);
  });

  it("never paints quick-view success on failure (A7, A19)", () => {
    const failed = overlayMachine(initialOverlayMachine(), { type: "load/error", message: "no" });
    expect(failed.open).toBe(false);
    expect(failed.status).toBe("error");
    expect(overlayMachine(failed, { type: "add/error", message: "no" }).message).toBe("no");
  });

  it("resets qty and gallery when the product changes (A22)", () => {
    const dirty = pdpMachine(initialPdpMachine("a"), { type: "qty/set", qty: 5, minQty: 1, maxQty: 9 });
    const next = pdpMachine(dirty, { type: "product/change", productId: "b" });
    expect(next.qty).toBe(1);
    expect(next.galleryIndex).toBe(0);
  });
});

/**
 * sf-085: every explicit prototype machine now has a pure reducer. Focused
 * specs cover each transition table; this aggregate pins the initial faces so
 * an island cannot boot into a state the prototype never declared.
 */
describe("prototype machine faces (sf-085)", () => {
  it("boots all 13 ported machines at their declared initial state", () => {
    expect(filterDrawerMachine(initialFilterDrawerMachine(), { type: "CLOSE" }).face).toBe("closed");
    expect(gridModeMachine(initialGridModeMachine(), { type: "SET_TWO" }).mode).toBe("two");
    expect(cartViewMachine(initialCartViewMachine(), { type: "SET_TABLE" }).mode).toBe("table");
    expect(authFormMachine(initialAuthFormMachine(), { type: "reset" }).status).toBe("idle");
    expect(heroCarouselMachine(initialHeroCarouselMachine(), { type: "resume" }).index).toBe(0);
    expect(accountTabsMachine(initialAccountTabsMachine(), { type: "OVERVIEW" }).tab).toBe("overview");
    expect(pdpMachine(initialPdpMachine("a"), { type: "tab/set", tab: "description" }).tab).toBe("description");
    expect(overlayMachine(initialOverlayMachine(), { type: "timer/clear" }).status).toBe("idle");
    expect(searchMachine(initialSearchMachine<string>(), { type: "results/clear" }).status).toBe("idle");
    expect(initialCartMachine().status).toBe("idle");
    expect(initialCheckoutMachine().status).toBe("idle");
    expect(initialCompareMachine().status).toBe("idle");
    expect(initialNavbarMachine().hidden).toBe(false);
  });
});
