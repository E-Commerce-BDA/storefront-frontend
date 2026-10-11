import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { Badge, Icon, IconButton } from "@/components/ui";
import type { SearchResult } from "@/lib/search/source";
import { tagTone } from "@/lib/search/tagTone";
import type { SearchStatus } from "@/app/hooks/useSearch";
import type { ResolvedOverlayMotion } from "@/lib/search/motion";
import { DEFAULT_NAV_SETTINGS, type ResolvedEditorialSettings } from "@/lib/shell/navSettings";

/**
 * Dumb editorial takeover (overlay variant "editorial") — scrollable
 * full-screen archive search (photo §sf-023): header eyebrow + X close,
 * serif giant input, curated grid with dept tabs.
 *
 * Results, query, dept and active index arrive as props (hook-owned);
 * this file renders regions and fires callbacks. No fetch, no timers.
 *
 * Empty query shows `curated` (the photo's grid-before-typing); 2+ chars
 * switch the grid to live `results`. Card badges resolve through the
 * tagTone lib map — this file never switches on tag strings.
 */
export interface SearchEditorialProps {
  query: string;
  results: SearchResult[];
  status?: SearchStatus;
  dept?: string;
  departments?: string[];
  /** Empty-query grid (throwaway demo rows today, CMS collections later). */
  curated?: SearchResult[];
  placeholder?: string;
  activeIndex?: number;
  /** Flat copy wins over theme (trio rule: flat > object > resolver). */
  eyebrow?: string;
  archiveEyebrow?: string;
  title?: string;
  onQuery: (q: string) => void;
  onDept?: (d: string) => void;
  onActive?: (i: number) => void;
  onSelect?: (r: SearchResult) => void;
  onClose: () => void;
  /**
   * Resolved paint + copy (concrete values, preset already resolved
   * upstream). Inlined as --ed-* vars — the component never sees knob
   * names. Default imports builtins (a 24-field literal mirror would rot;
   * DEFAULT_* stays the one home for literals).
   */
  theme?: ResolvedEditorialSettings;
  /**
   * Resolved takeover motion. Default rides theme.editorialAnimation
   * (flat prop wins when both arrive — same trio rule as copy).
   */
  motion?: ResolvedOverlayMotion;
  /** True while the owner animates dismissal (CSS fades, then unmounts). */
  closing?: boolean;
  className?: string;
}

const BUILTIN_THEME = DEFAULT_NAV_SETTINGS.search.editorial;

