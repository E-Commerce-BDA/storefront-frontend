import { forwardRef, useRef } from "react";
import { Badge, Icon } from "@/components/ui";
import { tagTone } from "@/lib/search/tagTone";
import {
  type BadgePosition,
  type CtaPosition,
  type CtaStyle,
  type CtaVariant,
  type EyebrowMode,
  type HoverMode,
  type ImageBlendMode,
  type ImageFit,
  type ImageIndicatorPosition,
  type ImageIndicatorStyle,
  type ImageNavMode,
  type MediaRatio,
  type OptionCardPlacement,
  type ProductCardData,
  type ProductCardOption,
  type ProductCardReserved,
  type ProductCardStyleConfig,
  type ProductCardType,
  type QuickAction,
  type SelectionEffect,
  type SelectionMode,
  type TextAlign,
  resolveProductCardCssVars,
  resolveProductCardStyles,
  resolveSelectedVariant,
} from "@/lib/commerce/productCard";

/**
 * Dumb ProductCard — commerce face (product.md §1–8): media + badges +
 * info + action bar variants + swatches/pills + stock/wishlist states +
 * sibling multi-image carousel + variant selection effects.
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
  previewedOptions?: Record<string, string> | null;
  onSelectOption?: (optionName: string, value: string) => void;
  onPreviewOption?: (optionName: string, value: string | null) => void;
  activeImageIndex?: number;
  onImageIndexChange?: (newIndex: number) => void;
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
    previewedOptions,
    onSelectOption,
    onPreviewOption,
    activeImageIndex,
    onImageIndexChange,
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
    eyebrow,
    imageNav,
    imageIndicator,
    imageIndicatorPosition,
    imageLoop,
    imageLimit,
    selectionMode,
    selectionEffects,
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

  const touchStartXRef = useRef<number>(0);

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
    ...(eyebrow !== undefined ? { eyebrow } : {}),
    ...(imageNav !== undefined ? { imageNav } : {}),
    ...(imageIndicator !== undefined ? { imageIndicator } : {}),
    ...(imageIndicatorPosition !== undefined ? { imageIndicatorPosition } : {}),
    ...(imageLoop !== undefined ? { imageLoop } : {}),
    ...(imageLimit !== undefined ? { imageLimit } : {}),
    ...(selectionMode !== undefined ? { selectionMode } : {}),
    ...(selectionEffects !== undefined ? { selectionEffects } : {}),
  });

  // Multi-image list bounded by imageLimit
  const rawImages = p.images && p.images.length > 0 ? p.images : p.image ? [{ url: p.image }] : [];
  const images = rawImages.slice(0, styles.imageLimit);
  const totalImages = images.length;
  const currentImageIdx = Math.max(0, Math.min(activeImageIndex ?? 0, totalImages - 1));

  // Pure variant resolution for selection effects (image swap, price update, stock)
  const {
    displayImage,
    displayPrice,
    displayCompareAt,
    displayStock,
    isOutOfStock,
  } = resolveSelectedVariant(
    p,
    selectedOptions,
    previewedOptions,
    currentImageIdx,
    styles.selectionEffects,
  );

  const out = isOutOfStock || displayStock === "out" || p.stock === "out";
  const sale = displayCompareAt !== undefined && displayCompareAt !== null && displayCompareAt > displayPrice;
  const handlers: Record<QuickAction, ((p: ProductCardData) => void) | undefined> = {
    "quick-view": onQuickView,
    wishlist: onWishlist,
    "add-to-cart": onQuickAdd,
    share: onShare,
  };

  const openLabel = `${p.name}, $${displayPrice}`;

  function open() {
    if (!out) onOpen?.(p);
  }

  const cssVars = resolveProductCardCssVars(styles);

  // Carousel arrow click handlers (stop propagation so card doesn't navigate)
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalImages <= 1) return;
    if (currentImageIdx > 0) {
      onImageIndexChange?.(currentImageIdx - 1);
    } else if (styles.imageLoop) {
      onImageIndexChange?.(totalImages - 1);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalImages <= 1) return;
    if (currentImageIdx < totalImages - 1) {
      onImageIndexChange?.(currentImageIdx + 1);
    } else if (styles.imageLoop) {
      onImageIndexChange?.(0);
    }
  };

  // Touch swipe support on media
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (totalImages <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartXRef.current;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        // Swipe left -> Next
        if (currentImageIdx < totalImages - 1) {
          onImageIndexChange?.(currentImageIdx + 1);
        } else if (styles.imageLoop) {
          onImageIndexChange?.(0);
        }
      } else {
        // Swipe right -> Prev
        if (currentImageIdx > 0) {
          onImageIndexChange?.(currentImageIdx - 1);
        } else if (styles.imageLoop) {
          onImageIndexChange?.(totalImages - 1);
        }
      }
    }
  };

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

  // Partition options by placement slot
  const options = p.options ?? [];
  const getPlacement = (opt: ProductCardOption): OptionCardPlacement => {
    if (opt.cardPlacement) return opt.cardPlacement;
    return opt.showOnCard !== false ? "info" : "hidden";
  };

  const infoOptions = options.filter((o) => getPlacement(o) === "info");
  const mediaOptions = options.filter((o) => getPlacement(o) === "media");
  const brandHoverOptions = options.filter((o) => getPlacement(o) === "brand-hover");
  const mediaHoverTopOptions = options.filter((o) => getPlacement(o) === "media-hover-top");

  const renderOptionGroup = (opt: ProductCardOption) => {
    const isSwatch = opt.displayType === "swatch" && styles.showSwatches;
    const isPill = opt.displayType === "pill" && styles.showPills;
    if (!isSwatch && !isPill) return null;

    const selectedVal = selectedOptions?.[opt.name];
    const hasSelected = opt.values.some((v) => v.value === selectedVal);

    const handleKeyDown = (e: React.KeyboardEvent, currIdx: number) => {
      let nextIdx = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIdx = (currIdx + 1) % opt.values.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        nextIdx = (currIdx - 1 + opt.values.length) % opt.values.length;
      } else if (e.key === "Home") {
        nextIdx = 0;
      } else if (e.key === "End") {
        nextIdx = opt.values.length - 1;
      }
      if (nextIdx !== -1) {
        e.preventDefault();
        onSelectOption?.(opt.name, opt.values[nextIdx].value);
      }
    };

    if (isSwatch) {
      return (
        <div
          key={opt.name}
          className="sf-productcard__swatches"
          role="radiogroup"
          aria-label={`Options for ${opt.name}`}
        >
          {opt.values.map((v, idx) => {
            const isSelected = selectedVal === v.value;
            const tabIndex = isSelected ? 0 : !hasSelected && idx === 0 ? 0 : -1;
            return (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={tabIndex}
                aria-label={`${opt.name}: ${v.value}`}
                title={v.value}
                className={`sf-productcard__swatch ${isSelected ? "sf-productcard__swatch--active" : ""}`}
                style={{
                  backgroundColor: v.swatchHex ?? "var(--border, currentColor)",
                  backgroundImage: v.swatchImageUrl ? `url(${v.swatchImageUrl})` : undefined,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOption?.(opt.name, v.value);
                }}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onMouseEnter={() => {
                  if (styles.selectionMode === "preview") {
                    onPreviewOption?.(opt.name, v.value);
                  }
                }}
                onMouseLeave={() => {
                  if (styles.selectionMode === "preview") {
                    onPreviewOption?.(opt.name, null);
                  }
                }}
                onFocus={() => {
                  if (styles.selectionMode === "preview") {
                    onPreviewOption?.(opt.name, v.value);
                  }
                }}
                onBlur={() => {
                  if (styles.selectionMode === "preview") {
                    onPreviewOption?.(opt.name, null);
                  }
                }}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div
        key={opt.name}
        className="sf-productcard__pills"
        role="radiogroup"
        aria-label={`Options for ${opt.name}`}
      >
        {opt.values.map((v, idx) => {
          const isSelected = selectedVal === v.value;
          const tabIndex = isSelected ? 0 : !hasSelected && idx === 0 ? 0 : -1;
          return (
            <button
              key={v.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={tabIndex}
              aria-label={`${opt.name}: ${v.value}`}
              className={`sf-productcard__pill ${isSelected ? "sf-productcard__pill--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectOption?.(opt.name, v.value);
              }}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onMouseEnter={() => {
                if (styles.selectionMode === "preview") {
                  onPreviewOption?.(opt.name, v.value);
                }
              }}
              onMouseLeave={() => {
                if (styles.selectionMode === "preview") {
                  onPreviewOption?.(opt.name, null);
                }
              }}
              onFocus={() => {
                if (styles.selectionMode === "preview") {
                  onPreviewOption?.(opt.name, v.value);
                }
              }}
              onBlur={() => {
                if (styles.selectionMode === "preview") {
                  onPreviewOption?.(opt.name, null);
                }
              }}
            >
              {v.value}
            </button>
          );
        })}
      </div>
    );
  };

  const eyebrowLabel = styles.eyebrow === "brand" ? (p.brand?.name ?? p.category) : p.category;

  return (
    <article
      ref={ref}
      data-stock={displayStock}
      data-card-type={styles.cardType}
      data-hover={styles.hoverMode}
      data-touch-actions={styles.showActionsOnTouch}
      data-badgepos={styles.badgePosition}
      data-ctapos={styles.ctaPosition}
      data-ctavariant={styles.ctaVariant}
      data-ctastyle={styles.ctaStyle}
      data-blend-mode={styles.imageBlendMode}
      data-fit={styles.imageFit}
      data-align={styles.textAlign}
      data-imagenav={styles.imageNav}
      data-imageindicator={styles.imageIndicator}
      data-indicatorpos={styles.imageIndicatorPosition}
      className={`sf-productcard ${className}`}
      style={{ ...cssVars, ...customStyle }}
    >
      <div
        className="sf-productcard__media"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="sf-productcard__open"
          onClick={open}
          disabled={out}
          aria-label={openLabel}
        >
          {displayImage ? (
            // alt="" deliberate: open control announces name+price —
            // named imgs would double-announce (palette-row pattern).
            <img src={displayImage} alt="" loading="lazy" className="sf-productcard__cover" />
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

        {/* Carousel arrows — siblings of open button (never nested buttons) */}
        {totalImages > 1 && styles.imageNav !== "none" && (
          <div className="sf-productcard__img-nav">
            <button
              type="button"
              className="sf-productcard__img-arrow sf-productcard__img-arrow--prev"
              onClick={handlePrevImage}
              disabled={!styles.imageLoop && currentImageIdx === 0}
              aria-label="Previous image"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <button
              type="button"
              className="sf-productcard__img-arrow sf-productcard__img-arrow--next"
              onClick={handleNextImage}
              disabled={!styles.imageLoop && currentImageIdx === totalImages - 1}
              aria-label="Next image"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        )}

        {/* Carousel indicators */}
        {totalImages > 1 && styles.imageIndicator !== "none" && (
          <div
            className="sf-productcard__img-indicators"
            data-position={styles.imageIndicatorPosition}
            data-style={styles.imageIndicator}
            role="tablist"
            aria-label="Image slides"
          >
            {styles.imageIndicator === "dots" &&
              images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === currentImageIdx}
                  aria-label={`Slide ${i + 1} of ${totalImages}`}
                  className={`sf-productcard__indicator-dot ${i === currentImageIdx ? "sf-productcard__indicator-dot--active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageIndexChange?.(i);
                  }}
                  tabIndex={-1}
                />
              ))}
            {styles.imageIndicator === "bars" &&
              images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === currentImageIdx}
                  aria-label={`Slide ${i + 1} of ${totalImages}`}
                  className={`sf-productcard__indicator-bar ${i === currentImageIdx ? "sf-productcard__indicator-bar--active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageIndexChange?.(i);
                  }}
                  tabIndex={-1}
                />
              ))}
            {styles.imageIndicator === "count" && (
              <span className="sf-productcard__indicator-count" aria-live="polite">
                {currentImageIdx + 1} / {totalImages}
              </span>
            )}
          </div>
        )}

        {/* Media top hover options (e.g. size pills on media hover) */}
        {mediaHoverTopOptions.length > 0 && (
          <div className="sf-productcard__media-hover-top">
            {mediaHoverTopOptions.map(renderOptionGroup)}
          </div>
        )}

        {/* Media bottom overlay options */}
        {mediaOptions.length > 0 && (
          <div className="sf-productcard__media-options">
            {mediaOptions.map(renderOptionGroup)}
          </div>
        )}

        {/* Overlay CTAs */}
        {styles.ctaVariant === "overlay" && renderCtas("sf-productcard__ctas")}

        {out && (
          <span className="sf-productcard__soldout" aria-hidden="true">
            Sold out
          </span>
        )}
      </div>

      {styles.ctaVariant === "below" && renderCtas("sf-productcard__ctas sf-productcard__ctas--below")}

      <div className="sf-productcard__info">
        {((styles.showDept && styles.eyebrow !== "none") || brandHoverOptions.length > 0) && (
          <div className="sf-productcard__eyebrow-container">
            {styles.showDept && styles.eyebrow !== "none" && (
              <span className="sf-productcard__dept">{eyebrowLabel}</span>
            )}
            {brandHoverOptions.length > 0 && (
              <div className="sf-productcard__brand-hover-slot">
                {brandHoverOptions.map(renderOptionGroup)}
              </div>
            )}
          </div>
        )}

        <button type="button" className="sf-productcard__name" onClick={open} disabled={out} aria-label={openLabel}>
          {p.name}
        </button>

        {infoOptions.length > 0 && (
          <div className="sf-productcard__options">
            {infoOptions.map(renderOptionGroup)}
          </div>
        )}

        <div className="sf-productcard__pricerow-wrap">
          <span className="sf-productcard__pricerow">
            <span className="sf-productcard__price">${displayPrice}</span>
            {sale && <s className="sf-productcard__compare">${displayCompareAt}</s>}
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

        {displayStock === "low" && <span className="sf-productcard__lowstock">Low stock</span>}
      </div>

      {styles.ctaVariant === "footer" && renderCtas("sf-productcard__ctas sf-productcard__ctas--footer")}
    </article>
  );
});

export default ProductCard;
