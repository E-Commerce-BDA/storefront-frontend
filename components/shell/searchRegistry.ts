/**
 * Search overlay registry — one dynamic import per BUILT variant, so
 * unselected overlays never enter the client bundle. Unbuilt variants
 * resolve to null (caller falls back to classic), never to a wrong
 * variant. Palette → editorial → inspect add their lines as they land.
 * Verify in build output: unselected variant chunks absent.
 */
import type { ComponentType } from "react";

export type SearchOverlayId = "classic" | "palette" | "sheet" | "editorial" | "inspect";

type AnyOverlay = ComponentType<Record<string, unknown>>;

// Reason for the cast: dynamic-import boundary — the registry loads
// modules, never renders them; props are checked at the call site.
const registry: Partial<Record<SearchOverlayId, () => Promise<{ default: AnyOverlay }>>> = {
  sheet: (() => import("./SearchSheet")) as unknown as () => Promise<{ default: AnyOverlay }>,
};

export function resolveSearchOverlay(id: SearchOverlayId): (() => Promise<{ default: AnyOverlay }>) | null {
  return registry[id] ?? null;
}
