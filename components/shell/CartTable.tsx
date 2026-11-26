"use client";

import { Checkbox } from "@/components/ui";
import CartLineItem from "./CartLineItem";
import type { CartItemDto } from "@/lib/cart/schemas";

export interface CartTableProps {
  items: CartItemDto[];
  pending?: Record<string, boolean>;
  onQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  /** sf-058 batch select; parent owns the set (controlled-only). */
  selectedIds?: readonly string[];
  onToggleSelected?: (itemId: string) => void;
  onToggleAll?: () => void;
  className?: string;
}

/**
 * Cart list shell — sf-081. The row is `CartLineItem`, the same block the
 * mini-cart and checkout use, so a stock hint or a pending face can never be
 * fixed in one place and forgotten in another. This shell owns only the
 * select-all header and the controlled selection wiring.
 */
export default function CartTable({
  items,
  pending = {},
  onQty,
  onRemove,
  selectedIds = [],
  onToggleSelected,
  onToggleAll,
  className = "",
}: CartTableProps) {
  const allSelected = items.length > 0 && items.every((line) => selectedIds.includes(line.id));
  return (
    <div className={`sf-carttable ${className}`}>
      <div className="sf-carttable__head">
        {onToggleAll ? (
          <Checkbox
            label="Select all cart items"
            checked={allSelected}
            onChange={onToggleAll}
          />
        ) : null}
        <span aria-hidden="true">Product</span>
        <span aria-hidden="true">Price</span>
        <span aria-hidden="true">Quantity</span>
        <span aria-hidden="true">Total</span>
      </div>
      <ul className="sf-carttable__rows" role="list" aria-label="Shopping cart items">
        {items.map((line) => (
          <CartLineItem
            key={line.id}
            line={line}
            pending={pending[line.id] === true}
            onQty={onQty}
            onRemove={onRemove}
            showPrice
            selected={selectedIds.includes(line.id)}
            onToggleSelected={onToggleSelected}
          />
        ))}
      </ul>
    </div>
  );
}
