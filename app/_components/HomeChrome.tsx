"use client";

import { useState } from "react";
import AnnouncementBar from "@/components/shell/AnnouncementBar";
import NavLinks from "@/components/shell/NavLinks";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";

export interface HomeAnnouncement {
  items: { text: string; cta: { label: string; href: string } | null; countdownTo: string }[];
  showArrows: boolean;
  dismissible: boolean;
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
  const [active, setActive] = useState(0);
  const count = announcement.items.length;

  return (
    <>
      {!dismissed && (
        <AnnouncementBar
          items={announcement.items}
          activeIndex={count === 0 ? 0 : active % count}
          showArrows={announcement.showArrows}
          dismissible={announcement.dismissible}
          onDismiss={() => setDismissed(true)}
          onPrev={() => setActive((a) => (a - 1 + count) % count)}
          onNext={() => setActive((a) => (a + 1) % count)}
        />
      )}
      <NavLinks links={links} />
    </>
  );
}
