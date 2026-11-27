import type { CSSProperties, ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/icons";
import { resolveFilterDrawer, type DrawerSide } from "@/lib/shop/models";

/**
 * Dumb FilterDrawer — left/right scrim + panel. `open` and `onClose` are owned
 * by the listing island; the drawer never toggles itself. Paint rides `.sf-*`
 * vars, width arrives as a resolved CSS var so CSS can theme around it.
 */
export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  side?: DrawerSide;
  width?: number;
  options?: { side?: DrawerSide; title?: string; width?: number };
  className?: string;
  style?: CSSProperties;
}

export default function FilterDrawer({
  open,
  onClose,
  children,
  title,
  footer,
  side,
  width,
  options,
  className = "",
  style,
}: FilterDrawerProps) {
  const resolved = resolveFilterDrawer(options, { side, title, width });
  if (!open) return null;

  const vars = {
    "--drawer-width": `${resolved.width}px`,
    ...style,
  } as CSSProperties;

  return (
    <div className="sf-filter-drawer" style={vars} data-side={resolved.side}>
      <div className="sf-filter-drawer__scrim sf-scrim" aria-hidden onClick={onClose} />
      <aside
        className={`sf-filter-drawer__panel sf-drawer ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={resolved.title}
        data-side={resolved.side}
        data-open="true"
        data-motion="on"
      >
        <header className="sf-filter-drawer__head">
          <h2 className="sf-filter-drawer__title">{resolved.title}</h2>
          <IconButton label={`Close ${resolved.title}`} size={32} onClick={onClose}>
            <Icon name="x" size={16} />
          </IconButton>
        </header>
        <div className="sf-filter-drawer__body">{children}</div>
        {footer !== undefined ? (
          <footer className="sf-filter-drawer__footer">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}
