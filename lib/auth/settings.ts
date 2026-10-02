/**
 * Auth settings vocabulary — Oceanic Blue v1.0
 * (Documentation/pages/auth-design.md §2–§3)
 *
 * This file NAMES things, nothing more: what can be customized (shapes),
 * what the world looks like uncustomized (DEFAULT_* = today's look = final
 * fallback), and the numeric limits. No logic, no merging, no clamping —
 * that belongs to resolveSettings.ts. No React, no fetch.
 *
 * Convention (mirrors lib/cms/buttonAnimation.ts): admin-facing fields are
 * all-optional (absent = inherit); resolved types are all-required;
 * hex literals live ONLY in DEFAULT_* (the one legal home for literals).
 */

export type AuthMode = "centered" | "split";
export type PanelSide = "left" | "right";
export type SplitRatio = "50-50" | "60-40" | "40-60";
export type AuthMobile = "stacked" | "hidden-panel";

export type PanelBgMode = "solid" | "gradient" | "image" | "pattern" | "none";

export interface GradientStop {
  color: string;
  /** Position 0–100. Absent = distribute evenly (resolver fills). */
  at?: number;
}

/**
 * Angle is linear-only by construction: radial takes shape+position, conic
 * takes from+position. The impossible state (angle on a radial) is
 * unrepresentable. CSS angle convention: 0 = toward top, clockwise
 * (135° = diagonal toward bottom-right).
 */
export type PanelGradient =
  | { type: "linear"; angle: number; stops: GradientStop[] }
  | { type: "radial"; shape: "circle" | "ellipse"; at: string; stops: GradientStop[] }
  | { type: "conic"; from: number; at: string; stops: GradientStop[] };

export type ImageFit = "cover" | "contain";

export type FormSurface = "white" | "tinted" | "transparent";
export type FormElevation = "flat" | "border" | "floating";

export type FontFamily = "outfit" | "fraunces" | "system";
export type TextAlign = "left" | "center" | "right";

export interface ElementStyle {
  size: number;
  weight: number;
  color: string;
  align: TextAlign;
}

export type SocialProvider = "google" | "apple" | "facebook";
export type ErrorStyle = "banner" | "inline";

/** Numeric limits for every ranged knob (clamped in resolveSettings.ts). */
export const AUTH_LIMITS = {
  formRadius: { min: 0, max: 24 },
  formWidth: { min: 360, max: 480 },
  inputRadius: { min: 0, max: 24 },
  ringWidth: { min: 0, max: 8 },
  gradientAngle: { min: 0, max: 360 },
  gradientStops: { min: 2, max: 4 },
  overlay: { min: 0, max: 80 },
  logoHeight: { min: 16, max: 64 },
  pageFadeMs: { min: 150, max: 300 },
} as const;

/* Admin-facing fields: all optional (absent = inherit). */

export interface AuthLayoutField {
  mode?: AuthMode;
  panelSide?: PanelSide;
  ratio?: SplitRatio;
  mobile?: AuthMobile;
}

export interface AuthFormField {
  surface?: FormSurface;
  radius?: number;
  width?: number;
  elevation?: FormElevation;
}

export interface AuthInputsField {
  bg?: string;
  border?: string;
  radius?: number;
  text?: string;
  placeholder?: string;
  focusBorder?: string;
  focusRing?: string;
  focusRingWidth?: number;
  errorBorder?: string;
}

export interface AuthPanelField {
  bgMode?: PanelBgMode;
  solid?: string;
  gradient?: PanelGradient;
  imageUrl?: string;
  imageFit?: ImageFit;
  imagePosition?: string;
  overlay?: number;
  logoUrl?: string;
  logoHeight?: number;
}

export interface AuthTypographyField {
  family?: FontFamily;
  headline?: ElementStyle;
  sub?: ElementStyle;
  bullets?: ElementStyle;
  quote?: ElementStyle;
  formTitle?: ElementStyle;
  labels?: ElementStyle;
}

/** Panel copy (sanitized HTML — allowlist enforced in resolveSettings.ts). */
export interface AuthContentField {
  headline?: string;
  sub?: string;
  bullets?: string;
  quote?: string;
  microcopy?: string;
  /** Form title + footer links (plain text/URLs — never HTML). */
  formTitle?: string;
  footerLinks?: { label: string; href: string }[];
}

export interface AuthBehaviorField {
  rememberDefault?: boolean;
  postLoginRedirect?: string;
  /** Copy overrides (defaults mirror lib/auth/errors.ts COPY — resolver
   *  prefers admin values; errors.ts stays the safe default). */
  rememberLabel?: string;
  noticeRateLimit?: string;
  noticeSessionExpired?: string;
}

export interface AuthErrorsField {
  style?: ErrorStyle;
}

export interface AuthMotionField {
  pageFadeMs?: number;
}

export interface AuthSeoField {
  title?: string;
  description?: string;
}

/** Full per-scope style set (shared shape; forgot owns its own copy). */
export interface AuthPageOverrides {
  layout?: AuthLayoutField;
  form?: AuthFormField;
  inputs?: AuthInputsField;
  panel?: AuthPanelField;
  typography?: AuthTypographyField;
  content?: AuthContentField;
  behavior?: AuthBehaviorField;
  socialProviders?: SocialProvider[];
  errors?: AuthErrorsField;
  motion?: AuthMotionField;
  seo?: AuthSeoField;
}

export interface AuthPageLayout {
  mode?: AuthMode;
  panelSide?: PanelSide;
}

/** Admin input: shared set (signin+signup) + per-page layout/side + forgot's own style. */
export interface AuthSettings {
  shared?: AuthPageOverrides;
  pages?: {
    signin?: AuthPageLayout;
    signup?: AuthPageLayout;
    forgot?: AuthPageLayout & { style?: AuthPageOverrides };
  };
}

