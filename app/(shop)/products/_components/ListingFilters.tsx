"use client";

/**
 * Listing filter/sort island — sf-054.
 *
 * The URL is the only state container: the island takes the resolved selection
 * from the route as props and pushes a new URL through the router. Catalog does
 * the ordering, the RSC re-renders, and the dumb rail below owns no state of its
 * own. Changing any filter drops the cursor — a cursor belongs to one result
 * set, so reusing it after a filter change would skip rows.
 */

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import FilterRail, {
  type FilterRailSelection,
} from "@/components/commerce/FilterRail";
import SortSelect from "@/components/commerce/SortSelect";
import type { CategoryNode } from "@/lib/catalog/facets";
import { buildListingQuery } from "@/lib/catalog/listing";
import type { CatalogSort } from "@/lib/catalog/schemas";

export interface ListingFiltersProps {
  categories: readonly CategoryNode[];
  brands: readonly { slug: string; name: string }[];
  tags: readonly string[];
  priceBounds: { min: number | null; max: number | null };
  selected: FilterRailSelection & { q?: string; sort?: CatalogSort };
}

export default function ListingFilters({
  categories,
  brands,
  tags,
  priceBounds,
  selected,
}: ListingFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  // sf-081: the rail is a disclosure now. The URL still owns every filter
  // value; this flag only owns how much of the rail is on screen.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const go = useCallback(
    (next: Partial<FilterRailSelection> & { sort?: CatalogSort }) => {
      const merged = { ...selected, ...next };
      router.push(
        `${pathname}${buildListingQuery({
          categorySlug: merged.categorySlug,
          brandSlug: merged.brandSlug,
          q: merged.q,
          sort: merged.sort,
          tags: merged.tags,
          discounted: merged.discounted,
          minPrice: merged.minPrice,
          maxPrice: merged.maxPrice,
        })}`,
      );
    },
    [pathname, router, selected],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const current = selected.tags ?? [];
      go({
        tags: current.includes(tag)
          ? current.filter((item) => item !== tag)
          : [...current, tag],
      });
    },
    [go, selected.tags],
  );

  return (
    <div className="sf-listing-controls">
      <SortSelect value={selected.sort} onChange={(sort) => go({ sort })} />
      <FilterRail
        categories={categories}
        brands={brands}
        tags={tags}
        priceBounds={priceBounds}
        selected={selected}
        open={filtersOpen}
        onToggle={() => setFiltersOpen((open) => !open)}
        onCategoryChange={(categorySlug) => go({ categorySlug })}
        onBrandChange={(brandSlug) => go({ brandSlug })}
        onTagToggle={toggleTag}
        onDiscountedChange={(discounted) => go({ discounted })}
        onMinPriceChange={(minPrice) => go({ minPrice })}
        onMaxPriceChange={(maxPrice) => go({ maxPrice })}
        onReset={() =>
          go({
            categorySlug: undefined,
            brandSlug: undefined,
            tags: [],
            discounted: false,
            minPrice: undefined,
            maxPrice: undefined,
          })
        }
      />
    </div>
  );
}
