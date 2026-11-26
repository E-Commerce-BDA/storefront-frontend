/**
 * Cart island machine — sf-074 (A3, A11).
 * Pure: no React, no fetch. The provider dispatches, this module decides.
 *
 * A3: a failed optimistic write rolls back **its own delta**, never a stored
 * whole-cart snapshot — a concurrent add that landed while the write was in
 * flight survives. Deltas are keyed by op id, so two overlapping writes cannot
 * undo each other.
 * A11: a successful GET clears all outstanding op ids; stale ids from a
 * previous cart can never be reconciled against the new snapshot.
 */
import type { CartItemDto } from "@/lib/cart/schemas";
import { emptyCart, reconcile, withItems, type CartState } from "@/lib/cart/state";
import { statusForItems, type Status } from "@/lib/machine/status";

interface Delta {
  added: string[];
  removed: CartItemDto[];
  changed: Record<string, CartItemDto>;
}

export interface CartMachineState {
  cart: CartState;
  status: Status;
  ops: Record<string, Delta>;
  notice: string | null;
}

export type CartMachineEvent =
  | { type: "load/start" }
  | { type: "load/success"; snapshot: Parameters<typeof reconcile>[0] }
  | { type: "load/error" }
  | { type: "op/start"; opId: string; optimistic: CartState }
  | { type: "op/success"; opId: string; item?: CartItemDto }
  | { type: "op/failure"; opId: string; message: string }
  | { type: "clear/start" }
  | { type: "clear/failure"; message: string }
  | { type: "notice/dismiss" };

export function initialCartMachine(): CartMachineState {
  return { cart: emptyCart(), status: "idle", ops: {}, notice: null };
}

function delta(before: CartState, after: CartState): Delta {
  const beforeById = new Map(before.items.map((item) => [item.id, item]));
  const afterById = new Map(after.items.map((item) => [item.id, item]));
  const changed: Record<string, CartItemDto> = {};
  for (const [id, item] of afterById) {
    const prior = beforeById.get(id);
    if (prior !== undefined && JSON.stringify(prior) !== JSON.stringify(item)) changed[id] = prior;
  }
  return {
    added: after.items.filter((item) => !beforeById.has(item.id)).map((item) => item.id),
    removed: before.items.filter((item) => !afterById.has(item.id)),
    changed,
  };
}

function undo(cart: CartState, op: Delta): CartState {
  const added = new Set(op.added);
  const items = cart.items.filter((item) => !added.has(item.id));
  for (const removed of op.removed) {
    if (!items.some((item) => item.id === removed.id)) items.push(removed);
  }
  return withItems(
    cart,
    items.map((item) => op.changed[item.id] ?? item),
  );
}

/** Pure inverse of a local optimistic transition, used by the provider mirror. */
export function rollbackDelta(cart: CartState, before: CartState, after: CartState): CartState {
  return undo(cart, delta(before, after));
}

export function cartMachine(state: CartMachineState, event: CartMachineEvent): CartMachineState {
  switch (event.type) {
    case "load/start":
      return { ...state, status: "loading" };
    case "load/success": {
      const cart = reconcile(event.snapshot);
      // A11: a new snapshot invalidates every id from the previous cart.
      return { cart, status: "ready", ops: {}, notice: null };
    }
    case "load/error":
      // A failed GET is a status, not a shopper toast — the cart face says so.
      return { ...state, status: "error" };
    case "op/start": {
      const ops = { ...state.ops, [event.opId]: delta(state.cart, event.optimistic) };
      return { ...state, cart: event.optimistic, ops, notice: null };
    }
    case "op/success": {
      const { [event.opId]: _done, ...ops } = state.ops;
      const cart =
        event.item === undefined
          ? state.cart
          : withItems(state.cart, [
              ...state.cart.items.filter(
                (item) => `${item.productId}:${item.variantId ?? ""}` !== `${event.item!.productId}:${event.item!.variantId ?? ""}`,
              ),
              event.item,
            ]);
      return { ...state, cart, ops, status: statusForItems(cart.items.length) };
    }
    case "op/failure": {
      const op = state.ops[event.opId];
      if (op === undefined) return { ...state, notice: event.message };
      const { [event.opId]: _failed, ...ops } = state.ops;
      return { ...state, cart: undo(state.cart, op), ops, notice: event.message };
    }
    case "clear/start":
      return { ...state, cart: emptyCart(), status: "empty", ops: {}, notice: null };
    case "clear/failure":
      // A clear has no delta to invert; only a fresh GET can restore the truth.
      return { ...state, status: "error", notice: event.message };
    case "notice/dismiss":
      return { ...state, notice: null };
  }
}
