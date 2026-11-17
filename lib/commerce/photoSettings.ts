/**
 * PDP photo-settings precedence — sf-055 (product.md §7.6)
 *
 * Product > section > global. A present value at a higher layer wins; an
 * absent one inherits the next layer down; a wrong-typed value is a miss
 * (never a blank page). Every numeric knob is clamped here so paint receives
 * a valid face, and CSS variables mirror the defaults.
 *
 * The `photoSettings` bag arrives as an untrusted record from catalog-svc;
 * the section layer is the CMS knobs a PDP section already carries
 * (`ratio`/`blendMode`/`showPhotos`/`gutter`). Global comes from the resolved
 * theme, never the raw admin document.
 */

import type { ResolvedThemePhotoSettings } from "@/lib/cms/themeSettings";
import type { MediaRatio } from "./productCard";

export type PhotoFormat = "horizontal" | "vertical";
export type PhotoLayout = "grid" | "carousel";
export type PhotoBlend = "multiply" | "normal";
export type PhotoRatio = MediaRatio | "custom";

export interface ResolvedPhotoSettings {
  format: PhotoFormat;
  ratio: PhotoRatio;
  customRatio: number;
  layout: PhotoLayout;
  gutter: number;
  widthPercent: number;
  blendMode: PhotoBlend;
  showPhotos: boolean;
}

export type PhotoSettingsLayer = Partial<{
  format: unknown;
  ratio: unknown;
  customRatio: unknown;
  layout: unknown;
  gutter: unknown;
  widthPercent: unknown;
  blendMode: unknown;
  showPhotos: unknown;
}>;

const RATIOS: readonly PhotoRatio[] = ["1:1", "4:3", "4:5", "3:4", "16:9", "custom"];
const clamp = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
};

function pick(layers: readonly PhotoSettingsLayer[], key: keyof PhotoSettingsLayer): unknown {
  for (const layer of layers) {
    if (layer !== undefined && layer[key] !== undefined) return layer[key];
  }
  return undefined;
}

/**
 * The single merge for PDP photo paint. `layers` is ordered high → low
 * (product, section, global); the global layer is always present as the
 * resolved theme default.
 */
export function resolvePhotoSettings(
  layers: readonly PhotoSettingsLayer[],
  global: ResolvedThemePhotoSettings,
): ResolvedPhotoSettings {
  const ratioRaw = pick(layers, "ratio");
  const ratio: PhotoRatio =
    typeof ratioRaw === "string" && (RATIOS as readonly string[]).includes(ratioRaw)
      ? (ratioRaw as PhotoRatio)
      : global.ratio;

  return {
    format: pick(layers, "format") === "horizontal" ? "horizontal" : global.format,
    ratio,
    customRatio: clamp(pick(layers, "customRatio"), 0.5, 2.5, global.customRatio),
    layout: pick(layers, "layout") === "grid" ? "grid" : global.layout,
    gutter: clamp(pick(layers, "gutter"), 0, 48, global.gutter),
    widthPercent: clamp(pick(layers, "widthPercent"), 25, 100, global.widthPercent),
    blendMode: pick(layers, "blendMode") === "multiply" ? "multiply" : global.blendMode,
    showPhotos:
      typeof pick(layers, "showPhotos") === "boolean"
        ? (pick(layers, "showPhotos") as boolean)
        : global.showPhotos,
  };
}
