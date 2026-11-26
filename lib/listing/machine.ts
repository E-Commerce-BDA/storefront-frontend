/**
 * Listing grid island machine — sf-074 (A6). Pure.
 * A6: a queryKey change resets accumulated rows to the new server page; a
 * late response from the previous query is ignored by key, not appended.
 */
import type { ProductCardData } from "@/lib/commerce/productCard";
import { statusForItems, type Status } from "@/lib/machine/status";

export interface ListingMachineState {
  queryKey: string;
  items: ProductCardData[];
  cursor: string | null;
  status: Status;
}

export type ListingMachineEvent =
  | { type: "query/change"; queryKey: string; items: ProductCardData[]; cursor: string | null }
  | { type: "more/start" }
  | { type: "more/success"; queryKey: string; items: ProductCardData[]; cursor: string | null }
  | { type: "more/error" };

export function initialListingMachine(
  queryKey: string,
  items: ProductCardData[],
  cursor: string | null,
): ListingMachineState {
  return {
    queryKey,
    items,
    cursor,
    // A cursor means more pages exist — the grid is idle, not finished.
    status: cursor === null ? statusForItems(items.length) : "idle",
  };
}

export function listingMachine(
  state: ListingMachineState,
  event: ListingMachineEvent,
): ListingMachineState {
  switch (event.type) {
    case "query/change":
      return initialListingMachine(event.queryKey, event.items, event.cursor);
    case "more/start":
      return { ...state, status: "loading" };
    case "more/success":
      if (event.queryKey !== state.queryKey) return state;
      {
        const known = new Set(state.items.map((item) => item.id));
        const items = [...state.items, ...event.items.filter((item) => !known.has(item.id))];
        return {
          ...state,
          items,
          cursor: event.cursor,
          status: event.cursor === null ? "ready" : "idle",
        };
      }
    case "more/error":
      return { ...state, status: "error" };
  }
}
