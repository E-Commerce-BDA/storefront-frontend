"use client";

import Image from "next/image";
import { Icon, IconButton, QuantityStepper } from "@/components/ui";
import type { CartItemDto } from "@/lib/cart/schemas";

export interface CartTableProps {
  items: CartItemDto[];
  pending?: Record<string, boolean>;
  onQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  className?: string;
}

export default function CartTable({
  items,
  pending = {},
  onQty,
  onRemove,
  className = "",
}: CartTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm text-[var(--color-ink)]" aria-label="Shopping cart items">
        <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
          <tr>
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

            return (
              <tr
                key={line.id}
                className={`transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}
                data-pending={isPending ? "true" : undefined}
              >
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
                      max={99}
                      onChange={(nextQty) => onQty(line.id, nextQty)}
                      label={`${line.productName} quantity`}
                      disabled={isPending}
                    />
                  </div>
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
