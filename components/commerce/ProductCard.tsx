import { forwardRef } from "react";
import { Badge, Icon } from "@/components/ui";
import { tagTone } from "@/lib/search/tagTone";
import {
  type BadgePosition,
  type CtaPosition,
  type CtaStyle,
  type CtaVariant,
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
 * Dumb ProductCard — commerce face (product.md §1–8): media + badges +
 * info + action bar variants + swatches/pills + stock/wishlist states.
 * Root is <article>, never a button/link: media + name navigate via onOpen
 * (owner routes to PDP); actions are sibling buttons (nested-<button> ban,
 * palette-row precedent). props → JSX only. No fetch, no timers.
 */
export interface ProductCardProps extends ProductCardReserved, ProductCardStyleConfig {
  product: ProductCardData;
  /** Custom badge faces (sf-032 tones map, same lookup order). */
  tones?: Record<string, { bg: string; text: string; border?: string; borderStyle?: "solid" | "dashed" | "dotted" }>;
  styleConfig?: ProductCardStyleConfig;
  selectedOptions?: Record<string, string>;
  onSelectOption?: (optionName: string, value: string) => void;
  onOpen?: (p: ProductCardData) => void;
  onWishlist?: (p: ProductCardData) => void;
  onQuickAdd?: (p: ProductCardData) => void;
  onShare?: (p: ProductCardData) => void;
  className?: string;
  style?: React.CSSProperties;
}

const CTA_META: Record<
  QuickAction,
  { icon: "eye" | "heart" | "shopping-bag" | "share"; shortLabel: string; label: (n: string) => string }
> = {
  "quick-view": { icon: "eye", shortLabel: "Quick view", label: (n) => `Quick view ${n}` },
  wishlist: { icon: "heart", shortLabel: "Wishlist", label: (n) => `Add ${n} to wishlist` },
  "add-to-cart": { icon: "shopping-bag", shortLabel: "Add to bag", label: (n) => `Add ${n} to bag` },
  share: { icon: "share", shortLabel: "Share", label: (n) => `Share ${n}` },
};

const ProductCard = forwardRef<HTMLElement, ProductCardProps>(function ProductCard(
  {
    product: p,
    tones,
    styleConfig,
    selectedOptions,
    onSelectOption,
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
    textColor,
    mutedTextColor,
    priceColor,
    comparePriceColor,
    imageBlendMode,
    imageFit,
    badgePosition,
    showBadge,
    showDept,
    showRatings,
    showSwatches,
    showPills,
    hoverMode,
    ctaVariant,
    ctaStyle,
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

  // Sparse product card settings override global/theme defaults
  const productOverrides = p.cardSettings ?? {};

  // Flat props take precedence over styleConfig object and product card settings
  const styles = resolveProductCardStyles({
    ...productOverrides,
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
    ...(textColor !== undefined ? { textColor } : {}),
    ...(mutedTextColor !== undefined ? { mutedTextColor } : {}),
    ...(priceColor !== undefined ? { priceColor } : {}),
    ...(comparePriceColor !== undefined ? { comparePriceColor } : {}),
    ...(imageBlendMode !== undefined ? { imageBlendMode } : {}),
    ...(imageFit !== undefined ? { imageFit } : {}),
    ...(badgePosition !== undefined ? { badgePosition } : {}),
    ...(showBadge !== undefined ? { showBadge } : {}),
    ...(showDept !== undefined ? { showDept } : {}),
    ...(showRatings !== undefined ? { showRatings } : {}),
    ...(showSwatches !== undefined ? { showSwatches } : {}),
    ...(showPills !== undefined ? { showPills } : {}),
    ...(hoverMode !== undefined ? { hoverMode } : {}),
    ...(ctaVariant !== undefined ? { ctaVariant } : {}),
    ...(ctaStyle !== undefined ? { ctaStyle } : {}),
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

  const renderCtas = (containerClass: string) => {
    if (styles.ctaVariant === "none" || styles.ctaSet.length === 0) return null;
    return (
      <div className={containerClass} role="group" aria-label={`Actions for ${p.name}`}>
        {styles.ctaSet.map((c) => {
          const meta = CTA_META[c];
          const isWishlist = c === "wishlist";
          const pressed = isWishlist ? (p.wishlisted ?? false) : undefined;
          return (
            <button
              key={c}
              type="button"
              className="sf-productcard__cta"
              disabled={out}
              aria-label={meta.label(p.name)}
              aria-pressed={pressed}
              onClick={(e) => {
                e.stopPropagation();
                handlers[c]?.(p);
              }}
            >
              {(styles.ctaStyle === "icon" || styles.ctaStyle === "icon-label") && (
                <Icon name={meta.icon} size={16} filled={isWishlist ? (p.wishlisted ?? false) : false} />
              )}
              {(styles.ctaStyle === "label" || styles.ctaStyle === "icon-label") && (
                <span className="sf-productcard__cta-label">{meta.shortLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <article
      ref={ref}
      data-stock={p.stock ?? "in"}
      data-card-type={styles.cardType}
      data-hover={styles.hoverMode}
      data-touch-actions={styles.showActionsOnTouch}
      data-badgepos={styles.badgePosition}
      data-ctapos={styles.ctaPosition}
      data-ctavariant={styles.ctaVariant}
      data-ctastyle={styles.ctaStyle}
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

        {styles.showBadge && (
          <>
            {p.badges && p.badges.length > 0 ? (
              <div className="sf-productcard__badge-list">
                {p.badges.slice(0, 3).map((b) => (
                  <span
                    key={b.key ?? b.id}
                    className="sf-productcard__badge"
                    style={{
                      backgroundColor: b.bg,
                      color: b.textColor,
                      ...(b.borderColor
                        ? { borderColor: b.borderColor, borderStyle: b.borderStyle ?? "solid", borderWidth: "1px" }
                        : {}),
                    }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            ) : p.tag ? (
              <Badge tone={tagTone(p.tag)} tones={tones} className="sf-productcard__badge">
                {p.tag}
              </Badge>
            ) : null}
          </>
        )}

        {styles.ctaVariant === "overlay" && styles.hoverMode === "actions" && (
          renderCtas("sf-productcard__ctas")
        )}

        {out && (
          <span className="sf-productcard__soldout" aria-hidden="true">
            Sold out
          </span>
        )}
      </div>

      {styles.ctaVariant === "below" && renderCtas("sf-productcard__ctas sf-productcard__ctas--below")}

      <div className="sf-productcard__info">
        {styles.showDept && <span className="sf-productcard__dept">{p.category}</span>}
        <button type="button" className="sf-productcard__name" onClick={open} disabled={out} aria-label={openLabel}>
          {p.name}
        </button>

        {p.options && p.options.length > 0 && (
          <div className="sf-productcard__options">
            {p.options
              .filter((opt) => opt.showOnCard !== false)
              .map((opt) => {
                if (opt.displayType === "swatch" && styles.showSwatches) {
                  return (
                    <div
                      key={opt.name}
                      className="sf-productcard__swatches"
                      role="radiogroup"
                      aria-label={`Options for ${opt.name}`}
                    >
                      {opt.values.map((v) => {
                        const isSelected = selectedOptions?.[opt.name] === v.value;
                        return (
                          <button
                            key={v.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`${opt.name}: ${v.value}`}
                            title={v.value}
                            className={`sf-productcard__swatch ${isSelected ? "sf-productcard__swatch--active" : ""}`}
                            style={{
                              backgroundColor: v.swatchHex ?? "#cbd5e1",
                              backgroundImage: v.swatchImageUrl ? `url(${v.swatchImageUrl})` : undefined,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOption?.(opt.name, v.value);
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                }
                if (opt.displayType === "pill" && styles.showPills) {
                  return (
                    <div
                      key={opt.name}
                      className="sf-productcard__pills"
                      role="radiogroup"
                      aria-label={`Options for ${opt.name}`}
                    >
                      {opt.values.map((v) => {
                        const isSelected = selectedOptions?.[opt.name] === v.value;
                        return (
                          <button
                            key={v.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`${opt.name}: ${v.value}`}
                            className={`sf-productcard__pill ${isSelected ? "sf-productcard__pill--active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOption?.(opt.name, v.value);
                            }}
                          >
                            {v.value}
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              })}
          </div>
        )}

        <div className="sf-productcard__pricerow-wrap">
          <span className="sf-productcard__pricerow">
            <span className="sf-productcard__price">${p.price}</span>
            {sale && <s className="sf-productcard__compare">${p.compareAt}</s>}
            {styles.showRatings && p.rating !== undefined && (
              <span className="sf-productcard__rating">
                <Icon name="star" size={13} filled />
                {p.rating.toFixed(1)}
                {p.ratingCount !== undefined && <span>({p.ratingCount})</span>}
              </span>
            )}
          </span>
          {styles.ctaVariant === "inline" && renderCtas("sf-productcard__ctas sf-productcard__ctas--inline")}
        </div>

        {p.stock === "low" && <span className="sf-productcard__lowstock">Low stock</span>}
      </div>

      {styles.ctaVariant === "footer" && renderCtas("sf-productcard__ctas sf-productcard__ctas--footer")}
    </article>
  );
});

export default ProductCard;
