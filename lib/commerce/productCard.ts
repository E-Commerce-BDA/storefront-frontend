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
export type CtaVariant = "overlay" | "below" | "inline" | "footer" | "none";
export type CtaStyle = "icon" | "label" | "icon-label";
export type ImageBlendMode = "normal" | "multiply" | "darken" | "overlay" | "screen";
export type ImageFit = "cover" | "contain";
export type TextAlign = "left" | "center" | "right";

export interface ProductCardBadge {
  id?: string;
  key: string;
  label: string;
  bg: string;
  textColor: string;
  borderColor?: string | null;
  borderStyle?: "solid" | "dashed" | "dotted";
}

export interface ProductCardOptionValue {
  id?: string;
  value: string;
  position?: number;
  swatchHex?: string | null;
  swatchImageUrl?: string | null;
  inStock?: boolean;
}

export interface ProductCardOption {
  id?: string;
  name: string;
  displayType: "text" | "pill" | "swatch";
  showOnCard: boolean;
  values: ProductCardOptionValue[];
}

export interface ProductCardData extends SearchResult {
  /** Hover-swap image (admin sets; absent = static cover). */
  hoverImage?: string;
  /** PDP destination (owner routes; absent = onOpen only). */
  url?: string;
  /** Compare-at price (strikethrough + sale face when above price). */
  compareAt?: number;
  stock?: ProductStock;
  wishlisted?: boolean;
  /** Centralized badge list resolved from catalog registry */
  badges?: ProductCardBadge[];
  /** Card-projected options (swatches, size pills) */
  options?: ProductCardOption[];
  /** Sparse per-product card settings */
  cardSettings?: Partial<ProductCardStyleConfig>;
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
  textColor?: string;
  mutedTextColor?: string;
  priceColor?: string;
  comparePriceColor?: string;
  imageBlendMode?: ImageBlendMode;
  imageFit?: ImageFit;
  badgePosition?: BadgePosition;
  showBadge?: boolean;
  showRatings?: boolean;
  showDept?: boolean;
  showSwatches?: boolean;
  showPills?: boolean;
  hoverMode?: HoverMode;
  ctaVariant?: CtaVariant;
  ctaStyle?: CtaStyle;
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
  textColor: string;
  mutedTextColor: string;
  priceColor: string;
  comparePriceColor: string;
  imageBlendMode: ImageBlendMode;
  imageFit: ImageFit;
  badgePosition: BadgePosition;
  showBadge: boolean;
  showRatings: boolean;
  showDept: boolean;
  showSwatches: boolean;
  showPills: boolean;
  hoverMode: HoverMode;
  ctaVariant: CtaVariant;
  ctaStyle: CtaStyle;
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
  textColor: "",
  mutedTextColor: "",
  priceColor: "",
  comparePriceColor: "",
  imageBlendMode: "normal",
  imageFit: "cover",
  badgePosition: "left",
  showBadge: true,
  showRatings: true,
  showDept: true,
  showSwatches: true,
  showPills: true,
  hoverMode: "actions",
  ctaVariant: "overlay",
  ctaStyle: "icon",
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

/**
 * Checks if a hex color is dark (<128 brightness) for contrast fallback.
 */
export function isDarkHex(color: string): boolean {
  if (!color.startsWith("#")) return false;
  let hex = color.slice(1);
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split("").map((c) => c + c).join("").slice(0, 6);
  } else if (hex.length >= 6) {
    hex = hex.slice(0, 6);
  } else {
    return false;
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

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

  const cardBg = cleanColor(c.cardBg, base.cardBg);
  const borderColor = cleanColor(c.borderColor, base.borderColor);
  const hoverCardBg = cleanColor(c.hoverCardBg, base.hoverCardBg);
  const hoverBorderColor = cleanColor(c.hoverBorderColor, base.hoverBorderColor);
  const mediaBg = cleanColor(c.mediaBg, base.mediaBg);

  // Contrast Safety Logic: if cardBg is dark and no explicit text colors given, provide readable tokens
  const isDarkBg = isDarkHex(cardBg);
  let textColor = cleanColor(c.textColor, base.textColor);
  let mutedTextColor = cleanColor(c.mutedTextColor, base.mutedTextColor);
  let priceColor = cleanColor(c.priceColor, base.priceColor);
  let comparePriceColor = cleanColor(c.comparePriceColor, base.comparePriceColor);

  if (isDarkBg) {
    if (!textColor) textColor = "#f8fafc";
    if (!mutedTextColor) mutedTextColor = "#94a3b8";
    if (!priceColor) priceColor = "#38bdf8";
    if (!comparePriceColor) comparePriceColor = "#64748b";
  }

  const validBlends = new Set<ImageBlendMode>(["normal", "multiply", "darken", "overlay", "screen"]);
  const imageBlendMode: ImageBlendMode =
    c.imageBlendMode && validBlends.has(c.imageBlendMode) ? c.imageBlendMode : base.imageBlendMode;

  const validFits = new Set<ImageFit>(["cover", "contain"]);
  const imageFit: ImageFit = c.imageFit && validFits.has(c.imageFit) ? c.imageFit : base.imageFit;

  const validHovers = new Set<HoverMode>(["none", "image", "actions", "zoom"]);
  const hoverMode: HoverMode = c.hoverMode && validHovers.has(c.hoverMode) ? c.hoverMode : base.hoverMode;

  const validCtaVariants = new Set<CtaVariant>(["overlay", "below", "inline", "footer", "none"]);
  const ctaVariant: CtaVariant =
    c.ctaVariant && validCtaVariants.has(c.ctaVariant) ? c.ctaVariant : base.ctaVariant;

  const validCtaStyles = new Set<CtaStyle>(["icon", "label", "icon-label"]);
  const ctaStyle: CtaStyle =
    c.ctaStyle && validCtaStyles.has(c.ctaStyle) ? c.ctaStyle : base.ctaStyle;

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
    badgePosition: c.badgePosition === "right" || c.badgePosition === "left" ? c.badgePosition : base.badgePosition,
    showBadge: c.showBadge ?? base.showBadge,
    showRatings: c.showRatings ?? base.showRatings,
    showDept: c.showDept ?? base.showDept,
    showSwatches: c.showSwatches ?? base.showSwatches,
    showPills: c.showPills ?? base.showPills,
    hoverMode,
    ctaVariant,
    ctaStyle,
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
  if (resolved.textColor) vars["--pc-text"] = resolved.textColor;
  if (resolved.mutedTextColor) vars["--pc-muted"] = resolved.mutedTextColor;
  if (resolved.priceColor) vars["--pc-price"] = resolved.priceColor;
  if (resolved.comparePriceColor) vars["--pc-compare-price"] = resolved.comparePriceColor;

  return vars as React.CSSProperties;
}
