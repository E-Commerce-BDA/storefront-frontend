/**
 * Paginated rail resolver — sf-088. Pure.
 *
 * The prototype's rail engine is expressed as two decisions: how many pages a
 * list has, and what index a drag/next/prev lands on. Pointer bookkeeping and
 * timers stay in the client shell; this module knows no DOM.
 */

export type RailMotion = "on" | "off";

export interface RailModel {
  count: number;
  pageSize: number;
  index: number;
  loop: boolean;
  motion: RailMotion;
}

export interface ResolvedRail {
  pages: number;
  index: number;
  pageSize: number;
  loop: boolean;
  motion: RailMotion;
  dots: number[];
}

export const DEFAULT_RAIL = {
  count: 0,
  pageSize: 4,
  index: 0,
  loop: true,
  motion: "on" as RailMotion,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function resolveRail(
  options: Partial<RailModel> | undefined,
  flat: { motion?: RailMotion; loop?: boolean } = {},
): ResolvedRail {
  const source = options ?? DEFAULT_RAIL;
  const pageSize = clamp(source.pageSize ?? DEFAULT_RAIL.pageSize, 1, 12);
  const count = clamp(source.count ?? DEFAULT_RAIL.count, 0, 240);
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const loop = flat.loop ?? source.loop ?? DEFAULT_RAIL.loop;
  const raw = clamp(source.index ?? DEFAULT_RAIL.index, 0, pages - 1);
  return {
    pages,
    index: raw,
    pageSize,
    loop,
    motion: flat.motion ?? source.motion ?? DEFAULT_RAIL.motion,
    dots: Array.from({ length: pages }, (_, index) => index),
  };
}

/** One step of the infinite/capped rail. No state — the owner stores the index. */
export function railStep(index: number, pages: number, delta: number, loop: boolean): number {
  if (pages <= 1) return 0;
  const next = index + (delta > 0 ? 1 : -1);
  if (loop) return ((next % pages) + pages) % pages;
  return clamp(next, 0, pages - 1);
}
