/**
 * Layered theme palette — pure resolver (sf-084).
 *
 * Layers, highest precedence first: product/slide flat props, component theme,
 * section settings, global `theme.palette`, builtin primitives. Each layer is
 * sparse: absent keys inherit, `null` and the contract's `""` sentinel delete
 * the key from that layer (the resolved output never contains null).
 *
 * Contrast-bearing faces are builtins, not admin knobs: focus/disabled and the
 * status foreground / on-colors are locked, so no layer can retune them into a
 * failing pair. Rejected: writing `null` for a reset — the contract refuses
 * null on the wire and CSS would inherit nothing.
 */

export type PaletteScalar = string | number | null;

export interface PaletteBrandInput {
  brand?: PaletteScalar;
  brandHover?: PaletteScalar;
  onBrand?: PaletteScalar;
  brandWash?: PaletteScalar;
}
export interface PaletteInkInput {
  ink?: PaletteScalar;
  muted?: PaletteScalar;
  border?: PaletteScalar;
}
export interface PaletteSurfacesInput {
  surface?: PaletteScalar;
  surfaceSunken?: PaletteScalar;
  surfaceRaised?: PaletteScalar;
  imagePlaceholder?: PaletteScalar;
}
export interface PaletteSaleInput {
  saleFill?: PaletteScalar;
  saleText?: PaletteScalar;
  saleWash?: PaletteScalar;
  onSale?: PaletteScalar;
}
export interface PaletteStatusInput {
  fg?: PaletteScalar;
  fill?: PaletteScalar;
  bg?: PaletteScalar;
  border?: PaletteScalar;
}
export interface PaletteNavbarInput {
  bg?: PaletteScalar;
  text?: PaletteScalar;
  hover?: PaletteScalar;
  badgeBg?: PaletteScalar;
  badgeText?: PaletteScalar;
  announceBg?: PaletteScalar;
  announceText?: PaletteScalar;
}
export interface PaletteFooterInput {
  bg?: PaletteScalar;
  text?: PaletteScalar;
  link?: PaletteScalar;
  hover?: PaletteScalar;
}
export interface PaletteScrimInput {
  soft?: PaletteScalar;
  panel?: PaletteScalar;
  strong?: PaletteScalar;
}
export interface PaletteStateInput {
  focusOutline?: PaletteScalar;
  focusHalo?: PaletteScalar;
  disabledBg?: PaletteScalar;
  disabledText?: PaletteScalar;
  disabledBorder?: PaletteScalar;
}
export interface PaletteRadiiInput {
  radiusButton?: PaletteScalar;
  radiusCard?: PaletteScalar;
  radiusSm?: PaletteScalar;
  radiusMd?: PaletteScalar;
}
export interface PaletteTypeInput {
  fontSans?: PaletteScalar;
  fontDisplay?: PaletteScalar;
  fsDisplay1?: PaletteScalar;
  fsDisplay2?: PaletteScalar;
  fsDisplay3?: PaletteScalar;
  fsBody?: PaletteScalar;
  fsCaption?: PaletteScalar;
}

/** Sparse, contract-shaped palette source; `null` at group level resets it. */
export interface PaletteLayer {
  brand?: PaletteBrandInput | null;
  ink?: PaletteInkInput | null;
  surfaces?: PaletteSurfacesInput | null;
  sale?: PaletteSaleInput | null;
  success?: PaletteStatusInput | null;
  warning?: PaletteStatusInput | null;
  error?: PaletteStatusInput | null;
  navbar?: PaletteNavbarInput | null;
  footer?: PaletteFooterInput | null;
  scrim?: PaletteScrimInput | null;
  state?: PaletteStateInput | null;
  radii?: PaletteRadiiInput | null;
  type?: PaletteTypeInput | null;
}

