import type { ReactNode } from "react";

/**
 * Auth routes layout — conversion surface, no storefront chrome.
 *
 * sf-079: `.sf-shop` and the `100vh - 160px` reservation both went away. The
 * auth blocks own their own height (`.sf-auth__split` already reserves the
 * viewport minus its own chrome) and their own gutter, so this wrapper only
 * provides the `main` landmark. Rejected alternative: keeping `.sf-shop` — it
 * added 28/64px block padding and a second inline gutter to a page that has no
 * navbar or footer to align with.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}