/* Resolved types: all required (produced by resolveSettings.ts). */

export interface ResolvedGradientStop {
  color: string;
  at: number;
}

export type ResolvedPanelGradient =
  | { type: "linear"; angle: number; stops: ResolvedGradientStop[] }
  | { type: "radial"; shape: "circle" | "ellipse"; at: string; stops: ResolvedGradientStop[] }
  | { type: "conic"; from: number; at: string; stops: ResolvedGradientStop[] };

export interface ResolvedAuthStyle {
  layout: { mode: AuthMode; panelSide: PanelSide; ratio: SplitRatio; mobile: AuthMobile };
  form: { surface: FormSurface; radius: number; width: number; elevation: FormElevation };
  inputs: {
    bg: string;
    border: string;
    radius: number;
    text: string;
    placeholder: string;
    focusBorder: string;
    focusRing: string;
    focusRingWidth: number;
    errorBorder: string;
  };
  panel: {
    bgMode: PanelBgMode;
    solid: string;
    gradient: ResolvedPanelGradient;
    imageUrl: string;
    imageFit: ImageFit;
    imagePosition: string;
    overlay: number;
    logoUrl: string;
    logoHeight: number;
  };
  typography: {
    family: FontFamily;
    headline: ElementStyle;
    sub: ElementStyle;
    bullets: ElementStyle;
    quote: ElementStyle;
    formTitle: ElementStyle;
    labels: ElementStyle;
  };
  content: {
    headline: string;
    sub: string;
    bullets: string;
    quote: string;
    microcopy: string;
    formTitle: string;
    footerLinks: { label: string; href: string }[];
  };
  behavior: {
    rememberDefault: boolean;
    postLoginRedirect: string;
    rememberLabel: string;
    noticeRateLimit: string;
    noticeSessionExpired: string;
  };
  socialProviders: SocialProvider[];
  errors: { style: ErrorStyle };
  motion: { pageFadeMs: number };
  seo: { title: string; description: string };
}

export interface ResolvedAuthSettings {
  signin: ResolvedAuthStyle;
  signup: ResolvedAuthStyle;
  forgot: ResolvedAuthStyle;
}

/* Builtins: today's look = final fallback (the one legal home for literals). */

const DEFAULT_ELEMENT = (size: number, weight: number, color: string, align: TextAlign): ElementStyle => ({
  size,
  weight,
  color,
  align,
});

const DEFAULT_STYLE_BODY = {
  layout: { mode: "split" as AuthMode, panelSide: "left" as PanelSide, ratio: "50-50" as SplitRatio, mobile: "stacked" as AuthMobile },
  form: { surface: "white" as FormSurface, radius: 12, width: 400, elevation: "border" as FormElevation },
  inputs: {
    bg: "#ffffff",
    border: "#dce8ee",
    radius: 10,
    text: "#0a2540",
    placeholder: "#5b7286",
    focusBorder: "#0077b6",
    focusRing: "#0077b633",
    focusRingWidth: 3,
    errorBorder: "#d92d20",
  },
  panel: {
    bgMode: "gradient" as PanelBgMode,
    solid: "#0077b6",
    gradient: {
      type: "linear" as const,
      angle: 135,
      stops: [
        { color: "#023e8a", at: 0 },
        { color: "#0077b6", at: 60 },
        { color: "#48cae4", at: 100 },
      ],
    },
    imageUrl: "",
    imageFit: "cover" as ImageFit,
    imagePosition: "center",
    overlay: 0,
    logoUrl: "",
    logoHeight: 28,
  },
  typography: {
    family: "outfit" as FontFamily,
    headline: DEFAULT_ELEMENT(30, 700, "#ffffff", "left"),
    sub: DEFAULT_ELEMENT(14, 400, "#ffffff", "left"),
    bullets: DEFAULT_ELEMENT(13, 400, "#ffffff", "left"),
    quote: DEFAULT_ELEMENT(13, 400, "#ffffff", "left"),
    formTitle: DEFAULT_ELEMENT(14, 600, "#0a2540", "left"),
    labels: DEFAULT_ELEMENT(12, 600, "#0a2540", "left"),
  },
  content: {
    headline: "",
    sub: "",
    bullets: "",
    quote: "",
    microcopy: "",
    formTitle: "",
    footerLinks: [] as { label: string; href: string }[],
  },
  behavior: {
    rememberDefault: true,
    postLoginRedirect: "",
    rememberLabel: "Remember me",
    noticeRateLimit: "Too many attempts. Try again shortly.",
    noticeSessionExpired: "Your session expired. Please sign in again.",
  },
  socialProviders: [] as SocialProvider[],
  errors: { style: "banner" as ErrorStyle },
  motion: { pageFadeMs: 200 },
  seo: { title: "", description: "" },
};

export const DEFAULT_AUTH_SETTINGS: ResolvedAuthSettings = {
  signin: {
    ...DEFAULT_STYLE_BODY,
    layout: { ...DEFAULT_STYLE_BODY.layout, mode: "split", panelSide: "left" },
    content: { ...DEFAULT_STYLE_BODY.content, formTitle: "Welcome back" },
  },
  signup: {
    ...DEFAULT_STYLE_BODY,
    layout: { ...DEFAULT_STYLE_BODY.layout, mode: "split", panelSide: "right" },
    content: { ...DEFAULT_STYLE_BODY.content, formTitle: "Create your account" },
  },
  forgot: {
    ...DEFAULT_STYLE_BODY,
    layout: { ...DEFAULT_STYLE_BODY.layout, mode: "centered", panelSide: "left" },
    content: { ...DEFAULT_STYLE_BODY.content, formTitle: "Reset your password" },
  },
};
