"use client";

import Image from "next/image";
import { Checkbox, Icon, IconButton, QuantityStepper } from "@/components/ui";
import type { CartItemDto } from "@/lib/cart/schemas";
import { stockCeiling } from "@/lib/cart/stock";

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
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm text-[var(--color-ink)]" aria-label="Shopping cart items">
        <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
          <tr>
            {onToggleAll ? (
              <th scope="col" className="pb-3 pr-3 font-medium">
                <Checkbox
                  label="Select all cart items"
                  checked={allSelected}
                  onChange={onToggleAll}
                />
              </th>
            ) : null}
            <th scope="col" className="pb-3 font-medium">Product</th>
            <th scope="col" className="pb-3 text-right font-medium">Price</th>
            <th scope="col" className="pb-3 text-center font-medium">Quantity</th>
            <th scope="col" className="pb-3 text-right font-medium">Total</th>
            <th scope="col" className="pb-3 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((line) => {
            const isPending = pending[line.id] === true;
            const lineTotal = line.unitPrice * line.qty;
            const ceiling = stockCeiling(line.stock);
            const selected = selectedIds.includes(line.id);

            return (
              <tr
                key={line.id}
                data-pending={isPending ? "true" : undefined}
                className={isPending ? "pointer-events-none bg-[var(--surface-disabled)]" : ""}
                data-selected={selected ? "true" : undefined}
                data-stock-capped={line.stock != null && ceiling < 99 ? "true" : undefined}
              >
                {onToggleSelected ? (
                  <td className="py-4 pr-3">
                    <Checkbox
                      label={`Select ${line.productName}`}
                      checked={selected}
                      onChange={() => onToggleSelected(line.id)}
                    />
                  </td>
                ) : null}
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    {line.imageUrl ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm,6px)] bg-[var(--surface-muted)]">
                        <Image
                          src={line.imageUrl}
                          alt={line.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-sm,6px)] bg-[var(--surface-muted)] text-[var(--text-muted)]">
                        <Icon name="shopping-bag" size={24} />
                      </div>
                    )}
                    <div className="grid gap-0.5">
                      <span className="font-semibold text-[var(--color-ink)]">
                        {line.productName}
                      </span>
                      {line.variantId ? (
                        <span className="text-xs text-[var(--text-muted)]">
                          Variant: {line.variantId}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap py-4 text-right font-medium text-[var(--color-ink)]">
                  ${line.unitPrice}
                </td>

                <td className="whitespace-nowrap py-4 text-center">
                  <div className="inline-flex justify-center">
                    <QuantityStepper
                      value={line.qty}
                      min={1}
                      max={ceiling}
                      onChange={(nextQty) => onQty(line.id, nextQty)}
                      label={`${line.productName} quantity`}
                      disabled={isPending}
                    />
                  </div>
                  {line.stock != null && ceiling < 99 ? (
                    <span className="mt-1 block text-xs text-[var(--text-muted)]" data-stock-hint={line.id}>
                      Only {ceiling} left
                    </span>
                  ) : null}
                </td>

                <td className="whitespace-nowrap py-4 text-right font-semibold text-[var(--color-ink)]">
                  ${lineTotal}
                </td>

                <td className="whitespace-nowrap py-4 text-right">
                  <IconButton
                    label={`Remove ${line.productName} from cart`}
                    onClick={() => onRemove(line.id)}
                    disabled={isPending}
                  >
                    <Icon name="trash" size={16} />
                  </IconButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
