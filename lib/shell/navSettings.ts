/**
 * Navbar settings vocabulary — Oceanic Blue v1.0
 * (Locked navbar plan: regions, logo, bar, colors, links, search/account/
 * cart, announcement/mobile. Same-everywhere chrome — single shared scope,
 * no per-page overrides in v1.)
 *
 * This file NAMES things, nothing more: what can be customized (shapes),
 * what the world looks like uncustomized (DEFAULT_* = today's look = final
 * fallback), and numeric limits. No logic, no merging, no clamping — that
 * belongs to resolveNav.ts. No React, no fetch.
 *
 * Convention (mirrors lib/auth/settings.ts): admin-facing fields are
 * all-optional (absent = inherit); resolved types are all-required;
 * hex literals live ONLY in DEFAULT_* (the one legal home for literals).
 */

import type { OverlayMotionField, ResolvedOverlayMotion } from "@/lib/search/motion";

export type LogoPosition = "left" | "center";
export type StickyMode = "always" | "hide-on-scroll" | "static";
export type BarShadow = "border" | "float" | "none";
export type LinkHighlight = "none" | "sale" | "bold" | "accent";
export type CartDestination = "drawer" | "page";
export type DrawerSide = "left" | "right";
export type AccountItem = "orders" | "addresses" | "wishlist" | "signout";

/** Schedule window as ISO strings (never Date — must survive JSON). */
export interface LinkSchedule {
  startsAt?: string;
  endsAt?: string;
}

export interface LinkBadge {
  text: string;
}

export type NavLink =
  | { kind: "category"; label: string; href: string; categoryId: string; icon?: string; badge?: LinkBadge; highlight?: LinkHighlight; schedule?: LinkSchedule }
  | { kind: "custom"; label: string; href: string; icon?: string; badge?: LinkBadge; highlight?: LinkHighlight; schedule?: LinkSchedule };

/** Numeric limits for every ranged knob (clamped in resolveNav.ts). */
export const NAV_LIMITS = {
  logoHeight: { min: 20, max: 40 },
  barHeight: { min: 56, max: 80 },
  maxItems: { min: 3, max: 8 },
  badgeCap: { min: 1, max: 99 },
  breakpoint: { min: 640, max: 1024 },
  bgAlpha: { min: 0, max: 100 },
  blurPx: { min: 0, max: 24 },
  cardRadius: { min: 0, max: 24 },
} as const;

/** Resolved palette settings: all required (produced by resolveNav.ts). */
export interface ResolvedPaletteSettings {
  cardBg: string;
  backdrop: string;
  backdropAlpha: number;
  blur: boolean;
  blurPx: number;
  inputColor: string;
  placeholderColor: string;
  iconColor: string;
  closeColor: string;
  mutedColor: string;
  headingColor: string;
  nameColor: string;
  priceColor: string;
  ratingColor: string;
  deptColor: string;
  pillActiveBg: string;
  pillActiveText: string;
  pillText: string;
  pillBorder: string;
  pillChipBg: string;
  quickAddBg: string;
  quickAddText: string;
  quickAddedBg: string;
  quickAddedText: string;
  cardType: PaletteCardType;
  thumbRadius: number;
  paletteAnimation: ResolvedOverlayMotion;
}

/** Resolved editorial settings: all required (produced by resolveNav.ts). */
export interface ResolvedEditorialSettings {
  bg: string;
  bgAlpha: number;
  blur: boolean;
  blurPx: number;
  eyebrow: string;
  eyebrowColor: string;
  archiveEyebrow: string;
  archiveColor: string;
  inputColor: string;
  placeholderColor: string;
  underlineColor: string;
  title: string;
  titleColor: string;
  mutedColor: string;
  closeIconColor: string;
  tabTextColor: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabShape: EditorialTabShape;
  cardType: EditorialCardType;
  cardRadius: number;
  deptColor: string;
  nameColor: string;
  priceColor: string;
  editorialAnimation: ResolvedOverlayMotion;
}

