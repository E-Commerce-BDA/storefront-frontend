/**
 * Shop chrome machines — sf-085. Pure.
 *
 * The prototype's ShopFilterDrawerMachine and ShopGridModeMachine are ported
 * as two explicit reducers. They stay separate because a filter drawer is a
 * disclosure and a grid mode is a value: merging them would let a grid event
 * close a drawer by accident. No generic factory — the event unions are the
 * contract the islands dispatch against.
 */

export type FilterDrawerFace = "closed" | "open";

export interface FilterDrawerMachineState {
  face: FilterDrawerFace;
}

export type FilterDrawerMachineEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" };

export function initialFilterDrawerMachine(): FilterDrawerMachineState {
  return { face: "closed" };
}

export function filterDrawerMachine(
  state: FilterDrawerMachineState,
  event: FilterDrawerMachineEvent,
): FilterDrawerMachineState {
  switch (event.type) {
    case "OPEN":
      return { face: "open" };
    case "CLOSE":
      return { face: "closed" };
    case "TOGGLE":
      return { face: state.face === "open" ? "closed" : "open" };
  }
}

export type GridMode = "two" | "one";

export interface GridModeMachineState {
  mode: GridMode;
}

export type GridModeMachineEvent =
  | { type: "SET_TWO" }
  | { type: "SET_ONE" }
  | { type: "TOGGLE" };

export function initialGridModeMachine(): GridModeMachineState {
  return { mode: "two" };
}

export function gridModeMachine(
  state: GridModeMachineState,
  event: GridModeMachineEvent,
): GridModeMachineState {
  switch (event.type) {
    case "SET_TWO":
      return { mode: "two" };
    case "SET_ONE":
      return { mode: "one" };
    case "TOGGLE":
      return { mode: state.mode === "two" ? "one" : "two" };
  }
}
