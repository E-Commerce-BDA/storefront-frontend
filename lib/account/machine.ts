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
