import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui";
import NavLinks from "./NavLinks";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";

/**
 * Dumb mobile drawer — slide-in panel with NavLinks + close control.
 * Parent owns `open` (controlled-only; no allowlist exit — disclosure
 * state is route chrome state, owned by NavbarMount). Esc/overlay call
 * onClose; Tab cycles inside (trap wins — same contract as overlays).
 */
export interface MobileDrawerProps {
  open: boolean;
  side?: "left" | "right";
  links: ResolvedNavLink[];
  onClose: () => void;
  className?: string;
}

export default function MobileDrawer({
  open,
  side = "left",
  links,
  onClose,
  className = "",
}: MobileDrawerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={rootRef} data-trap="true" data-side={side} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-[rgba(10,37,64,0.5)]" onClick={onClose} aria-hidden />
      <div className={`sf-mobiledrawer ${className}`}>
        <button type="button" onClick={onClose} aria-label="Close menu" className="sf-mobiledrawer__x">
          <Icon name="x" size={20} />
        </button>
        <NavLinks links={links} />
      </div>
    </div>
  );
}
