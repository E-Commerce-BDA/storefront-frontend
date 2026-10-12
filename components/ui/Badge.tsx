import { forwardRef } from "react";

/** Dumb Badge — 11px 700 pill. Sale uses ink text, never white on coral. */
export type BadgeTone = "success" | "warning" | "error" | "sale" | "info" | "neutral" | "lilac";

/** Admin-created face (custom badge creator): border type + colors. */
export type BadgeBorderStyle = "solid" | "dashed" | "dotted";
export interface CustomBadgeTone {
  bg: string;
  text: string;
  /** Defaults to bg (tone-on-tone ring). */
  border?: string;
  borderStyle?: BadgeBorderStyle;
}

const TONES: Record<BadgeTone, { bg: string; text: string; border: string }> = {
  success: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success-border)" },
  warning: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning-border)" },
  error: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error-border)" },
  sale: { bg: "var(--color-sale)", text: "var(--color-ink)", border: "var(--color-sale)" },
  info: { bg: "var(--color-accent-50)", text: "var(--color-accent)", border: "var(--color-accent-50)" },
  neutral: { bg: "#fff", text: "var(--text-muted)", border: "var(--border)" },
  lilac: { bg: "var(--color-lilac-bg)", text: "var(--color-lilac)", border: "var(--color-lilac-border)" },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Builtin tone or admin-created id (`string & {}` keeps builtin
   * autocomplete while admitting custom ids). Lookup: custom map first
   * (admin may retint a builtin face), then builtins, then neutral —
   * unknown ids fail closed, never blank.
   */
  tone?: BadgeTone | (string & {});
  /** Resolved custom faces (owner passes the theme's custom map). */
  tones?: Record<string, CustomBadgeTone>;
  children: React.ReactNode;
}

const BORDER_STYLES: BadgeBorderStyle[] = ["solid", "dashed", "dotted"];

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ tone = "neutral", tones, children, className = "", style = {}, ...rest }, ref) {
  const custom = typeof tone === "string" ? tones?.[tone] : undefined;
  // Normalized face (builtins pin solid — byte-identical renders).
  const t: { bg: string; text: string; border: string; borderStyle: BadgeBorderStyle } = custom
    ? {
        bg: custom.bg,
        text: custom.text,
        border: custom.border ?? custom.bg,
        borderStyle: custom.borderStyle && BORDER_STYLES.includes(custom.borderStyle) ? custom.borderStyle : "solid",
      }
    : { ...(TONES[tone as BadgeTone] ?? TONES.neutral), borderStyle: "solid" };
  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${className}`}
      style={{ background: t.bg, color: t.text, border: `1px ${t.borderStyle} ${t.border}`, ...style }}
      {...rest}
    >
      {children}
    </span>
  );
});

export default Badge;
