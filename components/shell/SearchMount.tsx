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
import { useRouter } from "next/navigation";
import { Icon, Toast } from "@/components/ui";
import { resolveSearchOverlay, type SearchOverlayId } from "./searchRegistry";
import { useSearch } from "@/app/hooks/useSearch";
import { useRecentSearches } from "@/app/hooks/useRecentSearches";
import { useQuickAdd } from "@/app/hooks/useQuickAdd";
import { useCart } from "@/app/_components/CartProvider";
import { createHttpSearchSource } from "@/lib/search/httpSource";
import { createCartPort } from "@/lib/cart/port";
import type { SearchResult } from "@/lib/search/source";
import type { ResolvedNavSettings } from "@/lib/shell/navSettings";
import type { ResolvedOverlayMotion } from "@/lib/search/motion";

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

  const departments = useMemo(() => ["All", "Products"], []);

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
    onQueryChange: live.setQuery,
    onDeptChange: live.setDept,
    onSelect: select,
    onClose: close,
    onClear: () => live.setQuery(""),
  };

  const overlayNode =
    variant === "sheet" ? (
      <LazyOverlay
        {...shared}
        motion={search.sheetAnimation}
        onQuickAdd={(item: SearchResult) => quickAdd.quickAdd(item.id)}
        addedIds={quickAdd.addedIds}
        pendingIds={quickAdd.pendingIds}
      />
    ) : variant === "editorial" ? (
      <LazyOverlay
        {...shared}
        motion={search.editorial.editorialAnimation}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
        onQuickAdd={(item: SearchResult) => quickAdd.quickAdd(item.id)}
        addedIds={quickAdd.addedIds}
        pendingIds={quickAdd.pendingIds}
      />
    ) : (
      <LazyOverlay
        {...shared}
        motion={search.palette.paletteAnimation}
        settings={search.palette}
        recents={recents.recent}
        onClearRecents={recents.clear}
        activeIndex={activeIndex}
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
        <Toast
          open={true}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
