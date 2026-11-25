/**
 * Checkout step model — sf-058
 *
 * Pure: the step labels and which one is active. The chrome is display-only —
 * it never owns navigation, so a shopper cannot click into a step they have
 * not earned. Keeping the list here lets the component stay dumb.
 */

export interface CheckoutStep {
  id: string;
  label: string;
}

export const CHECKOUT_STEPS: readonly CheckoutStep[] = [
  { id: "cart", label: "Cart" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "done", label: "Done" },
];

export type CheckoutStepState = "done" | "active" | "upcoming";

export interface ResolvedCheckoutStep extends CheckoutStep {
  state: CheckoutStepState;
}

export function resolveCheckoutSteps(activeIndex: number): ResolvedCheckoutStep[] {
  const active = Number.isFinite(activeIndex)
    ? Math.max(0, Math.min(CHECKOUT_STEPS.length - 1, Math.trunc(activeIndex)))
    : 0;
  return CHECKOUT_STEPS.map((step, index) => ({
    ...step,
    state: index < active ? "done" : index === active ? "active" : "upcoming",
  }));
}
