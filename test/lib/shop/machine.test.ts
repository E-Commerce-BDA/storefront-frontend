import { describe, expect, it } from "vitest";
import {
  filterDrawerMachine,
  gridModeMachine,
  initialFilterDrawerMachine,
  initialGridModeMachine,
} from "@/lib/shop/machine";
import { cartViewMachine, initialCartViewMachine } from "@/lib/cart/machine";

describe("filter drawer machine", () => {
  it("starts closed and honours OPEN/CLOSE/TOGGLE", () => {
    const closed = initialFilterDrawerMachine();
    expect(closed.face).toBe("closed");
    const opened = filterDrawerMachine(closed, { type: "OPEN" });
    expect(opened.face).toBe("open");
    expect(filterDrawerMachine(opened, { type: "OPEN" }).face).toBe("open");
    expect(filterDrawerMachine(opened, { type: "CLOSE" }).face).toBe("closed");
    expect(filterDrawerMachine(opened, { type: "TOGGLE" }).face).toBe("closed");
    expect(filterDrawerMachine(closed, { type: "TOGGLE" }).face).toBe("open");
  });
});

describe("grid mode machine", () => {
  it("starts at two columns and clamps to the two declared modes", () => {
    const two = initialGridModeMachine();
    const one = gridModeMachine(two, { type: "TOGGLE" });
    expect(one.mode).toBe("one");
    expect(gridModeMachine(one, { type: "SET_ONE" }).mode).toBe("one");
    expect(gridModeMachine(one, { type: "SET_TWO" }).mode).toBe("two");
    expect(gridModeMachine(two, { type: "SET_TWO" }).mode).toBe("two");
  });
});

describe("cart view machine", () => {
  it("starts as a table and toggles to cards and back", () => {
    const table = initialCartViewMachine();
    const cards = cartViewMachine(table, { type: "TOGGLE" });
    expect(cards.mode).toBe("cards");
    expect(cartViewMachine(cards, { type: "TOGGLE" }).mode).toBe("table");
    expect(cartViewMachine(cards, { type: "SET_TABLE" }).mode).toBe("table");
    expect(cartViewMachine(table, { type: "SET_CARDS" }).mode).toBe("cards");
  });
});
