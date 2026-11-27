/**
 * Mega menu resolver — sf-088. Pure. Consumes the versioned 2.2.0 navigation
 * group shape directly; the renderer clamps columns/items to the shell budget
 * instead of trusting CMS-authored numbers.
 */
import type { MegaMenuGroup } from "@ecom/contracts";

export interface ResolvedMegaMenuGroup {
  title: string;
  items: MegaMenuGroup["items"];
  columns: number;
  promo?: MegaMenuGroup["promo"];
}

export interface ResolvedMegaMenu {
  groups: ResolvedMegaMenuGroup[];
  ariaLabel: string;
}

export const DEFAULT_MEGA_MENU = { ariaLabel: "Browse", maxGroups: 6, maxColumns: 4, maxItems: 12 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function resolveMegaMenu(
  groups: readonly MegaMenuGroup[],
  options: { ariaLabel?: string; maxGroups?: number; maxColumns?: number } | undefined,
  flat: { ariaLabel?: string } = {},
): ResolvedMegaMenu {
  const source = options ?? DEFAULT_MEGA_MENU;
  const groupLimit = clamp(source.maxGroups ?? DEFAULT_MEGA_MENU.maxGroups, 1, 6);
  const columnLimit = clamp(source.maxColumns ?? DEFAULT_MEGA_MENU.maxColumns, 1, 4);
  return {
    ariaLabel: flat.ariaLabel ?? source.ariaLabel ?? DEFAULT_MEGA_MENU.ariaLabel,
    groups: groups.slice(0, groupLimit).map((group) => ({
      title: group.title,
      items: group.items.slice(0, DEFAULT_MEGA_MENU.maxItems),
      columns: clamp(group.columns ?? columnLimit, 1, columnLimit),
      ...(group.promo === undefined ? {} : { promo: group.promo }),
    })),
  };
}
