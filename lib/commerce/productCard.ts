/**
 * Product card data — extends SearchResult additively (never forks).
 * All new fields optional: absent renders the base face.
 */
import type { SearchResult } from "@/lib/search/source";

export type ProductStock = "in" | "low" | "out";
export type MediaRatio = "1:1" | "3:4" | "4:5" | "4:3" | "16:9";
export type ProductCardType = "standard" | "minimal" | "compact" | "overlay" | "horizontal";
export type BadgePosition = "left" | "right";
export type HoverMode = "none" | "image" | "actions" | "zoom";
export type QuickAction = "quick-view" | "wishlist" | "add-to-cart" | "share";
export type CtaPosition = "left" | "center" | "right";
export type ImageBlendMode = "normal" | "multiply" | "darken" | "overlay" | "screen";
export type ImageFit = "cover" | "contain";
export type TextAlign = "left" | "center" | "right";

export interface ProductCardData extends SearchResult {
  /** Hover-swap image (admin sets; absent = static cover). */
  hoverImage?: string;
  /** PDP destination (owner routes; absent = onOpen only). */
  url?: string;
  /** Compare-at price (strikethrough + sale face when above price). */
  compareAt?: number;
  stock?: ProductStock;
  wishlisted?: boolean;
}

/** Reserved (deferred slices land here — never stubbed UI). */
export interface ProductCardReserved {
  /** Single-attribute quick-pick (needs variant-inventory thinking). */
  selectedAttribute?: string;
  onAttribute?: (attr: string) => void;
  onQuickView?: (p: ProductCardData) => void;
  onCompare?: (p: ProductCardData) => void;
}

export interface ProductCardStyleConfig {
  cardType?: ProductCardType;
  mediaRatio?: MediaRatio;
  borderRadius?: number;
  imageBorderRadius?: number;
  cardPad?: number;
  cardBg?: string;
  borderColor?: string;
  hoverCardBg?: string;
  hoverBorderColor?: string;
  mediaBg?: string;
  imageBlendMode?: ImageBlendMode;
  imageFit?: ImageFit;
  badgePosition?: BadgePosition;
  showBadge?: boolean;
  showRatings?: boolean;
  showDept?: boolean;
  hoverMode?: HoverMode;
  ctaSet?: QuickAction[];
  ctaPosition?: CtaPosition;
  showActionsOnTouch?: boolean;
  nameSize?: number;
  priceSize?: number;
  textAlign?: TextAlign;
}

export interface ResolvedProductCardStyles {
  cardType: ProductCardType;
  mediaRatio: MediaRatio;
  borderRadius: number;
  imageBorderRadius: number;
  cardPad: number;
  cardBg: string;
  borderColor: string;
  hoverCardBg: string;
  hoverBorderColor: string;
  mediaBg: string;
  imageBlendMode: ImageBlendMode;
  imageFit: ImageFit;
  badgePosition: BadgePosition;
  showBadge: boolean;
  showRatings: boolean;
  showDept: boolean;
  hoverMode: HoverMode;
  ctaSet: QuickAction[];
  ctaPosition: CtaPosition;
  showActionsOnTouch: boolean;
  nameSize: number;
  priceSize: number;
  textAlign: TextAlign;
}

export const PRODUCT_CARD_RATIOS: Record<MediaRatio, string> = {
  "1:1": "1 / 1",
  "3:4": "3 / 4",
  "4:5": "4 / 5",
  "4:3": "4 / 3",
  "16:9": "16 / 9",
};

export const PRODUCT_CARD_LIMITS = {
  radius: { min: 0, max: 24 },
  pad: { min: 0, max: 24 },
  nameSize: { min: 12, max: 22 },
  priceSize: { min: 12, max: 22 },
} as const;

export const DEFAULT_PRODUCT_CARD_STYLES: ResolvedProductCardStyles = {
  cardType: "standard",
  mediaRatio: "4:5",
  borderRadius: 0,
  imageBorderRadius: 0,
  cardPad: 0,
  cardBg: "",
  borderColor: "",
  hoverCardBg: "",
  hoverBorderColor: "",
  mediaBg: "",
  imageBlendMode: "normal",
  imageFit: "cover",
  badgePosition: "left",
  showBadge: true,
  showRatings: true,
  showDept: true,
  hoverMode: "actions",
  ctaSet: ["quick-view", "wishlist", "add-to-cart"],
  ctaPosition: "center",
  showActionsOnTouch: false,
  nameSize: 15,
  priceSize: 15,
  textAlign: "left",
};

const clamp = (v: unknown, min: number, max: number, fallback: number): number => {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.min(Math.max(Math.round(v), min), max);
};

