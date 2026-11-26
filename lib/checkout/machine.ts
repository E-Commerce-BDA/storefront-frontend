/**
 * Checkout island machine — sf-074 (A1).
 * Pure. A cold GET has no settled empty answer: only `status === "ready"` may
 * bounce to /cart. Loading shows the loading face; error shows the error face.
 */
import { isSettled, type Status } from "@/lib/machine/status";

export interface CheckoutMachineState {
  status: Status;
  submitting: boolean;
  banner: { message: string; toCart: boolean; rotateKey: boolean; retryWithSameKey: boolean } | null;
  discountCode: string;
  couponValid: boolean;
}

export type CheckoutMachineEvent =
  | { type: "load/start" }
  | { type: "load/success"; itemCount: number }
  | { type: "load/error" }
  | { type: "submit/start" }
  | { type: "submit/success" }
  | { type: "submit/failure"; banner: NonNullable<CheckoutMachineState["banner"]> }
  | { type: "coupon/typed"; code: string }
  | { type: "coupon/valid" }
  | { type: "coupon/invalid" };

export function initialCheckoutMachine(): CheckoutMachineState {
  return {
    status: "idle",
    submitting: false,
    banner: null,
    discountCode: "",
    couponValid: false,
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
    case "submit/failure":
      return { ...state, submitting: false, banner: event.banner };
    case "coupon/typed":
      return { ...state, discountCode: event.code, couponValid: false };
    case "coupon/valid":
      return { ...state, couponValid: true };
    case "coupon/invalid":
      return { ...state, couponValid: false };
  }
}

export function checkoutFace(state: CheckoutMachineState): Status {
  return isSettled(state.status) ? state.status : "loading";
}
