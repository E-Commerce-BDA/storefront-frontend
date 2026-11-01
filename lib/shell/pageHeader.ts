/**
 * PageHeader model — sf-051 (shell-cart.md §3, pages/routing.md §2).
 *
 * The header itself is pure `props -> JSX`, but a breadcrumb carries one real
 * decision that is not a style: the *last* crumb is where the shopper already
 * is, so it must not be a link and must announce itself as current — even when
 * a caller lazily pastes an `href` on it. Putting that rule in one pure function
 * means `NavLinks`' active logic, this crumb logic and the block all agree the
 * last entry is special, and the resolver-unit tier can prove it without React.
 */

export interface BreadcrumbItem {
  /** Visible crumb text; blank labels are dropped, not rendered empty. */
  label: string;
  /** Destination; a crumb without one renders as plain text. */
  href?: string;
}

/** A crumb after resolution: the block reads `current` and never recomputes it. */
export interface Crumb {
  label: string;
  href?: string;
  current: boolean;
}

/**
 * Normalise a breadcrumb trail: drop blank labels, then mark only the final
 * crumb as current (and strip its href, since "you are here" is not a link).
 *
 * An empty or absent trail returns `[]` — a listing/cart page shows a heading
 * with no upward path, and that is a valid header, not a missing one
 * (`pages/routing.md` §2: top-level trails are noise).
 */
export function resolveBreadcrumbs(items: readonly BreadcrumbItem[] | null | undefined): Crumb[] {
  if (!items || items.length === 0) return [];

  const kept = items.filter((item) => item.label !== undefined && item.label.trim() !== "");
  return kept.map((item, i) => {
    const current = i === kept.length - 1;
    // A current crumb is text, never a link — its href is dropped so a stale
    // caller cannot make the page you are already on look clickable.
    return current ? { label: item.label, current } : { label: item.label, href: item.href, current };
  });
}
