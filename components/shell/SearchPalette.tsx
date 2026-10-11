import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { Badge, Icon, Pill } from "@/components/ui";
import type { SearchResult } from "@/lib/search/source";
import { tagTone } from "@/lib/search/tagTone";
import type { SearchStatus } from "@/app/hooks/useSearch";
import type { ResolvedOverlayMotion } from "@/lib/search/motion";
import { DEFAULT_NAV_SETTINGS, type ResolvedPaletteSettings } from "@/lib/shell/navSettings";

/**
 * Dumb palette modal (overlay variant "palette") — centered card (photo
 * §sf-024): search row, filter Pills, trending + recent columns,
 * matching-product rows with ratings + quick-add, kbd footer.
 *
 * Results, query, dept, active index, trending, recent and added ids
 * arrive as props (hook-owned); this file renders regions and fires
 * callbacks. No fetch, no timers. Rows nest a select button + a
 * quick-add Pill inside a div (nested <button>s are illegal HTML).
 */
export interface SearchPaletteProps {
  query: string;
  results: SearchResult[];
  status?: SearchStatus;
  dept?: string;
  departments?: string[];
  /** Empty-query trending terms (demo list today, TrendingSource later). */
  trending?: string[];
  /** Visit-memory recent terms (useRecentSearches owns). */
  recent?: string[];
  /** Empty-query product grid (curated-before-typing rule, see below). */
  curated?: SearchResult[];
  placeholder?: string;
  activeIndex?: number;
  /** Ids the quick-add hook reports added (row flips to Added). */
  addedIds?: string[];
  /** Ids mid-flight (row disables — explicit solids, never opacity). */
  pendingIds?: string[];
  onQuery: (q: string) => void;
  onDept?: (d: string) => void;
  onActive?: (i: number) => void;
  onSelect?: (r: SearchResult) => void;
  onQuickAdd?: (r: SearchResult) => void;
  onTrending?: (term: string) => void;
  onClearRecent?: () => void;
  onClose: () => void;
  /**
   * Resolved paint (concrete values, preset already resolved upstream).
   * Inlined as --pl-* vars — the component never sees knob names.
   * Default imports builtins (a 27-field literal mirror would rot;
   * DEFAULT_* stays the one home for literals).
   */
  theme?: ResolvedPaletteSettings;
  /**
   * Resolved takeover motion. Default rides theme.paletteAnimation
   * (flat prop wins when both arrive — same trio rule as copy).
   */
  motion?: ResolvedOverlayMotion;
  /** True while the owner animates dismissal (CSS fades, then unmounts). */
  closing?: boolean;
  className?: string;
}

const BUILTIN_THEME = DEFAULT_NAV_SETTINGS.search.palette;

