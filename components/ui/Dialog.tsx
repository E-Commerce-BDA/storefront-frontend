"use client";

import { forwardRef, useEffect } from "react";

/** Dumb Dialog — overlay + panel, Escape/overlay close. Parent owns `open`. */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { open, onClose, title, children, className = "" },
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
      <div className="absolute inset-0 bg-[rgba(10,37,64,0.5)]" onClick={() => onClose?.()} aria-hidden />
      <div
        ref={ref}
        className={`relative w-full max-w-md border border-[var(--border)] bg-white p-5 ${className}`}
        style={{ borderRadius: "var(--radius-card)" }}
      >
        {title && <h2 className="mb-3 text-lg font-semibold text-[var(--color-ink)]">{title}</h2>}
        {children}
      </div>
    </div>
  );
});

export default Dialog;
