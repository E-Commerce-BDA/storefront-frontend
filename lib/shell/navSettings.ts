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
} as const;

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

export type SearchOverlayVariant = "classic" | "palette" | "sheet" | "editorial" | "inspect";

export interface NavSearchField {
  enabled?: boolean;
  /** Which overlay ships to the client (registry dynamic-imports only this). */
  overlayVariant?: SearchOverlayVariant;
  placeholder?: string;
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
  search: { enabled: boolean; overlayVariant: SearchOverlayVariant; placeholder: string };
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
  search: { enabled: true, overlayVariant: "classic", placeholder: "Search products…" },
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