const cleanColor = (c: unknown, fallback: string): string => {
  if (typeof c !== "string") return fallback;
  const t = c.trim();
  if (t === "") return "";
  if (/^#([0-9a-fA-F]{3,8})$/.test(t)) return t;
  if (/^(rgb|rgba|hsl|hsla|var)\(/.test(t)) return t;
  return fallback;
};

export function resolveProductCardStyles(
  custom?: ProductCardStyleConfig,
  themeFallback?: Partial<ResolvedProductCardStyles>,
): ResolvedProductCardStyles {
  const base: ResolvedProductCardStyles = {
    ...DEFAULT_PRODUCT_CARD_STYLES,
    ...themeFallback,
  };
  const c = custom ?? {};
  const L = PRODUCT_CARD_LIMITS;

  const validCardTypes = new Set<ProductCardType>(["standard", "minimal", "compact", "overlay", "horizontal"]);
  const cardType: ProductCardType = c.cardType && validCardTypes.has(c.cardType) ? c.cardType : base.cardType;

  const validRatios = new Set<MediaRatio>(["1:1", "3:4", "4:5", "4:3", "16:9"]);
  const mediaRatio: MediaRatio = c.mediaRatio && validRatios.has(c.mediaRatio) ? c.mediaRatio : base.mediaRatio;

  const borderRadius = clamp(c.borderRadius ?? base.borderRadius, L.radius.min, L.radius.max, base.borderRadius);
  const imageBorderRadius = clamp(
    c.imageBorderRadius ?? (c.borderRadius !== undefined ? c.borderRadius : base.imageBorderRadius),
    L.radius.min,
    L.radius.max,
    borderRadius,
  );
  const cardPad = clamp(c.cardPad ?? base.cardPad, L.pad.min, L.pad.max, base.cardPad);

  const validBlends = new Set<ImageBlendMode>(["normal", "multiply", "darken", "overlay", "screen"]);
  const imageBlendMode: ImageBlendMode =
    c.imageBlendMode && validBlends.has(c.imageBlendMode) ? c.imageBlendMode : base.imageBlendMode;

  const validFits = new Set<ImageFit>(["cover", "contain"]);
  const imageFit: ImageFit = c.imageFit && validFits.has(c.imageFit) ? c.imageFit : base.imageFit;

  const validHovers = new Set<HoverMode>(["none", "image", "actions", "zoom"]);
  const hoverMode: HoverMode = c.hoverMode && validHovers.has(c.hoverMode) ? c.hoverMode : base.hoverMode;

  const validAligns = new Set<TextAlign>(["left", "center", "right"]);
  const textAlign: TextAlign = c.textAlign && validAligns.has(c.textAlign) ? c.textAlign : base.textAlign;

  const rawCtaSet = Array.isArray(c.ctaSet) ? c.ctaSet : base.ctaSet;
  const validCtas = new Set<QuickAction>(["quick-view", "wishlist", "add-to-cart", "share"]);
  const ctaSet = rawCtaSet.filter((action): action is QuickAction => validCtas.has(action)).slice(0, 3);

  return {
    cardType,
    mediaRatio,
    borderRadius,
    imageBorderRadius,
    cardPad,
    cardBg: cleanColor(c.cardBg, base.cardBg),
    borderColor: cleanColor(c.borderColor, base.borderColor),
    hoverCardBg: cleanColor(c.hoverCardBg, base.hoverCardBg),
    hoverBorderColor: cleanColor(c.hoverBorderColor, base.hoverBorderColor),
    mediaBg: cleanColor(c.mediaBg, base.mediaBg),
    imageBlendMode,
    imageFit,
    badgePosition: c.badgePosition === "right" || c.badgePosition === "left" ? c.badgePosition : base.badgePosition,
    showBadge: c.showBadge ?? base.showBadge,
    showRatings: c.showRatings ?? base.showRatings,
    showDept: c.showDept ?? base.showDept,
    hoverMode,
    ctaSet,
    ctaPosition:
      c.ctaPosition === "left" || c.ctaPosition === "right" || c.ctaPosition === "center"
        ? c.ctaPosition
        : base.ctaPosition,
    showActionsOnTouch: c.showActionsOnTouch ?? base.showActionsOnTouch,
    nameSize: clamp(c.nameSize ?? base.nameSize, L.nameSize.min, L.nameSize.max, base.nameSize),
    priceSize: clamp(c.priceSize ?? base.priceSize, L.priceSize.min, L.priceSize.max, base.priceSize),
    textAlign,
  };
}

export function resolveProductCardCssVars(resolved: ResolvedProductCardStyles): React.CSSProperties {
  const vars: Record<string, string> = {
    "--pc-ratio": PRODUCT_CARD_RATIOS[resolved.mediaRatio],
    "--pc-radius": `${resolved.borderRadius}px`,
    "--pc-media-radius": `${resolved.imageBorderRadius}px`,
    "--pc-pad": `${resolved.cardPad}px`,
    "--pc-image-blend": resolved.imageBlendMode,
    "--pc-image-fit": resolved.imageFit,
    "--pc-name-size": `${resolved.nameSize}px`,
    "--pc-price-size": `${resolved.priceSize}px`,
    "--pc-align": resolved.textAlign,
  };

  if (resolved.cardBg) vars["--pc-bg"] = resolved.cardBg;
  if (resolved.borderColor) vars["--pc-border"] = resolved.borderColor;
  if (resolved.hoverCardBg) vars["--pc-hover-bg"] = resolved.hoverCardBg;
  if (resolved.hoverBorderColor) vars["--pc-hover-border"] = resolved.hoverBorderColor;
  if (resolved.mediaBg) vars["--pc-media-bg"] = resolved.mediaBg;

  return vars as React.CSSProperties;
}
