"use client";

/**
 * Page-view tracker — sf-052
 *
 * Mounted once in the root layout. Sends a pageview beacon when the route
 * changes and one heartbeat when the page is left. Uses sendBeacon because the
 * browser queues it and forgets it — there is no pending fetch to slow a
 * navigation, and nothing for the UI to handle when tracking is down.
 *
 * It never reads a service URL or holds a credential; the only destination is
 * this origin's /api/track. Consent is checked here (browser signals) and again
 * in the route (opt-out cookie), so a declined shopper is not counted even if
 * a stale island is still mounted.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackingAllowed } from "@/lib/analytics/consent";
import { TRACK_OPTOUT_COOKIE } from "@/lib/analytics/consent";

const TRACK_PATH = "/api/track";

function cookieValue(name: string): string | undefined {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return undefined;
}

function device(): "desktop" | "mobile" | "tablet" {
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const startedAt = useRef<number>(Date.now());
  const exited = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    exited.current = false;

    const navigatorSignals = {
      doNotTrack: navigator.doNotTrack,
      globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl,
    };
    const optout = cookieValue(TRACK_OPTOUT_COOKIE);
    if (!trackingAllowed(navigatorSignals, optout)) return;

    const page = `${window.location.pathname}${window.location.search}`;
    const referrer = document.referrer || undefined;
    const payload = { page, eventKind: "pageview" as const, referrer, device: device() };
    navigator.sendBeacon?.(TRACK_PATH, new Blob([JSON.stringify(payload)], { type: "application/json" }));

    const sendExit = () => {
      if (exited.current) return;
      exited.current = true;
      const exitPayload = {
        page,
        eventKind: "heartbeat" as const,
        exited: true,
        durationMs: Math.max(0, Date.now() - startedAt.current),
      };
      navigator.sendBeacon?.(
        TRACK_PATH,
        new Blob([JSON.stringify(exitPayload)], { type: "application/json" }),
      );
    };

    window.addEventListener("pagehide", sendExit);
    return () => window.removeEventListener("pagehide", sendExit);
  }, [pathname]);

  return null;
}
