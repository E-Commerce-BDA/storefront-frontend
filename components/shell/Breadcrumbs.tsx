import { resolveBreadcrumbs, type BreadcrumbItem } from "@/lib/shell/pageHeader";

/**
 * Breadcrumbs — `PageHeader`'s crumb row with no title block — sf-063
 *
 * `PageHeader` owns "eyebrow + `<h1>` + crumbs", which is right for every shop
 * page. A CMS document is different: its `<h1>` is the post title (inside the
 * `<article>`) or the page title (already the document's own heading), so the
 * route needs the crumb row and nothing else. Two `<h1>`s on one page is the bug
 * this small block exists to prevent — the alternative was a `PageHeader` prop
 * that silently drops its main heading, i.e. a header component that is not a
 * header.
 *
 * Same resolver, same markup, same `aria-current` contract as `PageHeader`, so
 * the crumb row looks and reads identically wherever it appears.
 */
export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const crumbs = resolveBreadcrumbs(items);
  if (crumbs.length === 0) return null;

  return (
    <nav className={`sf-page-header__crumbs ${className}`} aria-label="Breadcrumb">
      <ol className="sf-page-header__crumb-list">
        {crumbs.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="sf-page-header__crumb">
            {crumb.current ? (
              <span aria-current="page">{crumb.label}</span>
            ) : crumb.href ? (
              <a href={crumb.href}>{crumb.label}</a>
            ) : (
              <span>{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
