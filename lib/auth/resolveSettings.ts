/**
 * Auth settings resolver — Oceanic Blue v1.0
 * (Documentation/pages/auth-design.md §2 + AGENTS.md §3.4)
 *
 * Holes go in, completeness comes out: partial admin/shared/global scopes
 * resolve to a fully-concrete ResolvedAuthSettings the page renders blindly.
 *
 * REASON FOR ?? IN THIS FILE (AGENTS.md reason-required rule): this file IS
 * the cascade — `page ?? shared ?? global ?? builtin` is the single place
 * defaults resolve. Every other file renders resolved values with no
 * fallbacks. Corrupt/unreadable scopes are not errors here, just misses:
 * CMS down + cold cache lands on builtins (= today's look).
 *
 * No React, no fetch, no logging (pure — the fetcher logs, this resolves).
 */

import {
  AUTH_LIMITS,
  DEFAULT_AUTH_SETTINGS,
  type AuthPageOverrides,
  type AuthPanelField,
  type AuthSettings,
  type GradientStop,
  type PanelGradient,
  type ResolvedAuthSettings,
  type ResolvedAuthStyle,
  type ResolvedGradientStop,
  type ResolvedPanelGradient,
} from "./settings";

export interface ResolveSettingsInput {
  /** CMS admin values (shared scope + per-page). Null = CMS unreadable. */
  settings?: AuthSettings | null;
  /** Global theme scope. Null = absent. */
  global?: AuthPageOverrides | null;
}

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
};

/** Per-group merge honoring page > shared > global > builtin (see header). */
function mergeGroup<T extends object>(builtin: T, global: Partial<T> | undefined, shared: Partial<T> | undefined, page: Partial<T> | undefined): T {
  return { ...builtin, ...global, ...shared, ...page };
}

const L = AUTH_LIMITS;
const D = DEFAULT_AUTH_SETTINGS.signin;

/* Gradient: clamp angle/count, fill missing positions evenly, sort by
   position. Fewer than 2 usable stops degrades to solid (a gradient needs
   at least two colors) — rendering never fails because of theming. */
function resolveGradient(
  page: PanelGradient | undefined,
  shared: PanelGradient | undefined,
  global: PanelGradient | undefined,
): ResolvedPanelGradient {
  const g = page ?? shared ?? global ?? D.panel.gradient;
  const rawStops = (g.stops ?? []).filter((s) => s && typeof s.color === "string" && s.color !== "");
  const kept = rawStops.slice(0, L.gradientStops.max).map((s) => ({ color: s.color, at: s.at }));
  if (kept.length < L.gradientStops.min) {
    return { ...D.panel.gradient, stops: [...D.panel.gradient.stops] };
  }
  // Missing positions distribute evenly by index; explicit ones clamp 0–100.
  const filled: ResolvedGradientStop[] = kept
    .map((s, i) => {
      const explicit = typeof s.at === "number" && Number.isFinite(s.at);
      const at = explicit
        ? Math.min(100, Math.max(0, Math.round(s.at as number)))
        : kept.length === 1
          ? 0
          : Math.round((i / (kept.length - 1)) * 100);
      return { color: s.color, at };
    })
    .sort((a, b) => a.at - b.at);
  if (g.type === "radial") {
    return { type: "radial", shape: g.shape ?? "ellipse", at: g.at ?? "center", stops: filled };
  }
  if (g.type === "conic") {
    return { type: "conic", from: clampInt(g.from, 0, 360, 0), at: g.at ?? "center", stops: filled };
  }
  return {
    type: "linear",
    angle: clampInt(g.angle, L.gradientAngle.min, L.gradientAngle.max, 135),
    stops: filled,
  };
}

/* Sanitizer: allowlist tags + attributes, applied once here (server-side).
   Components receive already-safe HTML and never escape anything.
   v1 is dependency-free by the zero-new-deps rule; swap for a dedicated
   library with cms-svc if the allowlist ever grows beyond this shape. */
const ALLOWED_TAGS = new Set(["h1", "h2", "h3", "h4", "p", "strong", "em", "ul", "ol", "li", "a", "span", "br"]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  span: new Set(["style"]),
  p: new Set(["style"]),
  h1: new Set(["style"]),
  h2: new Set(["style"]),
  h3: new Set(["style"]),
  h4: new Set(["style"]),
};

