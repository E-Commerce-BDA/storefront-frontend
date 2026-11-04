import type { Footer } from "@ecom/contracts";
import PaymentIcon from "@/components/shell/PaymentIcon";
import SocialIcon from "@/components/shell/SocialIcon";

/**
 * Footer — the global link shell, from cms-svc — sf-062
 * (plan §7; `components/shell-cart.md` §5)
 *
 * Dumb: it paints the footer document and fetches nothing. Every column, link,
 * social row, contact line and payment chip is the admin's data, so "the footer
 * changed" is never a deploy.
 *
 * Two faces, and the difference is a service, not a design:
 * - `footer` present → the CMS document.
 * - `footer === null` (cms-svc unreachable, or nothing saved yet) → the
 *   **minimal shell**: real routes only (`/products`, `/about`, `/privacy`,
 *   `/terms`). A footer that vanishes on an outage would take the site's
 *   navigation with it; a footer that invents columns would be a lie. Four true
 *   links is the honest middle.
 *
 * Rules worth naming:
 * - Internal hrefs are `href` strings, not `next/link`: this markup is painted
 *   from admin data whose shape we validate but never prefetch, and a `Link`
 *   would add a client router to a server-only shell for no benefit.
 * - Anything absolute is external by definition and gets
 *   `rel="noopener noreferrer"`.
 * - `social[].platform` becomes `data-platform` and drives a `SocialIcon`: a
 *   known network paints a committed monochrome glyph (inheriting the footer's
 *   text color), and an unknown one falls back to its label — the same
 *   fail-closed rule `PaymentIcon` follows, so a new link is never a blank box.
 *   The glyph is decorative; the link's accessible name is `social[].label`.
 * - Payment keys are platform strings (`visa`, `gpay`) drawn from the CMS footer
 *   document; `PaymentIcon` maps each to a committed brand mark and falls back
 *   to the label for an unknown key. They sit in a single horizontal row on the
 *   right of the bottom bar; the legal links (Privacy/Terms) live up in the meta
 *   row beside the address, and the copyright anchors the bottom bar's left.
 */

/** What the fallback face links to. Every one of these is a real route. */
export const FALLBACK_FOOTER_LINKS = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

const SITE_NAME = "Next.7";

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return isExternal(href) ? (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  );
}

export interface FooterProps {
  footer: Footer | null;
  className?: string;
}

export default function Footer({ footer, className = "" }: FooterProps) {
  if (footer === null) {
    return (
      <footer className={`sf-footer sf-footer--minimal ${className}`} data-face="minimal" aria-label="Footer">
        <div className="sf-footer__inner">
          <p className="sf-footer__wordmark">{SITE_NAME}</p>
          <nav className="sf-footer__fallback" aria-label="Site links">
            <ul role="list">
              {FALLBACK_FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    );
  }

  const { columns, social, legal, contact, logo, wordmark, tagline, copyright, paymentIcons } = footer;
  const brand = wordmark ?? SITE_NAME;

  return (
    <footer className={`sf-footer ${className}`} data-face="cms" aria-label="Footer">
      <div className="sf-footer__inner">
        <div className="sf-footer__brand">
          {logo !== undefined ? (
            <img className="sf-footer__logo" src={logo} alt={brand} loading="lazy" />
          ) : null}
          <p className="sf-footer__wordmark">{brand}</p>
          {tagline !== undefined ? <p className="sf-footer__tagline">{tagline}</p> : null}
        </div>

        {columns !== undefined && columns.length > 0 ? (
          <div className="sf-footer__columns">
            {columns.map((column) => (
              <nav key={column.title} className="sf-footer__col" aria-label={column.title}>
                <h2 className="sf-footer__col-title">{column.title}</h2>
                <ul role="list" className="sf-footer__list">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}-${link.label}`}>
                      <ExternalLink href={link.href}>{link.label}</ExternalLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        ) : null}

        <div className="sf-footer__meta">
          {contact !== undefined &&
          (contact.email !== undefined || contact.phone !== undefined || contact.address !== undefined) ? (
            <address className="sf-footer__contact">
              {contact.email !== undefined ? (
                <a className="sf-footer__contact-line" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              ) : null}
              {contact.phone !== undefined ? (
                <a className="sf-footer__contact-line" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>
                  {contact.phone}
                </a>
              ) : null}
              {contact.address !== undefined ? (
                <span className="sf-footer__contact-line">{contact.address}</span>
              ) : null}
            </address>
          ) : null}

          {social !== undefined && social.length > 0 ? (
            <ul className="sf-footer__social" role="list">
              {social.map((link) => (
                <li key={link.platform} data-platform={link.platform}>
                  <a href={link.url} rel="noopener noreferrer" target="_blank" aria-label={link.label}>
                    <SocialIcon
                      platform={link.platform}
                      label={link.label}
                      className="sf-footer__social-icon"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {legal !== undefined && legal.length > 0 ? (
            <nav aria-label="Legal" className="sf-footer__legal-nav">
              <ul role="list">
                {legal.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <ExternalLink href={link.href}>{link.label}</ExternalLink>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>

        <div className="sf-footer__legal">
          {copyright !== undefined ? <p className="sf-footer__copyright">{copyright}</p> : null}
          {paymentIcons !== undefined && paymentIcons.length > 0 ? (
            <ul className="sf-footer__payments" role="list" aria-label="Accepted payment methods">
              {paymentIcons.map((key) => (
                <li key={key} className="sf-footer__pay" data-icon={key}>
                  <PaymentIcon icon={key} className="sf-footer__pay-img" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
