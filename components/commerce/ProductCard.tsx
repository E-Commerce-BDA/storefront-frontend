import { forwardRef } from "react";
import { Badge, Icon } from "@/components/ui";
import { tagTone } from "@/lib/search/tagTone";
import type {
  BadgePosition,
  CtaPosition,
  HoverMode,
  MediaRatio,
  ProductCardData,
  ProductCardReserved,
  QuickAction,
} from "@/lib/commerce/productCard";

/**
 * Dumb ProductCard — commerce face (product.md §1–8): media + badge +
 * info + hover actions + stock/wishlist states. Root is <article>, never
 * a button/link: media + name navigate via onOpen (owner routes to PDP);
 * actions are sibling buttons (nested-<button> ban, palette-row
 * precedent). props → JSX only. No fetch, no timers.
 */
export interface ProductCardProps extends ProductCardReserved {
  product: ProductCardData;
  /** Custom badge faces (sf-032 tones map, same lookup order). */
  tones?: Record<string, { bg: string; text: string; border?: string; borderStyle?: "solid" | "dashed" | "dotted" }>;
  mediaRatio?: MediaRatio;
  showBadge?: boolean;
  badgePosition?: BadgePosition;
  showDept?: boolean;
  showRatings?: boolean;
  hoverMode?: HoverMode;
  /** CTA set, max 3 (order = display order). Default: all four trimmed to three. */
  ctaSet?: QuickAction[];
  ctaPosition?: CtaPosition;
  /** Touch override (default false — hover layer is hover-only). */
  showActionsOnTouch?: boolean;
  onOpen?: (p: ProductCardData) => void;
  onWishlist?: (p: ProductCardData) => void;
  onQuickAdd?: (p: ProductCardData) => void;
  onShare?: (p: ProductCardData) => void;
  className?: string;
}

const RATIOS: Record<MediaRatio, string> = {
  "3:4": "3 / 4",
  "4:3": "4 / 3",
  "4:5": "4 / 5",
  "1:1": "1 / 1",
  "16:9": "16 / 9",
};

const CTA_ICON: Record<QuickAction, { icon: "eye" | "heart" | "shopping-bag" | "share"; label: (n: string) => string }> = {
  "quick-view": { icon: "eye", label: (n) => `Quick view ${n}` },
  wishlist: { icon: "heart", label: (n) => `Add ${n} to wishlist` },
  "add-to-cart": { icon: "shopping-bag", label: (n) => `Add ${n} to bag` },
  share: { icon: "share", label: (n) => `Share ${n}` },
};

const ProductCard = forwardRef<HTMLElement, ProductCardProps>(function ProductCard(
  {
    product: p,
    tones,
    mediaRatio = "4:5",
    showBadge = true,
    badgePosition = "left",
    showDept = true,
    showRatings = true,
    hoverMode = "actions",
    ctaSet = ["quick-view", "wishlist", "add-to-cart"],
    ctaPosition = "center",
    showActionsOnTouch = false,
    onOpen,
    onWishlist,
    onQuickAdd,
    onShare,
    selectedAttribute: _reservedAttr,
    onAttribute: _reservedAttrCb,
    onQuickView,
    onCompare: _reservedCompare,
    className = "",
  },
  ref,
) {
  void _reservedAttr;
  void _reservedAttrCb;
  void _reservedCompare;
  const out = p.stock === "out";
  const sale = p.compareAt !== undefined && p.compareAt > p.price;
  // CTA set clamps to 3 (admin picks max three — extras are misses).
  const ctas = ctaSet.slice(0, 3);
  const handlers: Record<QuickAction, ((p: ProductCardData) => void) | undefined> = {
    "quick-view": onQuickView,
    wishlist: onWishlist,
    "add-to-cart": onQuickAdd,
    share: onShare,
  };

  const openLabel = `${p.name}, $${p.price}`;
  // Reason for data-* below: stock/hover/touch roots are behavior hooks
  // for tests, not paint. data-badgepos/data-ctapos DO paint — state
  // reaches CSS only through attrs, never class toggles.

  function open() {
    if (!out) onOpen?.(p);
  }

  return (
    <article
      ref={ref}
      data-stock={p.stock ?? "in"}
      data-hover={hoverMode}
      data-touch-actions={showActionsOnTouch}
      data-badgepos={badgePosition}
      data-ctapos={ctaPosition}
      className={`sf-productcard ${className}`}
      style={{ "--pc-ratio": RATIOS[mediaRatio] } as React.CSSProperties}
    >
      <div className="sf-productcard__media">
        <button
          type="button"
          className="sf-productcard__open"
          onClick={open}
          disabled={out}
          aria-label={openLabel}
        >
          {p.image !== "" ? (
            // alt="" deliberate: the open control announces name+price —
            // named imgs would double-announce (palette-row pattern).
            <img src={p.image} alt="" loading="lazy" className="sf-productcard__cover" />
          ) : (
            <span className="sf-productcard__initial" aria-hidden="true">
              {p.name.charAt(0)}
            </span>
          )}
          {hoverMode === "image" && p.hoverImage && (
            <img src={p.hoverImage} alt="" loading="lazy" aria-hidden="true" className="sf-productcard__hoverimg" />
          )}
        </button>
        {showBadge && p.tag && (
          <Badge tone={tagTone(p.tag)} tones={tones} className="sf-productcard__badge">
            {p.tag}
          </Badge>
        )}
        {hoverMode === "actions" && (
          <div className="sf-productcard__ctas" role="group" aria-label={`Actions for ${p.name}`}>
            {ctas.map((c) => (
              <button
                key={c}
                type="button"
                className="sf-productcard__cta"
                disabled={out}
                aria-label={CTA_ICON[c].label(p.name)}
                aria-pressed={c === "wishlist" ? (p.wishlisted ?? false) : undefined}
                onClick={(e) => {
                  // Whole-card click never swallows actions (stated).
                  e.stopPropagation();
                  handlers[c]?.(p);
                }}
              >
                <Icon name={CTA_ICON[c].icon} size={17} filled={c === "wishlist" ? (p.wishlisted ?? false) : false} />
              </button>
            ))}
          </div>
        )}
        {out && (
          <span className="sf-productcard__soldout" aria-hidden="true">
            Sold out
          </span>
        )}
      </div>
      <div className="sf-productcard__info">
        {showDept && <span className="sf-productcard__dept">{p.category}</span>}
        <button type="button" className="sf-productcard__name" onClick={open} disabled={out} aria-label={openLabel}>
          {p.name}
        </button>
        <span className="sf-productcard__pricerow">
          <span>${p.price}</span>
          {sale && <s className="sf-productcard__compare">${p.compareAt}</s>}
          {showRatings && p.rating !== undefined && (
            <span className="sf-productcard__rating">
              <Icon name="star" size={13} filled />
              {p.rating.toFixed(1)}
              {p.ratingCount !== undefined && <span>({p.ratingCount})</span>}
            </span>
          )}
        </span>
        {p.stock === "low" && <span className="sf-productcard__lowstock">Low stock</span>}
      </div>
    </article>
  );
});

export default ProductCard;
