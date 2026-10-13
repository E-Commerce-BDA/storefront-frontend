"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/shell/Navbar";
import SearchMount, { preloadSearchOverlay } from "@/components/shell/SearchMount";
import type { ResolvedNavSettings } from "@/lib/shell/navSettings";

/** Auth routes stay chromeless — the island self-suppresses (no
 * conditional markup in the shell; layout always mounts this). */
const AUTH_PATHS = ["/signin", "/signup", "/forgot"];

const COLLAPSE_MS = 220;

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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const [barHidden, setBarHidden] = useState(false);

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
    const onScroll = () => setBarHidden(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [nav.bar.sticky]);

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

  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

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
        onMenuOpen={() => setMobileOpen(true)}
        onMenuClose={() => setMobileOpen(false)}
        onSearchOpen={() => setSearchOpen(true)}
        onSearchPreload={preload}
      />
      <SearchMount search={nav.search} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
