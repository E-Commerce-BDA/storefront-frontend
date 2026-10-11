/**
 * Navbar settings resolver — Oceanic Blue v1.0
 * (Locked navbar plan: cascade + time-filter + truncate + clamps.)
 *
 * Sibling of lib/auth/resolveSettings.ts, smaller domain: one shared scope
 * (no pages), plus two navbar-only jobs — dropping out-of-window scheduled
 * items and truncating links to maxItems. Same rules: corrupt scopes are
 * misses (builtins render, never blank); the only ?? lives here, stated
 * once in this header as the cascade itself.
 *
 * Time judgment (locked): valid windows excluding now DROP the item (an
 * expired promo shown is a pricing lie); malformed date bounds are treated
 * as absent bounds (a broken string must not nuke a link). Server clock.
 *
 * No React, no fetch, no logging.
 */

import {
  NAV_LIMITS,
  DEFAULT_NAV_SETTINGS,
  type EditorialOverlayField,
  type LinkSchedule,
  type NavLink,
  type NavPageOverrides,
  type NavSettings,
  type ResolvedNavLink,
  type ResolvedNavSettings,
} from "./navSettings";
import { resolveOverlayMotion } from "@/lib/search/motion";

export interface ResolveNavInput {
  /** CMS admin values. Null = CMS unreadable (builtins render). */
  settings?: NavSettings | null;
  /** Global theme scope. Null = absent. */
  global?: NavPageOverrides | null;
}

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
};

/** Per-group merge honoring shared → global → builtin (see header). */
function mergeGroup<T extends object>(builtin: T, global: Partial<T> | undefined, shared: Partial<T> | undefined): T {
  return { ...builtin, ...global, ...shared };
}

const L = NAV_LIMITS;
const D = DEFAULT_NAV_SETTINGS;

