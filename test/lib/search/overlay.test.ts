import { describe, expect, it } from "vitest";
import { initialSearchMachine, searchMachine, searchOverlayFace } from "@/lib/search/machine";

describe("search overlay face", () => {
  it("maps idle, results and empty from the same state the hook renders", () => {
    const idle = initialSearchMachine<string>();
    expect(searchOverlayFace(idle)).toBe("idle");
    expect(searchOverlayFace(searchMachine(idle, { type: "request/start", seq: 1 }))).toBe("idle");
    const typed = searchMachine(idle, { type: "type", query: "boot" });
    expect(searchOverlayFace(searchMachine(typed, { type: "request/success", seq: typed.seq, results: ["a"] }))).toBe("results");
    expect(searchOverlayFace(searchMachine(typed, { type: "request/success", seq: typed.seq, results: [] }))).toBe("empty");
    expect(searchOverlayFace(searchMachine(typed, { type: "results/clear" }))).toBe("idle");
  });
});
