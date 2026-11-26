"use client";

import { useCallback, useEffect, useReducer, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/shell/Navbar";
import SearchMount, { preloadSearchOverlay } from "@/components/shell/SearchMount";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { resolveAccountMenu } from "@/lib/shell/accountMenu";
import type { ResolvedNavSettings } from "@/lib/shell/navSettings";
import { initialNavbarMachine, navbarMachine } from "@/lib/navbar/machine";
import { initialOverlayMachine, overlayMachine } from "@/lib/overlay/machine";

const COLLAPSE_MS = 220;
const ACCOUNT_MENU = resolveAccountMenu();

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Route island: navbar interaction state. Owned by the root layout
 * (all routes); server resolves everything, this island remembers UI
 * state and nothing else. Disclosure, dismissal, slides and scroll-hide
 * live here — values and copy stay server-resolved props.
 */
export default function NavbarMount({ nav }: { nav: ResolvedNavSettings }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const [shell, dispatch] = useReducer(navbarMachine, undefined, () =>
    initialNavbarMachine(pathname),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  // The search overlay's open/close lifecycle is machine state too — a stale
  // boolean could otherwise reopen the sheet with the previous query's face.
  const [overlay, dispatchOverlay] = useReducer(overlayMachine, undefined, initialOverlayMachine);
  const searchOpen = overlay.open;
  const [dismissed, setDismissed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const {
    hidden: barHidden,
    badgeCount,
    badgeCap,
    destination,
    currentHref,
    status,
  } = shell;
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // A14: a route change restores the bar before any scroll event can re-hide it.
  // sf-080: the resolved knobs are machine state, not parallel locals.
  useEffect(() => {
    dispatch({ type: "navigate", pathname, currentHref: pathname });
  }, [pathname]);
  useEffect(() => {
    dispatch({ type: "sticky/set", sticky: nav.bar.sticky !== "static" });
  }, [nav.bar.sticky]);
  useEffect(() => {
    dispatch({
      type: "cart/count",
      count: cart.count,
      cap: nav.cart.badgeCap,
      visible: nav.regions.badge !== false,
    });
  }, [cart.count, nav.cart.badgeCap, nav.regions.badge]);
  useEffect(() => {
    dispatch({ type: "cart/destination", destination: nav.cart.destination });
  }, [nav.cart.destination]);
  useEffect(() => {
    dispatch({ type: "load/ready" });
  }, []);

  const query = `(max-width: ${nav.mobile.breakpoint - 1}px)`;
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  // SSR snapshot false (desktop chrome first paint); client corrects on
  // hydrate — no flash of wrong chrome persists past mount.
  const isMobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );

  const items = nav.announcement.items;
  const count = items.length;

  // Autoplay rotation (owner timer; collapsing/animation live in CSS).
  useEffect(() => {
    const ms = nav.announcement.autoplayMs;
    if (ms == null || count < 2 || dismissed) return;
    const t = setInterval(() => setActive((a) => (a + 1) % count), ms);
    return () => clearInterval(t);
  }, [nav.announcement.autoplayMs, count, dismissed]);

  // Hide-on-scroll (only when the knob selects it; other modes ignore
  // scroll entirely — no listener, no state churn).
  useEffect(() => {
    if (nav.bar.sticky !== "hide-on-scroll") return;
    const onScroll = () => dispatch({ type: window.scrollY > 8 ? "scroll/hide" : "scroll/show" });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [nav.bar.sticky]);

  // The account dropdown is owned here (controlled-only): Escape and an
  // outside pointer merely call the close setter, never own open-state.
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-accountmenu-anchor]") === null
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [accountMenuOpen]);

  // Two-phase dismiss (HomeChrome pattern, preserved verbatim): collapsing
  // class animates, unmount follows. Instant when animation is off or
  // reduced-motion is preferred.
  function dismiss() {
    if (!nav.announcement.collapseAnimation || prefersReducedMotion()) {
      setDismissed(true);
      return;
    }
    setClosing(true);
    setTimeout(() => setDismissed(true), COLLAPSE_MS);
  }

  const preload = useCallback(() => {
    preloadSearchOverlay(nav.search.overlayVariant);
  }, [nav.search.overlayVariant]);


  return (
    <>
      <Navbar
        regions={nav.regions}
        logo={nav.logo}
        bar={{ height: nav.bar.height, sticky: nav.bar.sticky, shadow: nav.bar.shadow, hidden: barHidden }}
        colors={nav.colors}
        links={nav.links.items}
        announcement={{
          items: dismissed ? [] : items,
          showArrows: nav.announcement.showArrows,
          activeIndex: count === 0 ? 0 : active % count,
          countdownText: "",
          dismissible: nav.announcement.dismissible,
          collapsing: closing,
          onDismiss: dismiss,
          onPrev: () => setActive((a) => (a - 1 + count) % count),
          onNext: () => setActive((a) => (a + 1) % count),
        }}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        mobileSide={nav.mobile.drawerSide}
        cart={{
          // A16: the machine caps the badge and owns the resolved destination.
          count: badgeCount,
          badgeCap,
          onOpen:
            destination === "page" ? () => router.push("/cart") : cart.openDrawer,
        }}
        currentHref={currentHref}
        status={status}
        account={{ onOpen: () => setAccountMenuOpen((open) => !open) }}
        accountMenu={{
          model: ACCOUNT_MENU,
          open: accountMenuOpen,
          onClose: () => setAccountMenuOpen(false),
        }}
        wishlist={{ count: wishlist.count, onOpen: () => router.push("/wishlist") }}
        onMenuOpen={() => setMobileOpen(true)}
        onMenuClose={() => setMobileOpen(false)}
        onSearchOpen={() => dispatchOverlay({ type: "open" })}
        onSearchPreload={preload}
      />
      <SearchMount
        search={nav.search}
        open={searchOpen}
        onClose={() => dispatchOverlay({ type: "close/finish" })}
      />
    </>
  );
}
