/**
 * Overlay + quick-view machine — sf-074 (A7, A19, A20). Pure.
 * A7: a quick view shows success only when the response was ok; a failure
 * keeps the dialog closed and surfaces a face instead of opening the drawer.
 * A19: quick-add failures produce a visible failure face, not a silent undo.
 * A20: overlay timers are described as deadlines the owner can cancel.
 */
import type { Status } from "@/lib/machine/status";

export interface OverlayMachineState {
  open: boolean;
  closing: boolean;
  status: Status;
  message: string | null;
  /** Deadline token; the owner clears it on unmount or close. */
  timerToken: number | null;
  /** Quick-view selection — sf-085, ported from the prototype's QuickView state. */
  selectedOptions: Record<string, string>;
  qty: number;
  imageIndex: number;
}

export type OverlayMachineEvent =
  | { type: "open" }
  | { type: "close/start"; timerToken: number }
  | { type: "close/finish" }
  | { type: "load/success" }
  | { type: "load/error"; message: string }
  | { type: "add/success" }
  | { type: "add/error"; message: string }
  | { type: "timer/clear" }
  | { type: "selection/set"; name: string; value: string }
  | { type: "selection/reset"; options: Record<string, string> }
  | { type: "qty/set"; qty: number; min: number; max: number }
  | { type: "image/set"; index: number; count: number };

export function initialOverlayMachine(): OverlayMachineState {
  return {
    open: false,
    closing: false,
    status: "idle",
    message: null,
    timerToken: null,
    selectedOptions: {},
    qty: 1,
    imageIndex: 0,
  };
}

export function overlayMachine(
  state: OverlayMachineState,
  event: OverlayMachineEvent,
): OverlayMachineState {
  switch (event.type) {
    case "open":
      return { ...initialOverlayMachine(), open: true, status: "loading" };
    case "close/start":
      return { ...state, closing: true, timerToken: event.timerToken };
    case "close/finish":
      return initialOverlayMachine();
    case "load/success":
      return { ...state, status: "ready" };
    case "load/error":
      // A7: failure never flips the open face to success and never opens a drawer.
      return { ...state, status: "error", message: event.message, open: false, closing: false };
    case "add/success":
      return { ...state, status: "success", message: null };
    case "add/error":
      // A19: the failure face is part of state, so the island must render it.
      return { ...state, status: "error", message: event.message };
    case "timer/clear":
      return { ...state, timerToken: null };
    case "selection/set":
      return {
        ...state,
        selectedOptions: { ...state.selectedOptions, [event.name]: event.value },
      };
    case "selection/reset":
      return { ...state, selectedOptions: { ...event.options }, qty: 1, imageIndex: 0 };
    case "qty/set":
      // Clamping lives here so two entry points (stepper/keyboard) cannot
      // disagree about the bounds of the same selection.
      return { ...state, qty: Math.min(event.max, Math.max(event.min, Math.trunc(event.qty))) };
    case "image/set":
      return event.count === 0
        ? state
        : { ...state, imageIndex: ((event.index % event.count) + event.count) % event.count };
  }
}
