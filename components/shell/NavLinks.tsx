import { Icon } from "@/components/ui";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";

export interface NavLinksProps {
  links: ResolvedNavLink[]; // required - a nav with no links is a caller bug, made visible
  className?: string; // optional - styling hatch only, default "" at destructure
  /** CMS 2.2.0 groups turn a link into a disclosure trigger (controlled). */
  activeMegaMenu?: string | null;
  onMegaMenuToggle?: (label: string) => void;
}

/**
 * Dumb primary nav — labels, highlights, badges and the optional mega-menu
 * disclosure. Every decision is a prop; this file never owns open-state.
 */
export default function NavLinks({
  links,
  className = "",
  activeMegaMenu = null,
  onMegaMenuToggle,
}: NavLinksProps) {
  return (
    <nav aria-label="Primary" className={`sf-navlinks ${className}`}>
      {links.map((l) => {
        const hasGroups = (l.groups?.length ?? 0) > 0;
        const expanded = hasGroups && activeMegaMenu === l.label;
        const content = (
          <>
            {l.badge && <span className="sf-navlinks__badge">{l.badge.text}</span>}
            {l.label}
            {hasGroups ? <Icon name="chevron-down" size={14} /> : null}
          </>
        );
        const shared = {
          "data-highlight": l.highlight,
          "data-current": l.current ? "true" : undefined,
          "aria-current": l.current ? ("page" as const) : undefined,
        };
        return hasGroups ? (
          <button
            key={l.href}
            {...shared}
            type="button"
            className="sf-navlink"
            data-megamenu={l.label}
            aria-expanded={expanded}
            onClick={() => onMegaMenuToggle?.(l.label)}
          >
            {content}
          </button>
        ) : (
          <a key={l.href} {...shared} href={l.href} className="sf-navlink">
            {content}
          </a>
        );
      })}
    </nav>
  );
}
