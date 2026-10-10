import { Icon } from "@/components/ui";
import type { SearchResult } from "@/lib/search/source";

/**
 * Dumb inspect list region — department pills, scrollable result rows,
 * inspect affordance, keyboard hint. Hover AND keyboard both drive
 * `onInspect` (same target, two pointers — hover intent, arrows precise).
 * Selection state (`activeId`) arrives as a prop; this file keeps none.
 * props → JSX. No fetch, no timers.
 */
export interface SearchInspectListProps {
  results: SearchResult[];
  departments?: string[];
  dept?: string;
  /** Currently inspected product id (hover/keyboard target). */
  activeId?: string | null;
  onDept?: (d: string) => void;
  onInspect?: (id: string) => void;
  onSelect?: (r: SearchResult) => void;
  className?: string;
}

export default function SearchInspectList({
  results,
  departments = ["All"],
  dept = "All",
  activeId = null,
  onDept,
  onInspect,
  onSelect,
  className = "",
}: SearchInspectListProps) {
  return (
    <div className={`sf-inspect__list ${className}`}>
      <div className="sf-inspect__depts" role="group" aria-label="Department">
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
      {results.length === 0 ? (
        <p className="sf-inspect__list-empty" role="status">
          No products match — try another department or query.
        </p>
      ) : (
        <ul className="sf-inspect__rows">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="sf-inspect__row"
                data-active={r.id === activeId}
                onMouseEnter={() => onInspect?.(r.id)}
                onFocus={() => onInspect?.(r.id)}
                onClick={() => {
                  onInspect?.(r.id);
                  onSelect?.(r);
                }}
                aria-label={`${r.name}, $${r.price}`}
              >
                <span className="sf-inspect__thumb" aria-hidden="true">
                  {r.image !== "" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" />
                  ) : (
                    r.name.charAt(0)
                  )}
                </span>
                <span className="sf-inspect__rowtext">
                  <span className="sf-inspect__rowname">{r.name}</span>
                  <span className="sf-inspect__rowmeta">
                    ${r.price}
                    {typeof r.rating === "number" && <span className="sf-inspect__rating"> ★ {r.rating}</span>}
                  </span>
                </span>
                <span className="sf-inspect__inspect" aria-hidden="true">
                  Inspect <Icon name="arrow-right" size={12} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="sf-inspect__hint">Hover or use ↑↓ to inspect</p>
    </div>
  );
}
