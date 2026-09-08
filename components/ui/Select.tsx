import { forwardRef } from "react";

/** Dumb Select — native select styled like Input. No Radix in Phase-1. */
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  value: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  label?: string;
  helper?: string;
  error?: string;
  placeholder?: string;
  radius?: number;
  borderColor?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { value, onChange, options, label, helper, error, placeholder = "Select…", radius = 10, borderColor, id, disabled = false, required = false, className = "", style = {}, ...rest },
  ref,
) {
  const invalid = error != null && error !== "";
  const fieldId = id ?? (label ? `sf-sel-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={`grid gap-1.5 ${className}`} style={style}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold tracking-wide text-[var(--color-ink)]">
          {label} {required && <span aria-hidden>*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={fieldId}
        className="min-h-10 w-full bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-0 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        style={{
          border: `1px solid ${invalid ? "var(--color-error)" : (borderColor ?? "var(--border)")}`,
          borderRadius: radius,
          opacity: disabled ? 0.6 : undefined,
        }}
        value={value}
        onChange={(e) => onChange?.(e.target.value, e)}
        disabled={disabled}
        required={required}
        aria-invalid={invalid}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {invalid ? (
        <p role="alert" className="m-0 text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : helper ? (
        <p className="m-0 text-[13px] text-[var(--text-muted)]">{helper}</p>
      ) : null}
    </div>
  );
});

export default Select;
