/**
 * Account menu model — sf-072
 *
 * Pure: the shell dropdown's links and sign-out target. Both the client island
 * (NavbarMount) and the dumb AccountMenu consume this one shape, so the link
 * set and the form action cannot drift apart at two call sites.
 */

export const ACCOUNT_MENU_LINKS = [
  { label: "My account", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
] as const;

export const SIGN_OUT_ACTION = "/api/auth/logout";
export const PUBLIC_SHELL_PATH = "/";

export interface AccountMenuLink {
  label: string;
  href: string;
}

export interface AccountMenuModel {
  links: readonly AccountMenuLink[];
  signOut: { action: string; next: string; label: string };
}

/** Resolver owns the values; the component has no defaults of its own. */
export function resolveAccountMenu(): AccountMenuModel {
  return {
    links: ACCOUNT_MENU_LINKS,
    signOut: { action: SIGN_OUT_ACTION, next: PUBLIC_SHELL_PATH, label: "Sign out" },
  };
}

/**
 * A form-supplied redirect target is only safe when it is a same-origin
 * relative path. `//host` and `/\host` are protocol-relative escapes that a
 * browser would treat as off-origin, so both are refused here rather than
 * trusted by `NextResponse.redirect`.
 */
export function isSafeNextPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
}
