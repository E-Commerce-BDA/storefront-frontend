"use client";

import { useCallback, useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/shell/Navbar";
import SearchMount, { preloadSearchOverlay } from "@/components/shell/SearchMount";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { resolveAccountMenu } from "@/lib/shell/accountMenu";
import { markCurrentNavLinks } from "@/lib/shell/resolveNav";
import type { ResolvedNavSettings } from "@/lib/shell/navSettings";
import { initialNavbarMachine, navbarMachine } from "@/lib/navbar/machine";
import { initialOverlayMachine, overlayMachine } from "@/lib/overlay/machine";
import { initialNavUiMachine, navUiMachine } from "@/lib/shell/navUiMachine";

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
  // sf-086: the four shell disclosures share one reducer; a route change or
  // Escape cannot desync them the way independent booleans could.
  const [ui, dispatchUi] = useReducer(navUiMachine, undefined, initialNavUiMachine);
  // The search overlay's open/close lifecycle is machine state too — a stale
  // boolean could otherwise reopen the sheet with the previous query's face.
  const [overlay, dispatchOverlay] = useReducer(overlayMachine, undefined, initialOverlayMachine);
  const searchOpen = overlay.open;
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    hidden: barHidden,
    badgeCount,
    badgeCap,
    destination,
    currentHref,
    status,
  } = shell;

  // A14: a route change restores the bar before any scroll event can re-hide it.
  // sf-080: the resolved knobs are machine state, not parallel locals.
  useEffect(() => {
    dispatch({ type: "navigate", pathname, currentHref: pathname });
    // A route change cannot leave a mega menu hanging over the new page.
    dispatchUi({ type: "mega/close" });
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
    if (ms == null || count < 2 || ui.announcementDismissed) return;
    const t = setInterval(() => dispatchUi({ type: "announcement/next", count }), ms);
    return () => clearInterval(t);
  }, [nav.announcement.autoplayMs, count, ui.announcementDismissed]);

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
    const anyOpen = ui.accountMenuOpen || ui.megaMenuLabel !== null || ui.mobileOpen;
    if (!anyOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dispatchUi({ type: "account/close" });
      dispatchUi({ type: "mega/close" });
      dispatchUi({ type: "mobile/close" });
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-accountmenu-anchor]") === null) {
        dispatchUi({ type: "account/close" });
      }
      // The trigger and the panel are both inside the navbar; a click anywhere
      // else is an outside dismissal for the mega menu.
      if (
        ui.megaMenuLabel !== null &&
        target.closest("[data-megamenu]") === null &&
        target.closest(".sf-megamenu") === null
      ) {
        dispatchUi({ type: "mega/close" });
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [ui.accountMenuOpen, ui.megaMenuLabel, ui.mobileOpen]);

  // Two-phase dismiss (HomeChrome pattern, preserved verbatim): collapsing
  // class animates, unmount follows. Instant when animation is off or
  // reduced-motion is preferred.
  useEffect(
    () => () => {
      if (collapseTimer.current !== null) clearTimeout(collapseTimer.current);
    },
    [],
  );

  function dismiss() {
    if (!nav.announcement.collapseAnimation || prefersReducedMotion()) {
      dispatchUi({ type: "announcement/dismiss/finish" });
      return;
    }
    dispatchUi({ type: "announcement/dismiss/start" });
    collapseTimer.current = setTimeout(
      () => dispatchUi({ type: "announcement/dismiss/finish" }),
      COLLAPSE_MS,
    );
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
        links={markCurrentNavLinks(nav.links.items, currentHref)}
        megaMenu={{
          activeLabel: ui.megaMenuLabel,
          onToggle: (label) => dispatchUi({ type: "mega/toggle", label }),
        }}
        announcement={{
          items: ui.announcementDismissed ? [] : items,
          showArrows: nav.announcement.showArrows,
          activeIndex: count === 0 ? 0 : ui.announcementIndex % count,
          countdownText: "",
          dismissible: nav.announcement.dismissible,
          collapsing: ui.announcementClosing,
          onDismiss: dismiss,
          onPrev: () => dispatchUi({ type: "announcement/prev", count }),
          onNext: () => dispatchUi({ type: "announcement/next", count }),
        }}
        isMobile={isMobile}
        mobileOpen={ui.mobileOpen}
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
        account={{ onOpen: () => dispatchUi({ type: "account/toggle" }) }}
        accountMenu={{
          model: ACCOUNT_MENU,
          open: ui.accountMenuOpen,
          onClose: () => dispatchUi({ type: "account/close" }),
        }}
        wishlist={{ count: wishlist.count, onOpen: () => router.push("/wishlist") }}
        onMenuOpen={() => dispatchUi({ type: "mobile/open" })}
        onMenuClose={() => dispatchUi({ type: "mobile/close" })}
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
