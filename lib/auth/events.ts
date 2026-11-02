/**
 * Global auth events
 *
 * Used across client islands (CartProvider, WishlistProvider, etc.) to react
 * when a user signs in, registers, or logs out.
 */

export const AUTH_CHANGED_EVENT = "sf:auth-changed";

export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