/* Admin-facing fields: all optional (absent = inherit). */

export interface NavRegionsField {
  announcement?: boolean;
  logo?: boolean;
  links?: boolean;
  search?: boolean;
  account?: boolean;
  wishlist?: boolean;
  cart?: boolean;
  badge?: boolean;
}

export interface NavLogoField {
  imageUrl?: string;
  height?: number;
  position?: LogoPosition;
  wordmark?: string;
}

export interface NavBarField {
  height?: number;
  sticky?: StickyMode;
  shadow?: BarShadow;
}

export interface NavColorsField {
  bg?: string;
  text?: string;
  hover?: string;
  badgeBg?: string;
  badgeText?: string;
  announceBg?: string;
  announceText?: string;
}

export interface NavLinksField {
  items?: NavLink[];
  maxItems?: number;
}

export type SearchOverlayVariant = "classic" | "palette" | "sheet" | "editorial";

/**
 * Editorial card skin. v1 ships one ("standard" = photo: tall image, tag
 * badge, dept eyebrow, name, price). Later cards extend this union —
 * additive, stored admin values keep working.
 */
export type EditorialCardType = "standard";
/**
 * Curated-tab shape. v1 ships one ("pill" = ink pill on active, text on
 * rest). Underline/segmented variants extend this union later.
 */
export type EditorialTabShape = "pill";

/**
 * Editorial-takeover paint + copy knobs (admin-facing: all optional,
 * absent = inherit). One nested group — not fifteen flat fields — because
 * flat search.* already holds behavior knobs and a second flat crowd would
 * collide with future palette/editorial siblings. Colors are raw strings
 * (validated as non-empty at resolve; garbage falls back to builtins).
 */
export interface EditorialOverlayField {
  bg?: string;
  /** Overlay wash alpha 0–100 (100 = fully opaque bg). */
  bgAlpha?: number;
  /** True = backdrop-filter blur over the page behind the wash. */
  blur?: boolean;
  /** Blur radius px (only read when blur is true). */
  blurPx?: number;
  eyebrow?: string;
  eyebrowColor?: string;
  archiveEyebrow?: string;
  archiveColor?: string;
  inputColor?: string;
  placeholderColor?: string;
  underlineColor?: string;
  title?: string;
  titleColor?: string;
  mutedColor?: string;
  closeIconColor?: string;
  tabTextColor?: string;
  tabActiveBg?: string;
  tabActiveText?: string;
  tabShape?: EditorialTabShape;
  cardType?: EditorialCardType;
  /** Card image corner radius px. */
  cardRadius?: number;
  deptColor?: string;
  nameColor?: string;
  priceColor?: string;
  /**
   * Editorial-variant motion (per-variant instance of the shared
   * OverlayMotionField shape — settings never leak across variants).
   */
  editorialAnimation?: OverlayMotionField;
}

/**
 * Palette card skin. v1 ships one ("row" = photo: thumb, badge+dept,
 * name, price+rating, quick-add). Later cards extend this union.
 */
export type PaletteCardType = "row";

/**
 * Palette-modal paint knobs (admin-facing: all optional, absent =
 * inherit). Nested group like editorial — flat search.* stays behavioral.
 * Pill faces map 1:1 onto --pill-* vars (see components/ui/Pill).
 */
export interface PaletteOverlayField {
  cardBg?: string;
  backdrop?: string;
  /** Backdrop wash alpha 0–100. */
  backdropAlpha?: number;
  /** True = backdrop-filter blur over the page behind the wash. */
  blur?: boolean;
  /** Blur radius px (only read when blur is true). */
  blurPx?: number;
  inputColor?: string;
  placeholderColor?: string;
  iconColor?: string;
  closeColor?: string;
  mutedColor?: string;
  headingColor?: string;
  nameColor?: string;
  priceColor?: string;
  ratingColor?: string;
  deptColor?: string;
  pillActiveBg?: string;
  pillActiveText?: string;
  pillText?: string;
  pillBorder?: string;
  pillChipBg?: string;
  quickAddBg?: string;
  quickAddText?: string;
  quickAddedBg?: string;
  quickAddedText?: string;
  cardType?: PaletteCardType;
  /** Thumbnail corner radius px. */
  thumbRadius?: number;
  /**
   * Palette-variant motion (per-variant instance of the shared
   * OverlayMotionField shape — settings never leak across variants).
   */
  paletteAnimation?: OverlayMotionField;
}

