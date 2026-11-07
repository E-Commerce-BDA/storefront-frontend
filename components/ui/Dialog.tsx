"use client";

import { forwardRef, useEffect } from "react";

/** Dumb Dialog — overlay + panel, Escape/overlay close. Parent owns `open`. */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /**
   * House paint (theme.dialog feeds; flat wins). Absent = today's look
   * (classes below hold; styles apply only when set — byte-identical
   * default render). Numerics trust the owner (the resolver clamps
   * theme values; direct props are owner-precise).
   */
  overlayColor?: string;
  /** Overlay wash alpha 0–100 (default 50, mirrors today's rgba). */
  overlayAlpha?: number;
  panelBg?: string;
  borderColor?: string;
  radius?: number;
  /** Panel width cap px (default 448 = max-w-md). */
  maxWidth?: number;
  titleColor?: string;
  titleSize?: number;
  /** Inherited panel defaults (owner direct styles win automatically). */
  bodySize?: number;
  bodyWeight?: number;
  bodyColor?: string;
}

const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { open, onClose, title, children, className = "", overlayColor, overlayAlpha, panelBg, borderColor, radius, maxWidth, titleColor, titleSize, bodySize, bodyWeight, bodyColor },
  ref,
) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0"
        // Custom wash replaces the class (style wins); absent = theme var with
        // the same rgba fallback the class held before.
        style={
          overlayColor !== undefined || overlayAlpha !== undefined
            ? { background: `color-mix(in srgb, ${overlayColor ?? "#0a2540"} ${overlayAlpha ?? 50}%, transparent)` }
            : { background: "var(--theme-dialog-overlay, rgba(10,37,64,0.5))" }
        }
        onClick={() => onClose?.()}
        aria-hidden
      />
      <div
        ref={ref}
        className={`relative w-full max-w-md border border-[var(--border)] bg-white p-5 ${className}`}
        style={{
          borderRadius: radius ?? "var(--theme-dialog-radius, var(--radius-card))",
          ...(maxWidth !== undefined ? { maxWidth } : { maxWidth: "var(--theme-dialog-max-width, 448px)" }),
          ...(panelBg ? { background: panelBg } : { background: "var(--theme-dialog-panel-bg, var(--color-card, #ffffff))" }),
          ...(borderColor ? { borderColor } : { borderColor: "var(--theme-dialog-border, var(--border))" }),
          ...(bodySize !== undefined ? { fontSize: bodySize } : { fontSize: "var(--theme-dialog-body-size, 14px)" }),
          ...(bodyWeight !== undefined ? { fontWeight: bodyWeight } : { fontWeight: "var(--theme-dialog-body-weight, 400)" }),
          ...(bodyColor ? { color: bodyColor } : { color: "var(--theme-dialog-body-color, var(--color-ink))" }),
        }}
      >
        {title && (
          <h2
            className="mb-3 text-lg font-semibold text-[var(--color-ink)]"
            style={{
              ...(titleColor ? { color: titleColor } : { color: "var(--theme-dialog-title-color, var(--color-ink))" }),
              ...(titleSize !== undefined ? { fontSize: titleSize } : { fontSize: "var(--theme-dialog-title-size, 18px)" }),
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
});

export default Dialog;
