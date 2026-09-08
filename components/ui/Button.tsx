import { forwardRef } from "react";

/**
 * Dumb Button — Oceanic Blue v1.0 (Documentation/design-system/storefront.md §7.1)
 * props -> JSX only. Parent resolves P>S>G and passes final bg/textColor/border*.
 * Solid fills only, wave hover, min-h 44px.
 */
export type ButtonVariant = "primary" | "light" | "ghost-ink" | "sale" | "success" | "error";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, { bg: string; text: string; border: string; waveBg: string; waveText: string }> = {
  primary: {
    bg: "var(--color-button-bg, #0077B6)",
    text: "var(--color-button-text, #FFFFFF)",
    border: "var(--color-button-bg, #0077B6)",
    waveBg: "#FFFFFF",
    waveText: "#0077B6",
  },
  light: { bg: "#FFFFFF", text: "#0077B6", border: "#0077B6", waveBg: "#0077B6", waveText: "#FFFFFF" },
  "ghost-ink": { bg: "#FFFFFF", text: "#0A2540", border: "#0A2540", waveBg: "#0A2540", waveText: "#FFFFFF" },
  // Sale MUST use ink text (4.6:1 AA) — never white on #FF6B4A (2.8:1 fail)
  sale: { bg: "#FF6B4A", text: "#0A2540", border: "#FF6B4A", waveBg: "#FFEDE6", waveText: "#0A2540" },
  success: { bg: "#0E9F6E", text: "#FFFFFF", border: "#0E9F6E", waveBg: "#ECFDF3", waveText: "#0E9F6E" },
  error: { bg: "#D92D20", text: "#FFFFFF", border: "#D92D20", waveBg: "#FEF3F2", waveText: "#D92D20" },
};

const SIZES: Record<ButtonSize, { minHeight: number; padding: string; fontSize: number }> = {
  sm: { minHeight: 36, padding: "10px 20px", fontSize: 14 },
  md: { minHeight: 44, padding: "14px 28px", fontSize: 15 },
  lg: { minHeight: 52, padding: "16px 32px", fontSize: 16 },
};

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children?: React.ReactNode;
  text?: string;
  variant?: ButtonVariant;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  waveBg?: string;
  waveText?: string;
  size?: ButtonSize;
  fullWidth?: boolean;
  href?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(
  {
    children,
    text,
    variant = "primary",
    bg,
    textColor,
    borderColor,
    borderWidth = 1,
    borderRadius = 8,
    waveBg,
    waveText,
    size = "md",
    fullWidth = false,
    href,
    type = "button",
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
    className = "",
    style = {},
    ...rest
  },
  ref,
) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;
  const isDisabled = disabled || loading;

  const cssVars = {
    "--btn-bg": bg ?? v.bg,
    "--btn-text": textColor ?? v.text,
    "--btn-border": borderColor ?? v.border,
    "--btn-bw": `${borderWidth}px`,
    "--btn-radius": borderRadius >= 999 ? "9999px" : `${borderRadius}px`,
    "--wave-bg": waveBg ?? v.waveBg,
    "--wave-text": waveText ?? v.waveText,
    minHeight: s.minHeight,
    padding: s.padding,
    fontSize: s.fontSize,
    width: fullWidth ? "100%" : undefined,
    ...style,
  } as React.CSSProperties;

  const inner = (
    <>
      {loading ? <span className="sf-btn__spinner" aria-hidden /> : leftIcon}
      <span className="sf-btn__label">{text ?? children}</span>
      {rightIcon}
    </>
  );

  if (href && !isDisabled) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        aria-disabled={isDisabled}
        className={`sf-btn ${className}`}
        style={cssVars}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`sf-btn ${className}`}
      style={cssVars}
      {...rest}
    >
      {inner}
    </button>
  );
});

export default Button;
