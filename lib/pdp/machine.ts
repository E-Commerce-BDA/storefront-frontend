/**
 * PDP island machine — sf-074 (A22). Pure.
 * A22: a product id change resets qty and gallery index. Next.js reuses the
 * same route component across `[slug]` navigations, so implicit local state
 * otherwise leaks the previous product's selection into the new page.
 */
import type { Status } from "@/lib/machine/status";

/** PDP tab states — the prototype's PdpTabMachine (sf-085). */
export type PdpTab = "description" | "details" | "reviews" | "faq";

export interface PdpMachineState {
  productId: string;
  qty: number;
  galleryIndex: number;
  tab: PdpTab;
  status: Status;
}

export type PdpMachineEvent =
  | { type: "product/change"; productId: string; minQty?: number }
  | { type: "qty/set"; qty: number; minQty: number; maxQty: number }
  | { type: "gallery/set"; index: number; count: number }
  | { type: "tab/set"; tab: PdpTab }
  | { type: "load/error" }
  | { type: "load/ready" };

export function initialPdpMachine(productId: string, minQty = 1): PdpMachineState {
  return { productId, qty: Math.max(1, minQty), galleryIndex: 0, tab: "description", status: "ready" };
}

export function pdpMachine(state: PdpMachineState, event: PdpMachineEvent): PdpMachineState {
  switch (event.type) {
    case "product/change":
      return event.productId === state.productId
        ? state
        : initialPdpMachine(event.productId, event.minQty);
    case "qty/set":
      return { ...state, qty: Math.min(event.maxQty, Math.max(event.minQty, Math.trunc(event.qty))) };
    case "gallery/set":
      return {
        ...state,
        galleryIndex: event.count === 0 ? 0 : ((event.index % event.count) + event.count) % event.count,
      };
    case "tab/set":
      return state.tab === event.tab ? state : { ...state, tab: event.tab };
    case "load/error":
      return { ...state, status: "error" };
    case "load/ready":
      return { ...state, status: "ready" };
  }
}
