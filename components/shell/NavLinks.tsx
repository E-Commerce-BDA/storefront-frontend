import type {ResolvedNavLink} from "@/lib/shell/navSettings";

export interface NavLinksProps {
  links: ResolvedNavLink[]; //required - a nav with no links is a caller bug, made visible
  className?: string; //optional - allows for custom styling hatch only, default "" at destructure
}

export default function NavLinks({links, className = ""}: NavLinksProps) {
    return (
        <nav aria-label="Primary" className={className}>
        {links.map((l) => (
            <a
                key={l.href}
                href={l.href} 
                data-highlight={l.highlight}
                aria-current={l.current ? "page" : undefined}
            >
                {l.badge && <span> {l.badge.text}</span>}
            {l.label}
            </a>

        ))}
        </nav>
    );
}