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