/** Fully resolved, concrete palette — the only shape the emitter accepts. */
export interface ResolvedPalette {
  brand: string;
  brandHover: string;
  onBrand: string;
  brandWash: string;
  ink: string;
  muted: string;
  border: string;
  surface: string;
  surfaceSunken: string;
  surfaceRaised: string;
  imagePlaceholder: string;
  saleFill: string;
  saleText: string;
  saleWash: string;
  onSale: string;
  successFg: string;
  successFill: string;
  successBg: string;
  successBorder: string;
  onSuccess: string;
  warningFg: string;
  warningFill: string;
  warningBg: string;
  warningBorder: string;
  onWarning: string;
  errorFg: string;
  errorFill: string;
  errorBg: string;
  errorBorder: string;
  onError: string;
  navbarBg: string;
  navbarText: string;
  navbarHover: string;
  navbarBadgeBg: string;
  navbarBadgeText: string;
  navbarAnnounceBg: string;
  navbarAnnounceText: string;
  footerBg: string;
  footerText: string;
  footerLink: string;
  footerHover: string;
  scrimSoft: string;
  scrimPanel: string;
  scrimStrong: string;
  focusOutline: string;
  focusHalo: string;
  disabledBg: string;
  disabledText: string;
  disabledBorder: string;
  radiusButton: number;
  radiusCard: number;
  radiusSm: number;
  radiusMd: number;
  fontSans: string;
  fontDisplay: string;
  fsDisplay1: number;
  fsDisplay2: number;
  fsDisplay3: number;
  fsBody: number;
  fsCaption: number;
}

export type PaletteKey = keyof ResolvedPalette;
export type PaletteFlat = Partial<Record<PaletteKey, PaletteScalar>>;

/** Oceanic Blue v1.0, the one home for the builtin primitives. */
export const DEFAULT_PALETTE: ResolvedPalette = {
  brand: "#0077B6",
  brandHover: "#023E8A",
  onBrand: "#FFFFFF",
  brandWash: "#E6F7FB",
  ink: "#0A2540",
  muted: "#5B7286",
  border: "#DCE8EE",
  surface: "#FFFFFF",
  surfaceSunken: "#F5FAFC",
  surfaceRaised: "#FFFFFF",
  imagePlaceholder: "#CAF0F8",
  saleFill: "#FF6B4A",
  saleText: "#B9381C",
  saleWash: "#FFEDE6",
  onSale: "#0A2540",
  successFg: "#067647",
  successFill: "#0E9F6E",
  successBg: "#ECFDF3",
  successBorder: "#ABEFC6",
  onSuccess: "#FFFFFF",
  warningFg: "#B54708",
  warningFill: "#F79009",
  warningBg: "#FFFAEB",
  warningBorder: "#FEDF89",
  onWarning: "#FFFFFF",
  errorFg: "#B42318",
  errorFill: "#D92D20",
  errorBg: "#FEF3F2",
  errorBorder: "#FECDCA",
  onError: "#FFFFFF",
  navbarBg: "#FFFFFF",
  navbarText: "#0A2540",
  navbarHover: "#0077B6",
  navbarBadgeBg: "#0077B6",
  navbarBadgeText: "#FFFFFF",
  navbarAnnounceBg: "#0A2540",
  navbarAnnounceText: "#FFFFFF",
  footerBg: "#0A2540",
  footerText: "#FFFFFF",
  footerLink: "#FFFFFF",
  footerHover: "#E6F7FB",
  /* Soft = half the dialog veil, panel = the shipped --scrim, strong = the
     search-palette backdrop. No new alpha was invented for this layer. */
  scrimSoft: "rgba(10, 37, 64, 0.25)",
  scrimPanel: "rgba(10, 37, 64, 0.45)",
  scrimStrong: "rgba(10, 37, 64, 0.72)",
  focusOutline: "#0077B6",
  focusHalo: "#0077B633",
  disabledBg: "#E6ECF1",
  disabledText: "#5B7286",
  disabledBorder: "#DCE8EE",
  radiusButton: 8,
  radiusCard: 12,
  radiusSm: 6,
  radiusMd: 10,
  /* Font tokens mirror the shipped next/font stacks; sizes mirror the
     ceiling of the existing clamp() scales so emitting them changes no pixels. */
  fontSans: '"Outfit", system-ui, sans-serif',
  fontDisplay: '"Fraunces", serif',
  fsDisplay1: 72,
  fsDisplay2: 48,
  fsDisplay3: 32,
  fsBody: 15,
  fsCaption: 12,
};

