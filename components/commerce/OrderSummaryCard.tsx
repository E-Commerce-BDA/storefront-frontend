import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/ui/icons";
import {
  resolveOrderSummary,
  type OrderSummaryInput,
} from "@/lib/order/summaryModel";

/**
 * Dumb OrderSummaryCard — money arrives resolved; the only arithmetic here is
 * the pure free-shipping resolver in lib. Paint rides `--summary-*` vars and
 * the progress width is a CSS var so CSS can animate/clamp it.
 */
export interface OrderSummaryCardProps extends OrderSummaryInput {
  coupon?: { code: string; discount: number };
  onRemoveCoupon?: () => void;
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function OrderSummaryCard({
  subtotal,
  discount,
  shipping,
  tax,
  freeShipThreshold,
  coupon,
  onRemoveCoupon,
  action,
  className = "",
  style,
}: OrderSummaryCardProps) {
  const summary = resolveOrderSummary(
    { subtotal, discount, shipping, tax, freeShipThreshold },
    { freeShipThreshold },
  );
  const vars = {
    "--summary-progress": `${summary.progress}%`,
    ...style,
  } as CSSProperties;

  return (
    <aside
      className={`sf-summary ${className}`}
      aria-label="Order summary"
      data-free-ship={summary.freeShip}
      style={vars}
    >
      <div className="sf-summary__ship" role="status">
        {summary.freeShip ? (
          <span>Free shipping unlocked</span>
        ) : (
          <span>${summary.remaining} away from free shipping</span>
        )}
        <div
          className="sf-summary__bar"
          role="progressbar"
          aria-valuenow={summary.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Free shipping progress"
        />
      </div>
      <dl className="sf-summary__lines">
        <div>
          <dt>Subtotal</dt>
          <dd>${subtotal}</dd>
        </div>
        {coupon === undefined ? null : (
          <div data-coupon={coupon.code}>
            <dt>Coupon ({coupon.code})</dt>
            <dd>
              -${coupon.discount}
              {onRemoveCoupon === undefined ? null : (
                <button type="button" onClick={onRemoveCoupon} aria-label="Remove coupon">
                  <Icon name="x" size={14} />
                </button>
              )}
            </dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd>{summary.freeShip ? "Free" : `$${summary.shipping}`}</dd>
        </div>
        <div>
          <dt>Tax</dt>
          <dd>${summary.tax}</dd>
        </div>
        <div className="sf-summary__total">
          <dt>Total</dt>
          <dd>${summary.total}</dd>
        </div>
      </dl>
      {action === undefined ? null : <div className="sf-summary__action">{action}</div>}
    </aside>
  );
}
