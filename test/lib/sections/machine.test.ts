import { describe, expect, it } from "vitest";
import { heroCarouselMachine, initialHeroCarouselMachine } from "@/lib/sections/machine";

describe("hero carousel machine", () => {
  it("wraps next/prev in both directions and holds a zero-count slide at zero", () => {
    const zero = initialHeroCarouselMachine();
    expect(zero.index).toBe(0);
    expect(heroCarouselMachine(zero, { type: "slide/prev", count: 3 }).index).toBe(2);
    const first = heroCarouselMachine(zero, { type: "slide/next", count: 3 });
    expect(first.index).toBe(1);
    expect(heroCarouselMachine(first, { type: "slide/set", index: 7, count: 3 }).index).toBe(1);
    expect(heroCarouselMachine(first, { type: "slide/next", count: 0 }).index).toBe(0);
  });

  it("owns pause independently of the index and reports ready", () => {
    const paused = heroCarouselMachine(initialHeroCarouselMachine(), { type: "pause" });
    expect(paused.paused).toBe(true);
    expect(paused.index).toBe(0);
    const stepped = heroCarouselMachine(paused, { type: "slide/next", count: 2 });
    expect(stepped.paused).toBe(true);
    expect(heroCarouselMachine(stepped, { type: "resume" }).paused).toBe(false);
    expect(heroCarouselMachine(stepped, { type: "load/ready" }).status).toBe("ready");
  });
});
