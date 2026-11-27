/**
 * Mega menu resolver — sf-088, normalization extended in sf-089. Pure.
 * Consumes the versioned 2.2.0 navigation group shape directly; the renderer
 * clamps columns/items to the shell budget instead of trusting CMS-authored
 * numbers. `normalizeNavGroups` is the defensive gate at the CMS→view-model
 * seam: a malformed group/item is dropped, never painted as a dead link.
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

/** Matches the contracts `navHrefSchema`: internal path or http(s) only. */
const SAFE_HREF = /^(?:\/(?!\/)|https?:\/\/)/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function cleanHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  return href !== "" && href.length <= 2048 && SAFE_HREF.test(href) ? href : null;
}

function cleanText(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, max) : null;
}

function cleanBadge(value: unknown): { text: string } | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const text = cleanText((value as Record<string, unknown>).text, 40);
  return text === null ? undefined : { text };
}

function normalizeItem(value: unknown): MegaMenuGroup["items"][number] | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Record<string, unknown>;
  const label = cleanText(item.label, 64);
  const href = cleanHref(item.href);
  if (label === null || href === null) return null;
  const description = typeof item.description === "string" ? item.description.slice(0, 200) : undefined;
  const badge = cleanBadge(item.badge);
  return { label, href, ...(description === undefined ? {} : { description }), ...(badge === undefined ? {} : { badge }) };
}

function normalizePromo(value: unknown): MegaMenuGroup["promo"] | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const promo = value as Record<string, unknown>;
  const title = cleanText(promo.title, 80);
  const href = cleanHref(promo.href);
  if (title === null || href === null) return undefined;
  const description = typeof promo.description === "string" ? promo.description.slice(0, 200) : undefined;
  const imageUrl = typeof promo.imageUrl === "string" ? promo.imageUrl : undefined;
  const badge = cleanBadge(promo.badge);
  return {
    title,
    href,
    ...(description === undefined ? {} : { description }),
    ...(imageUrl === undefined ? {} : { imageUrl }),
    ...(badge === undefined ? {} : { badge }),
  };
}

/**
 * CMS 2.2.0 groups → shell-safe groups. Dedupes by href so a duplicated link
 * cannot paint twice; groups with no valid item are absent, not an empty title.
 */
export function normalizeNavGroups(raw: readonly unknown[] | null | undefined): MegaMenuGroup[] {
  if (!Array.isArray(raw)) return [];
  const groups: MegaMenuGroup[] = [];
  for (const value of raw.slice(0, DEFAULT_MEGA_MENU.maxGroups)) {
    if (typeof value !== "object" || value === null) continue;
    const group = value as Record<string, unknown>;
    const title = cleanText(group.title, 64);
    if (title === null) continue;
    const seen = new Set<string>();
    const items: MegaMenuGroup["items"] = [];
    for (const candidate of Array.isArray(group.items) ? group.items.slice(0, DEFAULT_MEGA_MENU.maxItems) : []) {
      const item = normalizeItem(candidate);
      if (item === null || seen.has(item.href)) continue;
      seen.add(item.href);
      items.push(item);
    }
    if (items.length === 0) continue;
    const columns =
      typeof group.columns === "number" && Number.isFinite(group.columns)
        ? clamp(group.columns, 1, DEFAULT_MEGA_MENU.maxColumns)
        : undefined;
    const promo = normalizePromo(group.promo);
    groups.push({
      title,
      items,
      ...(columns === undefined ? {} : { columns }),
      ...(promo === undefined ? {} : { promo }),
    });
  }
  return groups;
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
    groups: normalizeNavGroups(groups)
      .slice(0, groupLimit)
      .map((group) => ({
        title: group.title,
        items: group.items.slice(0, DEFAULT_MEGA_MENU.maxItems),
        columns: clamp(group.columns ?? columnLimit, 1, columnLimit),
        ...(group.promo === undefined ? {} : { promo: group.promo }),
      })),
  };
}
