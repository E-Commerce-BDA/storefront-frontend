"use client";

import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { Icon, Toast } from "@/components/ui";
import { resolveSearchOverlay, type SearchOverlayId } from "./searchRegistry";
import { useSearch } from "@/app/hooks/useSearch";
import { useRecentSearches } from "@/app/hooks/useRecentSearches";
import { useQuickAdd } from "@/app/hooks/useQuickAdd";
import { createDemoSource, DEMO_CATALOG, DEMO_TRENDING } from "@/lib/search/demoSource";
import { createDemoQuickAdd } from "@/lib/cart/quickAdd";
import type { SearchResult } from "@/lib/search/source";
import type { ResolvedNavSettings } from "@/lib/shell/navSettings";
import type { ResolvedOverlayMotion } from "@/lib/search/motion";

// TODO(cms-svc): curated/trending/sources arrive as props from the CMS
// read (same shapes); demo imports below are the throwaway seam —
// search-svc/cart-svc swap one line each, callers never change.
type AnyOverlay = ComponentType<Record<string, unknown>>;

const lazyCache = new Map<string, LazyExoticComponent<AnyOverlay>>();

function loaderFor(variant: SearchOverlayId): (() => Promise<{ default: AnyOverlay }>) | null {
  return resolveSearchOverlay(variant);
}

/**
 * Warm the chunk for `variant` (trigger hover/focus calls this — the
 * overlay opens instantly on click). Safe to call repeatedly; module
 * registry dedupes by specifier.
 */
export function preloadSearchOverlay(variant: SearchOverlayId): void {
  const key = variant === "classic" ? "sheet" : variant;
  if (lazyCache.has(key)) return;
  // Null loader means classic requested with no classic file — the sheet
  // is the production fallback (documented; a Classic file flips this).
  const loader = loaderFor(key as SearchOverlayId) ?? loaderFor("sheet");
  if (!loader) return;
  lazyCache.set(key, lazy(loader));
}

function lazyFor(variant: SearchOverlayId): LazyExoticComponent<AnyOverlay> | null {
  preloadSearchOverlay(variant);
  const key = variant === "classic" ? "sheet" : variant;
  return lazyCache.get(key) ?? null;
}

export interface SearchMountProps {
  search: ResolvedNavSettings["search"];
  open: boolean;
  onClose: () => void;
}

/**
 * Search assembler — owns the query/dept/active/recent/quick-add state
 * and renders the admin-selected overlay (lazy chunk, only that one).
 * Closed overlay mounts nothing (chunk + DOM both absent until open).
 */
export default function SearchMount({ search, open, onClose }: SearchMountProps) {
  const source = useMemo(() => createDemoSource(), []);
  const quickAddPort = useMemo(() => createDemoQuickAdd(), []);
  const live = useSearch(source);
  const recents = useRecentSearches();
  const quickAdd = useQuickAdd(quickAddPort);
  const [activeIndex, setActiveIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const addedCountRef = useRef(0);

  const variant = search.overlayVariant;
  const motion: ResolvedOverlayMotion =
    variant === "sheet"
      ? search.sheetAnimation
      : variant === "editorial"
        ? search.editorial.editorialAnimation
        : search.palette.paletteAnimation;

  const departments = useMemo(() => {
    const cats = Array.from(new Set(DEMO_CATALOG.map((p) => p.category)));
    return ["All", ...cats];
  }, []);

  // Two-phase close: closing flag plays the exit, unmount follows after
  // the resolved duration. Instant when motion is off.
  function close() {
    if (!motion.enabled) {
      onClose();
      return;
    }
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, motion.durationMs);
  }

  function select(r: SearchResult) {
    recents.push(r.name);
    close();
  }

  // Notify demo (notifyOnQuickAdd default on): Toast follows addedIds,
  // auto-dismisses in 3s. The assembler owns the effect — the Toast
  // holds no timers itself.
  useEffect(() => {
    if (variant !== "palette" || !search.palette.notifyOnQuickAdd) {
      addedCountRef.current = quickAdd.addedIds.length;
      return;
    }
    if (quickAdd.addedIds.length > addedCountRef.current) {
      const id = quickAdd.addedIds[quickAdd.addedIds.length - 1];
      const row = [...DEMO_CATALOG, ...live.results].find((p) => p.id === id);
      setToast({ title: "Added to bag", message: row ? row.name : "" });
      const t = setTimeout(() => setToast(null), 3000);
      addedCountRef.current = quickAdd.addedIds.length;
      return () => clearTimeout(t);
    }
    addedCountRef.current = quickAdd.addedIds.length;
    return undefined;
  }, [quickAdd.addedIds, variant, search.palette.notifyOnQuickAdd, live.results]);

  if (!open && !closing) return null;
  const LazyOverlay = lazyFor(variant);
  if (!LazyOverlay) return null;

  const shared = {
    query: live.query,
    results: live.results,
    status: live.status,
    dept: live.dept,
    departments,
    placeholder: search.placeholder,
    activeIndex,
    closing,
    onQuery: (q: string) => {
      live.setQuery(q);
      setActiveIndex(0);
    },
    onDept: live.setDept,
    onActive: setActiveIndex,
    onSelect: select,
    onClose: close,
    motion,
  };

  // Per-variant props (registry erases types at the boundary; props are
  // checked here at the call site — the documented cast point).
  const props: Record<string, unknown> =
    variant === "sheet"
      ? { ...shared }
      : variant === "editorial"
        ? {
            ...shared,
            curated: DEMO_CATALOG,
            theme: search.editorial,
          }
        : {
            ...shared,
            trending: DEMO_TRENDING,
            recent: recents.recent,
            curated: DEMO_CATALOG,
            addedIds: quickAdd.addedIds,
            pendingIds: quickAdd.pendingIds,
            onQuickAdd: (r: SearchResult) => quickAdd.quickAdd(r.id),
            onTrending: (t: string) => {
              live.setQuery(t);
              setActiveIndex(0);
              recents.push(t);
            },
            onClearRecent: recents.clear,
            theme: search.palette,
          };

  return (
    <>
      <Suspense fallback={null}>
        <LazyOverlay {...props} />
      </Suspense>
      <Toast
        open={toast !== null}
        title={toast?.title ?? ""}
        message={toast?.message}
        icon={<Icon name="check" size={16} />}
        onClose={() => setToast(null)}
      />
    </>
  );
}