/** Bounds from contracts 2.2.0 `themePaletteRadiiSchema`/`themePaletteTypeSchema`. */
export const PALETTE_LIMITS = {
  radiusButton: { min: 0, max: 24 },
  radiusCard: { min: 0, max: 24 },
  radiusSm: { min: 0, max: 8 },
  radiusMd: { min: 0, max: 16 },
  fsDisplay1: { min: 24, max: 96 },
  fsDisplay2: { min: 20, max: 72 },
  fsDisplay3: { min: 16, max: 56 },
  fsBody: { min: 12, max: 20 },
  fsCaption: { min: 10, max: 16 },
  fontStackMax: 120,
} as const;

const LOCKED_KEYS = new Set<PaletteKey>([
  "onBrand", "onSale",
  "successFg", "warningFg", "errorFg",
  "onSuccess", "onWarning", "onError",
  "focusOutline", "focusHalo",
  "disabledBg", "disabledText", "disabledBorder",
]);

const GROUP_FIELDS: Record<string, Record<string, PaletteKey>> = {
  brand: { brand: "brand", brandHover: "brandHover", onBrand: "onBrand", brandWash: "brandWash" },
  ink: { ink: "ink", muted: "muted", border: "border" },
  surfaces: {
    surface: "surface", surfaceSunken: "surfaceSunken",
    surfaceRaised: "surfaceRaised", imagePlaceholder: "imagePlaceholder",
  },
  sale: { saleFill: "saleFill", saleText: "saleText", saleWash: "saleWash", onSale: "onSale" },
  success: { fg: "successFg", fill: "successFill", bg: "successBg", border: "successBorder" },
  warning: { fg: "warningFg", fill: "warningFill", bg: "warningBg", border: "warningBorder" },
  error: { fg: "errorFg", fill: "errorFill", bg: "errorBg", border: "errorBorder" },
  navbar: {
    bg: "navbarBg", text: "navbarText", hover: "navbarHover",
    badgeBg: "navbarBadgeBg", badgeText: "navbarBadgeText",
    announceBg: "navbarAnnounceBg", announceText: "navbarAnnounceText",
  },
  footer: { bg: "footerBg", text: "footerText", link: "footerLink", hover: "footerHover" },
  scrim: { soft: "scrimSoft", panel: "scrimPanel", strong: "scrimStrong" },
  state: {
    focusOutline: "focusOutline", focusHalo: "focusHalo",
    disabledBg: "disabledBg", disabledText: "disabledText", disabledBorder: "disabledBorder",
  },
  radii: {
    radiusButton: "radiusButton", radiusCard: "radiusCard",
    radiusSm: "radiusSm", radiusMd: "radiusMd",
  },
  type: {
    fontSans: "fontSans", fontDisplay: "fontDisplay",
    fsDisplay1: "fsDisplay1", fsDisplay2: "fsDisplay2", fsDisplay3: "fsDisplay3",
    fsBody: "fsBody", fsCaption: "fsCaption",
  },
};

const PALETTE_KEY_SET = new Set<string>(Object.keys(DEFAULT_PALETTE));
const isPaletteKey = (key: string): key is PaletteKey => PALETTE_KEY_SET.has(key);

/** Hex for paint, contract's cssColor vocabulary for the transluc scrims. */
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CSS_COLOR = /^(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgba?|hsla?)\([0-9.,%\s/]+\)|transparent|currentColor)$/;
const FONT_STACK = /^[^\n;{}<>]{1,120}$/;