function cleanAttr(tag: string, name: string, value: string): string | null {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed || !allowed.has(name)) return null;
  if (name === "href") {
    const v = value.trim();
    if (!/^(https?:\/\/|\/|#|mailto:)/i.test(v)) return null;
    if (/^javascript:/i.test(v)) return null;
    return ` href="${v.replace(/"/g, "")}"`;
  }
  // style: drop event-handler smuggling and url()/expression().
  const v = value.replace(/expression\s*\(/gi, "").replace(/url\s*\(/gi, "");
  if (/on\w+\s*=/i.test(v)) return null;
  return ` style="${v.replace(/"/g, "")}"`;
}

export function sanitizeAuthHtml(dirty: unknown): string {
  if (typeof dirty !== "string" || dirty === "") return "";
  // Strip script/style blocks with content (keep inner text out entirely).
  let out = dirty.replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, "");
  out = out.replace(/<(script|style|iframe|object|embed)[^>]*\/?>/gi, "");
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    const closing = match.startsWith("</");
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (tag === "br") return "<br>";
    if (closing) return `</${tag}>`;
    let kept = "";
    attrs.replace(/([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g, (_m: string, name: string, value: string) => {
      const unquoted = value.replace(/^["']|["']$/g, "");
      const clean = cleanAttr(tag, name.toLowerCase(), unquoted);
      if (clean) kept += clean;
      return "";
    });
    return `<${tag}${kept}>`;
  });
  return out;
}

type PageKey = "signin" | "signup" | "forgot";

function resolvePage(
  key: PageKey,
  pageStyle: AuthPageOverrides | undefined,
  shared: AuthPageOverrides | undefined,
  global: AuthPageOverrides | undefined,
  isolateFromShared: boolean,
): ResolvedAuthStyle {
  const builtin = DEFAULT_AUTH_SETTINGS[key];
  // Forgot's own groups replace shared groups wholesale when present:
  // a present page group skips shared for that group (global still applies).
  const sh = <K extends keyof AuthPageOverrides>(group: K): AuthPageOverrides[K] | undefined =>
    isolateFromShared && pageStyle?.[group] !== undefined ? undefined : shared?.[group];
  const layout = mergeGroup(builtin.layout, global?.layout, sh("layout"), pageStyle?.layout);
  const form = mergeGroup(builtin.form, global?.form, sh("form"), pageStyle?.form);
  const rawInputs = mergeGroup(builtin.inputs, global?.inputs, sh("inputs"), pageStyle?.inputs);
  // Gradient resolves separately (partial in, concrete out) — excluded here.
  type PanelNoGradient = Omit<AuthPanelField, "gradient">;
  const pagePanel: PanelNoGradient = { ...pageStyle?.panel };
  delete (pagePanel as { gradient?: unknown }).gradient;
  const sharedPanel: PanelNoGradient = { ...sh("panel") };
  delete (sharedPanel as { gradient?: unknown }).gradient;
  const globalPanel: PanelNoGradient = { ...global?.panel };
  delete (globalPanel as { gradient?: unknown }).gradient;
  const rawPanel = mergeGroup(builtin.panel, globalPanel, sharedPanel, pagePanel);
  const typography = mergeGroup(builtin.typography, global?.typography, sh("typography"), pageStyle?.typography);
  const content = mergeGroup(builtin.content, global?.content, sh("content"), pageStyle?.content);
  const behavior = mergeGroup(builtin.behavior, global?.behavior, sh("behavior"), pageStyle?.behavior);
  const errors = mergeGroup(builtin.errors, global?.errors, sh("errors"), pageStyle?.errors);
  const motion = mergeGroup(builtin.motion, global?.motion, sh("motion"), pageStyle?.motion);
  const seo = mergeGroup(builtin.seo, global?.seo, sh("seo"), pageStyle?.seo);
  const gradient = resolveGradient(pageStyle?.panel?.gradient, sh("panel")?.gradient, global?.panel?.gradient);

  return {
    layout,
    form: {
      ...form,
      radius: clampInt(form.radius, L.formRadius.min, L.formRadius.max, builtin.form.radius),
      width: clampInt(form.width, L.formWidth.min, L.formWidth.max, builtin.form.width),
    },
    inputs: {
      ...rawInputs,
      radius: clampInt(rawInputs.radius, L.inputRadius.min, L.inputRadius.max, builtin.inputs.radius),
      focusRingWidth: clampInt(rawInputs.focusRingWidth, L.ringWidth.min, L.ringWidth.max, builtin.inputs.focusRingWidth),
    },
    panel: {
      ...rawPanel,
      gradient,
      overlay: clampInt(rawPanel.overlay, L.overlay.min, L.overlay.max, builtin.panel.overlay),
      logoHeight: clampInt(rawPanel.logoHeight, L.logoHeight.min, L.logoHeight.max, builtin.panel.logoHeight),
    },
    typography,
    content: {
      headline: sanitizeAuthHtml(content.headline),
      sub: sanitizeAuthHtml(content.sub),
      bullets: sanitizeAuthHtml(content.bullets),
      quote: sanitizeAuthHtml(content.quote),
      microcopy: sanitizeAuthHtml(content.microcopy),
      // Plain text by contract (React escapes on render); links allowlisted.
      formTitle: typeof content.formTitle === "string" ? content.formTitle : "",
      footerLinks: Array.isArray(content.footerLinks)
        ? content.footerLinks
            .filter(
              (l) =>
                l &&
                typeof l.label === "string" &&
                typeof l.href === "string" &&
                /^(https?:\/\/|\/|#)/i.test(l.href) &&
                !/^javascript:/i.test(l.href),
            )
            .map((l) => ({ label: l.label, href: l.href }))
        : [],
    },
    behavior,
    socialProviders: pageStyle?.socialProviders ?? sh("socialProviders") ?? global?.socialProviders ?? [],
    errors,
    motion: {
      pageFadeMs: clampInt(motion.pageFadeMs, L.pageFadeMs.min, L.pageFadeMs.max, builtin.motion.pageFadeMs),
    },
    seo,
  };
}

export function resolveAuthSettings(input: ResolveSettingsInput): ResolvedAuthSettings {
  const settings = input.settings ?? undefined;
  const global = input.global ?? undefined;
  const shared = settings?.shared ?? undefined;
  const pages = settings?.pages ?? undefined;
  const f = pages?.forgot;
  // Forgot's layout comes from its page entry; its style groups replace
  // shared wholesale when present (isolateFromShared = true).
  const forgotStyle: AuthPageOverrides | undefined =
    f === undefined
      ? undefined
      : { ...f.style, layout: { ...f.style?.layout, mode: f.mode, panelSide: f.panelSide } };
  return {
    signin: resolvePage("signin", pages?.signin ? { layout: pages.signin } : undefined, shared, global, false),
    signup: resolvePage("signup", pages?.signup ? { layout: pages.signup } : undefined, shared, global, false),
    forgot: resolvePage("forgot", forgotStyle, shared, global, true),
  };
}

export type { GradientStop, PanelGradient };
