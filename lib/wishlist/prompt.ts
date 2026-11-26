/**
 * Guest wishlist prompt model — sf-056
 *
 * Pure: the copy and sign-in target for "save this later" are decided here,
 * not in the island. The pending product is already held in the HttpOnly
 * `sf_pw` cookie by POST /api/wishlist/items; this only tells the shopper what
 * happens next. No `next=productUrl` guessing — the return path is the page
 * they were on when they tried to save.
 */

export interface WishlistGuestPrompt {
  title: string;
  body: string;
  signInHref: string;
  signInLabel: string;
  dismissLabel: string;
  productName?: string;
}

export function resolveWishlistGuestPrompt(
  currentPath: string,
  options: { productName?: string } = {},
): WishlistGuestPrompt {
  // A17: /account and /checkout are proxy-guarded; returning a signed-out
  // shopper there would bounce straight back to sign-in in a loop.
  const safePath =
    currentPath.startsWith("/") &&
    !currentPath.startsWith("//") &&
    !/^\/(account|checkout)(\/|$|\?)/.test(currentPath);
  const next = safePath ? currentPath : "/products";
  return {
    title: "Sign in to save this item",
    body: "We'll keep your pick ready and add it to your wishlist as soon as you sign in.",
    signInHref: `/signin?next=${encodeURIComponent(next)}`,
    signInLabel: "Sign in",
    dismissLabel: "Not now",
    ...(options.productName ? { productName: options.productName } : {}),
  };
}