const COLOR_KEYS = new Set<PaletteKey>(
  Object.keys(DEFAULT_PALETTE).filter((key) => typeof DEFAULT_PALETTE[key as PaletteKey] === "string") as PaletteKey[],
);
const SCRIM_KEYS = new Set<PaletteKey>(["scrimSoft", "scrimPanel", "scrimStrong"]);
const FONT_KEYS = new Set<PaletteKey>(["fontSans", "fontDisplay"]);

function setOrDelete(target: PaletteFlat, key: PaletteKey, value: PaletteScalar | undefined): void {
  // null, "" and non-finite numbers are deletes, never emitted values.
  if (value === undefined || value === null || value === "") {
    delete target[key];
    return;
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    delete target[key];
    return;
  }
  target[key] = value;
}

/** Accept either the contract's grouped shape or a flat product/slide map. */
function normalize(layer: PaletteLayer | PaletteFlat | null | undefined): PaletteFlat {
  const flat: PaletteFlat = {};
  if (!layer || typeof layer !== "object") return flat;
  for (const [name, raw] of Object.entries(layer)) {
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
      const fields = GROUP_FIELDS[name];
      if (!fields) continue;
      for (const [field, key] of Object.entries(fields)) {
        setOrDelete(flat, key, (raw as Record<string, PaletteScalar | undefined>)[field]);
      }
    } else if (isPaletteKey(name)) {
      setOrDelete(flat, name, raw as PaletteScalar);
    }
  }
  return flat;
}

