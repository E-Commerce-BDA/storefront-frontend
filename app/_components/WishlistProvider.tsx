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
import WishlistSignInPrompt from "@/components/commerce/WishlistSignInPrompt";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/events";
import {
  deleteWishlistItem,
  fetchWishlist,
  postConsumePending,
  postWishlistItem,
} from "@/lib/wishlist/port";
import { resolveWishlistGuestPrompt } from "@/lib/wishlist/prompt";
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
  /** sf-056: a guest tried to save; the product stays in the sf_pw cookie. */
  guestPromptProductId: string | null;
  dismissGuestPrompt: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<HydratedWishlistEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [optimisticIds, setOptimisticIds] = useState<string[]>([]);
  const [guestPrompt, setGuestPrompt] = useState<{ productId: string; next: string } | null>(null);
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
    (productId: string) =>
      optimisticIds.includes(productId) || items.some((it) => it.productId === productId),
    [items, optimisticIds],
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
        // Optimistic add: paint the saved face immediately, then revert if the
        // write fails. No fake product is inserted — ids drive the toggles,
        // the hydrated card only appears after the real read.
        setOptimisticIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
        const res = await postWishlistItem(productId);
        setOptimisticIds((prev) => prev.filter((id) => id !== productId));
        setPendingIds((prev) => prev.filter((id) => id !== productId));

        if (!res.ok) {
          if (res.status === 401) {
            // The BFF already parked the product in the HttpOnly sf_pw cookie.
            // Prompt rather than yank the shopper off the page; the link carries
            // the current page as `next` so the product is still in reach.
            setGuestPrompt({
              productId,
              next: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/products",
            });
          }
          return false;
        }

        // Refresh list to pull full hydrated product
        await refresh();
        return true;
      }
    },
    [items, refresh],
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

  const dismissGuestPrompt = useCallback(() => setGuestPrompt(null), []);

  // Escape is a request to close, never an owner of the prompt's open-state.
  useEffect(() => {
    if (guestPrompt === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissGuestPrompt();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guestPrompt, dismissGuestPrompt]);

  const ids = useMemo(
    () => Array.from(new Set([...items.map((i) => i.productId), ...optimisticIds])),
    [items, optimisticIds],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      ids,
      count: ids.length,
      status,
      has,
      itemFor,
      toggle,
      remove,
      refresh,
      pendingIds,
      guestPromptProductId: guestPrompt?.productId ?? null,
      dismissGuestPrompt,
    }),
    [items, ids, status, has, itemFor, toggle, remove, refresh, pendingIds, guestPrompt, dismissGuestPrompt],
  );

  const promptModel =
    guestPrompt === null
      ? null
      : resolveWishlistGuestPrompt(guestPrompt.next, {
          productName: items.find((i) => i.productId === guestPrompt.productId)?.product.name,
        });

  return (
    <WishlistContext.Provider value={value}>
      {children}
      {promptModel ? (
        <WishlistSignInPrompt model={promptModel} onDismiss={dismissGuestPrompt} />
      ) : null}
    </WishlistContext.Provider>
  );
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
  guestPromptProductId: null,
  dismissGuestPrompt: () => {},
};

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return DEFAULT_WISHLIST;
  }
  return ctx;
}

