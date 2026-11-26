"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
import { initialWishlistMachine, wishlistMachine } from "@/lib/wishlist/machine";
import type { Status } from "@/lib/machine/status";

export interface WishlistContextValue {
  items: HydratedWishlistEntry[];
  ids: readonly string[];
  count: number;
  status: Status;
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
  const [machine, dispatch] = useReducer(wishlistMachine, undefined, initialWishlistMachine);
  const { items, status, pendingIds, optimisticIds, guestPrompt } = machine;
  // A2: one read at a time, with a monotonic sequence. A second caller is
  // coalesced into the in-flight read instead of starting a racing refresh.
  const loadingRef = useRef(false);
  const seqRef = useRef(0);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const seq = ++seqRef.current;
    dispatch({ type: "refresh/start", seq });

    try {
      await postConsumePending();
      const res = await fetchWishlist();
      if (res.ok) dispatch({ type: "refresh/success", seq, items: res.data.items });
      else dispatch({ type: "refresh/error", seq });
    } catch {
      dispatch({ type: "refresh/error", seq });
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

      if (existing) {
        dispatch({ type: "toggle/remove-optimistic", productId, itemId: existing.id });
        const res = await deleteWishlistItem(existing.id);
        if (!res.ok) {
          dispatch({ type: "toggle/remove-failure", productId, entry: existing });
          return false;
        }
        dispatch({ type: "toggle/remove-success", productId });
        return true;
      }

      // Optimistic add: paint the saved face immediately. The machine keeps the
      // id until its own write settles, so a coalesced refresh cannot revert it.
      dispatch({ type: "toggle/add-optimistic", productId });
      const res = await postWishlistItem(productId);
      if (!res.ok) {
        // A17: the parked product resumes on the public product route, never
        // /account (proxy-guarded for signed-out shoppers).
        dispatch({
          type: "toggle/add-failure",
          productId,
          ...(res.status === 401
            ? {
                guestNext:
                  typeof window !== "undefined"
                    ? window.location.pathname + window.location.search
                    : "/products",
              }
            : {}),
        });
        return false;
      }
      dispatch({ type: "toggle/add-success", productId });
      await refresh();
      return true;
    },
    [items, refresh],
  );

  const remove = useCallback(
    async (itemId: string): Promise<boolean> => {
      const target = items.find((it) => it.id === itemId);
      if (target === undefined) return false;

      dispatch({ type: "toggle/remove-optimistic", productId: target.productId, itemId });
      const res = await deleteWishlistItem(itemId);
      if (!res.ok) {
        dispatch({ type: "toggle/remove-failure", productId: target.productId, entry: target });
        return false;
      }
      dispatch({ type: "toggle/remove-success", productId: target.productId });
      return true;
    },
    [items],
  );

  const dismissGuestPrompt = useCallback(() => dispatch({ type: "prompt/dismiss" }), []);

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

