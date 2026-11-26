import { forwardRef } from "react";

/** Dumb Toggle (Switch) — controlled-only. 44x24 pill default. */
export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  labelPosition?: "left" | "right";
  helper?: string;
  width?: number;
  height?: number;
  onColor?: string;
  offColor?: string;
  knobColor?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    checked,
    onChange,
    label,
    labelPosition = "right",
    helper,
    width,
    height,
    onColor,
    offColor,
    knobColor,
    disabled = false,
    id,
    name,
    className = "",
    style = {},
    ...rest
  },
  ref,
) {
  const fieldId = id ?? (label ? `sf-toggle-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const trackWidth = width ?? "var(--theme-toggle-width, 44px)";
  const trackHeight = height ?? "var(--theme-toggle-height, 24px)";
  // Keep the knob math numeric for the checked travel distance; a theme
  // width/height still paints through the vars above.
  const knob = (height ?? 24) - 6;

  const track = (
    <button
      ref={ref}
      id={fieldId}
      name={name}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      data-checked={checked}
      data-disabled={disabled}
      className="relative cursor-pointer border-0 p-0 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--surface-disabled)] disabled:text-[var(--text-disabled)]"
      style={{
        width: trackWidth,
        height: trackHeight,
        borderRadius: 9999,
        background: checked ? (onColor ?? "var(--theme-toggle-on, var(--color-accent))") : (offColor ?? "var(--theme-toggle-off, var(--border))"),
        transition: "background 0.18s ease",
      }}
      {...rest}
    >
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          top: 3,
          left: checked ? (typeof width === "number" ? width - knob - 3 : `calc(${trackWidth} - ${knob + 3}px)`) : 3,
          width: knob,
          height: knob,
          background: knobColor ?? "var(--theme-toggle-knob, #FFFFFF)",
          transition: "left 0.18s ease",
        }}
      />
    </button>
  );

  if (!label && !helper) return <span className={className} style={style}>{track}</span>;

  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={style} data-disabled={disabled}>
      {labelPosition === "left" && label && (
        <label htmlFor={fieldId} className="cursor-pointer text-sm font-medium text-[var(--color-ink)]">
          {label}
        </label>
      )}
      {track}
      {labelPosition === "right" && label && (
        <label htmlFor={fieldId} className="cursor-pointer text-sm font-medium text-[var(--color-ink)]">
          {label}
        </label>
      )}
      {helper && <span className="text-[13px] text-[var(--text-muted)]">{helper}</span>}
    </div>
  );
});

export default Toggle;
