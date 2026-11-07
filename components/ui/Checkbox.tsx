import { forwardRef } from "react";
import Icon from "./icons/Icon";

/** Dumb Checkbox — controlled-only. 20x20 radius 6 default. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked" | "size"> {
  checked: boolean;
  onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  helper?: string;
  error?: string;
  size?: number;
  boxBg?: string;
  tickColor?: string;
  borderColor?: string;
  borderRadius?: number;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    checked,
    onChange,
    label,
    helper,
    error,
    size,
    boxBg,
    tickColor,
    borderColor,
    borderRadius,
    indeterminate = false,
    disabled = false,
    id,
    name,
    className = "",
    style = {},
    ...rest
  },
  ref,
) {
  const invalid = error != null && error !== "";
  const boxSize = size ?? "var(--theme-checkbox-size, 20px)";
  const boxRadius = borderRadius ?? "var(--theme-checkbox-radius, 6px)";
  const fieldId = id ?? (label ? `sf-cb-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={`flex items-start gap-2.5 ${className}`} style={style} data-disabled={disabled}>
      <span
        className="relative inline-flex flex-none cursor-pointer items-center justify-center"
        data-checked={checked || indeterminate}
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: boxRadius,
          background: checked || indeterminate ? (boxBg ?? "var(--theme-checkbox-bg, var(--color-accent))") : "#FFFFFF",
          border: `1px solid ${invalid ? "var(--color-error)" : (borderColor ?? "var(--theme-checkbox-border, var(--border))")}`,
        }}
      >
        <input
          ref={ref}
          id={fieldId}
          name={name}
          type="checkbox"
          className="absolute inset-0 m-0 cursor-pointer opacity-0"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked, e)}
          disabled={disabled}
          aria-checked={indeterminate ? "mixed" : checked}
          aria-invalid={invalid}
          {...rest}
        />
        {(checked || indeterminate) && (
          <span style={{ color: tickColor ?? "var(--theme-checkbox-tick, #FFFFFF)" }} className="inline-flex items-center justify-center">
            <Icon
              name={indeterminate ? "minus" : "check"}
              size={typeof size === "number" ? size * 0.6 : 12}
              strokeWidth={2.5}
            />
          </span>
        )}
      </span>
      {(label || helper || invalid) && (
        <span className="grid gap-0.5">
          {label && (
            <label htmlFor={fieldId} className="cursor-pointer text-sm font-medium text-[var(--color-ink)]">
              {label}
            </label>
          )}
          {invalid ? (
            <span className="text-xs text-[var(--color-error)]">{error}</span>
          ) : helper ? (
            <span className="text-[13px] text-[var(--text-muted)]">{helper}</span>
          ) : null}
        </span>
      )}
    </div>
  );
});

export default Checkbox;
