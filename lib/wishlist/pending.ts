/**
 * Pending guest wishlist cookie — sf_pw
 *
 * 15 minutes HttpOnly cookie storing the product ID a guest attempted to save.
 * On login, /api/wishlist/consume-pending claims this product into the user's
 * cart-svc wishlist without client-side localStorage.
 */

export const PENDING_WISHLIST_COOKIE = "sf_pw";
export const PENDING_WISHLIST_TTL_SECONDS = 15 * 60; // 15 mins

export interface CookieSpec {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export interface CookieReader {
  get(name: string): { value: string } | undefined;
}

export function buildPendingWishlistCookie(
  productId: string,
  options: { secure: boolean },
): CookieSpec {
  return {
    name: PENDING_WISHLIST_COOKIE,
    value: productId,
    httpOnly: true,
    secure: options.secure,
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_WISHLIST_TTL_SECONDS,
  };
}

export function clearPendingWishlistCookie(options: { secure: boolean }): CookieSpec {
  return {
    name: PENDING_WISHLIST_COOKIE,
    value: "",
    httpOnly: true,
    secure: options.secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}

export function readPendingWishlist(reader: CookieReader): string | null {
  const c = reader.get(PENDING_WISHLIST_COOKIE);
  if (!c || !c.value || !c.value.trim()) return null;
  return c.value.trim();
}

