import PaymentIcon from "@/components/shell/PaymentIcon";
import type { PaymentMethodView } from "@/lib/checkout/payment";

/**
 * Dumb PaymentPill — one brand mark plus its method label. `selected` and
 * `onSelect` are owned by the checkout island; an unsupported method is painted
 * as a plain, disabled pill so it reads as information, never as a choice.
 */
export interface PaymentPillProps extends PaymentMethodView {
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export default function PaymentPill({
  label,
  icon,
  selectable,
  selected = false,
  onSelect,
  className = "",
}: PaymentPillProps) {
  const body = (
    <>
      <PaymentIcon icon={icon} className="sf-payment-pill__icon" />
      <span>{label}</span>
    </>
  );

  return selectable ? (
    <button
      type="button"
      className={`sf-payment-pill ${className}`}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      data-selected={selected}
      onClick={onSelect}
    >
      {body}
    </button>
  ) : (
    <span className={`sf-payment-pill ${className}`} data-selected="false" aria-disabled="true">
      {body}
    </span>
  );
}
