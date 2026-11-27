/**
 * Hero carousel machine — sf-085. Pure.
 *
 * The prototype kept the slide index and the pause flag next to the timer, so
 * a hover could leave a stale index behind after a re-render. Here both live
 * in one reducer and the interval is owned by the island: the machine decides
 * which slide is current, never when time passes.
 */
import type { Status } from "@/lib/machine/status";

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
