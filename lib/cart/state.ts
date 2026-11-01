/**
 * Cart state — sf-051
 * (1.Architecture.md §6.7 · plan §9)
 *
 * A pure reducer, no React: `applyAdd`, `applyQty`, `applyRemove`,
 * `applyRemoveMany`, `applyItem`, `reconcile`, `toView`. The provider is a thin
 * shell over these, which is what makes "optimistic then revert" testable
 * without a DOM — the hard part is the arithmetic, not the hooks.
 *
 * Three decisions:
 *
 * - **Totals are derived, not trusted, while optimistic.** `applyQty` rewrites
 *   the line and recomputes `{subtotal, itemCount, lineCount}` from the items,
 *   so the header count and the subtotal can never disagree mid-flight.
 *   `reconcile` then takes the server's numbers verbatim — cart-svc prices at
 *   write time and is the only authority once its answer lands.
 * - **Money is rounded to cents on every recompute.** `0.1 + 0.2` in a subtotal
 *   is a visible bug; two decimal rounding after each sum keeps the optimistic
 *   value equal to the server's for the same basket.
 * - **Lines are keyed by `productId:variantId`, not by item id.** An optimistic
 *   line has no server id yet, and cart-svc itself merges a repeat add into the
 *   existing line — so the temp line and the real one must collapse.
 *   `applyItem` (not `applyAdd`) overwrites, because the server's `qty` is the
 *   total, not a delta.
 */

import type { CartItemDto, CartSnapshotDto, CartTotalsDto } from "@/lib/cart/schemas";

export interface CartState {
  /** null until a cart row exists — a guest who has not added anything yet. */
  cartId: string | null;
  items: CartItemDto[];
  totals: CartTotalsDto;
}

export function emptyCart(): CartState {
  return {
    cartId: null,
    items: [],
    totals: { subtotal: 0, itemCount: 0, lineCount: 0 },
  };
}

/** The server's envelope → state. `cart` is null before the first item. */
export function fromSnapshot(snapshot: CartSnapshotDto): CartState {
  return {
    cartId: snapshot.cart?.id ?? null,
    items: snapshot.items,
    totals: snapshot.totals,
  };
}

export function lineKey(item: Pick<CartItemDto, "productId" | "variantId">): string {
  return `${item.productId}:${item.variantId ?? ""}`;
}

/**
 * Upsert by line key, **adding** the quantities. Used for the optimistic step
 * of an add: the shopper tapped "+1", so +1 is what the line shows until the
 * server's own number arrives via `applyItem`.
 */
export function applyAdd(state: CartState, item: CartItemDto): CartState {
  const key = lineKey(item);
  const existing = state.items.find((line) => lineKey(line) === key);
  const items =
    existing === undefined
      ? [...state.items, item]
      : state.items.map((line) =>
          // Keep the id already on the line: it is either the server's or the
          // pending one that `applyItem` will replace when the response lands.
          lineKey(line) === key ? { ...item, id: line.id, qty: line.qty + item.qty } : line,
        );
  return recompute(state, items);
}

/**
 * Overwrite the line for `item`'s key with the server's version — the real id,
 * the real name/price, and the *total* quantity. Never adds quantities.
 */
export function applyItem(state: CartState, item: CartItemDto): CartState {
  const key = lineKey(item);
  const exists = state.items.some((line) => lineKey(line) === key);
  const items = exists
    ? state.items.map((line) => (lineKey(line) === key ? item : line))
    : [...state.items, item];
  return recompute(state, items);
}

export function applyQty(state: CartState, itemId: string, qty: number): CartState {
  const next = Math.max(1, Math.trunc(qty));
  const items = state.items.map((line) => (line.id === itemId ? { ...line, qty: next } : line));
  return recompute(state, items);
}

export function applyRemove(state: CartState, itemId: string): CartState {
  return recompute(
    state,
    state.items.filter((line) => line.id !== itemId),
  );
}

export function applyRemoveMany(state: CartState, itemIds: string[]): CartState {
  const drop = new Set(itemIds);
  return recompute(
    state,
    state.items.filter((line) => !drop.has(line.id)),
  );
}

/**
 * Replace everything with the server's answer (the GET, or a read after a
 * mutation). Deliberately one argument: there is nothing to reconcile *with*
 * local state — cart-svc is the authority, and a merge here would be a way to
 * keep a line the server already removed.
 */
export function reconcile(snapshot: CartSnapshotDto): CartState {
  return fromSnapshot(snapshot);
}

export interface CartView {
  lines: CartItemDto[];
  /** Units, not lines: "3 items" for one line of qty 3. */
  count: number;
  subtotal: number;
  empty: boolean;
}

/** The three numbers the shell and the drawer render. */
export function toView(state: CartState): CartView {
  return {
    lines: state.items,
    count: state.totals.itemCount,
    subtotal: state.totals.subtotal,
    empty: state.items.length === 0,
  };
}

/** `lineTotal` for display; never trust a stale one after an optimistic qty. */
export function lineTotal(item: CartItemDto): number {
  return round(item.unitPrice * item.qty);
}

function recompute(state: CartState, items: CartItemDto[]): CartState {
  let subtotal = 0;
  let itemCount = 0;
  for (const item of items) {
    subtotal += lineTotal(item);
    itemCount += item.qty;
  }
  return {
    cartId: state.cartId,
    items,
    totals: { subtotal: round(subtotal), itemCount, lineCount: items.length },
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Marks a line that has no server id yet (see `applyAdd`). */
export const PENDING_PREFIX = "pending:";

export function pendingItemId(key: string): string {
  return `${PENDING_PREFIX}${key}`;
}

export function isPendingId(id: string): boolean {
  return id.startsWith(PENDING_PREFIX);
}
