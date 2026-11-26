"use client";

/**
 * Compare tray — sf-055 (A3.7), sf-074 (A18).
 *
 * Session-only in-memory state for the tray (no localStorage — AGENTS.md §5
 * hard-bans it). The shareable artifact is `/compare?ids=`, not the tray. One
 * provider in the root layout gives cards, the PDP and the tray one truth.
 *
 * A18: the query is re-seeded on navigation (not only at mount), and the
 * toggle reducer has no side effect — the cap notice is returned as state.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { COMPARE_LIMIT, compareQuery, parseCompareQuery } from "@/lib/commerce/compare";
import { compareMachine, initialCompareMachine } from "@/lib/compare/machine";

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
  const [machine, dispatch] = useReducer(compareMachine, undefined, initialCompareMachine);
  const { ids, notice } = machine;
  const pathname = usePathname();

  useEffect(() => {
    // Read the query from the browser here, not via useSearchParams in the
    // root layout (which would opt every route into a Suspense boundary).
    const params = new URLSearchParams(
      typeof window === "undefined" ? "" : window.location.search,
    );
    dispatch({
      type: "seed",
      pathname: `${pathname}?${params.toString()}`,
      ids: parseCompareQuery(params.get("ids")),
    });
  }, [pathname]);

  const value = useMemo<CompareContextValue>(
    () => ({
      ids,
      count: ids.length,
      full: ids.length >= COMPARE_LIMIT,
      has: (productId) => ids.includes(productId),
      toggle: (productId) => dispatch({ type: "toggle", productId }),
      clear: () => dispatch({ type: "clear" }),
      notice,
      dismissNotice: () => dispatch({ type: "notice/dismiss" }),
      href: `/compare${compareQuery(ids)}`,
    }),
    [ids, notice],
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
