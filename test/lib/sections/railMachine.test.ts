/**
 * sf-091 resolver-unit tier — the rail index reducer owns exactly one number.
 * Everything that changes it (dot, arrow, drag) funnels through one event, so a
 * wrap at the end and a clamp on an empty list are decided here, not in the DOM.
 */
import { describe, expect, it } from "vitest";
import {
  initialRailIndexMachine,
  railIndexMachine,
} from "@/lib/sections/machine";

describe("railIndexMachine", () => {
  it("starts on the first page and ignores writes to an empty rail", () => {
    const initial = initialRailIndexMachine();
    expect(initial).toEqual({ index: 0 });
    expect(
      railIndexMachine(initial, { type: "rail/set", index: 4, count: 0 }),
    ).toBe(initial);
  });

  it("clamps a dot selection to the available pages", () => {
    expect(
      railIndexMachine({ index: 0 }, { type: "rail/set", index: 99, count: 3 }).index,
    ).toBe(2);
    expect(
      railIndexMachine({ index: 2 }, { type: "rail/set", index: -7, count: 3 }).index,
    ).toBe(0);
  });

  it("wraps in a loop and stops at the ends when the loop is off", () => {
    expect(
      railIndexMachine({ index: 2 }, { type: "rail/step", delta: 1, count: 3, loop: true }).index,
    ).toBe(0);
    expect(
      railIndexMachine({ index: 0 }, { type: "rail/step", delta: -1, count: 3, loop: false }).index,
    ).toBe(0);
    expect(
      railIndexMachine({ index: 1 }, { type: "rail/step", delta: 1, count: 3, loop: false }).index,
    ).toBe(2);
  });

  it("keeps the same object when a step changes nothing", () => {
    const state = { index: 0 };
    expect(
      railIndexMachine(state, { type: "rail/step", delta: -1, count: 1, loop: true }),
    ).toBe(state);
  });
});
