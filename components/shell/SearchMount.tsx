"use client";

import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui";
import { resolveSearchOverlay, type SearchOverlayId } from "./searchRegistry";
import { useSearch } from "@/app/hooks/useSearch";
import { fromSearchResults } from "@/lib/commerce/fromSearch";
import { useRecentSearches } from "@/app/hooks/useRecentSearches";
import { useQuickAdd } from "@/app/hooks/useQuickAdd";
import { useCart } from "@/app/_components/CartProvider";
import { createHttpSearchSource } from "@/lib/search/httpSource";
import { fetchPaletteTrending } from "@/lib/search/trendingClient";
import { createCartPort } from "@/lib/cart/port";
import type { SearchResult } from "@/lib/search/source";
import type { ResolvedNavSettings } from "@/lib/shell/navSettings";
import type { ResolvedOverlayMotion } from "@/lib/search/motion";
import {
  initialSearchMountMachine,
  searchMountMachine,
} from "@/lib/search/mountMachine";

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
  const router = useRouter();
  const cart = useCart();
  const refresh = cart.refresh;

  const source = useMemo(() => createHttpSearchSource(), []);
  const quickAddPort = useMemo(
    () => createCartPort({ onAdded: () => void refresh() }),
    [refresh],
  );

  const live = useSearch(source);
  const recents = useRecentSearches();
  const quickAdd = useQuickAdd(quickAddPort);
  // A21: the active row is machine state now — a new query resets it in the
  // same transition that publishes the new results, no follow-up effect.
  const { activeIndex, setActive: setActiveIndex } = live;
  // sf-086: exit, toast and editorial assets are one mount machine; the query
  // remains owned by useSearch, so no two owners can fight over results.
  const [{ closing, toast, trending, curated }, dispatch] = useReducer(
    searchMountMachine,
    undefined,
    initialSearchMountMachine,
  );
  const addedCountRef = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
      if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    },
    [],
  );

  const variant = search.overlayVariant;
  const motion: ResolvedOverlayMotion =
    variant === "sheet"
      ? search.sheetAnimation
      : variant === "editorial"
        ? search.editorial.editorialAnimation
        : search.palette.paletteAnimation;

  // Static v1 list, not CMS/settings-sourced — departments exist only because
  // the palette expects a filter vocabulary; sf-066 tracks the real endpoint.
  const departments = useMemo(() => ["All", "Products"], []);

  // sf-066: trending/curated arrive from search-svc once an overlay opens —
  // no network for a closed palette. Abort on close so a slow response cannot
  // paint a region after the overlay is gone.
  useEffect(() => {
    if (!open || (variant !== "palette" && variant !== "editorial")) return;
    const controller = new AbortController();
    void fetchPaletteTrending(controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      dispatch({ type: "assets/success", terms: data.terms, curated: data.curated });
    });
    return () => controller.abort();
  }, [open, variant]);

  // Two-phase close: closing flag plays the exit, unmount follows after
  // the resolved duration. Instant when motion is off.
  function close() {
    if (!motion.enabled) {
      onClose();
      return;
    }
    dispatch({ type: "close/start" });
    closeTimer.current = setTimeout(() => {
      onClose();
      dispatch({ type: "close/finish" });
    }, motion.durationMs);
  }

  function select(r: SearchResult) {
    recents.push(r.name);
    close();
    if (r.url) {
      router.push(r.url);
    }
  }

  // Notify on quick add
  useEffect(() => {
    if (variant !== "palette" || !search.palette.notifyOnQuickAdd) {
      addedCountRef.current = quickAdd.addedIds.length;
      return;
    }
    if (quickAdd.addedIds.length > addedCountRef.current) {
      const id = quickAdd.addedIds[quickAdd.addedIds.length - 1];
      const row = live.results.find((p) => p.id === id);
      dispatch({ type: "toast/show", toast: { title: "Added to bag", message: row ? row.name : "" } });
      toastTimer.current = setTimeout(() => dispatch({ type: "toast/clear" }), 3000);
      addedCountRef.current = quickAdd.addedIds.length;
      return () => {
        if (toastTimer.current !== null) clearTimeout(toastTimer.current);
      };
    }
    addedCountRef.current = quickAdd.addedIds.length;
    return undefined;
  }, [quickAdd.addedIds, variant, search.palette.notifyOnQuickAdd, live.results]);

  if (!open && !closing) return null;
  const LazyOverlay = lazyFor(variant);
  if (!LazyOverlay) return null;

  const shared = {
    query: live.query,
    // One mapper feeds all three overlays: a search row is a card with media,
    // not a letter tile invented per variant.
    results: fromSearchResults(live.results),
    status: live.status,
    dept: live.dept,
    departments,
    placeholder: search.placeholder,
    onQuery: live.setQuery,
    onQueryChange: live.setQuery,
    onDept: live.setDept,
    onDeptChange: live.setDept,
    onSelect: select,
    onClose: close,
    onClear: () => live.setQuery(""),
    closing,
  };

  const overlayNode =
    variant === "sheet" ? (
      <LazyOverlay
        {...shared}
        activeIndex={activeIndex}
        onActive={setActiveIndex}
        motion={search.sheetAnimation}
        onQuickAdd={(item: SearchResult) => quickAdd.quickAdd(item.id)}
        addedIds={quickAdd.addedIds}
        pendingIds={quickAdd.pendingIds}
      />
    ) : variant === "editorial" ? (
      <LazyOverlay
        {...shared}
        theme={search.editorial}
        motion={search.editorial.editorialAnimation}
        curated={fromSearchResults(curated)}
        activeIndex={activeIndex}
        onActive={setActiveIndex}
        onActiveChange={setActiveIndex}
        onQuickAdd={(item: SearchResult) => quickAdd.quickAdd(item.id)}
        addedIds={quickAdd.addedIds}
        pendingIds={quickAdd.pendingIds}
      />
    ) : (
      <LazyOverlay
        {...shared}
        theme={search.palette}
        settings={search.palette}
        motion={search.palette.paletteAnimation}
        trending={trending}
        curated={fromSearchResults(curated)}
        recent={recents.recent}
        recents={recents.recent}
        onClearRecent={recents.clear}
        onClearRecents={recents.clear}
        onTrending={(term: string) => live.setQuery(term)}
        activeIndex={activeIndex}
        onActive={setActiveIndex}
        onActiveChange={setActiveIndex}
        onQuickAdd={(item: SearchResult) => quickAdd.quickAdd(item.id)}
        addedIds={quickAdd.addedIds}
        pendingIds={quickAdd.pendingIds}
      />
    );

  return (
    <>
      <Suspense fallback={null}>{overlayNode}</Suspense>
      {toast ? (
        <div className="sf-toast-wrap">
          <Toast
            open={true}
            title={toast.title}
            message={toast.message}
            onClose={() => dispatch({ type: "toast/clear" })}
          />
        </div>
      ) : null}
    </>
  );
}