export interface NavSearchField {
  enabled?: boolean;
  /** Which overlay ships to the client (registry dynamic-imports only this). */
  overlayVariant?: SearchOverlayVariant;
  placeholder?: string;
  /**
   * Sheet-variant slide motion (per-variant instance of the shared
   * OverlayMotionField shape — other overlays get their own instances).
   */
  sheetAnimation?: OverlayMotionField;
  /** Editorial-takeover paint + copy (nested group, see above). */
  editorial?: EditorialOverlayField;
  /** Palette-modal paint (nested group, see above). */
  palette?: PaletteOverlayField;
}

export interface NavAccountField {
  enabled?: boolean;
  items?: AccountItem[];
}

export interface NavCartField {
  enabled?: boolean;
  destination?: CartDestination;
  dedicatedPage?: boolean;
  badgeCap?: number;
}

export interface NavAnnouncementField {
  items?: { text: string; cta?: { label: string; href: string }; countdownTo?: string; }[];
  showArrows?: boolean;
  autoplayMs?: number | null;
  dismissible?: boolean;
  /** Smooth upward collapse on dismiss (reduced-motion forces instant). */
  collapseAnimation?: boolean;
}

export interface NavMobileField {
  breakpoint?: number;
  drawerSide?: DrawerSide;
}

/** Full per-scope style set (single shared scope in v1). */
export interface NavPageOverrides {
  regions?: NavRegionsField;
  logo?: NavLogoField;
  bar?: NavBarField;
  colors?: NavColorsField;
  links?: NavLinksField;
  search?: NavSearchField;
  account?: NavAccountField;
  cart?: NavCartField;
  announcement?: NavAnnouncementField;
  mobile?: NavMobileField;
}

/** Admin input: one shared scope (same-everywhere chrome). */
export interface NavSettings {
  shared?: NavPageOverrides;
}

/* Resolved types: all required (produced by resolveNav.ts). */

export interface ResolvedNavLink {
  kind: "category" | "custom";
  label: string;
  href: string;
  categoryId: string;
  icon: string;
  badge: LinkBadge | null;
  highlight: LinkHighlight;
  schedule: { startsAt: string; endsAt: string };
  current: boolean; //true if this link is the current page (or parent of current page)
}

export interface ResolvedNavSettings {
  regions: {
    announcement: boolean;
    logo: boolean;
    links: boolean;
    search: boolean;
    account: boolean;
    wishlist: boolean;
    cart: boolean;
    badge: boolean;
  };
  logo: { imageUrl: string; height: number; position: LogoPosition; wordmark: string };
  bar: { height: number; sticky: StickyMode; shadow: BarShadow };
  colors: {
    bg: string;
    text: string;
    hover: string;
    badgeBg: string;
    badgeText: string;
    announceBg: string;
    announceText: string;
  };
  links: { items: ResolvedNavLink[]; maxItems: number };
  search: {
    enabled: boolean;
    overlayVariant: SearchOverlayVariant;
    placeholder: string;
    sheetAnimation: ResolvedOverlayMotion;
    editorial: ResolvedEditorialSettings;
    palette: ResolvedPaletteSettings;
  };
  account: { enabled: boolean; items: AccountItem[] };
  cart: { enabled: boolean; destination: CartDestination; dedicatedPage: boolean; badgeCap: number };
  announcement: {
    items: { text: string; cta: { label: string; href: string } | null; countdownTo: string }[];
    showArrows: boolean;
    autoplayMs: number | null;
    dismissible: boolean;
    collapseAnimation: boolean;
  };
  mobile: { breakpoint: number; drawerSide: DrawerSide };
}

