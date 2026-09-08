import { forwardRef } from "react";

/** Dumb Input — controlled-only. value + onChange owned by parent. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> {
  value: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  helper?: string;
  error?: string;
  size?: "sm" | "md";
  radius?: number;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    value,
    onChange,
    label,
    helper,
    error,
    size = "md",
    radius = 10,
    bg,
    textColor,
    borderColor,
    placeholder,
    disabled = false,
    required = false,
    leftIcon,
    rightIcon,
    type = "text",
    id,
    className = "",
    style = {},
    ...rest
  },
  ref,
) {
  const invalid = error != null && error !== "";
  const fieldId = id ?? (label ? `sf-input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={`grid gap-1.5 ${className}`} style={style}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold tracking-wide text-[var(--color-ink)]">
          {label} {required && <span aria-hidden>*</span>}
        </label>
      )}
      <div
        className="flex items-center gap-2 bg-white focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_3px_var(--focus-ring)]"
        data-disabled={disabled}
        data-invalid={invalid}
        style={{
          border: `1px solid ${invalid ? "var(--color-error)" : (borderColor ?? "var(--border)")}`,
          borderRadius: size === "sm" ? 9999 : radius,
          minHeight: size === "sm" ? 36 : 40,
          padding: "0 12px",
          background: bg ?? "#FFFFFF",
          opacity: disabled ? 0.6 : undefined,
        }}
      >
        {leftIcon && (
          <span className="inline-flex text-[var(--text-muted)]" aria-hidden>
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          className="min-h-[inherit] w-full min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-[var(--color-ink)] outline-0"
          value={value}
          onChange={(e) => onChange?.(e.target.value, e)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          type={type}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${fieldId}-err` : helper ? `${fieldId}-help` : undefined}
          {...rest}
        />
        {rightIcon && (
          <span className="inline-flex text-[var(--text-muted)]" aria-hidden>
            {rightIcon}
          </span>
        )}
      </div>
      {invalid ? (
        <p id={`${fieldId}-err`} role="alert" className="m-0 text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : helper ? (
        <p id={`${fieldId}-help`} className="m-0 text-[13px] text-[var(--text-muted)]">
          {helper}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
