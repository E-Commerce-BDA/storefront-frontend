"use client";

/**
 * Listing shell — `/products` — sf-092.
 *
 * The URL is still the only state container for *filters and sort*; this shell
 * owns two disclosure/value machines that the URL does not express: the mobile
 * filter drawer and the mobile column count. Keeping both in one island is the
 * point — the grid island downstream takes an explicit column count, so the
 * toggle has to reach it through a real prop instead of a CSS override of the
 * grid's inline vars.
 *
 * Rejected alternative: two sibling islands with the toggle state duplicated
 * in each. That would make the chips and the grid disagree after a sort change.
 */
import { useCallback, useReducer } from "react";
import { usePathname, useRouter } from "next/navigation";
import FilterRail, {
  type FilterRailSelection,
} from "@/components/commerce/FilterRail";
import { Button, FilterDrawer, ShopToolbar } from "@/components/ui";
import type { CategoryNode } from "@/lib/catalog/facets";
import type { ProductCardData } from "@/lib/commerce/productCard";
import { buildListingQuery } from "@/lib/catalog/listing";
import type { CatalogSort } from "@/lib/catalog/schemas";
import {
  filterDrawerMachine,
  gridModeMachine,
  initialFilterDrawerMachine,
  initialGridModeMachine,
} from "@/lib/shop/machine";
import ListingGridIsland from "./ListingGridIsland";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "created_desc", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "rating_desc", label: "Top Rated" },
  { value: "popularity_desc", label: "Most Popular" },
] as const;

export interface ListingShellProps {
  categories: readonly CategoryNode[];
  brands: readonly { slug: string; name: string }[];
  tags: readonly string[];
  priceBounds: { min: number | null; max: number | null };
  selected: FilterRailSelection & { q?: string; sort?: CatalogSort };
  initialItems: ProductCardData[];
  initialCursor: string | null;
  queryKey: string;
  columns?: React.ComponentProps<typeof ListingGridIsland>["columns"];
  themeFallback?: React.ComponentProps<typeof ListingGridIsland>["themeFallback"];
  tones?: React.ComponentProps<typeof ListingGridIsland>["tones"];
  empty?: React.ReactNode;
  resultCount?: number;
}

export default function ListingShell({
  categories,
  brands,
  tags,
  priceBounds,
  selected,
  initialItems,
  initialCursor,
  queryKey,
  columns,
  themeFallback,
  tones,
  empty,
  resultCount,
}: ListingShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, drawerDispatch] = useReducer(
    filterDrawerMachine,
    undefined,
    initialFilterDrawerMachine,
  );
  const [grid, gridDispatch] = useReducer(
    gridModeMachine,
    undefined,
    initialGridModeMachine,
  );
  const mode = grid.mode;

  const go = useCallback(
    (next: Partial<FilterRailSelection> & { sort?: CatalogSort; q?: string }) => {
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

  const reset = useCallback(
    () =>
      go({
        categorySlug: undefined,
        brandSlug: undefined,
        tags: [],
        discounted: false,
        minPrice: undefined,
        maxPrice: undefined,
      }),
    [go],
  );

  const railProps = {
    categories,
    brands,
    tags,
    priceBounds,
    selected,
    onCategoryChange: (categorySlug: string | undefined) => go({ categorySlug }),
    onBrandChange: (brandSlug: string | undefined) => go({ brandSlug }),
    onTagToggle: toggleTag,
    onDiscountedChange: (discounted: boolean) => go({ discounted }),
    onMinPriceChange: (minPrice: number | undefined) => go({ minPrice }),
    onMaxPriceChange: (maxPrice: number | undefined) => go({ maxPrice }),
    onReset: reset,
  };

  const activeFilters: { label: string; onClear: () => void }[] = [];
  if (selected.q !== undefined) {
    activeFilters.push({ label: `Search: ${selected.q}`, onClear: () => go({ q: undefined }) });
  }
  if (selected.categorySlug !== undefined) {
    activeFilters.push({
      label: `Category: ${selected.categorySlug}`,
      onClear: () => go({ categorySlug: undefined }),
    });
  }
  if (selected.brandSlug !== undefined) {
    activeFilters.push({
      label: `Brand: ${selected.brandSlug}`,
      onClear: () => go({ brandSlug: undefined }),
    });
  }
  for (const tag of selected.tags ?? []) {
    activeFilters.push({ label: tag, onClear: () => toggleTag(tag) });
  }
  if (selected.discounted === true) {
    activeFilters.push({ label: "On sale", onClear: () => go({ discounted: false }) });
  }
  if (selected.minPrice !== undefined) {
    activeFilters.push({
      label: `Min: $${selected.minPrice}`,
      onClear: () => go({ minPrice: undefined }),
    });
  }
  if (selected.maxPrice !== undefined) {
    activeFilters.push({
      label: `Max: $${selected.maxPrice}`,
      onClear: () => go({ maxPrice: undefined }),
    });
  }

  return (
    <>
      <ShopToolbar
        sortValue={selected.sort ?? "featured"}
        sortOptions={SORT_OPTIONS}
        onSortChange={(value) =>
          go({ sort: value === "featured" ? undefined : (value as CatalogSort) })
        }
        onOpenFilters={() => drawerDispatch({ type: "OPEN" })}
        mode={mode}
        onModeChange={(next) =>
          gridDispatch({ type: next === "one" ? "SET_ONE" : "SET_TWO" })
        }
        resultCount={resultCount}
        activeFilters={activeFilters}
      />

      <FilterDrawer
        open={drawer.face === "open"}
        onClose={() => drawerDispatch({ type: "CLOSE" })}
        title="Filters"
        footer={
          <Button fullWidth onClick={() => drawerDispatch({ type: "CLOSE" })}>
            Show results
          </Button>
        }
      >
        <FilterRail {...railProps} open />
      </FilterDrawer>

      <div className="sf-listing" data-mode={mode}>
        <aside className="sf-listing__rail" aria-label="Filters">
          <FilterRail {...railProps} open />
        </aside>
        <ListingGridIsland
          initialItems={initialItems}
          initialCursor={initialCursor}
          queryKey={queryKey}
          columns={mode === "one" ? { desktop: 1, tablet: 1, phone: 1 } : columns}
          themeFallback={themeFallback}
          tones={tones}
          empty={empty}
        />
      </div>
    </>
  );
}