/** Valid bound or null (malformed = absent bound, never an error). */
function bound(value: string | undefined): number | null {
  if (typeof value !== "string" || value === "") return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

/** True while `now` sits inside the window; unbounded sides stay open. */
function inWindow(schedule: LinkSchedule | undefined, now: number): boolean {
  const start = bound(schedule?.startsAt);
  const end = bound(schedule?.endsAt);
  if (start !== null && now < start) return false;
  if (end !== null && now > end) return false;
  return true;
}

function resolveLinks(
  items: NavLink[] | undefined,
  maxItems: number | undefined,
  now: number,
): { items: ResolvedNavLink[]; maxItems: number } {
  const cap = clampInt(maxItems, L.maxItems.min, L.maxItems.max, D.links.maxItems);
  const resolved: ResolvedNavLink[] = (Array.isArray(items) ? items : [])
    .filter((l) => l && typeof l.label === "string" && typeof l.href === "string" && inWindow(l.schedule, now))
    .map((l) => ({
      kind: l.kind,
      label: l.label,
      href: l.href,
      categoryId: l.kind === "category" ? l.categoryId : "",
      icon: l.icon ?? "",
      badge: l.badge ?? null,
      highlight: l.highlight ?? "none",
      schedule: {
        startsAt: typeof l.schedule?.startsAt === "string" ? l.schedule.startsAt : "",
        endsAt: typeof l.schedule?.endsAt === "string" ? l.schedule.endsAt : "",
      },
      // Page marks the active route later; resolver never knows the route.
      current: false,
    }));
  return { items: resolved.slice(0, cap), maxItems: cap };
}

export function resolveNavSettings(input: ResolveNavInput, now: number = Date.now()): ResolvedNavSettings {
  const shared = input.settings?.shared ?? undefined;
  const global = input.global ?? undefined;

  const regions = mergeGroup(D.regions, global?.regions, shared?.regions);
  const logo = mergeGroup(D.logo, global?.logo, shared?.logo);
  const bar = mergeGroup(D.bar, global?.bar, shared?.bar);
  const colors = mergeGroup(D.colors, global?.colors, shared?.colors);
  // Motion instances resolve through their own resolver (preset → concrete
  // ms+easing, clamped + allowlisted) — generic merge would pass presets
  // through raw, so the partial key is excluded here and set concrete
  // below. One instance per variant; settings never leak across variants.
  type SearchNoMotion = Omit<NavPageOverrides["search"], "sheetAnimation" | "editorial">;
  type EditorialNoMotion = Omit<EditorialOverlayField, "editorialAnimation">;
  const stripMotion = (s: NavPageOverrides["search"]): SearchNoMotion | undefined => {
    if (!s) return undefined;
    const { sheetAnimation: _dropSheet, editorial: _dropEdGroup, ...rest } = s;
    void _dropSheet;
    void _dropEdGroup;
    return rest;
  };
  // Editorial merges per-KEY (not per-object): a shared { bg } must not wipe
  // a global tabShape. Motion is excluded from the merge and resolved below.
  const stripEdMotion = (e: EditorialOverlayField | undefined): EditorialNoMotion | undefined => {
    if (!e) return undefined;
    const { editorialAnimation: _dropEd, ...rest } = e;
    void _dropEd;
    return rest;
  };
  // Non-empty strings only — "" or wrong-typed admin values are misses
  // (builtins render, never blank/injected garbage).
  const cleanStr = (v: unknown, fallback: string): string =>
    typeof v === "string" && v !== "" ? v : fallback;
  const searchBase = mergeGroup(D.search, stripMotion(global?.search), stripMotion(shared?.search));
  const { sheetAnimation: _builtinSheet, editorial: _builtinEdGroup, ...searchRest } = searchBase;
  void _builtinSheet;
  void _builtinEdGroup;
  const edBase = mergeGroup(
    D.search.editorial,
    stripEdMotion(global?.search?.editorial),
    stripEdMotion(shared?.search?.editorial),
  );
  const { editorialAnimation: _builtinEd, ...edRest } = edBase;
  void _builtinEd;
  const ed = D.search.editorial;
  const search = {
    ...searchRest,
    sheetAnimation: resolveOverlayMotion(
      shared?.search?.sheetAnimation ?? global?.search?.sheetAnimation ?? undefined,
      D.search.sheetAnimation,
    ),
    editorial: {
      bg: cleanStr(edRest.bg, ed.bg),
      bgAlpha: clampInt(edRest.bgAlpha, L.bgAlpha.min, L.bgAlpha.max, ed.bgAlpha),
      blur: edRest.blur,
      blurPx: clampInt(edRest.blurPx, L.blurPx.min, L.blurPx.max, ed.blurPx),
      eyebrow: cleanStr(edRest.eyebrow, ed.eyebrow),
      eyebrowColor: cleanStr(edRest.eyebrowColor, ed.eyebrowColor),
      archiveEyebrow: cleanStr(edRest.archiveEyebrow, ed.archiveEyebrow),
      archiveColor: cleanStr(edRest.archiveColor, ed.archiveColor),
      inputColor: cleanStr(edRest.inputColor, ed.inputColor),
      placeholderColor: cleanStr(edRest.placeholderColor, ed.placeholderColor),
      underlineColor: cleanStr(edRest.underlineColor, ed.underlineColor),
      title: cleanStr(edRest.title, ed.title),
      titleColor: cleanStr(edRest.titleColor, ed.titleColor),
      mutedColor: cleanStr(edRest.mutedColor, ed.mutedColor),
      closeIconColor: cleanStr(edRest.closeIconColor, ed.closeIconColor),
      tabTextColor: cleanStr(edRest.tabTextColor, ed.tabTextColor),
      tabActiveBg: cleanStr(edRest.tabActiveBg, ed.tabActiveBg),
      tabActiveText: cleanStr(edRest.tabActiveText, ed.tabActiveText),
      // v1-only unions: unknown members are misses (later variants extend
      // these checks, never loosen them).
      tabShape: edRest.tabShape === "pill" ? edRest.tabShape : ed.tabShape,
      cardType: edRest.cardType === "standard" ? edRest.cardType : ed.cardType,
      cardRadius: clampInt(edRest.cardRadius, L.cardRadius.min, L.cardRadius.max, ed.cardRadius),
      deptColor: cleanStr(edRest.deptColor, ed.deptColor),
      nameColor: cleanStr(edRest.nameColor, ed.nameColor),
      priceColor: cleanStr(edRest.priceColor, ed.priceColor),
      editorialAnimation: resolveOverlayMotion(
        shared?.search?.editorial?.editorialAnimation ?? global?.search?.editorial?.editorialAnimation ?? undefined,
        ed.editorialAnimation,
      ),
    },
  };
  const account = mergeGroup(D.account, global?.account, shared?.account);
  const cart = mergeGroup(D.cart, global?.cart, shared?.cart);
  const mobile = mergeGroup(D.mobile, global?.mobile, shared?.mobile);

  const links = resolveLinks(shared?.links?.items ?? global?.links?.items, shared?.links?.maxItems ?? global?.links?.maxItems, now);

  const announceItems = (shared?.announcement?.items ?? global?.announcement?.items ?? [])
    .filter((it) => it && typeof it.text === "string" && it.text !== "")
    .map((it) => ({
      text: it.text,
      cta: it.cta && typeof it.cta.label === "string" && typeof it.cta.href === "string" ? { label: it.cta.label, href: it.cta.href } : null,
      countdownTo: typeof it.countdownTo === "string" ? it.countdownTo : "",
    }));

  return {
    regions,
    logo: { ...logo, height: clampInt(logo.height, L.logoHeight.min, L.logoHeight.max, D.logo.height) },
    bar: { ...bar, height: clampInt(bar.height, L.barHeight.min, L.barHeight.max, D.bar.height) },
    colors,
    links,
    search,
    account,
    cart: { ...cart, badgeCap: clampInt(cart.badgeCap, L.badgeCap.min, L.badgeCap.max, D.cart.badgeCap) },
    announcement: {
      items: announceItems,
      showArrows: shared?.announcement?.showArrows ?? global?.announcement?.showArrows ?? D.announcement.showArrows,
      autoplayMs: shared?.announcement?.autoplayMs ?? global?.announcement?.autoplayMs ?? D.announcement.autoplayMs,
      dismissible: shared?.announcement?.dismissible ?? global?.announcement?.dismissible ?? D.announcement.dismissible,
      collapseAnimation: shared?.announcement?.collapseAnimation ?? global?.announcement?.collapseAnimation ?? D.announcement.collapseAnimation,
    },
    mobile: { ...mobile, breakpoint: clampInt(mobile.breakpoint, L.breakpoint.min, L.breakpoint.max, D.mobile.breakpoint) },
  };
}
