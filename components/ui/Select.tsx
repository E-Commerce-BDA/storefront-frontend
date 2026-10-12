import { forwardRef, type CSSProperties } from "react";
import { Icon } from "./icons";

/**
 * Dumb Select — native branch by default (custom listbox via
 * variant="custom"). Native menus are OS chrome: button-face knobs apply,
 * list-interior knobs (option hover/selected faces, animation) are
 * documented-ignored on native — that split is why the custom branch
 * exists (see components/customization.md).
 */
export interface SelectOption {
  value: string;
  label: string;
}

export type SelectVariant = "native" | "custom";

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
  /** House paint (theme feeds; flat wins). Absent = component tokens. */
  bg?: string;
  textColor?: string;
  focusBorderColor?: string;
  /** Branch selector (default native — zero-breakage). */
  variant?: SelectVariant;
  /** CMS media URL for the arrow (empty = chevron-down glyph). */
  arrowIconUrl?: string;
  /** Arrow right-offset px (arrow hit-area padding). */
  arrowPadding?: number;
}

/**
 * Arrow glyph with upload fallback. The chevron always renders beneath;
 * a broken CMS URL removes its own <img> imperatively (decorative node
 * only — no React state, so the dumb contract holds; re-renders
 * self-heal by re-firing onError).
 */
function ArrowGlyph({ url }: { url?: string }) {
  if (!url) return <Icon name="chevron-down" size={16} />;
  return (
    <>
      <Icon name="chevron-down" size={16} />
      {/* alt="" deliberate: the select is already labelled. */}
      <img
        src={url}
        alt=""
        aria-hidden="true"
        onError={(e) => e.currentTarget.remove()}
      />
    </>
  );
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { value, onChange, options, label, helper, error, placeholder = "Select…", radius = 10, borderColor, bg, textColor, focusBorderColor, variant = "native", arrowIconUrl, arrowPadding = 12, id, disabled = false, required = false, className = "", style = {}, ...rest },
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
      <div className="sf-selectwrap">
        <select
          ref={ref}
          id={fieldId}
          // sf-select hook: themed focus border paints through --se-focus
          // (Textarea pattern). appearance-none drops the OS arrow; the
          // arrow layer below replaces it (icon or uploaded URL).
          className="sf-select min-h-10 w-full appearance-none py-2.5 pl-3 text-sm text-[var(--color-ink)] outline-0 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          data-focus={focusBorderColor ? "custom" : "default"}
          data-variant={variant}
          style={{
            border: `1px solid ${invalid ? "var(--color-error)" : (borderColor ?? "var(--border)")}`,
            borderRadius: radius,
            background: bg ?? "var(--color-navbar-bg, #ffffff)",
            color: textColor,
            paddingRight: `calc(${arrowPadding}px + 24px)`,
            ...(focusBorderColor ? ({ "--se-focus": focusBorderColor } as CSSProperties) : {}),
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
        {/* Arrow layer (decorative — the select is already labelled). */
        /* img onError falls back to the glyph (broken CMS URL never blanks). */}
        <span className="sf-select__arrow" aria-hidden="true" style={{ right: arrowPadding }}>
          <ArrowGlyph url={arrowIconUrl} />
        </span>
      </div>
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
