import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatOrderDate } from "@/lib/order/formatDate";
import type { OrderDto } from "@/lib/order/schemas";

/**
 * Dumb OrderRow — the one order summary row (sf-081). Both the account
 * dashboard and the full order history render this block; `compact` only
 * changes the density, never the copy, status tone or date formatter.
 */
export interface OrderRowProps {
  order: OrderDto;
  compact?: boolean;
  className?: string;
}

export default function OrderRow({ order, compact = false, className = "" }: OrderRowProps) {
  const tone =
    order.status === "cancelled" ? "error" : order.status === "delivered" ? "success" : "neutral";
  return (
    <li className={className}>
      <Link
        href={`/account/orders/${encodeURIComponent(order.id)}`}
        className={
          compact
            ? "flex items-baseline justify-between gap-4 rounded-[var(--radius-md,10px)] border border-[var(--border)] px-4 py-3 transition-colors hover:border-[var(--color-navy)] hover:bg-[var(--surface-hover)]"
            : "group flex flex-col gap-3 rounded-[var(--radius-md,10px)] border border-[var(--border)] p-4 transition-colors hover:border-[var(--color-navy)] hover:bg-[var(--surface-hover)] sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <span className="grid gap-1">
          <span className={compact ? "text-sm font-medium text-[var(--color-ink)]" : "font-semibold text-[var(--color-ink)]"}>
            {order.order_number}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {compact ? "" : "Placed on "}
            {formatOrderDate(order.created_at)}
            {compact ? "" : ` · ${order.items.length} ${order.items.length === 1 ? "item" : "items"}`}
          </span>
        </span>
        <span className={compact ? "flex items-center gap-3" : "flex items-center gap-4"}>
          <Badge tone={tone}>{order.status}</Badge>
          <span className={compact ? "text-sm font-semibold text-[var(--color-ink)]" : "text-base font-semibold text-[var(--color-ink)]"}>
            ${order.grand_total}
          </span>
          {compact ? null : (
            <span className="text-xs font-medium text-[var(--color-navy)] group-hover:underline">
              View details →
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