export default function SearchPalette({
  query,
  results,
  status = "idle",
  dept = "All",
  departments = ["All"],
  trending = [],
  recent = [],
  curated = [],
  placeholder = "Search products, materials (e.g. linen, suede), or categories…",
  activeIndex = 0,
  addedIds = [],
  pendingIds = [],
  onQuery,
  onDept,
  onActive,
  onSelect,
  onQuickAdd,
  onTrending,
  onClearRecent,
  onClose,
  theme = BUILTIN_THEME,
  motion,
  closing = false,
  className = "",
}: SearchPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const typing = query.trim().length >= 2;
  const anim = motion ?? theme.paletteAnimation;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Locked feel-test verdict: trap wins (same contract as sheet/editorial —
  // centered modal still traps; Tab cycles inside, Esc closes).
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
  // for tests, not paint. data-blur/data-card DO paint — state reaches
  // CSS only through attrs, never class toggles.
  // Curated-before-typing (search-overlays.md §5): empty query shows the
  // curated grid, 2+ chars switch to live results — the photo's
  // empty-input-with-products is this rule, not a contradiction.
  const curatedShown = dept === "All" ? curated : curated.filter((r) => r.category === dept);
  const pool = typing ? results : curatedShown;

  function cycle(dir: 1 | -1) {
    if (pool.length === 0) return;
    onActive?.((activeIndex + dir + pool.length) % pool.length);
  }

  // Theme vars ride inline (presentation via props — no new lib module).
  // Pill faces map 1:1 onto --pill-* vars (see components/ui/Pill).
  // Motion vars only when enabled (CSS fallbacks stay instant-safe).
  const themeVars = {
    "--pl-card": theme.cardBg,
    "--pl-backdrop": theme.backdrop,
    "--pl-backdrop-alpha": `${theme.backdropAlpha}%`,
    "--pl-blur-px": `${theme.blurPx}px`,
    "--pl-input": theme.inputColor,
    "--pl-placeholder": theme.placeholderColor,
    "--pl-icon": theme.iconColor,
    "--pl-close": theme.closeColor,
    "--pl-muted": theme.mutedColor,
    "--pl-heading": theme.headingColor,
    "--pl-name": theme.nameColor,
    "--pl-price": theme.priceColor,
    "--pl-rating": theme.ratingColor,
    "--pl-dept": theme.deptColor,
    "--pill-bg": theme.pillActiveBg,
    "--pill-active-text": theme.pillActiveText,
    "--pill-text": theme.pillText,
    "--pill-border": theme.pillBorder,
    "--pill-chip-bg": theme.pillChipBg,
    "--pill-action-bg": theme.quickAddBg,
    "--pill-action-text": theme.quickAddText,
    "--pill-added-bg": theme.quickAddedBg,
    "--pill-added-text": theme.quickAddedText,
    "--pl-thumb": `${theme.thumbRadius}px`,
    ...(anim.enabled
      ? {
          "--pl-duration": `${anim.durationMs}ms`,
          "--pl-easing": anim.easing,
        }
      : {}),
  } as CSSProperties;

  const showColumns = !typing && (trending.length > 0 || recent.length > 0);

  return (
    <div
      ref={rootRef}
      data-trap="true"
      data-motion={anim.enabled ? "on" : "off"}
      data-closing={closing}
      data-blur={theme.blur}
      data-card={theme.cardType}
      className={`sf-searchpalette ${className}`}
      style={themeVars}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <div className="sf-searchpalette__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="sf-searchpalette__card">
        <div className="sf-searchpalette__searchrow">
          <span className="sf-searchpalette__searchicon" aria-hidden="true">
            <Icon name="search" size={22} />
          </span>
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
            aria-label="Search products, materials, or categories"
            autoComplete="off"
            className="sf-searchpalette__input"
          />
          <span className="sf-searchpalette__divider" aria-hidden="true" />
          <kbd className="sf-searchpalette__esc">ESC</kbd>
          {/* Bare X (photo has no circle): 36px hit area, transparent —
              IconButton's circle would add chrome the photo rejects. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="sf-searchpalette__x"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="sf-searchpalette__filters" role="group" aria-label="Filter by department">
          <span className="sf-searchpalette__filters-label">Filters:</span>
          {departments.map((d) => (
            <Pill
              key={d}
              variant="filter"
              active={d === dept}
              aria-pressed={d === dept}
              onClick={() => onDept?.(d)}
            >
              {d}
            </Pill>
          ))}
        </div>
        {showColumns && (
          <div className="sf-searchpalette__columns">
            {trending.length > 0 && (
              <div className="sf-searchpalette__col">
                <p className="sf-searchpalette__colhead">
                  <Icon name="flame" size={15} />
                  Trending right now
                </p>
                <div className="sf-searchpalette__chips">
                  {trending.map((t) => (
                    <Pill key={t} variant="chip" onClick={() => onTrending?.(t)}>
                      {t}
                      <Icon name="arrow-up-right" size={14} />
                    </Pill>
                  ))}
                </div>
              </div>
            )}
            {recent.length > 0 && (
              <div className="sf-searchpalette__col">
                <div className="sf-searchpalette__recenthead">
                  <p className="sf-searchpalette__colhead">Recent searches</p>
                  <button
                    type="button"
                    className="sf-searchpalette__clear"
                    onClick={onClearRecent}
                  >
                    Clear all
                  </button>
                </div>
                <div className="sf-searchpalette__recent">
                  {recent.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="sf-searchpalette__recentrow"
                      onClick={() => onTrending?.(t)}
                    >
                      <Icon name="clock" size={15} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="sf-searchpalette__products-head">
          <p className="sf-searchpalette__products-title">Matching Products ({pool.length})</p>
          <p className="sf-searchpalette__hint">Use ↑ ↓ then Enter</p>
        </div>
        {status === "loading" && typing ? (
          <p className="sf-searchpalette__empty" role="status">
            Searching…
          </p>
        ) : !typing && curatedShown.length === 0 ? (
          <p className="sf-searchpalette__empty">No products to show.</p>
        ) : typing && pool.length === 0 ? (
          <p className="sf-searchpalette__empty" role="status">
            No matches for “{query.trim()}”.
          </p>
        ) : (
          <div className="sf-searchpalette__rows">
            {pool.map((r, i) => {
              const added = addedIds.includes(r.id);
              const pending = pendingIds.includes(r.id);
              return (
                <div
                  key={r.id}
                  className="sf-searchpalette__row"
                  data-active={i === activeIndex}
                >
                  <button
                    type="button"
                    className="sf-searchpalette__select"
                    onClick={() => onSelect?.(r)}
                    aria-label={`${r.name}, $${r.price}`}
                  >
                    <span className="sf-searchpalette__thumb" aria-hidden="true">
                      {r.image !== "" ? (
                        // alt="" is deliberate: the select button already
                        // announces "name, $price" — a named img would
                        // double-announce (same rule as editorial cards).
                        <img src={r.image} alt="" loading="lazy" />
                      ) : (
                        <span className="sf-searchpalette__initial">{r.name.charAt(0)}</span>
                      )}
                    </span>
                    <span className="sf-searchpalette__meta">
                      <span className="sf-searchpalette__tagrow">
                        {r.tag && <Badge tone={tagTone(r.tag)}>{r.tag}</Badge>}
                        <span className="sf-searchpalette__dept">{r.category}</span>
                      </span>
                      <span className="sf-searchpalette__name">{r.name}</span>
                      <span className="sf-searchpalette__pricerow">
                        <span>${r.price}</span>
                        {r.rating !== undefined && (
                          <span className="sf-searchpalette__rating">
                            <Icon name="star" size={13} filled />
                            {r.rating.toFixed(1)}
                            {r.ratingCount !== undefined && <span>({r.ratingCount})</span>}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  <Pill
                    variant="action"
                    state={added ? "added" : undefined}
                    disabled={pending}
                    onClick={() => onQuickAdd?.(r)}
                    aria-label={added ? `${r.name} added to bag` : `Quick add ${r.name} to bag`}
                  >
                    {added && <Icon name="check" size={14} />}
                    {added ? "Added" : "Quick Add"}
                  </Pill>
                </div>
              );
            })}
          </div>
        )}
        <div className="sf-searchpalette__footer">
          <p className="sf-searchpalette__kbd-hints">
            <span>
              <kbd>↵</kbd> Select
            </span>
            <span>
              <kbd>↑↓</kbd> Navigate
            </span>
            <span>
              <kbd>Tab</kbd> Cycle
            </span>
          </p>
          <p className="sf-searchpalette__count">
            {pool.length} available {pool.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>
    </div>
  );
}
