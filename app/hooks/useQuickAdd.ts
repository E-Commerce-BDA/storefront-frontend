"use client";

/**
 * Port-injected quick-add — owns pending/added/error id sets; knows
 * nothing about endpoints. Re-add while pending is ignored (double taps
 * must not double-add); unmount aborts all flights. PDP reuses this hook
 * later — palette stays fully controlled via addedIds + onQuickAdd.
 */
import { useEffect, useRef, useState } from "react";
import type { QuickAddError, QuickAddPort, QuickAddResult } from "@/lib/cart/quickAdd";

export interface UseQuickAdd {
  addedIds: string[];
  pendingIds: string[];
  error: QuickAddError | null;
  quickAdd: (productId: string) => void;
  reset: () => void;
}

export function useQuickAdd(port: QuickAddPort): UseQuickAdd {
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [error, setError] = useState<QuickAddError | null>(null);
  const flights = useRef(new Map<string, AbortController>());

  // Unmount aborts every flight (stale resolves must never land).
  useEffect(() => {
    const open = flights.current;
    return () => {
      open.forEach((c) => c.abort());
      open.clear();
    };
  }, []);

  const dropPending = (id: string) => {
    flights.current.delete(id);
    setPendingIds((prev) => prev.filter((p) => p !== id));
  };

  const quickAdd = (productId: string) => {
    if (flights.current.has(productId)) return;
    const controller = new AbortController();
    flights.current.set(productId, controller);
    setPendingIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    port
      .add(productId, controller.signal)
      .then((r: QuickAddResult) => {
        dropPending(productId);
        if (r.ok) {
          setAddedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
        } else {
          setError(r.error ?? "unavailable");
        }
      })
      .catch((err: unknown) => {
        dropPending(productId);
        // Aborts are silence (user navigated away); real failures surface.
        if (!(err instanceof Error && err.message === "aborted")) setError("unavailable");
      });
  };

  const reset = () => {
    flights.current.forEach((c) => c.abort());
    flights.current.clear();
    setAddedIds([]);
    setPendingIds([]);
    setError(null);
  };

  return { addedIds, pendingIds, error, quickAdd, reset };
}
