/**
 * `(shop)` group layout — sf-051, full-bleed shell at sf-060
 * (plan §5/§8: the group carries the shared container so a route is only content)
 *
 * One shell, no max-width: `.sf-shop` owns the page gutter through
 * `--sf-page-pad` (≤50px combined edge gap, design-system §4/§8), so `/products`,
 * the PDP, `/cart`, the CMS home and every section below align on the same edge
 * and none of them repeats a container. Adding a route is one page file with no
 * layout boilerplate — the seam's whole promise (§1).
 *
 * The root layout already mounts `CartProvider` + `NavbarMount` above this, so
 * the drawer, the badge and quick-add are live for anything rendered here.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <div className="sf-shop">{children}</div>;
}
