import { forwardRef } from "react";

/** Dumb Radio — controlled-only, single. Group via same `name` in parent. */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked: boolean;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  helper?: string;
  error?: string;
  size?: number;
  dotColor?: string;
  borderColor?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    checked,
    onChange,
    name,
    value,
    label,
    helper,
    error,
    size = 20,
    dotColor,
    borderColor,
    disabled = false,
    id,
    className = "",
    style = {},
    ...rest
  },
  ref,
) {
  const invalid = error != null && error !== "";
  const fieldId = id ?? `sf-radio-${name}-${value}`;

  return (
    <div className={`flex items-start gap-2.5 ${className}`} style={style} data-disabled={disabled}>
      <span
        className="relative inline-flex flex-none cursor-pointer items-center justify-center rounded-full"
        data-checked={checked}
        style={{
          width: size,
          height: size,
          border: `2px solid ${invalid ? "var(--color-error)" : checked ? "var(--color-accent)" : (borderColor ?? "var(--border)")}`,
          background: "#fff",
        }}
      >
        <input
          ref={ref}
          id={fieldId}
          name={name}
          value={value}
          type="radio"
          className="absolute inset-0 m-0 cursor-pointer opacity-0"
          checked={checked}
          onChange={(e) => onChange?.(e.target.value, e)}
          disabled={disabled}
          aria-invalid={invalid}
          {...rest}
        />
        {checked && (
          <span className="rounded-full" style={{ width: size * 0.5, height: size * 0.5, background: dotColor ?? "var(--color-accent)" }} aria-hidden />
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

export default Radio;
