"use client";

/**
 * Source-injected search hook — locked discipline (300ms debounce, min-2
 * gate, AbortController stale-kill). Owns interaction state (query, dept,
 * results, status); knows nothing about endpoints — `source` is injected,
 * so demo today swaps to search-svc tomorrow at the call site (one line).
 */
import { useEffect, useRef, useState } from "react";
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
}

export function useSearch(source: SearchSource, initialDept = "All"): UseSearch {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState(initialDept);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const seq = useRef(0);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < SEARCH_MIN_CHARS) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const id = ++seq.current;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      source
        .suggest(needle, controller.signal)
        .then((rows) => {
          // Stale responses never overwrite: only the latest request lands.
          if (seq.current === id) {
            setResults(rows);
            setStatus("done");
          }
        })
        .catch((err: unknown) => {
          if (seq.current === id && !(err instanceof Error && err.message === "aborted")) {
            setResults([]);
            setStatus("error");
          }
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, source]);

  const visible = dept === "All" ? results : results.filter((r) => r.category === dept);

  return { query, setQuery, dept, setDept, results: visible, status };
}
