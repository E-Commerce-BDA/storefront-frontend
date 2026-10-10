import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui";
import type { SearchResult } from "@/lib/search/source";
import type { SearchStatus } from "@/app/hooks/useSearch";

/**
 * Dumb search sheet (overlay variant "sheet") — top slide-down panel.
 * Results, query, dept and active index arrive as props (hook-owned);
 * this file renders regions and fires callbacks. No fetch, no timers.
 */
export interface SearchSheetProps {
  query: string;
  results: SearchResult[];
  status?: SearchStatus;
  dept?: string;
  departments?: string[];
  placeholder?: string;
  activeIndex?: number;
  onQuery: (q: string) => void;
  onDept?: (d: string) => void;
  onActive?: (i: number) => void;
  onSelect?: (r: SearchResult) => void;
  onClose: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function SearchSheet({
  query,
  results,
  status = "idle",
  dept = "All",
  departments = ["All"],
  placeholder = "Search products…",
  activeIndex = 0,
  onQuery,
  onDept,
  onActive,
  onSelect,
  onClose,
  onCancel,
  className = "",
}: SearchSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showResults = query.trim().length >= 2;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function cycle(dir: 1 | -1) {
    if (results.length === 0) return;
    onActive?.((activeIndex + dir + results.length) % results.length);
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search products">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(10,37,64,0.5)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`sf-searchsheet ${className}`}>
        <div className="sf-searchsheet__row">
          <div className="sf-searchsheet__bar">
            <Icon name="search" size={18} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  cycle(1);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  cycle(-1);
                } else if (e.key === "Enter" && results[activeIndex]) {
                  onSelect?.(results[activeIndex]);
                }
              }}
              placeholder={placeholder}
              aria-label="Search products"
              autoComplete="off"
            />
          </div>
          <button type="button" className="sf-searchsheet__cancel" onClick={onCancel ?? onClose}>
            Cancel
          </button>
        </div>
        <div className="sf-searchsheet__depts" role="group" aria-label="Department">
          <span className="sf-searchsheet__depts-label">Department:</span>
          {departments.map((d) => (
            <button
              key={d}
              type="button"
              data-active={d === dept}
              onClick={() => onDept?.(d)}
              aria-pressed={d === dept}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="sf-searchsheet__meta">
          <span>
            Instant Suggestions ({showResults ? results.length : 0})
          </span>
          <span className="sf-searchsheet__hint">Use Arrow keys to cycle products</span>
        </div>
        {status === "loading" ? (
          <p className="sf-searchsheet__empty" role="status">
            Searching…
          </p>
        ) : !showResults ? (
          <p className="sf-searchsheet__empty">Type 2+ characters to search the catalog.</p>
        ) : results.length === 0 ? (
          <p className="sf-searchsheet__empty" role="status">
            No matches for “{query.trim()}”.
          </p>
        ) : (
          <div className="sf-searchsheet__cards">
            {results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                data-active={i === activeIndex}
                onClick={() => onSelect?.(r)}
                aria-label={`${r.name}, $${r.price}`}
              >
                <span className="sf-searchsheet__thumb" aria-hidden="true">
                  {r.name.charAt(0)}
                </span>
                <span className="sf-searchsheet__name">{r.name}</span>
                <span className="sf-searchsheet__pricerow">
                  <span>${r.price}</span>
                  {r.tag && <span className="sf-searchsheet__tag">{r.tag}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
