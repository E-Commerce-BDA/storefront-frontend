import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui";
import type { ResolvedOverlayMotion } from "@/lib/search/motion";

/**
 * Dumb inspect-modal shell (overlay variant "inspect") — backdrop, centered
 * frame, close, focus trap. List / preview / actions regions land next
 * turns as separate components; this shell renders the frame and nothing
 * else (no placeholders, no dead markup). props → JSX. No fetch, no timers.
 */
export interface SearchInspectProps {
  /**
   * Resolved entrance motion (concrete ms + easing, preset already resolved
   * upstream). Oceanic default suits centered modals (scale+rise, never
   * full-travel slides). Default mirrors builtins for standalone/demo use.
   */
  motion?: ResolvedOverlayMotion;
  /** True while the owner animates dismissal (CSS reverses, then unmounts). */
  closing?: boolean;
  onClose: () => void;
  className?: string;
}

const OCEANIC_BUILTIN: ResolvedOverlayMotion = {
  enabled: true,
  durationMs: 320,
  easing: "cubic-bezier(0.32, 0.72, 0.32, 1)",
  travel: "full",
};

export default function SearchInspect({
  motion = OCEANIC_BUILTIN,
  closing = false,
  onClose,
  className = "",
}: SearchInspectProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Same trap contract as drawers/sheet: Tab cycles inside (recomputed per
  // press); Esc closes. No keyboard user left behind the overlay.
  useEffect(() => {
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
  }, [onClose]);

  // Motion vars ride inline (presentation via props — no new lib module);
  // disabled motion renders no vars (CSS fallbacks stay instant-safe).
  const motionVars = motion.enabled
    ? {
        "--inspect-duration": `${motion.durationMs}ms`,
        "--inspect-easing": motion.easing,
      } as CSSProperties
    : undefined;

  return (
    <div
      ref={rootRef}
      data-trap="true"
      data-motion={motion.enabled ? "on" : "off"}
      data-closing={closing}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={motionVars}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="sf-inspect__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`sf-inspect ${className}`}>
        <button type="button" className="sf-inspect__close" onClick={onClose} aria-label="Close search">
          <Icon name="x" size={18} />
        </button>
      </div>
    </div>
  );
}
