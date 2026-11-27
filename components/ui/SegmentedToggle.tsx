import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import {
  resolveSegmentedToggle,
  type SegmentedOption,
  type SegmentedSize,
  type SegmentedToggleOptions,
} from "@/lib/shop/models";

/**
 * Dumb SegmentedToggle — the prototype's segmented control as a controlled
 * radio group. Every value is resolved in `lib/shop/models.ts`; CSS only reads
 * `data-size` and `data-selected`. No fetch, no store, no local state.
 */
export interface SegmentedToggleProps {
  value: string;
  onChange: (value: string) => void;
  options?: readonly SegmentedOption[];
  /** Flat props beat the options object, which beats the resolver defaults. */
  size?: SegmentedSize;
  ariaLabel?: string;
  optionsConfig?: SegmentedToggleOptions;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function SegmentedToggle({
  value,
  onChange,
  options,
  size,
  ariaLabel,
  optionsConfig,
  disabled = false,
  className = "",
  style,
}: SegmentedToggleProps) {
  const resolved = resolveSegmentedToggle(optionsConfig, { options, size, ariaLabel });

  return (
    <div
      className={`sf-segmented ${className}`}
      role="group"
      aria-label={resolved.ariaLabel}
      data-size={resolved.size}
      data-disabled={disabled}
      style={style}
    >
      {resolved.options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className="sf-segmented__btn"
            data-selected={selected}
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.icon !== undefined ? <Icon name={option.icon as IconName} size={15} /> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
