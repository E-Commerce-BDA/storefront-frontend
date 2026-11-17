import { Select } from "@/components/ui";
import { CATALOG_SORTS, type CatalogSort } from "@/lib/catalog/schemas";

/**
 * Dumb sort control — sf-054.
 *
 * A native select so the page stays server-renderable and keyboard-accessible;
 * the owner writes the choice to `?sort=` and catalog-svc does the ordering.
 * Nothing is reordered in the browser.
 */
export interface SortSelectProps {
  value: CatalogSort | undefined;
  onChange?: (value: CatalogSort | undefined) => void;
  className?: string;
}

const LABELS: Record<CatalogSort, string> = {
  created_desc: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name_asc: "Name: A–Z",
  rating_desc: "Top rated",
  popularity_desc: "Most popular",
};

export default function SortSelect({
  value,
  onChange,
  className = "",
}: SortSelectProps) {
  return (
    <div className={`sf-sort ${className}`}>
      <Select
        label="Sort by"
        value={value ?? "created_desc"}
        options={CATALOG_SORTS.map((sort) => ({
          value: sort,
          label: LABELS[sort],
        }))}
        onChange={(raw) =>
          onChange?.(
            CATALOG_SORTS.includes(raw as CatalogSort)
              ? (raw as CatalogSort)
              : undefined,
          )
        }
      />
    </div>
  );
}
