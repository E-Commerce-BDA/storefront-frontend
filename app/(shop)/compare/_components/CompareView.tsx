"use client";

/**
 * Compare view island — sf-094. The checkbox is the only state here, held in
 * the pure compare-view machine; the table stays dumb and receives the resulting
 * face as a prop.
 */
import { useReducer } from "react";
import CompareTable from "@/components/commerce/CompareTable";
import type { ProductCardData } from "@/lib/commerce/productCard";
import {
  compareViewMachine,
  initialCompareViewMachine,
} from "@/lib/commerce/compare";

export interface CompareViewProps {
  items: ProductCardData[];
  className?: string;
}

export default function CompareView({ items, className = "" }: CompareViewProps) {
  const [{ face }, dispatch] = useReducer(
    compareViewMachine,
    undefined,
    initialCompareViewMachine,
  );
  const differencesOnly = face === "differences";

  return (
    <div className={`sf-compare-view ${className}`} data-face={face}>
      <label className="sf-compare-view__toggle">
        <input
          type="checkbox"
          checked={differencesOnly}
          onChange={(event) =>
            dispatch({
              type: "face/set",
              face: event.target.checked ? "differences" : "all",
            })
          }
        />
        Differences only
      </label>
      <CompareTable items={items} differencesOnly={differencesOnly} />
    </div>
  );
}
