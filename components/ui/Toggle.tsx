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
    width = 44,
    height = 24,
    onColor,
    offColor,
    knobColor = "#FFFFFF",
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
  const knob = height - 6;

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
      className="relative cursor-pointer border-0 p-0 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        width,
        height,
        borderRadius: 9999,
        background: checked ? (onColor ?? "var(--color-accent)") : (offColor ?? "var(--border)"),
        transition: "background 0.18s ease",
      }}
      {...rest}
    >
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          top: 3,
          left: checked ? width - knob - 3 : 3,
          width: knob,
          height: knob,
          background: knobColor,
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
