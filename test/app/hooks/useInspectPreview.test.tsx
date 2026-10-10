// @vitest-environment jsdom
/**
 * useInspectPreview — null renders nothing, hover sweeps abort (only the
 * latest inspect lands), unknown ids + errors clear to null.
 * Source stubbed (contract, not network); fake timers for determinism.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useInspectPreview } from "@/app/hooks/useInspectPreview";
import { createDemoPdpSource } from "@/lib/search/demoPdp";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe("useInspectPreview", () => {
  it("null id stays idle with null detail (no preview without a target)", async () => {
    const { result } = renderHook(() => useInspectPreview(createDemoPdpSource(), null));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.detail).toBeNull();
  });

  it("loads detail with skeleton status, then done", async () => {
    const { result } = renderHook(() => useInspectPreview(createDemoPdpSource(), "p1"));
    expect(result.current.status).toBe("loading");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.status).toBe("done");
    expect(result.current.detail?.name).toBe("Ocean Linen Shirt");
    expect(result.current.detail?.sizes).toContain("M");
  });

  it("hover sweeps abort — only the latest inspect lands", async () => {
    const { result, rerender } = renderHook(({ id }: { id: string | null }) => useInspectPreview(createDemoPdpSource(), id), {
      initialProps: { id: "p1" as string | null },
    });
    rerender({ id: "p2" });
    rerender({ id: "p3" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.detail?.id).toBe("p3");
  });

  it("unknown ids clear to null (absent data, absent preview)", async () => {
    const { result } = renderHook(() => useInspectPreview(createDemoPdpSource(), "nope"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.status).toBe("done");
    expect(result.current.detail).toBeNull();
  });
});
