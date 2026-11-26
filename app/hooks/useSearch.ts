"use client";

/**
 * Source-injected search hook — locked discipline (300ms debounce, min-2
 * gate, AbortController stale-kill). Interaction state lives in the pure
 * searchMachine: the hook translates source callbacks into events and maps the
 * machine's total status back to the four faces the overlays render.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { initialSearchMachine, searchMachine } from "@/lib/search/machine";
import type { SearchResult, SearchSource } from "@/lib/search/source";

export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_CHARS = 2;

export type SearchStatus = "idle" | "loading" | "done" | "error";

export interface UseSearch {
  query: string;
  setQuery: (q: string) => void;
  dept: string;
  setDept: (d: string) => void;
  results: SearchResult[];
  status: SearchStatus;
  activeIndex: number;
  setActive: (index: number) => void;
}

export function useSearch(source: SearchSource, initialDept = "All"): UseSearch {
  // sf-080: one reducer owns query/rows/status/active row. The old four
  // useStates could publish a stale answer after a newer query had won.
  const [machine, dispatch] = useReducer(searchMachine, undefined, () =>
    initialSearchMachine<SearchResult>(),
  );
  const [dept, setDept] = useState(initialDept);
  const seq = useRef(0);
  const { query, results, status: face, activeIndex } = machine;

  const setQuery = useCallback((q: string) => dispatch({ type: "type", query: q }), []);
  const setActive = useCallback((index: number) => dispatch({ type: "active/set", index }), []);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < SEARCH_MIN_CHARS) {
      dispatch({ type: "results/clear" });
      return;
    }
    // `type` already advanced the machine's sequence; a request must be newer.
    const id = machine.seq + 1;
    seq.current = id;
    dispatch({ type: "request/start", seq: id });
    const controller = new AbortController();
    const timer = setTimeout(() => {
      source
        .suggest(needle, controller.signal)
        .then((rows) => {
          if (seq.current === id) dispatch({ type: "request/success", seq: id, results: rows });
        })
        .catch((err: unknown) => {
          // A8: an abort (or a superseded sequence) is silence, never an error
          // face. DOMException("AbortError") is not an `Error` with a message.
          const aborted =
            controller.signal.aborted ||
            (err instanceof Error &&
              (err.name === "AbortError" || err.message === "aborted"));
          if (seq.current === id && !aborted) dispatch({ type: "request/error", seq: id });
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
      dispatch({ type: "request/abort", seq: id });
    };
    // machine.seq is intentionally not a dependency: `type` advances it, and
    // re-running here would issue a duplicate request for the same query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, source]);

  const visible = dept === "All" ? results : results.filter((r) => r.category === dept);
  const status: SearchStatus =
    face === "ready" || face === "empty" || face === "success" ? "done" : face;

  return { query, setQuery, dept, setDept, results: visible, status, activeIndex, setActive };
}
