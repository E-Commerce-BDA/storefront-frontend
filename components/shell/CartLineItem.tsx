import { Icon, QuantityStepper } from "@/components/ui";
import { isPendingId, lineTotal } from "@/lib/cart/state";
import type { CartItemDto } from "@/lib/cart/schemas";

/**
 * Dumb CartLineItem — one cart row (shell-cart.md §4, A4.1/A4.2).
 *
 * `props -> JSX`: the row shows what cart-svc sent and asks the owner to change
 * it. The arithmetic (`lineTotal`) and the clamp (`QuantityStepper`) are the two
 * already-tested seams; this block owns neither — it only lays them out beside
 * the thumbnail, name, variant label and a remove control.
 *
 * `pending` is passed in, never derived here: the store already knows a write is
 * in flight on this line. We mirror it onto the row as `data-pending` (CSS paints
 * it) and disable the controls, because the provider ignores mutations aimed at a
 * line that has no server id yet — clicking a dead control is worse than a muted
 * one. Money renders as `${n}`, the same raw-number face `ProductCard` uses.
 */
export interface CartLineItemProps {
  line: CartItemDto;
  /** A mutation is in flight, or the line is an optimistic placeholder. */
  pending?: boolean;
  onQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
}

export default function CartLineItem({ line, pending = false, onQty, onRemove }: CartLineItemProps) {
  // A placeholder line (no server id) must not offer writes the store will drop.
  const locked = pending || isPendingId(line.id);
  const name = line.productName || "Adding…";

  return (
    <li className="sf-cartline" data-pending={locked}>
      <span className="sf-cartline__thumb" aria-hidden="true">
        {line.imageUrl ? <img src={line.imageUrl} alt="" loading="lazy" /> : null}
      </span>

      <div className="sf-cartline__info">
        <p className="sf-cartline__name">{name}</p>
        {line.variantLabel ? <p className="sf-cartline__variant">{line.variantLabel}</p> : null}
        <QuantityStepper
          value={line.qty}
          disabled={locked}
          label={`${name} quantity`}
          onChange={(qty) => onQty(line.id, qty)}
        />
      </div>

      <div className="sf-cartline__end">
        <span className="sf-cartline__total">${lineTotal(line)}</span>
        <button
          type="button"
          className="sf-cartline__remove"
          onClick={() => onRemove(line.id)}
          disabled={locked}
          aria-label={`Remove ${name} from cart`}
        >
          <Icon name="trash" size={18} />
        </button>
      </div>
    </li>
  );
}
