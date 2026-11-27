/**
 * Draft theme → preview CSS vars — sf-096 follow-up. Pure.
 *
 * The admin sends only changed authored fields (a sparse patch), so it must be
 * merged over the published theme before the resolver runs; resolving the draft
 * alone would silently reset every untouched merchant value to library
 * defaults. Paint still goes through the same --sf-* emitters, never raw CSS.
 */
import type { ThemeSettings } from "@ecom/contracts";
import { resolveThemeSettings } from "@/lib/cms/themeSettings";
import { themeToCssVars } from "@/lib/cms/themeVars";
import { resolveComponentGroups, resolvePalette } from "@/lib/theme/palette";
import { paletteToThemeVars, type ThemeVars } from "@/lib/theme/vars";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Nested authored groups inherit per key; arrays and scalars are replaced. */
function mergeTheme(base: unknown, draft: unknown, depth = 0): Record<string, unknown> {
  const merged: Record<string, unknown> = isRecord(base) ? { ...base } : {};
  if (!isRecord(draft)) return merged;
  for (const [key, value] of Object.entries(draft)) {
    const previous = merged[key];
    merged[key] =
      depth < 8 && isRecord(previous) && isRecord(value)
        ? mergeTheme(previous, value, depth + 1)
        : value;
  }
  return merged;
}

export function previewThemeVars(base: unknown, draft: ThemeSettings | undefined): ThemeVars {
  const theme = mergeTheme(base, draft) as ThemeSettings;
  const palette = resolvePalette({ global: theme.palette });
  const groups = resolveComponentGroups({
    palette,
    global: {
      navbar: theme.navbar,
      filterRail: theme.filterRail,
      drawer: theme.drawer,
      marquee: theme.marquee,
      grid: theme.grid,
      productCard: theme.productCard,
    },
  });
  return {
    ...themeToCssVars(resolveThemeSettings({ settings: theme })),
    ...paletteToThemeVars(palette, groups),
  };
}
