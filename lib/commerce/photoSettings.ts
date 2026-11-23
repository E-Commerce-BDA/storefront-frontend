
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
