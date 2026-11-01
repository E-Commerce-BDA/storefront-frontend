"use client";

/**
 * CartView — the `/cart` island — sf-051
 * (plan §8; shell-cart.md §4: two surfaces, one reducer)
 *
 * `/cart` and the mini drawer render the *same* store, so this island holds no
 * cart data of its own — it lays out what `CartProvider` already reconciles. The
 * row face is `CartLineItem`, the arithmetic is `lib/cart/state.ts`, and the only
 * thing owned here is the *submission cadence*.
 *
 * **Qty writes are debounced per line** (shell-cart.md §4). A shopper holding the
 * "+" key intends one final number, not six PATCHes; and a write aimed at a line
 * whose earlier write is still in flight races the server's own total. So each
 * line gets one timer, and while that timer runs the row shows the typed number
 * from a local draft — the stepper must not snap back to the store's stale value
 * mid-think, or the control reads as broken.
 *
 * "Empty cart" is the batch remove v1 can honestly offer. Selective batch needs a
 * per-line checkbox vocabulary (sf-058), so it is not faked with a select-all
 * that no other surface has.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, Icon } from "@/components/ui";
import CartLineItem from "@/components/shell/CartLineItem";
import { useCart } from "@/app/_components/CartProvider";

/** The quiet tap before a quantity leaves the island (shell-cart.md §4). */
export const CART_QTY_DEBOUNCE_MS = 350;

export default function CartView() {
  const cart = useCart();
  const router = useRouter();

  /** Typed-but-unsubmitted quantities, keyed by line id (see header note). */
  const [draft, setDraft] = useState<Record<string, number>>({});
  const draftRef = useRef(draft);
  const [inFlight, setInFlight] = useState<Record<string, boolean>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // A navigation away must not strand a timer that PATCHes into a dead tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  function changeQty(itemId: string, qty: number) {
    // `draftRef` is the live source of truth and state mirrors it for render: a
    // timer can fire before React flushes (batched taps), and writing the ref
    // from a state-updater function would break under StrictMode double-invoke.
    const nextDraft = { ...draftRef.current, [itemId]: qty };
    draftRef.current = nextDraft;
    setDraft(nextDraft);

    const running = timers.current.get(itemId);
    if (running !== undefined) clearTimeout(running);

    timers.current.set(
      itemId,
      setTimeout(() => {
        timers.current.delete(itemId);
        // Read the draft at fire time: the last scheduled tap is the truth,
        // not whichever click-time number closed over this callback.
        const finalQty = draftRef.current[itemId] ?? qty;
        setInFlight((prev) => ({ ...prev, [itemId]: true }));
        void cart.setQty(itemId, finalQty).then(() => {
          // The store has answered either way (applied or reverted); its number
          // is the truth from here on.
          setInFlight((prev) => ({ ...prev, [itemId]: false }));
          const settled = { ...draftRef.current };
          delete settled[itemId];
          draftRef.current = settled;
          setDraft(settled);
        });
      }, CART_QTY_DEBOUNCE_MS),
    );
  }

  if (cart.status === "loading" && cart.items.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]" role="status">
        Loading your cart…
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="shopping-bag" size={22} />}
        title="Your cart is empty"
        body="Nothing here yet — the products page is a good place to start."
        action={
          <Button variant="light" onClick={() => router.push("/products")}>
            Continue shopping
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <ul className="m-0 grid list-none gap-4 p-0" role="list">
        {cart.items.map((line) => (
          <CartLineItem
            key={line.id}
            line={{ ...line, qty: draft[line.id] ?? line.qty }}
            pending={inFlight[line.id] === true}
            onQty={changeQty}
            onRemove={(itemId) => void cart.remove(itemId)}
          />
        ))}
      </ul>

      <aside className="flex flex-col gap-4 self-start">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[var(--text-muted)]">
            {cart.count} {cart.count === 1 ? "item" : "items"}
          </span>
          <span className="text-lg font-semibold text-[var(--color-ink)]">${cart.subtotal}</span>
        </div>

        <Button fullWidth onClick={() => router.push("/checkout")}>
          Checkout
        </Button>
        <Button variant="ghost-ink" fullWidth onClick={() => void cart.clear()}>
          Empty cart
        </Button>
        <Button variant="light" fullWidth onClick={() => router.push("/products")}>
          Continue shopping
        </Button>
      </aside>
    </div>
  );
}
