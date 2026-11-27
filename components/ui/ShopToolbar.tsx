import type { CSSProperties } from "react";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import Select from "@/components/ui/Select";
import { Icon } from "@/components/ui/icons";
import GridModeToggle from "@/components/ui/GridModeToggle";
import { resolveShopToolbar, type GridMode } from "@/lib/shop/models";

/**
 * Dumb ShopToolbar — the listing's sort/filter/column row. Every control is
 * controlled; the parent owns sort, drawer, grid mode and active-filter chips.
 */
export interface ShopToolbarProps {
  sortValue: string;
  sortOptions: readonly { value: string; label: string }[];
  onSortChange: (value: string) => void;
  onOpenFilters: () => void;
  mode: GridMode;
  onModeChange: (mode: GridMode) => void;
  resultCount?: number;
  activeFilters?: readonly { label: string; onClear: () => void }[];
  resultLabel?: string;
  showCount?: boolean;
  options?: { resultLabel?: string; showCount?: boolean };
  className?: string;
  style?: CSSProperties;
}

export default function ShopToolbar({
  sortValue,
  sortOptions,
  onSortChange,
  onOpenFilters,
  mode,
  onModeChange,
  resultCount,
  activeFilters = [],
  resultLabel,
  showCount,
  options,
  className = "",
  style,
}: ShopToolbarProps) {
  const toolbar = resolveShopToolbar(options, { resultLabel, showCount });

  return (
    <div className={`sf-shop-toolbar ${className}`} style={style} data-mode={mode}>
      <div className="sf-shop-toolbar__sort">
        <Select label="Sort by" value={sortValue} options={sortOptions.map((option) => ({ value: option.value, label: option.label }))} onChange={(value) => onSortChange(value)} />
        <Button
          variant="light"
          size="sm"
          onClick={onOpenFilters}
          aria-label="Filters"
          data-active-filter-count={activeFilters.length}
        >
          <Icon name="filter" size={16} />
          <span>Filters</span>
        </Button>
        <GridModeToggle value={mode} onChange={onModeChange} />
      </div>
      {toolbar.showCount && resultCount !== undefined ? (
        <p className="sf-shop-toolbar__count" role="status">
          {resultCount} {toolbar.resultLabel}
        </p>
      ) : null}
      {activeFilters.length > 0 ? (
        <div className="sf-shop-toolbar__chips" role="group" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <Pill key={filter.label} variant="filter" active onClick={filter.onClear}>
              {filter.label}
            </Pill>
          ))}
        </div>
      ) : null}
    </div>
  );
}
