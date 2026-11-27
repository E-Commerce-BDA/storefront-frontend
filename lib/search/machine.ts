/**
 * Search overlay machine — sf-074 (A8, A20, A21). Pure.
 * A8: an aborted request or a superseded sequence is never painted as an
 * error, and a typed character gates out every in-flight answer.
 * A21: typing and a fresh result reset activeIndex to the first row.
 */
import { statusForItems, type Status } from "@/lib/machine/status";

/** The prototype's SearchOverlayMachine face, derived from one source of truth. */
export type SearchOverlayFace = "idle" | "results" | "empty";

export interface SearchMachineState<T = unknown> {
  query: string;
  status: Status;
  results: T[];
  /** Monotonic request id; only the newest request may publish. */
  seq: number;
  activeIndex: number;
  aborted: boolean;
}

export type SearchMachineEvent<T = unknown> =
  | { type: "type"; query: string }
  | { type: "request/start"; seq: number }
  | { type: "request/success"; seq: number; results: T[] }
  | { type: "request/error"; seq: number }
  | { type: "request/abort"; seq: number }
  | { type: "results/clear" }
  | { type: "active/set"; index: number };

export function initialSearchMachine<T>(): SearchMachineState<T> {
  return { query: "", status: "idle", results: [], seq: 0, activeIndex: 0, aborted: false };
}

/**
 * A face is derived, never stored: keeping a second `face` field would let a
 * stale results/empty value survive a query change. `idle` also covers loading
 * — an in-flight request is not an answer, so no rows may be painted as empty.
 */
export function searchOverlayFace<T>(state: SearchMachineState<T>): SearchOverlayFace {
  if (state.status === "idle" || state.status === "loading") return "idle";
  return state.results.length === 0 ? "empty" : "results";
}

export function searchMachine<T>(
  state: SearchMachineState<T>,
  event: SearchMachineEvent<T>,
): SearchMachineState<T> {
  switch (event.type) {
    case "type":
      // A21: each keystroke is a new query; a stale active row must not follow.
      return { ...state, query: event.query, seq: state.seq + 1, activeIndex: 0, aborted: false };
    case "request/start":
      return event.seq <= state.seq ? state : { ...state, seq: event.seq, status: "loading", aborted: false };
    case "request/success":
      if (event.seq !== state.seq || state.aborted) return state;
      return {
        ...state,
        results: event.results,
        status: statusForItems(event.results.length),
        activeIndex: 0,
      };
    case "request/error":
      // A8: an abort must never produce an error face; only a live request may.
      if (event.seq !== state.seq || state.aborted) return state;
      return { ...state, status: "error" };
    case "request/abort":
      return { ...state, aborted: true, status: "idle" };
    case "results/clear":
      // Below the min-chars gate the last query's rows must go. The hook owns
      // no result state of its own, so the machine owns this reset too.
      return { ...state, results: [], status: "idle", activeIndex: 0, aborted: false };
    case "active/set":
      return { ...state, activeIndex: Math.max(0, event.index) };
  }
}
