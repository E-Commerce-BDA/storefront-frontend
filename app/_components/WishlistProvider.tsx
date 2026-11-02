"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/events";
import {
  deleteWishlistItem,
  fetchWishlist,
  postConsumePending,
  postWishlistItem,
} from "@/lib/wishlist/port";
import type { HydratedWishlistEntry } from "@/lib/wishlist/schemas";

export interface WishlistContextValue {
  items: HydratedWishlistEntry[];
  ids: readonly string[];
  count: number;
  status: "idle" | "loading" | "ready" | "error";
  has: (productId: string) => boolean;
  itemFor: (productId: string) => HydratedWishlistEntry | undefined;
  toggle: (productId: string) => Promise<boolean>;
  remove: (itemId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  pendingIds: readonly string[];
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<HydratedWishlistEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setStatus((prev) => (prev === "idle" ? "loading" : prev));

    try {
      // First try consuming any pending guest wishlist item
      await postConsumePending();
      const res = await fetchWishlist();
      if (res.ok) {
        setItems(res.data.items);
        setStatus("ready");
      } else {
        // If unauthenticated or unavailable, treat as empty
        setItems([]);
        setStatus(res.status === 401 ? "ready" : "error");
      }
    } catch {
      setItems([]);
      setStatus("error");
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleAuthChange = () => {
      void refresh();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, [refresh]);

  const has = useCallback(
    (productId: string) => items.some((it) => it.productId === productId),
    [items],
  );

  const itemFor = useCallback(
    (productId: string) => items.find((it) => it.productId === productId),
    [items],
  );

  const toggle = useCallback(
    async (productId: string): Promise<boolean> => {
      const existing = items.find((it) => it.productId === productId);
      setPendingIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));

      if (existing) {
        // Optimistic remove
        setItems((prev) => prev.filter((it) => it.id !== existing.id));
        const res = await deleteWishlistItem(existing.id);
        setPendingIds((prev) => prev.filter((id) => id !== productId));
        if (!res.ok) {
          // Rollback
          setItems((prev) => [...prev, existing]);
          return false;
        }
        return true;
      } else {
        const res = await postWishlistItem(productId);
        setPendingIds((prev) => prev.filter((id) => id !== productId));

        if (!res.ok) {
          if (res.status === 401) {
            // Guest attempted to save: pending cookie is set by BFF, redirect to sign-in
            const next = typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : "/";
            router.push(`/signin?next=${encodeURIComponent(next)}`);
          }
          return false;
        }

        // Refresh list to pull full hydrated product
        await refresh();
        return true;
      }
    },
    [items, refresh, router],
  );

  const remove = useCallback(
    async (itemId: string): Promise<boolean> => {
      const target = items.find((it) => it.id === itemId);
      if (!target) return false;

      const pId = target.productId;
      setPendingIds((prev) => (prev.includes(pId) ? prev : [...prev, pId]));
      setItems((prev) => prev.filter((it) => it.id !== itemId));

      const res = await deleteWishlistItem(itemId);
      setPendingIds((prev) => prev.filter((id) => id !== pId));

      if (!res.ok) {
        // Rollback
        setItems((prev) => [...prev, target]);
        return false;
      }
      return true;
    },
    [items],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      ids: items.map((i) => i.productId),
      count: items.length,
      status,
      has,
      itemFor,
      toggle,
      remove,
      refresh,
      pendingIds,
    }),
    [items, status, has, itemFor, toggle, remove, refresh, pendingIds],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

const DEFAULT_WISHLIST: WishlistContextValue = {
  items: [],
  ids: [],
  count: 0,
  status: "idle",
  has: () => false,
  itemFor: () => undefined,
  toggle: async () => false,
  remove: async () => false,
  refresh: async () => {},
  pendingIds: [],
};

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return DEFAULT_WISHLIST;
  }
  return ctx;
}

