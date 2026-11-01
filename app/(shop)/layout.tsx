/**
 * `(shop)` group layout — sf-051
 * (plan §8: the group carries the shared container so a route is only content)
 *
 * Every commerce page renders on the same 1280px / 24px grid (routing.md §2).
 * Putting the wrapper here means `/products`, the PDP, `/cart` etc. never repeat
 * the container, and adding a sixth route is one page file with no layout
 * boilerplate — the seam's whole promise (§1).
 *
 * The root layout already mounts `CartProvider` + `NavbarMount` above this, so
 * the drawer, the badge and quick-add are live for anything rendered here.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <div className="sf-shop">{children}</div>;
}
