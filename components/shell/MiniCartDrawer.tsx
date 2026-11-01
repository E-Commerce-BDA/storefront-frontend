import { useEffect, useRef } from "react";
import { Button, EmptyState, Icon } from "@/components/ui";
import CartLineItem from "./CartLineItem";
import type { CartItemDto } from "@/lib/cart/schemas";

/**
 * Dumb MiniCartDrawer — the navbar's cart peek (shell-cart.md §4, A4.1).
 *
 * Standalone, not a `Dialog` variant (decision 15): a drawer needs Escape/overlay
 * close and focus restore the same way `MobileDrawer` does, and bolting a
 * `placement` prop onto a shipped primitive would churn five artifacts to save
 * none. `open`/`onClose` stay parent-owned (CartProvider holds the flag) — the
 * block only *calls* onClose, it holds no disclosure state.
 *
 * Lines come from the store, so the drawer and `/cart` never disagree; each row
 * routes its own qty/remove back up through the same handlers. An empty cart is
 * a face, not a blank panel — `EmptyState` with a "keep shopping" action wired to
 * close. Money renders as `${subtotal}`, the house raw-number face.
 */
export interface MiniCartDrawerTotals {
  subtotal: number;
  itemCount: number;
}

export interface MiniCartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItemDto[];
  totals: MiniCartDrawerTotals;
  status: "idle" | "loading" | "ready" | "error";
  onQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  onCheckout: () => void;
  className?: string;
}

export default function MiniCartDrawer({
  open,
  onClose,
  items,
  totals,
  status,
  onQty,
  onRemove,
  onCheckout,
  className = "",
}: MiniCartDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Escape + focus trap (parent owns `open`; these only call onClose / move focus).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = panelRef.current;
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
  }, [open, onClose]);

  // Hand focus into the panel on open, give it back to the trigger on close —
  // a shopper who opened with the keyboard must not land on `document.body`.
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      returnFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const empty = items.length === 0;
  const loading = status === "loading" && empty;
  const errored = status === "error" && empty;

  return (
    <div className={`sf-minicart ${className}`} role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="sf-minicart__overlay" onClick={onClose} aria-hidden="true" />
      <div className="sf-minicart__panel" ref={panelRef} tabIndex={-1} data-trap="true">
        <header className="sf-minicart__head">
          <p className="sf-minicart__title">
            Your cart{totals.itemCount > 0 ? ` (${totals.itemCount})` : ""}
          </p>
          <button type="button" className="sf-minicart__x" onClick={onClose} aria-label="Close cart">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="sf-minicart__body">
          {loading ? (
            <p className="sf-minicart__note">Loading your cart…</p>
          ) : errored ? (
            <EmptyState
              title="We couldn't load your cart"
              body="Please try again in a moment."
            />
          ) : empty ? (
            <EmptyState
              icon={<Icon name="shopping-bag" size={22} />}
              title="Your cart is empty"
              action={<Button variant="light" onClick={onClose}>Continue shopping</Button>}
            />
          ) : (
            <ul className="sf-minicart__lines" role="list">
              {items.map((line) => (
                <CartLineItem key={line.id} line={line} onQty={onQty} onRemove={onRemove} />
              ))}
            </ul>
          )}
        </div>

        {!empty && !loading ? (
          <footer className="sf-minicart__foot">
            <p className="sf-minicart__subtotal">
              Subtotal <span>${totals.subtotal}</span>
            </p>
            <Button fullWidth onClick={onCheckout}>
              Checkout
            </Button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
