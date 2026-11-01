import type {
  VariantOptionView,
  VariantSelection,
} from "@/lib/commerce/variants";

/**
 * Dumb VariantSelector — one row per option, one button per value.
 * Strictly controlled (product.md §14): the island owns `selected` and decides
 * what a change means (find the variant, push history, rewrite the URL).
 *
 * Availability arrives pre-computed (`VariantValueView.available`), because the
 * cross-option rule lives in `lib/commerce/variants.ts`. An unavailable value is
 * rendered `aria-disabled` and **stays in the row** — removing it reflows the
 * swatches under the shopper's thumb, so the tap they were aiming at lands on a
 * different colour.
 *
 * Swatch faces carry no visible text, so their accessible name is the value
 * label; text and pill faces announce their own markup.
 */
export interface VariantSelectorProps {
  options: VariantOptionView[];
  selected: VariantSelection;
  onSelect: (optionName: string, valueId: string) => void;
  /** Freezes the whole selector (a write is in flight). */
  disabled?: boolean;
  className?: string;
}

export default function VariantSelector({
  options,
  selected,
  onSelect,
  disabled = false,
  className = "",
}: VariantSelectorProps) {
  return (
    <div className={`sf-variants ${className}`} data-disabled={disabled}>
      {options.map((option) => {
        const picked = option.values.find((value) => value.id === selected[option.name]);

        return (
          <div
            key={option.id}
            className="sf-variants__group"
            role="group"
            aria-label={option.name}
          >
            <p className="sf-variants__label">
              {option.name}
              {picked ? <span className="sf-variants__picked">{picked.value}</span> : null}
            </p>
            <div className="sf-variants__row">
              {option.values.map((value) => {
                const isSelected = picked?.id === value.id;
                const blocked = disabled || !value.available;

                return (
                  <button
                    key={value.id}
                    type="button"
                    className="sf-variants__value"
                    data-display={option.displayType}
                    data-active={isSelected}
                    aria-pressed={isSelected}
                    // Not `disabled`: a sold-out value must stay focusable so a
                    // keyboard shopper can hear why it cannot be picked.
                    aria-disabled={blocked || undefined}
                    aria-label={option.displayType === "swatch" ? value.value : undefined}
                    style={
                      option.displayType === "swatch" && value.swatchHex !== null
                        ? { background: value.swatchHex }
                        : undefined
                    }
                    onClick={() => {
                      if (!blocked) onSelect(option.name, value.id);
                    }}
                  >
                    {option.displayType === "swatch" ? (
                      value.swatchImageUrl !== null ? (
                        <img className="sf-variants__swatch-img" src={value.swatchImageUrl} alt="" />
                      ) : null
                    ) : (
                      <span className="sf-variants__text">{value.value}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
