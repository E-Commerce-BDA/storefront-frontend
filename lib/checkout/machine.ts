/**
 * Checkout island machine — sf-074 (A1).
 * Pure. A cold GET has no settled empty answer: only `status === "ready"` may
 * bounce to /cart. Loading shows the loading face; error shows the error face.
 */
import { isSettled, type Status } from "@/lib/machine/status";
import type { DiscountValidationResult, StockShortfall } from "@/lib/order/schemas";

export interface CheckoutMachineState {
  status: Status;
  submitting: boolean;
  banner: {
    message: string;
    toCart: boolean;
    rotateKey: boolean;
    retryWithSameKey: boolean;
    shortfall: StockShortfall | null;
  } | null;
  discountCode: string;
  couponValid: boolean;
  /** The coupon's resolved answer and its honest error copy (A9). */
  couponResult: DiscountValidationResult | null;
  couponError: string | null;
}

export type CheckoutMachineEvent =
  | { type: "load/start" }
  | { type: "load/success"; itemCount: number }
  | { type: "load/error" }
  | { type: "submit/start" }
  | { type: "submit/success" }
  | { type: "submit/finish" }
  | { type: "submit/failure"; banner: NonNullable<CheckoutMachineState["banner"]> }
  | { type: "coupon/typed"; code: string }
  | { type: "coupon/valid"; result?: DiscountValidationResult }
  | { type: "coupon/invalid"; message: string }
  | { type: "coupon/clear" };

export function initialCheckoutMachine(): CheckoutMachineState {
  return {
    status: "idle",
    submitting: false,
    banner: null,
    discountCode: "",
    couponValid: false,
    couponResult: null,
    couponError: null,
  };
}

/** A1: the one predicate that decides whether checkout may bounce to /cart. */
export function shouldBounceToCart(state: CheckoutMachineState, itemCount: number): boolean {
  return state.status === "ready" && itemCount === 0 && !state.submitting;
}

export function checkoutMachine(
  state: CheckoutMachineState,
  event: CheckoutMachineEvent,
): CheckoutMachineState {
  switch (event.type) {
    case "load/start":
      return { ...state, status: "loading" };
    case "load/success":
      // A "ready" cart with zero items is the settled answer that authorises
      // the /cart bounce; `empty` is reserved for an explicit empty face.
      return { ...state, status: "ready" };
    case "load/error":
      return { ...state, status: "error" };
    case "submit/start":
      return { ...state, submitting: true, banner: null };
    case "submit/success":
      return { ...state, submitting: false, status: "success" };
    case "submit/finish":
      // The attempt ended; only the in-flight flag changes, never the face.
      return { ...state, submitting: false };
    case "submit/failure":
      return { ...state, submitting: false, banner: event.banner };
    case "coupon/typed":
      return { ...state, discountCode: event.code, couponValid: false, couponError: null };
    case "coupon/valid":
      return { ...state, couponValid: true, couponResult: event.result ?? null, couponError: null };
    case "coupon/invalid":
      return { ...state, couponValid: false, couponResult: null, couponError: event.message };
    case "coupon/clear":
      return { ...state, couponValid: false, couponResult: null, couponError: null };
  }
}

export function checkoutFace(state: CheckoutMachineState): Status {
  return isSettled(state.status) ? state.status : "loading";
}
