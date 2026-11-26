/**
 * Orders list island machine — sf-074 (A12). Pure.
 * A12: a failed load-more has an error face (never silent), and neither the
 * initial list nor a later page may land after unmount or after `alive` flips.
 */
import type { OrderDto } from "@/lib/order/schemas";
import { statusForItems, type Status } from "@/lib/machine/status";

export interface OrdersMachineState {
  orders: OrderDto[];
  cursor: string | null;
  status: Status;
  loadingMore: boolean;
  moreError: string | null;
  alive: boolean;
}

export type OrdersMachineEvent =
  | { type: "mount" }
  | { type: "unmount" }
  | { type: "list/success"; orders: OrderDto[]; cursor: string | null }
  | { type: "list/error"; message: string }
  | { type: "more/start" }
  | { type: "more/success"; orders: OrderDto[]; cursor: string | null }
  | { type: "more/error"; message: string };

export function initialOrdersMachine(): OrdersMachineState {
  return { orders: [], cursor: null, status: "loading", loadingMore: false, moreError: null, alive: true };
}

export function ordersMachine(
  state: OrdersMachineState,
  event: OrdersMachineEvent,
): OrdersMachineState {
  if (!state.alive && event.type !== "mount") return state;
  switch (event.type) {
    case "mount":
      return { ...state, alive: true, status: "loading" };
    case "unmount":
      return { ...state, alive: false };
    case "list/success":
      return {
        ...state,
        orders: event.orders,
        cursor: event.cursor,
        status: statusForItems(event.orders.length),
      };
    case "list/error":
      return { ...state, status: "error", moreError: event.message };
    case "more/start":
      return { ...state, loadingMore: true, moreError: null };
    case "more/success": {
      const known = new Set(state.orders.map((order) => order.id));
      return {
        ...state,
        loadingMore: false,
        orders: [...state.orders, ...event.orders.filter((order) => !known.has(order.id))],
        cursor: event.cursor,
      };
    }
    case "more/error":
      return { ...state, loadingMore: false, moreError: event.message };
  }
}
