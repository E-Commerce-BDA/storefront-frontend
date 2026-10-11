import type { ReactNode } from "react";
// Relative import (not the barrel): Toast JOINS the barrel below, so
// barrel-importing here would cycle.
import { Icon } from "./icons";

/**
 * Dumb Toast — bottom-center notification (quick-add confirmations first,
 * cart/auth notices later). Renders nothing when closed; timing
 * (auto-dismiss) belongs to the owner — this file holds no timers, fires
 * onClose only from the X. role="status" announces politely.
 */
export interface ToastProps {
  open: boolean;
  title: string;
  message?: string;
  /** Leading glyph slot (owner composes, e.g. check in success ink). */
  icon?: ReactNode;
  onClose: () => void;
  className?: string;
}

export default function Toast({ open, title, message, icon, onClose, className = "" }: ToastProps) {
  if (!open) return null;
  return (
    <div role="status" className={`sf-toast ${className}`}>
      {icon}
      <p className="sf-toast__text">
        <b>{title}</b>
        {message && <span>{message}</span>}
      </p>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" className="sf-toast__x">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
