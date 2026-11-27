import type { CSSProperties } from "react";
import Link from "next/link";
import type { MegaMenuGroup } from "@ecom/contracts";
import { resolveMegaMenu } from "@/lib/shell/megaMenuModel";

/**
 * Dumb MegaMenu — server-renderable from the CMS navigation view model. It
 * consumes 2.2.0 groups/columns/promos and paints them; `open` and the active
 * group arrive from the route island, which owns every interaction.
 */
export interface MegaMenuProps {
  groups: readonly MegaMenuGroup[];
  open: boolean;
  activeLabel?: string;
  ariaLabel?: string;
  options?: { ariaLabel?: string; maxGroups?: number; maxColumns?: number };
  className?: string;
  style?: CSSProperties;
}

export default function MegaMenu({
  groups,
  open,
  activeLabel,
  ariaLabel,
  options,
  className = "",
  style,
}: MegaMenuProps) {
  const resolved = resolveMegaMenu(groups, options, { ariaLabel });
  if (!open) return null;

  return (
    <nav
      className={`sf-megamenu ${className}`}
      aria-label={resolved.ariaLabel}
      data-open="true"
      style={style}
    >
      {resolved.groups.map((group) => (
        <section
          key={group.title}
          className="sf-megamenu__group"
          data-active={group.title === activeLabel}
          data-columns={group.columns}
        >
          <h2 className="sf-megamenu__title">{group.title}</h2>
          <ul className="sf-megamenu__items" role="list">
            {group.items.map((item) => (
              <li key={item.href} className="sf-megamenu__item">
                <Link href={item.href} aria-current={item.label === activeLabel ? "page" : undefined}>
                  <span>{item.label}</span>
                  {item.description === undefined ? null : (
                    <small className="sf-megamenu__desc">{item.description}</small>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {group.promo === undefined ? null : (
            <Link className="sf-megamenu__promo" href={group.promo.href}>
              <span>{group.promo.title}</span>
              {group.promo.description === undefined ? null : <small>{group.promo.description}</small>}
            </Link>
          )}
        </section>
      ))}
    </nav>
  );
}
