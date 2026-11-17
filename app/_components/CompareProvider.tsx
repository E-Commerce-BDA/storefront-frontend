"use client";

/**
 * Compare tray — sf-055 (A3.7)
 *
 * Session-only in-memory state for the tray (no localStorage — AGENTS.md §5
 * hard-bans it). The shareable artifact is `/compare?ids=`, not the tray. One
 * provider in the root layout gives cards, the PDP and the tray one truth.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addCompareId,
  COMPARE_LIMIT,
  compareQuery,
  parseCompareQuery,
  removeCompareId,
} from "@/lib/commerce/compare";

export interface CompareContextValue {
  ids: string[];
  count: number;
  full: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  clear: () => void;
  /** Printable reason when the tray refused an add (cap reached). */
  notice: string | null;
  dismissNotice: () => void;
  href: string;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  // Seed the tray from ?ids= so a shared /compare link can be edited in place.
  const [ids, setIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : parseCompareQuery(new URLSearchParams(window.location.search).get("ids")),
  );
  const [notice, setNotice] = useState<string | null>(null);

  const toggle = useCallback((productId: string) => {
    setNotice(null);
    setIds((prev) => {
      if (prev.includes(productId)) return removeCompareId(prev, productId);
      const next = addCompareId(prev, productId);
      if (next.full) setNotice(`You can compare up to ${COMPARE_LIMIT} products.`);
      return next.ids;
    });
  }, []);

  const value = useMemo<CompareContextValue>(
    () => ({
      ids,
      count: ids.length,
      full: ids.length >= COMPARE_LIMIT,
      has: (productId) => ids.includes(productId),
      toggle,
      clear: () => {
        setIds([]);
        setNotice(null);
      },
      notice,
      dismissNotice: () => setNotice(null),
      href: `/compare${compareQuery(ids)}`,
    }),
    [ids, notice, toggle],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (ctx === null) {
    throw new Error("useCompare must be used inside CompareProvider");
  }
  return ctx;
}
