"use client";

/**
 * Cart store — sf-051
 * (plan §9: React context + pure reducer, no new dependency)
 *
 * One provider in the root layout holds the whole cart: the navbar badge, the
 * mini drawer, `/cart` and `/checkout` all read from here instead of each
 * fetching. That is deliberate — a second source of truth means the badge and
 * the drawer disagree after a quantity change, which is the single most
 * visible bug in an e-commerce header.
 *
 * Three decisions:
 *
 * - **The reducer owns the arithmetic** (`lib/cart/state.ts`), so "optimistic
 *   then revert" is one line here and fully unit-tested there.
 * - **Every mutation is optimistic and reverts on failure** with a toast. The
 *   shopper sees the quantity change immediately; if the BFF refuses (stock,
 *   network), the line snaps back to `before` rather than showing a lie.
 * - **`add` inserts a placeholder line** (no name, no price) because a grid
 *   card does not carry the authoritative price. The real line arrives with the
 *   response and overwrites it via `applyItem`; the count is correct
 *   immediately, which is the visible feedback. A pending line has no server id
 *   (`isPendingId`), so qty/remove ignore it until it settles — those writes
 *   would 404 on an id cart-svc has never seen.
 *
 * The drawer itself is mounted by `MiniCartDrawer`'s owner (commit 12); this
 * file owns `drawerOpen` so the navbar trigger and the cart page can move it
 * without prop-drilling through the layout.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";
import MiniCartDrawer from "@/components/shell/MiniCartDrawer";
import {
  clearCart,
  deleteCartItem,
  getCart,
  patchCartQty,
  postCartItem,
} from "@/lib/cart/port";
import type { CartItemDto } from "@/lib/cart/schemas";
import {
  applyAdd,
  applyItem,
  applyQty,
  applyRemove,
  emptyCart,
  isPendingId,
  lineKey,
  pendingItemId,
  reconcile,
  toView,
  type CartState,
} from "@/lib/cart/state";

export type CartStatus = "idle" | "loading" | "ready" | "error";

export interface AddOptions {
  qty?: number;
  variantId?: string;
}

export interface CartContextValue {
  items: CartItemDto[];
  /** Units, not lines. */
  count: number;
  subtotal: number;
  empty: boolean;
  status: CartStatus;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (productId: string, options?: AddOptions) => Promise<boolean>;
  setQty: (itemId: string, qty: number) => Promise<boolean>;
  remove: (itemId: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (value === null) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return value;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<CartState>(emptyCart);
  const [status, setStatus] = useState<CartStatus>("idle");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  /**
   * A synchronous mirror of `state`. React batches renders, so an `await` that
   * resolves between two mutations would otherwise read a stale `before`.
   */
  const latest = useRef<CartState>(state);

  const commit = useCallback((next: CartState) => {
    latest.current = next;
    setState(next);
  }, []);

  const refresh = useCallback(async () => {
    setStatus((current) => (current === "idle" ? "loading" : current));
    const result = await getCart();
    if (!result.ok) {
      setStatus("error");
      return;
    }
    commit(reconcile(result.data));
    setStatus("ready");
  }, [commit]);

  // One read on mount; a signed-out visitor gets the BFF's empty 200, so this
  // never surfaces an error state on a first visit.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId: string, options: AddOptions = {}) => {
      const qty = options.qty ?? 1;
      const variantId = options.variantId;
      const before = latest.current;

      const optimistic: CartItemDto = {
        id: pendingItemId(lineKey({ productId, variantId })),
        productId,
        variantId: variantId ?? null,
        qty,
        unitPrice: 0,
        productName: "",
      };
      commit(applyAdd(before, optimistic));

      const result = await postCartItem({ productId, variantId, qty });
      if (result.ok) {
        commit(applyItem(latest.current, result.data.item));
        setStatus("ready");
        return true;
      }

      commit(before);
      setNotice(messageFor(result.code, result.status));
      return false;
    },
    [commit],
  );

  const setQty = useCallback(
    async (itemId: string, qty: number) => {
      const next = Math.max(1, Math.trunc(qty));
      if (isPendingId(itemId)) return false;

      const before = latest.current;
      commit(applyQty(before, itemId, next));

      const result = await patchCartQty(itemId, next);
      if (result.ok) {
        commit(applyItem(latest.current, result.data.item));
        return true;
      }

      commit(before);
      setNotice(messageFor(result.code, result.status));
      return false;
    },
    [commit],
  );

  const remove = useCallback(
    async (itemId: string) => {
      if (isPendingId(itemId)) return false;

      const before = latest.current;
      commit(applyRemove(before, itemId));

      const result = await deleteCartItem(itemId);
      if (result.ok) return true;

      commit(before);
      setNotice(messageFor(result.code, result.status));
      return false;
    },
    [commit],
  );

  const clear = useCallback(async () => {
    const before = latest.current;
    commit(emptyCart());

    const result = await clearCart();
    if (result.ok) {
      setStatus("ready");
      return true;
    }

    commit(before);
    setNotice(messageFor(result.code, result.status));
    return false;
  }, [commit]);

  const value = useMemo<CartContextValue>(() => {
    const view = toView(state);
    return {
      items: view.lines,
      count: view.count,
      subtotal: view.subtotal,
      empty: view.empty,
      status,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add,
      setQty,
      remove,
      clear,
      refresh,
    };
  }, [state, status, drawerOpen, add, setQty, remove, clear, refresh]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <MiniCartDrawer
        open={value.drawerOpen}
        onClose={value.closeDrawer}
        items={value.items}
        totals={{ subtotal: value.subtotal, itemCount: value.count }}
        status={value.status}
        onQty={value.setQty}
        onRemove={value.remove}
        onViewCart={() => {
          value.closeDrawer();
          router.push("/cart");
        }}
        onCheckout={() => {
          value.closeDrawer();
          router.push("/checkout");
        }}
      />
      <Toast
        open={notice !== null}
        title={notice ?? ""}
        onClose={() => setNotice(null)}
      />
    </CartContext.Provider>
  );
}

/**
 * Shopper-facing copy for a failed write. Deliberately generic apart from the
 * one case the shopper can act on: an out-of-stock line is removed from the
 * catalogue, everything else is "try again".
 */
function messageFor(code: string | null, status: number): string {
  if (code === "CART_PRODUCT_UNAVAILABLE") {
    return "That item just sold out. It is still in your cart.";
  }
  if (status === 401 || status === 403) {
    return "Please sign in again to update your cart.";
  }
  if (status === 0 || status >= 500) {
    return "The shop is not responding. Please try again.";
  }
  return "We could not update your cart. Please try again.";
}
