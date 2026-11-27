import type { CSSProperties, ReactNode } from "react";
import { resolveMenu, type MenuAlign } from "@/lib/shop/models";

/**
 * Dumb Menu — a generic controlled disclosure. The parent owns `open` and
 * receives every close request; Escape/outside-click listeners belong to the
 * route island, never here. State reaches CSS through `data-open`/`data-align`.
 */
export interface MenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: MenuAlign;
  ariaLabel?: string;
  options?: { align?: MenuAlign; ariaLabel?: string };
  className?: string;
  style?: CSSProperties;
}

export default function Menu({
  open,
  onOpenChange,
  trigger,
  children,
  align,
  ariaLabel,
  options,
  className = "",
  style,
}: MenuProps) {
  const resolved = resolveMenu(options, { align, ariaLabel });

  return (
    <div
      className={`sf-menu ${className}`}
      data-open={open}
      data-align={resolved.align}
      style={style}
    >
      <button
        type="button"
        className="sf-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={resolved.ariaLabel}
        onClick={() => onOpenChange(!open)}
      >
        {trigger}
      </button>
      <div className="sf-menu__panel" role="menu" aria-label={resolved.ariaLabel} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
