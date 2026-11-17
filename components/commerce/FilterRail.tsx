import type { CSSProperties } from "react";
import { Button, Checkbox, Input, Select } from "@/components/ui";
import { flattenCategoryTree, type CategoryNode } from "@/lib/catalog/facets";

/**
 * Dumb listing filter rail — sf-054.
 *
 * Every value is controlled by the owner (the URL island), and every change is
 * a callback — the rail owns no state, fetches nothing, and knows no service.
 * Category options come from a flattened tree so depth is visible without a
 * custom widget; tags are real facet values from catalog rows, never a
 * hardcoded list.
 */
export interface FilterRailSelection {
  categorySlug?: string;
  brandSlug?: string;
  tags?: string[];
  discounted?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface FilterRailProps {
  categories: readonly CategoryNode[];
  brands: readonly { slug: string; name: string }[];
  tags: readonly string[];
  priceBounds: { min: number | null; max: number | null };
  selected: FilterRailSelection;
  onCategoryChange?: (slug: string | undefined) => void;
  onBrandChange?: (slug: string | undefined) => void;
  onTagToggle?: (tag: string) => void;
  onDiscountedChange?: (on: boolean) => void;
  onMinPriceChange?: (value: number | undefined) => void;
  onMaxPriceChange?: (value: number | undefined) => void;
  onReset?: () => void;
  className?: string;
}

const NONE = "__none__";

export default function FilterRail({
  categories,
  brands,
  tags,
  priceBounds,
  selected,
  onCategoryChange,
  onBrandChange,
  onTagToggle,
  onDiscountedChange,
  onMinPriceChange,
  onMaxPriceChange,
  onReset,
  className = "",
}: FilterRailProps) {
  const categoryOptions = [
    { value: NONE, label: "All categories" },
    ...flattenCategoryTree(categories).map((node) => ({
      value: node.slug,
      label: node.label,
    })),
  ];
  const brandOptions = [
    { value: NONE, label: "All brands" },
    ...brands.map((brand) => ({ value: brand.slug, label: brand.name })),
  ];

  const toNumber = (raw: string): number | undefined => {
    if (raw.trim() === "") return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };

  const style = {
    ...(priceBounds.min !== null
      ? { "--facet-price-min": String(priceBounds.min) }
      : {}),
    ...(priceBounds.max !== null
      ? { "--facet-price-max": String(priceBounds.max) }
      : {}),
  } as CSSProperties;

  return (
    <aside
      className={`sf-filter-rail ${className}`}
      style={style}
      aria-label="Filter products"
      data-discounted={selected.discounted === true}
    >
      <div className="sf-filter-rail__head">
        <h2 className="sf-filter-rail__title">Filters</h2>
        {onReset ? (
          <Button variant="ghost-ink" size="sm" onClick={onReset}>
            Clear all
          </Button>
        ) : null}
      </div>

      <div className="sf-facet">
        <Select
          label="Category"
          value={selected.categorySlug ?? NONE}
          options={categoryOptions}
          onChange={(value) =>
            onCategoryChange?.(value === NONE ? undefined : value)
          }
        />
      </div>

      <div className="sf-facet">
        <Select
          label="Brand"
          value={selected.brandSlug ?? NONE}
          options={brandOptions}
          onChange={(value) =>
            onBrandChange?.(value === NONE ? undefined : value)
          }
        />
      </div>

      <div className="sf-facet">
        <span className="sf-facet__label">Price</span>
        <div className="sf-facet__price">
          <Input
            label="Min"
            inputMode="decimal"
            value={selected.minPrice !== undefined ? String(selected.minPrice) : ""}
            onChange={(value) => onMinPriceChange?.(toNumber(value))}
          />
          <Input
            label="Max"
            inputMode="decimal"
            value={selected.maxPrice !== undefined ? String(selected.maxPrice) : ""}
            onChange={(value) => onMaxPriceChange?.(toNumber(value))}
          />
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="sf-facet">
          <span className="sf-facet__label">Tags</span>
          <div className="sf-facet__tags">
            {tags.map((tag) => (
              <Checkbox
                key={tag}
                label={tag}
                checked={selected.tags?.includes(tag) === true}
                onChange={() => onTagToggle?.(tag)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="sf-facet">
        <Checkbox
          label="Discounted only"
          checked={selected.discounted === true}
          onChange={(checked) => onDiscountedChange?.(checked)}
        />
      </div>
    </aside>
  );
}
