/**
 * Cart island interaction machine — sf-086. Pure.
 *
 * Selection, per-line typed drafts, in-flight writes and the coupon request
 * are four views of one cart interaction. They used to be four useState calls
 * that could disagree after a refresh; each transition now updates all of them
 * together. Network calls and their timers stay in the island.
 */
import type { DiscountValidationResult } from "@/lib/order/schemas";
import type { Status } from "@/lib/machine/status";

export interface CartViewMachineState {
  selectedIds: string[];
  drafts: Record<string, number>;
  pendingIds: string[];
  couponCode: string;
  couponStatus: Status;
  couponError: string | null;
  appliedCoupon: DiscountValidationResult | null;
}

export type CartViewMachineEvent =
  | { type: "select/toggle"; id: string }
  | { type: "select/all"; ids: string[] }
  | { type: "select/set"; ids: string[] }
  | { type: "select/prune"; ids: string[] }
  | { type: "draft/set"; id: string; qty: number }
  | { type: "draft/delete"; id: string }
  | { type: "write/start"; id: string }
  | { type: "write/finish"; id: string }
  | { type: "coupon/type"; code: string }
  | { type: "coupon/start" }
  | { type: "coupon/success"; result: DiscountValidationResult }
  | { type: "coupon/error"; message: string }
  | { type: "coupon/clear" };

export function initialCartIslandMachine(): CartViewMachineState {
  return {
    selectedIds: [],
    drafts: {},
    pendingIds: [],
    couponCode: "",
    couponStatus: "idle",
    couponError: null,
    appliedCoupon: null,
  };
}

export function cartIslandMachine(
  state: CartViewMachineState,
  event: CartViewMachineEvent,
): CartViewMachineState {
  switch (event.type) {
    case "select/toggle":
      return {
        ...state,
        selectedIds: state.selectedIds.includes(event.id)
          ? state.selectedIds.filter((id) => id !== event.id)
          : [...state.selectedIds, event.id],
      };
    case "select/all":
      return {
        ...state,
        selectedIds: state.selectedIds.length === event.ids.length ? [] : event.ids,
      };
    case "select/set":
      return { ...state, selectedIds: event.ids };
    case "select/prune": {
      const live = new Set(event.ids);
      const selectedIds = state.selectedIds.filter((id) => live.has(id));
      return selectedIds.length === state.selectedIds.length ? state : { ...state, selectedIds };
    }
    case "draft/set":
      return { ...state, drafts: { ...state.drafts, [event.id]: event.qty } };
    case "draft/delete": {
      const { [event.id]: _gone, ...drafts } = state.drafts;
      return { ...state, drafts };
    }
    case "write/start":
      return state.pendingIds.includes(event.id)
        ? state
        : { ...state, pendingIds: [...state.pendingIds, event.id] };
    case "write/finish":
      return { ...state, pendingIds: state.pendingIds.filter((id) => id !== event.id) };
    case "coupon/type":
      return { ...state, couponCode: event.code, couponStatus: "idle", couponError: null };
    case "coupon/start":
      return { ...state, couponStatus: "loading", couponError: null };
    case "coupon/success":
      return { ...state, couponStatus: "success", couponError: null, appliedCoupon: event.result };
    case "coupon/error":
      return { ...state, couponStatus: "error", couponError: event.message, appliedCoupon: null };
    case "coupon/clear":
      return {
        ...state,
        couponCode: "",
        couponStatus: "idle",
        couponError: null,
        appliedCoupon: null,
      };
  }
}
