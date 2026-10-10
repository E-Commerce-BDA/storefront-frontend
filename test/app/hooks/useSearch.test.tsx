// @vitest-environment jsdom
/**
 * useSearch — debounce, min-2 gate, stale-kill, dept filter, error path.
 * Source stubbed (contract, not network); fake timers for determinism.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useSearch } from "@/app/hooks/useSearch";
import type { SearchResult, SearchSource } from "@/lib/search/source";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

const ROWS: SearchResult[] = [
  { id: "p1", name: "Ocean Linen Shirt", price: 48, image: "", category: "Shirts" },
  { id: "p2", name: "Raw Hem Trouser", price: 94, image: "", category: "Pants" },
];

function stubSource(impl?: (q: string) => Promise<SearchResult[]>): SearchSource & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    suggest: (q: string) => {
      calls.push(q);
      return impl ? impl(q) : Promise.resolve(ROWS);
    },
  };
}

describe("useSearch", () => {
  it("min-2 gate: short queries never hit the source", async () => {
    const src = stubSource();
    const { result } = renderHook(() => useSearch(src));
    act(() => {
      result.current.setQuery("a");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(src.calls).toEqual([]);
    expect(result.current.status).toBe("idle");
    expect(result.current.results).toEqual([]);
  });

  it("debounces rapid typing into one call with the latest query", async () => {
    const src = stubSource();
    const { result } = renderHook(() => useSearch(src));
    act(() => {
      result.current.setQuery("li");
    });
    act(() => {
      result.current.setQuery("lin");
    });
    act(() => {
      result.current.setQuery("line");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(src.calls).toEqual(["line"]);
    expect(result.current.status).toBe("done");
  });

  it("stale responses never overwrite (slow first, fast second)", async () => {
    let resolveFirst!: (v: SearchResult[]) => void;
    const src = stubSource((q) =>
      q === "slow-query"
        ? new Promise<SearchResult[]>((res) => {
            resolveFirst = res;
          })
        : Promise.resolve([ROWS[1]]),
    );
    const { result } = renderHook(() => useSearch(src));
    act(() => {
      result.current.setQuery("slow-query");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    act(() => {
      result.current.setQuery("fast");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    await act(async () => {
      resolveFirst([ROWS[0]]);
    });
    expect(result.current.results).toEqual([ROWS[1]]);
  });

  it("dept filters client-side; error path empties with status", async () => {
    const src = stubSource();
    const { result } = renderHook(() => useSearch(src));
    act(() => {
      result.current.setQuery("linen");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    act(() => {
      result.current.setDept("Pants");
    });
    expect(result.current.results).toEqual([ROWS[1]]);

    const failing: SearchSource = {
      suggest: () => Promise.reject(new Error("down")),
    };
    const r2 = renderHook(() => useSearch(failing));
    act(() => {
      r2.result.current.setQuery("linen");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(r2.result.current.status).toBe("error");
    expect(r2.result.current.results).toEqual([]);
  });
});
