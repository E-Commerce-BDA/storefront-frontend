import { forwardRef } from "react";

/** Dumb Slider — native range, for CMS numeric settings (radius 0-24, gutter 0-48). */
export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: number;
  onChange?: (value: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  helper?: string;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { value, onChange, label, helper, min = 0, max = 100, step = 1, showValue = false, id, disabled = false, className = "", style = {}, ...rest },
  ref,
) {
  const fieldId = id ?? (label ? `sf-slider-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={`grid gap-1.5 ${className}`} style={style}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={fieldId} className="text-xs font-semibold tracking-wide text-[var(--color-ink)]">
              {label}
            </label>
          )}
          {showValue && <span className="text-[13px] font-semibold text-[var(--color-ink)]">{value}</span>}
        </div>
      )}
      <input
        ref={ref}
        id={fieldId}
        type="range"
        className="sf-slider"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange?.(Number(e.target.value), e)}
        aria-valuetext={String(value)}
        {...rest}
      />
      {helper && <p className="m-0 text-[13px] text-[var(--text-muted)]">{helper}</p>}
    </div>
  );
});

export default Slider;
