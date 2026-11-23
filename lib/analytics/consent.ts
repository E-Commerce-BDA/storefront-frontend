/**
 * Tracking consent — sf-052
 *
 * Pure so both the client island and the BFF route use the same rule. A user
 * who has said "do not track" through their browser, or who has explicitly
 * opted out in this storefront, is not counted. Default is on, matching the
 * anonymous-session model in 5.Features.md C5; there is no opt-in UI in this
 * slice, so an explicit opt-out cookie is the only storefront-side signal.
 */

export interface NavigatorSignals {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

export const TRACK_OPTOUT_COOKIE = "sf_track_optout";

export function trackingAllowed(
  signals: NavigatorSignals,
  optoutCookie: string | undefined | null,
): boolean {
  if (signals.doNotTrack === "1") return false;
  if (signals.globalPrivacyControl === true) return false;
  if (optoutCookie !== undefined && optoutCookie !== null && optoutCookie !== "") {
    return false;
  }
  return true;
}
