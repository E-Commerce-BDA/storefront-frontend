// @vitest-environment jsdom
/**
 * useRecentSearches — most-recent-first, case-insensitive dedupe, cap,
 * empty-guard, clear. Pure memory: unmount wipes (visit-scoped by design).
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useRecentSearches } from "@/app/hooks/useRecentSearches";

afterEach(cleanup);

describe("useRecentSearches", () => {
  it("pushes most-recent-first, dedupes case-insensitively, guards empties", () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.push("ocean linen shirt");
      result.current.push("  ");
      result.current.push("Waterproof Boots");
      result.current.push("OCEAN LINEN SHIRT");
    });
    expect(result.current.recent).toEqual(["OCEAN LINEN SHIRT", "Waterproof Boots"]);
  });

  it("caps the list and clears all", () => {
    const { result } = renderHook(() => useRecentSearches(2));
    act(() => {
      result.current.push("a");
      result.current.push("b");
      result.current.push("c");
    });
    expect(result.current.recent).toEqual(["c", "b"]);
    act(() => {
      result.current.clear();
    });
    expect(result.current.recent).toEqual([]);
  });
});
