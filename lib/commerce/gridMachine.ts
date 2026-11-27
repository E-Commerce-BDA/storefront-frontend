/**
 * Product grid island machine — sf-086. Pure.
 *
 * Quick view and the transient added flash used to be two useState values that
 * could both hold a product after a close. One reducer owns both; timers stay
 * in the island so a stale timeout can be cancelled on unmount.
 */
import type { ProductCardData } from "@/lib/commerce/productCard";
import type { Status } from "@/lib/machine/status";

export interface ProductGridIslandMachineState {
  activeProduct: ProductCardData | null;
  flashIds: string[];
  status: Status;
}

export type ProductGridIslandMachineEvent =
  | { type: "quickview/open"; product: ProductCardData }
  | { type: "quickview/close" }
  | { type: "flash/add"; id: string }
  | { type: "flash/remove"; id: string };

export function initialProductGridIslandMachine(): ProductGridIslandMachineState {
  return { activeProduct: null, flashIds: [], status: "ready" };
}

export function productGridIslandMachine(
  state: ProductGridIslandMachineState,
  event: ProductGridIslandMachineEvent,
): ProductGridIslandMachineState {
  switch (event.type) {
    case "quickview/open":
      return { ...state, activeProduct: event.product };
    case "quickview/close":
      return { ...state, activeProduct: null };
    case "flash/add":
      return state.flashIds.includes(event.id)
        ? state
        : { ...state, flashIds: [...state.flashIds, event.id] };
    case "flash/remove":
      return { ...state, flashIds: state.flashIds.filter((id) => id !== event.id) };
  }
}
