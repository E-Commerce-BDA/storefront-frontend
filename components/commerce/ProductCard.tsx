import { forwardRef } from "react";
import { Badge, Icon } from "@/components/ui";
import { tagTone } from "@/lib/search/tagTone";
import {
  type BadgePosition,
  type CtaPosition,
  type HoverMode,
  type ImageBlendMode,
  type ImageFit,
  type MediaRatio,
  type ProductCardData,
  type ProductCardReserved,
  type ProductCardStyleConfig,
  type ProductCardType,
  type QuickAction,
  type TextAlign,
  resolveProductCardCssVars,
  resolveProductCardStyles,
} from "@/lib/commerce/productCard";

/**
 * Dumb ProductCard — commerce face (product.md §1–8): media + badge +
 * info + hover actions + stock/wishlist states. Root is <article>, never
 * a button/link: media + name navigate via onOpen (owner routes to PDP);
 * actions are sibling buttons (nested-<button> ban, palette-row
 * precedent). props → JSX only. No fetch, no timers.
 */
export interface ProductCardProps extends ProductCardReserved, ProductCardStyleConfig {
  product: ProductCardData;
  /** Custom badge faces (sf-032 tones map, same lookup order). */
  tones?: Record<string, { bg: string; text: string; border?: string; borderStyle?: "solid" | "dashed" | "dotted" }>;
  styleConfig?: ProductCardStyleConfig;
  onOpen?: (p: ProductCardData) => void;
  onWishlist?: (p: ProductCardData) => void;
  onQuickAdd?: (p: ProductCardData) => void;
  onShare?: (p: ProductCardData) => void;
  className?: string;
  style?: React.CSSProperties;
}

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
    styleConfig,
    cardType,
    mediaRatio,
    borderRadius,
    imageBorderRadius,
    cardPad,
    cardBg,
    borderColor,
    hoverCardBg,
    hoverBorderColor,
    mediaBg,
    imageBlendMode,
    imageFit,
    badgePosition,
    showBadge,
    showDept,
    showRatings,
    hoverMode,
    ctaSet,
    ctaPosition,
    showActionsOnTouch,
    nameSize,
    priceSize,
    textAlign,
    onOpen,
    onWishlist,
    onQuickAdd,
    onShare,
    selectedAttribute: _reservedAttr,
    onAttribute: _reservedAttrCb,
    onQuickView,
    onCompare: _reservedCompare,
    className = "",
    style: customStyle,
  },
  ref,
) {
  void _reservedAttr;
  void _reservedAttrCb;
  void _reservedCompare;

  // Flat props take precedence over styleConfig object
  const styles = resolveProductCardStyles({
    ...styleConfig,
    ...(cardType !== undefined ? { cardType } : {}),
    ...(mediaRatio !== undefined ? { mediaRatio } : {}),
    ...(borderRadius !== undefined ? { borderRadius } : {}),
    ...(imageBorderRadius !== undefined ? { imageBorderRadius } : {}),
    ...(cardPad !== undefined ? { cardPad } : {}),
    ...(cardBg !== undefined ? { cardBg } : {}),
    ...(borderColor !== undefined ? { borderColor } : {}),
    ...(hoverCardBg !== undefined ? { hoverCardBg } : {}),
    ...(hoverBorderColor !== undefined ? { hoverBorderColor } : {}),
    ...(mediaBg !== undefined ? { mediaBg } : {}),
    ...(imageBlendMode !== undefined ? { imageBlendMode } : {}),
    ...(imageFit !== undefined ? { imageFit } : {}),
    ...(badgePosition !== undefined ? { badgePosition } : {}),
    ...(showBadge !== undefined ? { showBadge } : {}),
    ...(showDept !== undefined ? { showDept } : {}),
    ...(showRatings !== undefined ? { showRatings } : {}),
    ...(hoverMode !== undefined ? { hoverMode } : {}),
    ...(ctaSet !== undefined ? { ctaSet } : {}),
    ...(ctaPosition !== undefined ? { ctaPosition } : {}),
    ...(showActionsOnTouch !== undefined ? { showActionsOnTouch } : {}),
    ...(nameSize !== undefined ? { nameSize } : {}),
    ...(priceSize !== undefined ? { priceSize } : {}),
    ...(textAlign !== undefined ? { textAlign } : {}),
  });

  const out = p.stock === "out";
  const sale = p.compareAt !== undefined && p.compareAt > p.price;
  const handlers: Record<QuickAction, ((p: ProductCardData) => void) | undefined> = {
    "quick-view": onQuickView,
    wishlist: onWishlist,
    "add-to-cart": onQuickAdd,
    share: onShare,
  };

  const openLabel = `${p.name}, $${p.price}`;

  function open() {
    if (!out) onOpen?.(p);
  }

  const cssVars = resolveProductCardCssVars(styles);

  return (
    <article
      ref={ref}
      data-stock={p.stock ?? "in"}
      data-card-type={styles.cardType}
      data-hover={styles.hoverMode}
      data-touch-actions={styles.showActionsOnTouch}
      data-badgepos={styles.badgePosition}
      data-ctapos={styles.ctaPosition}
      data-blend-mode={styles.imageBlendMode}
      data-align={styles.textAlign}
      className={`sf-productcard ${className}`}
      style={{ ...cssVars, ...customStyle }}
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
            // alt="" deliberate: open control announces name+price —
            // named imgs would double-announce (palette-row pattern).
            <img src={p.image} alt="" loading="lazy" className="sf-productcard__cover" />
          ) : (
            <span className="sf-productcard__initial" aria-hidden="true">
              {p.name.charAt(0)}
            </span>
          )}
          {styles.hoverMode === "image" && p.hoverImage && (
            <img src={p.hoverImage} alt="" loading="lazy" aria-hidden="true" className="sf-productcard__hoverimg" />
          )}
        </button>
        {styles.showBadge && p.tag && (
          <Badge tone={tagTone(p.tag)} tones={tones} className="sf-productcard__badge">
            {p.tag}
          </Badge>
        )}
        {styles.hoverMode === "actions" && (
          <div className="sf-productcard__ctas" role="group" aria-label={`Actions for ${p.name}`}>
            {styles.ctaSet.map((c) => (
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
        {styles.showDept && <span className="sf-productcard__dept">{p.category}</span>}
        <button type="button" className="sf-productcard__name" onClick={open} disabled={out} aria-label={openLabel}>
          {p.name}
        </button>
        <span className="sf-productcard__pricerow">
          <span>${p.price}</span>
          {sale && <s className="sf-productcard__compare">${p.compareAt}</s>}
          {styles.showRatings && p.rating !== undefined && (
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
