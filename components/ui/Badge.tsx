import { forwardRef } from "react";

/** Dumb Badge — 11px 700 pill. Sale uses ink text, never white on coral. */
export type BadgeTone = "success" | "warning" | "error" | "sale" | "info" | "neutral";

const TONES: Record<BadgeTone, { bg: string; text: string; border: string }> = {
  success: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success-border)" },
  warning: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning-border)" },
  error: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error-border)" },
  sale: { bg: "var(--color-sale)", text: "var(--color-ink)", border: "var(--color-sale)" },
  info: { bg: "var(--color-accent-50)", text: "var(--color-accent)", border: "var(--color-accent-50)" },
  neutral: { bg: "#fff", text: "var(--text-muted)", border: "var(--border)" },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: React.ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ tone = "neutral", children, className = "", style = {}, ...rest }, ref) {
  const t = TONES[tone];
  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${className}`}
      style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}`, ...style }}
      {...rest}
    >
      {children}
    </span>
  );
});

export default Badge;
