import { forwardRef } from "react";

/** Dumb Textarea — controlled-only, same validation language as Input. */
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  value: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label?: string;
  helper?: string;
  error?: string;
  radius?: number;
  borderColor?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { value, onChange, label, helper, error, radius = 10, borderColor, rows = 4, id, disabled = false, required = false, className = "", style = {}, ...rest },
  ref,
) {
  const invalid = error != null && error !== "";
  const fieldId = id ?? (label ? `sf-ta-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={`grid gap-1.5 ${className}`} style={style}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold tracking-wide text-[var(--color-ink)]">
          {label} {required && <span aria-hidden>*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        className="w-full bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-0 placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        style={{
          border: `1px solid ${invalid ? "var(--color-error)" : (borderColor ?? "var(--border)")}`,
          borderRadius: radius,
          opacity: disabled ? 0.6 : undefined,
        }}
        value={value}
        onChange={(e) => onChange?.(e.target.value, e)}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={invalid}
        {...rest}
      />
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

export default Textarea;
