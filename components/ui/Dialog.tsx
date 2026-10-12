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
        className="absolute inset-0 bg-[rgba(10,37,64,0.5)]"
        // Custom wash replaces the class (style wins); absent = class
        // holds, so the default render never depends on color-mix support.
        style={
          overlayColor !== undefined || overlayAlpha !== undefined
            ? { background: `color-mix(in srgb, ${overlayColor ?? "#0a2540"} ${overlayAlpha ?? 50}%, transparent)` }
            : undefined
        }
        onClick={() => onClose?.()}
        aria-hidden
      />
      <div
        ref={ref}
        className={`relative w-full max-w-md border border-[var(--border)] bg-white p-5 ${className}`}
        style={{
          borderRadius: radius ?? "var(--radius-card)",
          ...(maxWidth !== undefined ? { maxWidth } : {}),
          ...(panelBg ? { background: panelBg } : {}),
          ...(borderColor ? { borderColor } : {}),
          ...(bodySize !== undefined ? { fontSize: bodySize } : {}),
          ...(bodyWeight !== undefined ? { fontWeight: bodyWeight } : {}),
          ...(bodyColor ? { color: bodyColor } : {}),
        }}
      >
        {title && (
          <h2
            className="mb-3 text-lg font-semibold text-[var(--color-ink)]"
            style={{
              ...(titleColor ? { color: titleColor } : {}),
              ...(titleSize !== undefined ? { fontSize: titleSize } : {}),
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
