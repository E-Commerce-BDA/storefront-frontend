// @vitest-environment jsdom
/**
 * useSelectOptions — mount load, reload re-fires, stale-kill, abort
 * silence, error path. Port stubbed (contract, not network).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useSelectOptions } from "@/app/hooks/useSelectOptions";
import type { SelectOption, OptionsSource } from "@/lib/select/options";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

const ROWS: SelectOption[] = [
  { value: "us", label: "United States" },
  { value: "de", label: "Germany" },
];

function stubSource(impl?: () => Promise<SelectOption[]>): OptionsSource & { calls: number } {
  const stub = { calls: 0 } as OptionsSource & { calls: number };
  stub.list = () => {
    stub.calls++;
    return impl ? impl() : Promise.resolve(ROWS);
  };
  return stub;
}

describe("useSelectOptions", () => {
  it("loads on mount (loading → done with rows)", async () => {
    const src = stubSource();
    const { result } = renderHook(() => useSelectOptions(src));
    expect(result.current.status).toBe("loading");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.status).toBe("done");
    expect(result.current.options).toEqual(ROWS);
    expect(src.calls).toBe(1);
  });

  it("reload re-fires; stale responses never overwrite", async () => {
    const resolvers: Array<(r: SelectOption[]) => void> = [];
    const src = stubSource(
      () =>
        new Promise<SelectOption[]>((res) => {
          resolvers.push(res);
        }),
    );
    const { result } = renderHook(() => useSelectOptions(src));
    act(() => {
      result.current.reload();
    });
    expect(src.calls).toBe(2);
    await act(async () => {
      resolvers[1]([{ value: "new", label: "New" }]);
      resolvers[0]([{ value: "stale", label: "Stale" }]);
    });
    expect(result.current.options).toEqual([{ value: "new", label: "New" }]);
  });

  it("surfaces errors, keeps aborts silent", async () => {
    const failing = stubSource(() => Promise.reject(new Error("down")));
    const { result: r1 } = renderHook(() => useSelectOptions(failing));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(r1.current.status).toBe("error");
    expect(r1.current.options).toEqual([]);
    const aborting = stubSource(() => Promise.reject(new Error("aborted")));
    const { result: r2 } = renderHook(() => useSelectOptions(aborting));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    // Abort is silence (navigation away), not an error face.
    expect(r2.current.status).toBe("loading");
  });
});
