/**
 * Presentation helpers for the CMS blocks — sf-060.
 *
 * Two small rules with real consequences: a date must never reach a shopper as
 * the database's ISO string, and a star row must only paint ratings the contract
 * allows. Both live in a lib file precisely so the blocks can stay painters.
 */
import { describe, expect, it } from "vitest";
import { formatMonthYear, starCells, STAR_COUNT } from "@/lib/sections/present";

describe("formatMonthYear", () => {
  it("renders a month and a year, never the raw timestamp", () => {
    expect(formatMonthYear("2026-11-04T00:00:00.000Z")).toBe("Nov 2026");
  });

  it("uses one fixed locale so the server's LANG cannot change the layout", () => {
    // The same instant must format identically however the process is started:
    // the assertion is the shape (short month + numeric year), not a locale guess.
    expect(formatMonthYear("2026-01-09T00:00:00.000Z")).toMatch(/^Jan 2026$/);
  });

  it("treats a missing, blank or unparseable date as no date", () => {
    expect(formatMonthYear(undefined)).toBeUndefined();
    expect(formatMonthYear(null)).toBeUndefined();
    expect(formatMonthYear("   ")).toBeUndefined();
    expect(formatMonthYear("not a date")).toBeUndefined();
  });
});

describe("starCells", () => {
  it("paints exactly five cells with the rating filled in", () => {
    expect(starCells(3)).toEqual([true, true, true, false, false]);
    expect(starCells(5)).toHaveLength(STAR_COUNT);
    expect(starCells(1)).toEqual([true, false, false, false, false]);
  });

  it("paints no row at all for an absent or out-of-range rating", () => {
    expect(starCells(undefined)).toBeUndefined();
    expect(starCells(0)).toBeUndefined();
    expect(starCells(6)).toBeUndefined();
    expect(starCells(Number.NaN)).toBeUndefined();
  });
});
