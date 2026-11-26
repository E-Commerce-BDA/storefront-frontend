"use client";

import { useWishlist } from "@/app/_components/WishlistProvider";
import { Icon } from "@/components/ui";

export interface WishlistButtonProps {
  productId: string;
  className?: string;
  label?: string;
}

export default function WishlistButton({
  productId,
  className = "",
  label,
}: WishlistButtonProps) {
  const { has, toggle, pendingIds } = useWishlist();
  const saved = has(productId);
  const pending = pendingIds.includes(productId);

  const buttonLabel = label ?? (saved ? "Remove from wishlist" : "Add to wishlist");

  return (
    <button
      type="button"
      className={`sf-wishlist-btn inline-flex items-center justify-center rounded-full p-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)] ${
        saved
          ? "text-[var(--color-sale-text)] hover:bg-[var(--color-sale-soft)]"
          : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--color-ink)]"
      } ${className}`}
      aria-label={buttonLabel}
      aria-pressed={saved}
      disabled={pending}
      data-pending={pending ? "true" : undefined}
      data-saved={saved ? "true" : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(productId);
      }}
    >
      <Icon
        name="heart"
        size={20}
        className={saved ? "fill-current text-[var(--color-sale-text)]" : "text-current"}
      />
    </button>
  );
}

