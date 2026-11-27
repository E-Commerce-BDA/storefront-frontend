/**
 * Account tab machine — sf-085. Pure. The prototype's AccountTabMachine has
 * six locations; the URL is the source of truth in Next, so the reducer is used
 * by the account shell to translate a route into one tab without inventing a
 * second navigation store. Events mirror the prototype so deep links land on
 * the same face.
 */

export type AccountTab =
  | "overview"
  | "orders"
  | "orderDetail"
  | "addresses"
  | "wishlist"
  | "profile";

export interface AccountTabsMachineState {
  tab: AccountTab;
}

export type AccountTabsMachineEvent =
  | { type: "OVERVIEW" }
  | { type: "ORDERS" }
  | { type: "ORDER_DETAIL" }
  | { type: "ADDRESSES" }
  | { type: "WISHLIST" }
  | { type: "PROFILE" };

export function initialAccountTabsMachine(tab: AccountTab = "overview"): AccountTabsMachineState {
  return { tab };
}

function tabFor(event: AccountTabsMachineEvent): AccountTab {
  switch (event.type) {
    case "OVERVIEW":
      return "overview";
    case "ORDERS":
      return "orders";
    case "ORDER_DETAIL":
      return "orderDetail";
    case "ADDRESSES":
      return "addresses";
    case "WISHLIST":
      return "wishlist";
    case "PROFILE":
      return "profile";
  }
}

export function accountTabsMachine(
  state: AccountTabsMachineState,
  event: AccountTabsMachineEvent,
): AccountTabsMachineState {
  const next = tabFor(event);
  return next === state.tab ? state : { tab: next };
}

/**
 * A `?tab=` deep link is untrusted input; a junk value falls to overview rather
 * than being reinterpreted as the nearest tab. `orderDetail` is not linkable —
 * it needs an order id in the path, so it is only reachable after a row click.
 */
export function parseAccountTab(value: unknown): AccountTab {
  return value === "orders" ||
    value === "addresses" ||
    value === "wishlist" ||
    value === "profile"
    ? value
    : "overview";
}

export function accountTabHref(tab: AccountTab): string {
  return tab === "overview" ? "/account" : `/account?tab=${tab}`;
}

/** The tab a link lands on becomes the machine event — no string casting. */
export function accountTabEvent(tab: AccountTab): AccountTabsMachineEvent {
  switch (tab) {
    case "overview":
      return { type: "OVERVIEW" };
    case "orders":
      return { type: "ORDERS" };
    case "orderDetail":
      return { type: "ORDER_DETAIL" };
    case "addresses":
      return { type: "ADDRESSES" };
    case "wishlist":
      return { type: "WISHLIST" };
    case "profile":
      return { type: "PROFILE" };
  }
}
