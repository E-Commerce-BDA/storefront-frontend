import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui";
import type { ResolvedOverlayMotion } from "@/lib/search/motion";

/**
 * Dumb inspect-modal shell (overlay variant "inspect") — backdrop, centered
 * frame, query input row, close, focus trap. List / preview / actions
 * regions land next turns as separate components. The input row is shell
 * chrome (like close): controlled query/onQuery pair, autofocus on mount.
 * props → JSX. No fetch, no timers.
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
  /**
   * Controlled query input row (shell chrome, like close — the click-path
   * audit proved an input owned by no region renders a dead shell).
   * Placeholder only; value + changes stay owner-held.
   */
  query?: string;
  onQuery?: (q: string) => void;
  placeholder?: string;
  /**
   * Region slots (composition, not imports — shell stays region-ignorant;
   * absent slots render absent columns). Parent composes list left,
   * preview+actions right.
   */
  list?: ReactNode;
  detail?: ReactNode;
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
  query,
  onQuery,
  placeholder = "Search products…",
  list,
  detail,
  className = "",
}: SearchInspectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        {typeof query === "string" && typeof onQuery === "function" && (
          <div className="sf-inspect__bar">
            <Icon name="search" size={20} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={placeholder}
              aria-label="Search products"
              autoComplete="off"
            />
          </div>
        )}
        <button type="button" className="sf-inspect__close" onClick={onClose} aria-label="Close search">
          <Icon name="x" size={18} />
        </button>
        {(list !== undefined || detail !== undefined) && (
          <div className="sf-inspect__body">
            {list !== undefined && <div className="sf-inspect__col-list">{list}</div>}
            {detail !== undefined && <div className="sf-inspect__col-detail">{detail}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
