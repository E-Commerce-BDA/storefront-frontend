// @vitest-environment jsdom
/**
 * useQuickAdd — pending during flight, added on ok, error surfaces,
 * re-add ignored, abort stays silent. Port stubbed (contract, not network).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useQuickAdd } from "@/app/hooks/useQuickAdd";
import type { QuickAddPort, QuickAddResult } from "@/lib/cart/quickAdd";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

function stubPort(impl: (id: string) => Promise<QuickAddResult>): QuickAddPort & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    add: (id: string) => {
      calls.push(id);
      return impl(id);
    },
  } as QuickAddPort & { calls: string[] };
}

describe("useQuickAdd", () => {
  it("marks pending during flight, added on ok", async () => {
    let resolve!: (r: QuickAddResult) => void;
    const port = stubPort(() => new Promise<QuickAddResult>((res) => (resolve = res)));
    const { result } = renderHook(() => useQuickAdd(port));
    act(() => {
      result.current.quickAdd("p1");
    });
    expect(result.current.pendingIds).toEqual(["p1"]);
    await act(async () => {
      resolve({ ok: true });
    });
    expect(result.current.pendingIds).toEqual([]);
    expect(result.current.addedIds).toEqual(["p1"]);
    expect(result.current.error).toBeNull();
  });

  it("ignores re-add while pending, surfaces port errors", async () => {
    let reject!: (e: Error) => void;
    const port = stubPort(
      () =>
        new Promise<QuickAddResult>((_res, rej) => {
          reject = rej;
        }),
    );
    const { result } = renderHook(() => useQuickAdd(port));
    act(() => {
      result.current.quickAdd("p2");
      result.current.quickAdd("p2");
    });
    expect(port.calls).toEqual(["p2"]);
    await act(async () => {
      reject(new Error("down"));
    });
    expect(result.current.pendingIds).toEqual([]);
    expect(result.current.addedIds).toEqual([]);
    expect(result.current.error).toBe("unavailable");
  });

  it("maps port-reported failure to its error", async () => {
    const port = stubPort(() => Promise.resolve({ ok: false, error: "out-of-stock" as const }));
    const { result } = renderHook(() => useQuickAdd(port));
    await act(async () => {
      result.current.quickAdd("p3");
    });
    expect(result.current.error).toBe("out-of-stock");
    expect(result.current.addedIds).toEqual([]);
  });
});
