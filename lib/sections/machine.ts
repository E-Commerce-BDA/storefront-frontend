/**
 * Hero carousel machine — sf-085. Pure.
 *
 * The prototype kept the slide index and the pause flag next to the timer, so
 * a hover could leave a stale index behind after a re-render. Here both live
 * in one reducer and the interval is owned by the island: the machine decides
 * which slide is current, never when time passes.
 */
import type { Status } from "@/lib/machine/status";
import { railStep } from "@/lib/sections/railModel";

export interface HeroCarouselMachineState {
  index: number;
  paused: boolean;
  status: Status;
}

export type HeroCarouselMachineEvent =
  | { type: "slide/next"; count: number }
  | { type: "slide/prev"; count: number }
  | { type: "slide/set"; index: number; count: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "load/ready" };

export function initialHeroCarouselMachine(): HeroCarouselMachineState {
  return { index: 0, paused: false, status: "idle" };
}

function wrap(index: number, count: number): number {
  return count === 0 ? 0 : ((index % count) + count) % count;
}

export function heroCarouselMachine(
  state: HeroCarouselMachineState,
  event: HeroCarouselMachineEvent,
): HeroCarouselMachineState {
  switch (event.type) {
    case "slide/next":
      return { ...state, index: wrap(state.index + 1, event.count) };
    case "slide/prev":
      return { ...state, index: wrap(state.index - 1, event.count) };
    case "slide/set":
      return { ...state, index: wrap(event.index, event.count) };
    case "pause":
      return { ...state, paused: true };
    case "resume":
      return { ...state, paused: false };
    case "load/ready":
      return { ...state, status: "ready" };
  }
}

/**
 * Paginated rail index machine — sf-091. Pure.
 *
 * The rail's dots, arrows and drag all produce the same event: "land on this
 * page". Keeping that one number in a reducer means a drag during a pending
 * re-render cannot leave a stale index behind, and the DOM component stays a
 * painter. Rejected: a `useState` per rail, which would make the state rules
 * depend on which section happened to mount it.
 */
export interface RailIndexMachineState {
  index: number;
}

export type RailIndexMachineEvent =
  | { type: "rail/set"; index: number; count: number }
  | { type: "rail/step"; delta: number; count: number; loop: boolean };

export function initialRailIndexMachine(): RailIndexMachineState {
  return { index: 0 };
}

export function railIndexMachine(
  state: RailIndexMachineState,
  event: RailIndexMachineEvent,
): RailIndexMachineState {
  if (event.count <= 0) return state;
  // A dot is always in range; clamping the out-of-range case too keeps this
  // reducer identical to `resolveRail`, so a stale dot from a shorter list
  // can never jump to a different page.
  const next =
    event.type === "rail/set"
      ? Math.min(event.count - 1, Math.max(0, Math.trunc(event.index)))
      : railStep(state.index, event.count, event.delta, event.loop);
  return next === state.index ? state : { index: next };
}
