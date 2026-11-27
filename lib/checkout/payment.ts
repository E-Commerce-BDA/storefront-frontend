/**
 * Payment pill vocabulary — sf-093. Pure.
 *
 * v1 has exactly one honest provider: the mock card the order service accepts.
 * The brand marks are shown as the *visual language* of that one method, not as
 * extra selectable providers — a pill that looked payable but was not would be
 * a checkout lie. The resolver keeps that distinction in data so the painter
 * cannot invent a method.
 */
export interface PaymentMethodView {
  id: string;
  label: string;
  icon: string;
  selectable: boolean;
}

export const PAYMENT_METHODS: readonly PaymentMethodView[] = [
  { id: "mock", label: "Card (demo)", icon: "visa", selectable: true },
  { id: "mastercard", label: "Mastercard", icon: "mastercard", selectable: false },
  { id: "paypal", label: "PayPal", icon: "paypal", selectable: false },
  { id: "upi", label: "UPI", icon: "upi", selectable: false },
];

export const DEFAULT_PAYMENT_METHOD = "mock";

export interface ResolvedPaymentMethod extends PaymentMethodView {
  selected: boolean;
}

export function resolvePaymentMethods(selected: string | undefined): ResolvedPaymentMethod[] {
  const active = selected ?? DEFAULT_PAYMENT_METHOD;
  return PAYMENT_METHODS.map((method) => ({
    ...method,
    selected: method.id === active,
  }));
}