function isValid(key: PaletteKey, value: string | number): boolean {
  if (FONT_KEYS.has(key)) {
    return typeof value === "string" && FONT_STACK.test(value) && !/url\s*\(/i.test(value);
  }
  if (COLOR_KEYS.has(key)) {
    if (typeof value !== "string") return false;
    return SCRIM_KEYS.has(key) ? CSS_COLOR.test(value) : HEX_COLOR.test(value);
  }
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(key: PaletteKey, value: string | number): string | number {
  if (typeof value !== "number") return value;
  const bounds = PALETTE_LIMITS[key as keyof typeof PALETTE_LIMITS] as
    | { min: number; max: number }
    | undefined;
  if (!bounds) return value;
  const rounded = Math.round(value);
  return Math.min(bounds.max, Math.max(bounds.min, rounded));
}

export interface ResolvePaletteInput {
  /** Product/slide flat props — the most specific layer. */
  flat?: PaletteFlat | null;
  /** Per-component theme projection (flat or grouped). */
  component?: PaletteLayer | PaletteFlat | null;
  /** Section settings. */
  section?: PaletteLayer | PaletteFlat | null;
  /** Global `theme.palette` from cms-svc. */
  global?: PaletteLayer | null;
}

/**
 * Pure merge. Every key resolves independently: a reset in a higher layer
 * deletes only that key, so the next layer below shows through. Bad values are
 * misses (builtins render); locked keys never read any input layer.
 */
export function resolvePalette(input: ResolvePaletteInput = {}): ResolvedPalette {
  const merged: PaletteFlat = {
    ...normalize(input.global),
    ...normalize(input.section),
    ...normalize(input.component),
    ...normalize(input.flat),
  };
  const result = { ...DEFAULT_PALETTE };
  for (const key of Object.keys(result) as PaletteKey[]) {
    if (LOCKED_KEYS.has(key)) continue;
    const value = merged[key];
    if (value === undefined || value === null) continue;
    if (!isValid(key, value)) continue;
    (result as Record<PaletteKey, string | number>)[key] = clamp(key, value);
  }
  return result;
}

/* -------------------------------------------------------------------------- *
 * contracts 2.2.0 component groups (sf-084 follow-up)
 *
 * These are paint/geometry projections onto families the stylesheet already
 * reads: --nb-*, --facet-*, --minicart-*, --strip-* and --marquee-*, --grid-gap and
 * --pc-cta-*. Same sparse merge, same reset-as-delete, same contract clamps as
 * the palette above. Locked palette faces stay locked because group values
 * cannot name them; a group may only retune its own projection.
 * -------------------------------------------------------------------------- */

export type ComponentGroupScalar = string | number | boolean | null;

export interface ComponentGroupLayer {
  navbar?: {
    height?: ComponentGroupScalar;
    bg?: ComponentGroupScalar;
    text?: ComponentGroupScalar;
    hover?: ComponentGroupScalar;
    badgeBg?: ComponentGroupScalar;
    badgeText?: ComponentGroupScalar;
    announceBg?: ComponentGroupScalar;
    announceText?: ComponentGroupScalar;
  } | null;
  filterRail?: {
    bg?: ComponentGroupScalar;
    border?: ComponentGroupScalar;
    title?: ComponentGroupScalar;
    label?: ComponentGroupScalar;
    gap?: ComponentGroupScalar;
    pad?: ComponentGroupScalar;
    radius?: ComponentGroupScalar;
    actionGap?: ComponentGroupScalar;
    maxHeight?: ComponentGroupScalar;
    headGap?: ComponentGroupScalar;
    titleSize?: ComponentGroupScalar;
    innerGap?: ComponentGroupScalar;
    labelSize?: ComponentGroupScalar;
    priceGap?: ComponentGroupScalar;
    tagGap?: ComponentGroupScalar;
    tagMax?: ComponentGroupScalar;
  } | null;
  drawer?: {
    bg?: ComponentGroupScalar;
    text?: ComponentGroupScalar;
    borderColor?: ComponentGroupScalar;
    overlayColor?: ComponentGroupScalar;
    width?: ComponentGroupScalar;
    durationMs?: ComponentGroupScalar;
    motion?: ComponentGroupScalar;
  } | null;
  marquee?: {
    speed?: ComponentGroupScalar;
    direction?: ComponentGroupScalar;
    pauseOnHover?: ComponentGroupScalar;
  } | null;
  grid?: { gap?: ComponentGroupScalar } | null;
  productCard?: {
    ctaBg?: ComponentGroupScalar;
    ctaTextColor?: ComponentGroupScalar;
    ctaBorderColor?: ComponentGroupScalar;
  } | null;
}

export interface ResolvedComponentGroups {
  navbarHeight: number;
  navbarBg: string;
  navbarText: string;
  navbarHover: string;
  navbarBadgeBg: string;
  navbarBadgeText: string;
  navbarAnnounceBg: string;
  navbarAnnounceText: string;
  facetBg: string;
  facetBorder: string;
  facetTitle: string;
  facetLabel: string;
  facetGap: number;
  facetPad: number;
  facetRadius: number;
  facetActionGap: number;
  facetMaxHeight: number;
  facetHeadGap: number;
  facetTitleSize: number;
  facetInnerGap: number;
  facetLabelSize: number;
  facetPriceGap: number;
  facetTagGap: number;
  facetTagMax: number;
  drawerBg: string;
  drawerText: string;
  drawerBorderColor: string;
  drawerOverlayColor: string;
  drawerWidth: number;
  drawerDurationMs: number;
  drawerMotion: "slide" | "fade" | "none";
  marqueeSpeed: number;
  marqueeDirection: "left" | "right";
  marqueePauseOnHover: boolean;
  gridGap: number;
  pcCtaBg: string;
  pcCtaText: string;
  pcCtaBorder: string;
}

export type ComponentGroupFlat = Partial<Record<keyof ResolvedComponentGroups, ComponentGroupScalar>>;

/** Bounds from contracts 2.2.0 theme{FilterRail,Drawer,Marquee,Grid}GroupSchema. */
export const COMPONENT_GROUP_LIMITS = {
  navbarHeight: { min: 48, max: 96 },
  facetGap: { min: 0, max: 40 },
  facetPad: { min: 0, max: 40 },
  facetRadius: { min: 0, max: 24 },
  facetActionGap: { min: 0, max: 24 },
  facetMaxHeight: { min: 120, max: 800 },
  facetHeadGap: { min: 0, max: 24 },
  facetTitleSize: { min: 12, max: 28 },
  facetInnerGap: { min: 0, max: 24 },
  facetLabelSize: { min: 10, max: 20 },
  facetPriceGap: { min: 0, max: 24 },
  facetTagGap: { min: 0, max: 20 },
  facetTagMax: { min: 60, max: 400 },
  drawerWidth: { min: 280, max: 480 },
  drawerDurationMs: { min: 100, max: 600 },
  marqueeSpeed: { min: 20, max: 200 },
  gridGap: { min: 0, max: 48 },
} as const;

const COMPONENT_GROUP_FIELDS: Record<string, Record<string, keyof ResolvedComponentGroups>> = {
  navbar: {
    height: "navbarHeight", bg: "navbarBg", text: "navbarText", hover: "navbarHover",
    badgeBg: "navbarBadgeBg", badgeText: "navbarBadgeText",
    announceBg: "navbarAnnounceBg", announceText: "navbarAnnounceText",
  },
  filterRail: {
    bg: "facetBg", border: "facetBorder", title: "facetTitle", label: "facetLabel",
    gap: "facetGap", pad: "facetPad", radius: "facetRadius", actionGap: "facetActionGap",
    maxHeight: "facetMaxHeight", headGap: "facetHeadGap", titleSize: "facetTitleSize",
    innerGap: "facetInnerGap", labelSize: "facetLabelSize", priceGap: "facetPriceGap",
    tagGap: "facetTagGap", tagMax: "facetTagMax",
  },
  drawer: {
    bg: "drawerBg", text: "drawerText", borderColor: "drawerBorderColor",
    overlayColor: "drawerOverlayColor", width: "drawerWidth",
    durationMs: "drawerDurationMs", motion: "drawerMotion",
  },
  marquee: { speed: "marqueeSpeed", direction: "marqueeDirection", pauseOnHover: "marqueePauseOnHover" },
  grid: { gap: "gridGap" },
  productCard: { ctaBg: "pcCtaBg", ctaTextColor: "pcCtaText", ctaBorderColor: "pcCtaBorder" },
};

const GROUP_FLAT_KEYS = new Set<string>(
  Object.values(COMPONENT_GROUP_FIELDS).flatMap((fields) => Object.values(fields)),
);
const GROUP_NUMBER_KEYS = new Set<keyof ResolvedComponentGroups>(
  Object.keys(COMPONENT_GROUP_LIMITS) as Array<keyof ResolvedComponentGroups>,
);
const GROUP_CSS_COLOR_KEYS = new Set<keyof ResolvedComponentGroups>(["drawerOverlayColor"]);

function setGroupValue(
  target: ComponentGroupFlat,
  key: keyof ResolvedComponentGroups,
  value: ComponentGroupScalar | undefined,
): void {
  if (value === undefined || value === null || value === "") {
    delete target[key];
    return;
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    delete target[key];
    return;
  }
  target[key] = value;
}

function normalizeGroups(layer: ComponentGroupLayer | ComponentGroupFlat | null | undefined): ComponentGroupFlat {
  const flat: ComponentGroupFlat = {};
  if (!layer || typeof layer !== "object") return flat;
  for (const [name, raw] of Object.entries(layer)) {
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
      const fields = COMPONENT_GROUP_FIELDS[name];
      if (!fields) continue;
      for (const [field, key] of Object.entries(fields)) {
        setGroupValue(flat, key, (raw as Record<string, ComponentGroupScalar | undefined>)[field]);
      }
    } else if (GROUP_FLAT_KEYS.has(name)) {
      // Flat product/slide props use concrete keys (e.g. navbarBg, gridGap).
      setGroupValue(flat, name as keyof ResolvedComponentGroups, raw as ComponentGroupScalar);
    }
  }
  return flat;
}

/** Builtins mirror the stylesheet fallbacks; colors follow the resolved palette. */
export function defaultComponentGroups(palette: ResolvedPalette): ResolvedComponentGroups {
  return {
    navbarHeight: 64,
    navbarBg: palette.navbarBg,
    navbarText: palette.navbarText,
    navbarHover: palette.navbarHover,
    navbarBadgeBg: palette.navbarBadgeBg,
    navbarBadgeText: palette.navbarBadgeText,
    navbarAnnounceBg: palette.navbarAnnounceBg,
    navbarAnnounceText: palette.navbarAnnounceText,
    facetBg: palette.navbarBg,
    facetBorder: palette.border,
    facetTitle: palette.ink,
    facetLabel: palette.ink,
    facetGap: 20,
    facetPad: 16,
    facetRadius: 10,
    facetActionGap: 8,
    facetMaxHeight: 320,
    facetHeadGap: 8,
    facetTitleSize: 18,
    facetInnerGap: 8,
    facetLabelSize: 14,
    facetPriceGap: 8,
    facetTagGap: 6,
    facetTagMax: 220,
    drawerBg: palette.surface,
    drawerText: palette.ink,
    drawerBorderColor: palette.border,
    drawerOverlayColor: "rgba(10, 37, 64, 0.5)",
    drawerWidth: 380,
    drawerDurationMs: 240,
    drawerMotion: "slide",
    marqueeSpeed: 60,
    marqueeDirection: "left",
    marqueePauseOnHover: true,
    gridGap: 20,
    pcCtaBg: palette.surface,
    pcCtaText: palette.ink,
    pcCtaBorder: palette.border,
  };
}

export interface ResolveComponentGroupsInput {
  flat?: ComponentGroupFlat | null;
  component?: ComponentGroupLayer | ComponentGroupFlat | null;
  section?: ComponentGroupLayer | ComponentGroupFlat | null;
  global?: ComponentGroupLayer | ComponentGroupFlat | null;
  /** The palette already resolved for this request (its colors are defaults). */
  palette: ResolvedPalette;
}

/**
 * Pure merge with the same precedence as `resolvePalette`: flat props win,
 * then component, section and global. Wrong types are misses, never blanks.
 */
export function resolveComponentGroups(input: ResolveComponentGroupsInput): ResolvedComponentGroups {
  const merged: ComponentGroupFlat = {
    ...normalizeGroups(input.global),
    ...normalizeGroups(input.section),
    ...normalizeGroups(input.component),
    ...normalizeGroups(input.flat),
  };
  const result = defaultComponentGroups(input.palette);
  for (const key of Object.keys(result) as Array<keyof ResolvedComponentGroups>) {
    const value = merged[key];
    if (value === undefined) continue;
    if (GROUP_NUMBER_KEYS.has(key)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        const bounds = COMPONENT_GROUP_LIMITS[key as keyof typeof COMPONENT_GROUP_LIMITS];
        (result as Record<keyof ResolvedComponentGroups, string | number | boolean>)[key] =
          Math.min(bounds.max, Math.max(bounds.min, Math.round(value)));
      }
      continue;
    }
    if (key === "drawerMotion") {
      if (value === "slide" || value === "fade" || value === "none") result.drawerMotion = value;
      continue;
    }
    if (key === "marqueeDirection") {
      if (value === "left" || value === "right") result.marqueeDirection = value;
      continue;
    }
    if (key === "marqueePauseOnHover") {
      if (typeof value === "boolean") result.marqueePauseOnHover = value;
      continue;
    }
    if (typeof value !== "string") continue;
    const pattern = GROUP_CSS_COLOR_KEYS.has(key) ? CSS_COLOR : HEX_COLOR;
    if (pattern.test(value)) {
      (result as Record<keyof ResolvedComponentGroups, string | number | boolean>)[key] = value;
    }
  }
  return result;
}
