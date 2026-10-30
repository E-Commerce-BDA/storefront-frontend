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
export type CtaIconPosition = "center" | "bottom";
export type CtaVariant = "overlay" | "below" | "inline" | "footer" | "none";
export type CtaStyle = "icon" | "label" | "icon-label";
export type ImageBlendMode = "normal" | "multiply" | "darken" | "overlay" | "screen";
export type ImageFit = "cover" | "contain";
export type TextAlign = "left" | "center" | "right";

export type OptionCardPlacement = "info" | "media" | "brand-hover" | "media-hover-top" | "hidden";
export type EyebrowMode = "category" | "brand" | "none";
export type ImageNavMode = "hover" | "always" | "touch" | "none";
export type ImageIndicatorStyle = "dots" | "bars" | "count" | "none";
export type ImageIndicatorPosition = "bottom" | "top";
export type SelectionMode = "preview" | "commit-only" | "visual";
export type SelectionEffect = "image" | "price" | "stock";

export interface ProductImageItem {
  id?: string;
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface CardVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  imageUrl?: string | null;
  optionValues: Record<string, string>;
}

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
  cardPlacement?: OptionCardPlacement;
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
  /** Multiple product media images for carousel */
  images?: ProductImageItem[];
  /** Brand identity */
  brand?: { id?: string; name: string };
  /** Compact card variants for active selection effects */
  cardVariants?: CardVariant[];
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
  ctaBg?: string;
  ctaTextColor?: string;
  ctaBorderColor?: string;
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
  ctaIconPosition?: CtaIconPosition;
  showActionsOnTouch?: boolean;
  nameSize?: number;
  priceSize?: number;
  textAlign?: TextAlign;
  eyebrow?: EyebrowMode;
  imageNav?: ImageNavMode;
  imageIndicator?: ImageIndicatorStyle;
  imageIndicatorPosition?: ImageIndicatorPosition;
  imageLoop?: boolean;
  imageLimit?: number;
  selectionMode?: SelectionMode;
  selectionEffects?: SelectionEffect[];
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
  ctaBg?: string;
  ctaTextColor?: string;
  ctaBorderColor?: string;
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
  ctaIconPosition: CtaIconPosition;
  showActionsOnTouch: boolean;
  nameSize: number;
  priceSize: number;
  textAlign: TextAlign;
  eyebrow: EyebrowMode;
  imageNav: ImageNavMode;
  imageIndicator: ImageIndicatorStyle;
  imageIndicatorPosition: ImageIndicatorPosition;
  imageLoop: boolean;
  imageLimit: number;
  selectionMode: SelectionMode;
  selectionEffects: SelectionEffect[];
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
  ctaIconPosition: "bottom",
  showActionsOnTouch: false,
  nameSize: 15,
  priceSize: 15,
  textAlign: "left",
  eyebrow: "category",
  imageNav: "hover",
  imageIndicator: "dots",
  imageIndicatorPosition: "bottom",
  imageLoop: true,
  imageLimit: 5,
  selectionMode: "preview",
  selectionEffects: ["image"],
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

  const eyebrow: EyebrowMode =
    c.eyebrow === "brand" || c.eyebrow === "none" || c.eyebrow === "category" ? c.eyebrow : base.eyebrow;

  const imageNav: ImageNavMode =
    c.imageNav === "always" || c.imageNav === "touch" || c.imageNav === "none" || c.imageNav === "hover"
      ? c.imageNav
      : base.imageNav;

  const imageIndicator: ImageIndicatorStyle =
    c.imageIndicator === "bars" ||
    c.imageIndicator === "count" ||
    c.imageIndicator === "none" ||
    c.imageIndicator === "dots"
      ? c.imageIndicator
      : base.imageIndicator;

  const imageIndicatorPosition: ImageIndicatorPosition =
    c.imageIndicatorPosition === "top" ? "top" : base.imageIndicatorPosition;

  const imageLoop = c.imageLoop ?? base.imageLoop;
  const imageLimit = clamp(c.imageLimit ?? base.imageLimit, 1, 10, base.imageLimit);

  const selectionMode: SelectionMode =
    c.selectionMode === "commit-only" || c.selectionMode === "visual" || c.selectionMode === "preview"
      ? c.selectionMode
      : base.selectionMode;

  const selectionEffects: SelectionEffect[] = Array.isArray(c.selectionEffects)
    ? c.selectionEffects.filter((e): e is SelectionEffect => e === "image" || e === "price" || e === "stock")
    : base.selectionEffects;

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
    ctaBg: c.ctaBg ?? base.ctaBg,
    ctaTextColor: c.ctaTextColor ?? base.ctaTextColor,
    ctaBorderColor: c.ctaBorderColor ?? base.ctaBorderColor,
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
    ctaIconPosition: c.ctaIconPosition === "center" ? "center" : (base.ctaIconPosition ?? "bottom"),
    showActionsOnTouch: c.showActionsOnTouch ?? base.showActionsOnTouch,
    nameSize: clamp(c.nameSize ?? base.nameSize, L.nameSize.min, L.nameSize.max, base.nameSize),
    priceSize: clamp(c.priceSize ?? base.priceSize, L.priceSize.min, L.priceSize.max, base.priceSize),
    textAlign,
    eyebrow,
    imageNav,
    imageIndicator,
    imageIndicatorPosition,
    imageLoop,
    imageLimit,
    selectionMode,
    selectionEffects,
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
  if (resolved.ctaBg) vars["--pc-cta-bg"] = resolved.ctaBg;
  if (resolved.ctaTextColor) vars["--pc-cta-text"] = resolved.ctaTextColor;
  if (resolved.ctaBorderColor) vars["--pc-cta-border"] = resolved.ctaBorderColor;

  return vars as React.CSSProperties;
}