export default function SearchEditorial({
  query,
  results,
  status = "idle",
  dept = "All",
  departments = ["All"],
  curated = [],
  placeholder = "Type anything (e.g. Linen, Boots, Suede…)",
  activeIndex = 0,
  eyebrow,
  archiveEyebrow,
  title,
  onQuery,
  onDept,
  onActive,
  onSelect,
  onClose,
  theme = BUILTIN_THEME,
  motion,
  closing = false,
  className = "",
}: SearchEditorialProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const typing = query.trim().length >= 2;
  const anim = motion ?? theme.editorialAnimation;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Locked feel-test verdict: trap wins (same contract as sheet/drawers —
  // full-screen scroll still traps; Tab cycles inside, Esc closes).
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

  // Reason for data-* below: trap/motion/variant roots are behavior hooks
  // for tests, not paint. data-blur/data-tabshape/data-card DO paint —
  // state reaches CSS only through attrs, never class toggles.
  const curatedShown = dept === "All" ? curated : curated.filter((r) => r.category === dept);
  const pool = typing ? results : curatedShown;

  function cycle(dir: 1 | -1) {
    if (pool.length === 0) return;
    onActive?.((activeIndex + dir + pool.length) % pool.length);
  }

  // Theme vars ride inline (presentation via props — no new lib module).
  // Motion vars only when enabled (CSS fallbacks stay instant-safe).
  const themeVars = {
    "--ed-bg": theme.bg,
    "--ed-alpha": `${theme.bgAlpha}%`,
    "--ed-blur-px": `${theme.blurPx}px`,
    "--ed-eyebrow": theme.eyebrowColor,
    "--ed-archive": theme.archiveColor,
    "--ed-input": theme.inputColor,
    "--ed-placeholder": theme.placeholderColor,
    "--ed-underline": theme.underlineColor,
    "--ed-title": theme.titleColor,
    "--ed-muted": theme.mutedColor,
    "--ed-close": theme.closeIconColor,
    "--ed-tab": theme.tabTextColor,
    "--ed-tab-bg": theme.tabActiveBg,
    "--ed-tab-text": theme.tabActiveText,
    "--ed-radius": `${theme.cardRadius}px`,
    "--ed-dept": theme.deptColor,
    "--ed-name": theme.nameColor,
    "--ed-price": theme.priceColor,
    ...(anim.enabled
      ? {
          "--ed-duration": `${anim.durationMs}ms`,
          "--ed-easing": anim.easing,
        }
      : {}),
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      data-trap="true"
      data-motion={anim.enabled ? "on" : "off"}
      data-closing={closing}
      data-blur={theme.blur}
      data-tabshape={theme.tabShape}
      data-card={theme.cardType}
      className={`sf-editorial ${className}`}
      style={themeVars}
      role="dialog"
      aria-modal="true"
      aria-label="Editorial search"
    >
      <div className="sf-editorial__panel">
        <div className="sf-editorial__head">
          <p className="sf-editorial__eyebrow">{eyebrow ?? theme.eyebrow}</p>
          <div className="sf-editorial__close-cluster">
            <kbd className="sf-editorial__esc">ESC</kbd>
            <IconButton label="Close search" onClick={onClose} style={{ color: "var(--ed-close)" }}>
              <Icon name="x" />
            </IconButton>
          </div>
        </div>
        <div className="sf-editorial__body">
          <p className="sf-editorial__archive">{archiveEyebrow ?? theme.archiveEyebrow}</p>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                cycle(1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                cycle(-1);
              } else if (e.key === "Enter" && pool[activeIndex]) {
                onSelect?.(pool[activeIndex]);
              }
            }}
            placeholder={placeholder}
            aria-label="Search the archive"
            autoComplete="off"
            className="sf-editorial__input"
          />
          <div className="sf-editorial__curated-head">
            {/* h2, never h1 — SEO rule: the page keeps its single h1; the
                overlay mounts only when open so crawlers see no duplicate. */}
            <h2 className="sf-editorial__title">{title ?? theme.title}</h2>
            <div className="sf-editorial__tabs" role="group" aria-label="Filter by department">
              {departments.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-active={d === dept}
                  onClick={() => onDept?.(d)}
                  aria-pressed={d === dept}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {status === "loading" && typing ? (
            <p className="sf-editorial__empty" role="status">
              Searching…
            </p>
          ) : !typing && curatedShown.length === 0 ? (
            <p className="sf-editorial__empty">The archive is empty.</p>
          ) : typing && pool.length === 0 ? (
            <p className="sf-editorial__empty" role="status">
              No matches for “{query.trim()}”.
            </p>
          ) : (
            <div className="sf-editorial__grid">
              {pool.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  className="sf-editorial__card"
                  data-active={i === activeIndex}
                  onClick={() => onSelect?.(r)}
                  aria-label={`${r.name}, $${r.price}`}
                >
                  <span className="sf-editorial__media" aria-hidden="true">
                    {r.image !== "" ? (
                      // alt="" is deliberate: the card button already
                      // announces "name, $price" — a named img would
                      // double-announce. No eslint in this repo, so no
                      // disable comment for next/image either: plain img
                      // keeps CMS URLs working with zero config.
                      <img src={r.image} alt="" loading="lazy" />
                    ) : (
                      <span className="sf-editorial__initial">{r.name.charAt(0)}</span>
                    )}
                    {r.tag && <Badge tone={tagTone(r.tag)}>{r.tag}</Badge>}
                  </span>
                  <span className="sf-editorial__dept">{r.category}</span>
                  <span className="sf-editorial__name">{r.name}</span>
                  <span className="sf-editorial__price">${r.price}</span>
                </button>
              ))}
            </div>
          )}
          <p className="sf-editorial__count">
            {pool.length} {pool.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>
    </div>
  );
}
