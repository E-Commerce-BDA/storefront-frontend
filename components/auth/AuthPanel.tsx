/**
 * Dumb AuthPanel — design panel: background mode, logo, sanitized HTML copy.
 *
 * HTML arrives ALREADY SANITIZED (resolveSettings.ts allowlist, applied
 * server-side) — hence dangerouslySetInnerHTML here with no escaping logic.
 * Components never sanitize; danger is resolved up, never handled down.
 * Background/overlay/type reach CSS only through --auth-* vars.
 * props → JSX only. No fetch, no state.
 */
export interface AuthPanelProps {
  logoUrl?: string;
  headline: string;
  sub: string;
  bulletsHtml: string;
  quoteHtml: string;
  microcopy?: string;
  className?: string;
}

export default function AuthPanel({
  logoUrl = "",
  headline,
  sub,
  bulletsHtml,
  quoteHtml,
  microcopy = "",
  className = "",
}: AuthPanelProps) {
  return (
    <div className={`sf-auth__panel ${className}`} data-admin-slot="panel">
      <div className="sf-auth__overlay" aria-hidden="true" />
      <div className="sf-auth__panel-head">
        {logoUrl !== "" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" aria-hidden="true" className="sf-auth__logo" />
        )}
        {headline !== "" && <div className="sf-auth__headline" dangerouslySetInnerHTML={{ __html: headline }} />}
        {sub !== "" && <div className="sf-auth__sub" dangerouslySetInnerHTML={{ __html: sub }} />}
      </div>
      {bulletsHtml !== "" && (
        <div className="sf-auth__panel-body">
          <div className="sf-auth__bullets" dangerouslySetInnerHTML={{ __html: bulletsHtml }} />
        </div>
      )}
      {(quoteHtml !== "" || microcopy !== "") && (
        <footer className="sf-auth__panel-footer">
          {quoteHtml !== "" && <div className="sf-auth__quote" dangerouslySetInnerHTML={{ __html: quoteHtml }} />}
          {microcopy !== "" && <p className="sf-auth__microcopy">{microcopy}</p>}
        </footer>
      )}
    </div>
  );
}