export interface ResolvedVariantState {
  activeVariant: CardVariant | null;
  displayImage: string;
  displayPrice: number;
  displayCompareAt?: number | null;
  displayStock: ProductStock;
  isOutOfStock: boolean;
}

/**
 * Pure variant resolver for selection effects on catalog grids.
 */
export function resolveSelectedVariant(
  product: ProductCardData,
  selectedOptions?: Record<string, string>,
  previewedOptions?: Record<string, string> | null,
  activeImageIndex: number = 0,
  effects: SelectionEffect[] = ["image"],
): ResolvedVariantState {
  const activeOpts = {
    ...(selectedOptions ?? {}),
    ...(previewedOptions ?? {}),
  };

  const variants = product.cardVariants ?? [];
  let matched: CardVariant | null = null;

  if (variants.length > 0 && Object.keys(activeOpts).length > 0) {
    matched =
      variants.find((v) =>
        Object.entries(activeOpts).every(([optName, optVal]) => v.optionValues[optName] === optVal),
      ) ?? null;
  }

  // Base image selection
  let baseImage = product.image;
  if (product.images && product.images.length > 0) {
    const idx = Math.max(0, Math.min(activeImageIndex, product.images.length - 1));
    baseImage = product.images[idx]?.url || product.image;
  }

  const applyImage = effects.includes("image");
  const applyPrice = effects.includes("price");
  const applyStock = effects.includes("stock");

  const displayImage = applyImage && matched?.imageUrl ? matched.imageUrl : baseImage;
  const displayPrice = applyPrice && matched?.price !== undefined ? matched.price : product.price;
  const displayCompareAt =
    applyPrice && matched?.compareAtPrice !== undefined ? matched.compareAtPrice : product.compareAt;

  let displayStock = product.stock ?? "in";
  if (applyStock && matched) {
    displayStock = matched.stock <= 0 ? "out" : matched.stock < 5 ? "low" : "in";
  }

  return {
    activeVariant: matched,
    displayImage,
    displayPrice,
    displayCompareAt,
    displayStock,
    isOutOfStock: displayStock === "out",
  };
}
