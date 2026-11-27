/**
 * Search mount machine — sf-086. Pure.
 *
 * The mount used to hold four unrelated useState values. This reducer owns the
 * mount's own faces (exit animation, toast, editorial assets); the query and
 * active row stay in the existing search machine, so there is one owner per
 * piece of state.
 */
import type { SearchResult } from "@/lib/search/source";
import type { Status } from "@/lib/machine/status";

export interface SearchToast {
  title: string;
  message: string;
}

export interface SearchMountMachineState {
  closing: boolean;
  toast: SearchToast | null;
  trending: string[];
  curated: SearchResult[];
  status: Status;
}

export type SearchMountMachineEvent =
  | { type: "close/start" }
  | { type: "close/finish" }
  | { type: "toast/show"; toast: SearchToast }
  | { type: "toast/clear" }
  | { type: "assets/success"; terms: string[]; curated: SearchResult[] };

export function initialSearchMountMachine(): SearchMountMachineState {
  return { closing: false, toast: null, trending: [], curated: [], status: "idle" };
}

export function searchMountMachine(
  state: SearchMountMachineState,
  event: SearchMountMachineEvent,
): SearchMountMachineState {
  switch (event.type) {
    case "close/start":
      return { ...state, closing: true };
    case "close/finish":
      return { ...state, closing: false };
    case "toast/show":
      return { ...state, toast: event.toast };
    case "toast/clear":
      return { ...state, toast: null };
    case "assets/success":
      return {
        ...state,
        trending: event.terms,
        curated: event.curated,
        status: "ready",
      };
  }
}
