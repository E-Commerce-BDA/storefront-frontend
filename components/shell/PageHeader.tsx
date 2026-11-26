import type { ReactNode } from "react";
import Breadcrumbs from "./Breadcrumbs";
import type { BreadcrumbItem } from "@/lib/shell/pageHeader";

/**
 * Dumb PageHeader — eyebrow, `<h1>`, optional breadcrumb trail, optional actions.
 *
 * One shell for every shop page (`pages/routing.md` §2), so the listing, PDP,
 * cart, checkout and account do not each reinvent a title block and each get the
 * separator/hierarchy treatment subtly different. `props -> JSX`: the route
 * decides which slots are filled; this block never guesses them.
 *
 * Breadcrumb state reaches CSS through `aria-current`, not a class: the resolver
 * has already decided which crumb is "you are here", and the last one is text,
 * not a link (`resolveBreadcrumbs`). `actions` is a slot, not an `onClick` — the
 * caller passes real buttons, so the header learns nothing about what they do.
 */
export interface PageHeaderProps {
  eyebrow?: string;
  title?: string;
  breadcrumb?: BreadcrumbItem[];
  /** Rendered at the trailing edge of the header — a `Button` or a filter row. */
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  breadcrumb,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`sf-page-header ${className}`}>
      {breadcrumb && breadcrumb.length > 0 ? <Breadcrumbs items={breadcrumb} /> : null}

      {title || eyebrow || actions ? (
        <div className="sf-page-header__row">
          <div className="sf-page-header__titles">
            {eyebrow ? <p className="sf-page-header__eyebrow">{eyebrow}</p> : null}
            {title ? <h1 className="sf-title sf-page-header__title">{title}</h1> : null}
          </div>
          {actions ? <div className="sf-page-header__actions">{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