/* Builtins: today's look = final fallback (the one legal home for literals). */

export const DEFAULT_NAV_SETTINGS: ResolvedNavSettings = {
  regions: {
    announcement: true,
    logo: true,
    links: true,
    search: true,
    account: true,
    wishlist: true,
    cart: true,
    badge: true,
  },
  logo: { imageUrl: "", height: 24, position: "center", wordmark: "SHOP" },
  bar: { height: 64, sticky: "always", shadow: "border" },
  colors: {
    bg: "#ffffff",
    text: "#0a2540",
    hover: "#0077b6",
    badgeBg: "#0077b6",
    badgeText: "#ffffff",
    announceBg: "#0a2540",
    announceText: "#ffffff",
  },
  links: { items: [], maxItems: 5 },
  search: {
    enabled: true,
    overlayVariant: "classic",
    placeholder: "Search products…",
    sheetAnimation: { enabled: true, durationMs: 240, easing: "ease-out", travel: "full" },
    // Photo defaults: pale section wash, ink text, accent archive eyebrow,
    // oceanic takeover motion. bg mirrors --color-section-bg (user verdict:
    // reuse the token value, mint a token only on a second consumer).
    editorial: {
      bg: "#f5fafc",
      bgAlpha: 100,
      blur: false,
      blurPx: 8,
      eyebrow: "Atelier editorial search",
      eyebrowColor: "#5b7286",
      archiveEyebrow: "Search the atelier archive",
      archiveColor: "#0077b6",
      inputColor: "#0a2540",
      placeholderColor: "#93a3b1",
      underlineColor: "#0a2540",
      title: "Curated this season",
      titleColor: "#0a2540",
      mutedColor: "#5b7286",
      closeIconColor: "#0a2540",
      tabTextColor: "#5b7286",
      tabActiveBg: "#0a2540",
      tabActiveText: "#ffffff",
      tabShape: "pill",
      cardType: "standard",
      cardRadius: 16,
      deptColor: "#5b7286",
      nameColor: "#0a2540",
      priceColor: "#0a2540",
      editorialAnimation: {
        enabled: true,
        durationMs: 320,
        easing: "cubic-bezier(0.32, 0.72, 0.32, 1)",
        travel: "full",
      },
    },
    // Photo defaults: white card on a navy wash (0.72alpha + blur),
    // accent search glyph, muted close, gold ratings, ink pills.
    // Literals mirror Oceanic tokens (this file is the one legal home).
    palette: {
      cardBg: "#ffffff",
      backdrop: "#0a2540",
      backdropAlpha: 72,
      blur: true,
      blurPx: 8,
      inputColor: "#0a2540",
      placeholderColor: "#93a3b1",
      iconColor: "#0077b6",
      closeColor: "#5b7286",
      mutedColor: "#5b7286",
      headingColor: "#0a2540",
      nameColor: "#0a2540",
      priceColor: "#0a2540",
      ratingColor: "#f79009",
      deptColor: "#5b7286",
      pillActiveBg: "#0a2540",
      pillActiveText: "#ffffff",
      pillText: "#0a2540",
      pillBorder: "#dce8ee",
      pillChipBg: "#ffffff",
      quickAddBg: "#e6f7fb",
      quickAddText: "#0a2540",
      quickAddedBg: "#ecfdf3",
      quickAddedText: "#0e9f6e",
      cardType: "row",
      thumbRadius: 14,
      paletteAnimation: {
        enabled: true,
        durationMs: 320,
        easing: "cubic-bezier(0.32, 0.72, 0.32, 1)",
        travel: "full",
      },
    },
  },
  account: { enabled: true, items: ["orders", "addresses", "wishlist", "signout"] },
  cart: { enabled: true, destination: "drawer", dedicatedPage: false, badgeCap: 9 },
  announcement: {
    items: [],
    showArrows: true,
    autoplayMs: null,
    dismissible: true,
    collapseAnimation: true,
  },
  mobile: { breakpoint: 768, drawerSide: "left" },
};
