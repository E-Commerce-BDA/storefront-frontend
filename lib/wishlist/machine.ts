/**
 * Wishlist island machine — sf-074 (A2, A17).
 * Pure: no React, no fetch. A2: an optimistic add is overlaid on every refresh
 * result until its own write settles, and overlapping refreshes are coalesced
 * by sequence number instead of racing to overwrite `items`.
 */
import type { HydratedWishlistEntry } from "@/lib/wishlist/schemas";
import { statusForItems, type Status } from "@/lib/machine/status";

export interface WishlistMachineState {
  items: HydratedWishlistEntry[];
  status: Status;
  /** Incremented per refresh; only the newest answer is allowed to land. */
  seq: number;
  inFlight: boolean;
  optimisticIds: string[];
  pendingIds: string[];
  guestPrompt: { productId: string; next: string } | null;
  notice: string | null;
}

export type WishlistMachineEvent =
  | { type: "refresh/start"; seq: number }
  | { type: "refresh/success"; seq: number; items: HydratedWishlistEntry[] }
  | { type: "refresh/error"; seq: number }
  | { type: "toggle/add-optimistic"; productId: string }
  | { type: "toggle/add-success"; productId: string }
  | { type: "toggle/add-failure"; productId: string; guestNext?: string }
  | { type: "toggle/remove-optimistic"; productId: string; itemId: string }
  | { type: "toggle/remove-success"; productId: string }
  | { type: "toggle/remove-failure"; productId: string; entry: HydratedWishlistEntry }
  | { type: "prompt/dismiss" }
  | { type: "notice/dismiss" };

export function initialWishlistMachine(): WishlistMachineState {
  return {
    items: [],
    status: "idle",
    seq: 0,
    inFlight: false,
    optimisticIds: [],
    pendingIds: [],
    guestPrompt: null,
    notice: null,
  };
}

export function wishlistMachine(
  state: WishlistMachineState,
  event: WishlistMachineEvent,
): WishlistMachineState {
  switch (event.type) {
    case "refresh/start":
      // A2: one refresh at a time. A second caller waits for the in-flight one
      // instead of starting a racing read that could clobber the optimistic add.
      return state.inFlight
        ? state
        : { ...state, inFlight: true, status: "loading", seq: Math.max(state.seq, event.seq) };
    case "refresh/success": {
      if (event.seq !== state.seq) return state;
      // The server answer is authoritative for hydrated rows; unconfirmed
      // optimistic adds stay in `optimisticIds` and are surfaced separately.
      const items = event.items;
      return {
        ...state,
        items,
        inFlight: false,
        status: statusForItems(items.length + state.optimisticIds.length),
      };
    }
    case "refresh/error":
      return event.seq === state.seq
        ? { ...state, inFlight: false, status: "error", items: [] }
        : state;
    case "toggle/add-optimistic":
      return {
        ...state,
        optimisticIds: state.optimisticIds.includes(event.productId)
          ? state.optimisticIds
          : [...state.optimisticIds, event.productId],
        pendingIds: state.pendingIds.includes(event.productId)
          ? state.pendingIds
          : [...state.pendingIds, event.productId],
      };
    case "toggle/add-success":
      return {
        ...state,
        optimisticIds: state.optimisticIds.filter((id) => id !== event.productId),
        pendingIds: state.pendingIds.filter((id) => id !== event.productId),
      };
    case "toggle/add-failure":
      return {
        ...state,
        optimisticIds: state.optimisticIds.filter((id) => id !== event.productId),
        pendingIds: state.pendingIds.filter((id) => id !== event.productId),
        // A17: a guest's parked product resumes at the public product route;
        // /account is proxy-guarded and would bounce the shopper to sign-in.
        guestPrompt:
          event.guestNext === undefined
            ? state.guestPrompt
            : { productId: event.productId, next: event.guestNext },
      };
    case "toggle/remove-optimistic":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== event.itemId),
        pendingIds: state.pendingIds.includes(event.productId)
          ? state.pendingIds
          : [...state.pendingIds, event.productId],
      };
    case "toggle/remove-success":
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== event.productId),
        pendingIds: state.pendingIds.filter((id) => id !== event.productId),
      };
    case "toggle/remove-failure":
      return {
        ...state,
        items: state.items.some((item) => item.id === event.entry.id)
          ? state.items
          : [...state.items, event.entry],
        pendingIds: state.pendingIds.filter((id) => id !== event.productId),
      };
    case "prompt/dismiss":
      return { ...state, guestPrompt: null };
    case "notice/dismiss":
      return { ...state, notice: null };
  }
}
