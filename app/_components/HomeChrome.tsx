"use client";

import { useState } from "react";
import AnnouncementBar from "@/components/shell/AnnouncementBar";
import NavLinks from "@/components/shell/NavLinks";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";

export interface HomeAnnouncement {
  items: { text: string; cta: { label: string; href: string } | null; countdownTo: string }[];
  showArrows: boolean;
  dismissible: boolean;
  collapseAnimation: boolean;
}

const COLLAPSE_MS = 220;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Route island: home chrome interaction state (dismissed bar, active
 * slide). Owned by app/page.tsx only. Server resolves everything;
 * this island remembers UI state and nothing else.
 */
export default function HomeChrome({
  announcement,
  links,
}: {
  announcement: HomeAnnouncement;
  links: ResolvedNavLink[];
}) {
  const [dismissed, setDismissed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const count = announcement.items.length;

  // Two-phase dismiss: collapsing class animates (CSS grid-rows), unmount
  // follows after the transition. Instant when animation is off or
  // reduced-motion is preferred — never make users wait out a transition.
  function dismiss() {
    if (!announcement.collapseAnimation || prefersReducedMotion()) {
      setDismissed(true);
      return;
    }
    setClosing(true);
    setTimeout(() => setDismissed(true), COLLAPSE_MS);
  }

  return (
    <>
      {!dismissed && (
        <AnnouncementBar
          items={announcement.items}
          activeIndex={count === 0 ? 0 : active % count}
          showArrows={announcement.showArrows}
          dismissible={announcement.dismissible}
          collapsing={closing}
          onDismiss={dismiss}
          onPrev={() => setActive((a) => (a - 1 + count) % count)}
          onNext={() => setActive((a) => (a + 1) % count)}
        />
      )}
      <NavLinks links={links} />
    </>
  );
}
