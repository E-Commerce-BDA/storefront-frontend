/**
 * Compare tray machine — sf-074 (A18). Pure.
 * A18: seeding from `?ids=` happens on a pathname change, not in a lazy
 * initialiser that only runs at mount, and the toggle reducer has no side
 * effect — the cap notice is returned as state for the owner to render.
 */
import { addCompareId, COMPARE_LIMIT, removeCompareId } from "@/lib/commerce/compare";
import type { Status } from "@/lib/machine/status";

export interface CompareMachineState {
  ids: string[];
  notice: string | null;
  seededPath: string | null;
  status: Status;
}

export type CompareMachineEvent =
  | { type: "seed"; pathname: string; ids: string[] }
  | { type: "toggle"; productId: string }
  | { type: "clear" }
  | { type: "notice/dismiss" };

export function initialCompareMachine(): CompareMachineState {
  return { ids: [], notice: null, seededPath: null, status: "idle" };
}

export function compareMachine(
  state: CompareMachineState,
  event: CompareMachineEvent,
): CompareMachineState {
  switch (event.type) {
    case "seed":
      return state.seededPath === event.pathname
        ? state
        : { ...state, seededPath: event.pathname, ids: event.ids, notice: null };
    case "toggle": {
      if (state.ids.includes(event.productId)) {
        return { ...state, ids: removeCompareId(state.ids, event.productId), notice: null };
      }
      const next = addCompareId(state.ids, event.productId);
      return next.full
        ? {
            ...state,
            notice: `You can compare up to ${COMPARE_LIMIT} products.`,
          }
        : { ...state, ids: next.ids, notice: null };
    }
    case "clear":
      return { ...state, ids: [], notice: null };
    case "notice/dismiss":
      return { ...state, notice: null };
  }
}
