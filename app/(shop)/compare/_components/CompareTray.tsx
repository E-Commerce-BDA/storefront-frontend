"use client";

/** Compare tray face — sf-055 (A3.7). Session-only; the URL is shareable. */
import { useCompare } from "@/app/_components/CompareProvider";

export default function CompareTray() {
  const compare = useCompare();
  if (compare.count === 0) return null;

  return (
    <aside
      className="sf-compare-tray"
      aria-label="Compare tray"
      data-count={compare.count}
      data-full={compare.full ? "true" : "false"}
    >
      <div className="sf-compare-tray__head">
        <span className="sf-compare-tray__count">
          {compare.count} selected
        </span>
        <button type="button" className="sf-compare-tray__clear" onClick={compare.clear}>
          Clear
        </button>
      </div>
      <a className="sf-compare-tray__go" href={compare.href} data-disabled={!compare.full && compare.count < 2}>
        Compare {compare.count} {compare.count === 1 ? "product" : "products"}
      </a>
      {compare.notice !== null ? (
        <p className="sf-compare-tray__notice" role="status">{compare.notice}</p>
      ) : null}
    </aside>
  );
}
