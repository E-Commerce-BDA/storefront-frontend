"use client";

/**
 * Visit-memory recent searches — capped most-recent-first list with
 * add-on-select and clear-all. No port (no endpoint serves memory) and no
 * persistence: the localStorage ban makes in-memory the only legal home,
 * so recents die with the visit by construction.
 */
import { useState } from "react";

export interface UseRecentSearches {
  recent: string[];
  push: (term: string) => void;
  clear: () => void;
}

export function useRecentSearches(limit = 5): UseRecentSearches {
  // Clamp once (1–10): a 0-cap would swallow every push, unbounded growth
  // is a leak. Non-finite input is a miss (default renders).
  const cap = Number.isFinite(limit) ? Math.min(10, Math.max(1, Math.round(limit))) : 5;
  const [recent, setRecent] = useState<string[]>([]);

  const push = (term: string) => {
    const t = term.trim();
    if (t === "") return;
    setRecent((prev) => [t, ...prev.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, cap));
  };
  const clear = () => setRecent([]);

  return { recent, push, clear };
}
