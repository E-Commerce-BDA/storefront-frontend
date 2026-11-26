/**
 * Navbar shell machine — sf-074 (A14, A16). Pure.
 * A14: `data-hidden` is navigation-scoped — a route change always restores the
 * bar, so a scroll-hidden state cannot leak into the next page.
 * A16: resolved knobs are state, not dead config: badge text/cap and cart
 * destination are consumed from the same machine the shell renders from.
 */
import type { Status } from "@/lib/machine/status";

export interface NavbarMachineState {
  pathname: string;
  hidden: boolean;
  sticky: boolean;
  badgeCount: number;
  badgeCap: number;
  badgeVisible: boolean;
  destination: "drawer" | "page";
  currentHref: string | null;
  status: Status;
}

export type NavbarMachineEvent =
  | { type: "navigate"; pathname: string; currentHref?: string }
  | { type: "scroll/hide" }
  | { type: "scroll/show" }
  | { type: "cart/count"; count: number; cap: number; visible: boolean }
  | { type: "cart/destination"; destination: "drawer" | "page" }
  | { type: "load/ready" };

export function initialNavbarMachine(pathname = "/"): NavbarMachineState {
  return {
    pathname,
    hidden: false,
    sticky: true,
    badgeCount: 0,
    badgeCap: 9,
    badgeVisible: true,
    destination: "drawer",
    currentHref: null,
    status: "idle",
  };
}

export function navbarMachine(
  state: NavbarMachineState,
  event: NavbarMachineEvent,
): NavbarMachineState {
  switch (event.type) {
    case "navigate":
      // A14: the new page starts with a visible bar regardless of scroll.
      return {
        ...state,
        pathname: event.pathname,
        currentHref: event.currentHref ?? null,
        hidden: false,
      };
    case "scroll/hide":
      return state.sticky ? { ...state, hidden: true } : state;
    case "scroll/show":
      return { ...state, hidden: false };
    case "cart/count":
      return {
        ...state,
        badgeCount: Math.max(0, Math.min(event.count, event.cap)),
        badgeCap: event.cap,
        badgeVisible: event.visible,
      };
    case "cart/destination":
      return { ...state, destination: event.destination };
    case "load/ready":
      return { ...state, status: "ready" };
  }
}
