/**
 * Navbar UI machine — sf-086. Pure.
 *
 * The prototype's overlay machine drives one disclosure at a time; the shell
 * has four independent ones (mobile drawer, account menu, announcement bar,
 * search), so N booleans would let Escape or a route change close the wrong
 * one. One reducer owns all four; the search overlay keeps its own machine.
 */
import type { Status } from "@/lib/machine/status";

export interface NavUiMachineState {
  mobileOpen: boolean;
  accountMenuOpen: boolean;
  /** CMS mega-menu trigger label; null = no disclosure. One at a time. */
  megaMenuLabel: string | null;
  announcementDismissed: boolean;
  announcementClosing: boolean;
  announcementIndex: number;
  status: Status;
}

export type NavUiMachineEvent =
  | { type: "mobile/open" }
  | { type: "mobile/close" }
  | { type: "account/toggle" }
  | { type: "account/close" }
  | { type: "mega/toggle"; label: string }
  | { type: "mega/close" }
  | { type: "announcement/next"; count: number }
  | { type: "announcement/prev"; count: number }
  | { type: "announcement/dismiss/start" }
  | { type: "announcement/dismiss/finish" }
  | { type: "load/ready" };

export function initialNavUiMachine(): NavUiMachineState {
  return {
    mobileOpen: false,
    accountMenuOpen: false,
    megaMenuLabel: null,
    announcementDismissed: false,
    announcementClosing: false,
    announcementIndex: 0,
    status: "idle",
  };
}

function wrap(index: number, count: number): number {
  return count === 0 ? 0 : ((index % count) + count) % count;
}

export function navUiMachine(
  state: NavUiMachineState,
  event: NavUiMachineEvent,
): NavUiMachineState {
  switch (event.type) {
    case "mobile/open":
      return { ...state, mobileOpen: true, megaMenuLabel: null };
    case "mobile/close":
      return { ...state, mobileOpen: false };
    case "account/toggle":
      // One disclosure at a time: opening the account menu dismisses the mega
      // menu (the prototype's overlay machine makes the same promise).
      return { ...state, accountMenuOpen: !state.accountMenuOpen, megaMenuLabel: null };
    case "account/close":
      return { ...state, accountMenuOpen: false };
    case "mega/toggle":
      return { ...state, megaMenuLabel: state.megaMenuLabel === event.label ? null : event.label };
    case "mega/close":
      return { ...state, megaMenuLabel: null };
    case "announcement/next":
      return { ...state, announcementIndex: wrap(state.announcementIndex + 1, event.count) };
    case "announcement/prev":
      return { ...state, announcementIndex: wrap(state.announcementIndex - 1, event.count) };
    case "announcement/dismiss/start":
      return { ...state, announcementClosing: true };
    case "announcement/dismiss/finish":
      return { ...state, announcementClosing: false, announcementDismissed: true };
    case "load/ready":
      return { ...state, status: "ready" };
  }
}
