import type { CSSProperties } from "react";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import type { GridMode } from "@/lib/shop/models";

/**
 * Dumb GridModeToggle — the prototype's two/one column switch. It is a thin
 * controlled wrapper over SegmentedToggle: the listing island owns the mode,
 * this component only supplies the two labels and their values.
 */
export interface GridModeToggleProps {
  value: GridMode;
  onChange: (mode: GridMode) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const OPTIONS = [
  { value: "two", label: "Two columns" },
  { value: "one", label: "One column" },
] as const;

export default function GridModeToggle({
  value,
  onChange,
  disabled = false,
  className = "",
  style,
}: GridModeToggleProps) {
  return (
    <SegmentedToggle
      className={`sf-gridmode ${className}`}
      ariaLabel="Grid columns"
      options={OPTIONS}
      value={value}
      onChange={(next) => onChange(next === "one" ? "one" : "two")}
      disabled={disabled}
      style={style}
    />
  );
}
