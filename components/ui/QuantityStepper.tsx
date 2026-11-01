import Icon from "./icons/Icon";
import { QTY_LIMITS, clampQty } from "@/lib/commerce/quantity";

/**
 * Dumb QuantityStepper — minus · number · plus on one 40 px row.
 *
 * Strictly controlled (AGENTS §3.2): the caller owns `value` and hears about
 * every intended change through `onChange`. Two consequences worth stating,
 * because both surprise:
 *
 * - **The input has no draft state.** A cleared field is *ignored* rather than
 *   snapped to `min` — otherwise clearing "3" to retype it would silently
 *   become 1. The last good number stays on screen until the shopper types a
 *   new one; the clamp then reels it into range.
 * - **`pending` is a paint hook, not a lock** (`data-pending` dims the digits).
 *   Whether the buttons freeze while a write is in flight is the caller's
 *   decision — pass `disabled` for that.
 *
 * State reaches CSS only through `data-*`; the arithmetic lives in
 * `lib/commerce/quantity.ts` so the cart store and the PDP share one clamp.
 */
export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  /** Disables both buttons and the field (a write is in flight). */
  disabled?: boolean;
  /** Dims the digits only — see the note above. */
  pending?: boolean;
  /** Accessible name for the field; row context belongs in it ("Mug quantity"). */
  label?: string;
  className?: string;
}

export default function QuantityStepper({
  value,
  min = QTY_LIMITS.min,
  max = QTY_LIMITS.max,
  step = 1,
  onChange,
  disabled = false,
  pending = false,
  label = "Quantity",
  className = "",
}: QuantityStepperProps) {
  const bounds = { min, max };
  const atMin = disabled || value <= min;
  const atMax = disabled || value >= max;

  return (
    <div
      className={`sf-qty ${className}`}
      data-disabled={disabled}
      data-pending={pending}
    >
      <button
        type="button"
        className="sf-qty__btn"
        aria-label="Decrease quantity"
        disabled={atMin}
        onClick={() => onChange(clampQty(value - step, bounds))}
      >
        <Icon name="minus" size={16} />
      </button>
      <input
        className="sf-qty__input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        disabled={disabled}
        value={String(value)}
        onChange={(event) => {
          const typed = Number.parseInt(event.target.value, 10);
          // "" and "abc" parse to NaN — ignored, see the header note.
          if (Number.isFinite(typed)) onChange(clampQty(typed, bounds));
        }}
      />
      <button
        type="button"
        className="sf-qty__btn"
        aria-label="Increase quantity"
        disabled={atMax}
        onClick={() => onChange(clampQty(value + step, bounds))}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
