import { fetchAuthSettings } from "@/lib/cms/authSettings";
import { resolveAuthSettings } from "@/lib/auth/resolveSettings";
import { authCssVars } from "@/lib/auth/cssVars";
import { AuthPage, AuthPanel, AuthSplit } from "@/components/auth";
import SigninForm from "../_components/SigninForm";

/**
 * Smart signin route: fetch settings → resolve → vars → props.
 * Owns no styling decisions; renders composed blocks + its form island.
 * No header/footer (conversion route renders chromeless until finalized).
 */

// TODO(validate): promote to lib/auth/validate.ts with the thin-client slice.
const NEXT_RE = /^\/(account|checkout|cart)(\/|$|\?)/;

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && NEXT_RE.test(next) ? next : "/account";

  // TODO(cms-svc): createCmsSource(process.env.CMS_BASE_URL) + Redis cache.
  // Null source/cache today → resolver renders builtins (today's look).
  const result = await fetchAuthSettings("auth", {
    source: { fetchPage: async () => null },
    cache: { get: () => null, set: () => {} },
  });
  const style = resolveAuthSettings({ settings: result.settings, global: null }).signin;
  const vars = authCssVars(style);

  const panel = (
    <AuthPanel
      logoUrl={style.panel.logoUrl}
      headline={style.content.headline}
      sub={style.content.sub}
      bulletsHtml={style.content.bullets}
      quoteHtml={style.content.quote}
    />
  );
  const footerLinks =
    style.content.footerLinks.length > 0 ? (
      <p className="m-0 text-[13px] text-[var(--text-muted)]">
        {style.content.footerLinks.map((l, i) => (
          <span key={l.href}>
            {i > 0 && " · "}
            <a href={l.href} style={{ color: "var(--color-accent)", fontWeight: 600 }}>
              {l.label}
            </a>
          </span>
        ))}
      </p>
    ) : (
      <p className="m-0 text-[13px] text-[var(--text-muted)]">
        New here?{" "}
        <a href="/signup" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          Create account
        </a>{" "}
        ·{" "}
        <a href="/forgot" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          Forgot password?
        </a>
      </p>
    );
  const form = (
    <SigninForm
      title={style.content.formTitle}
      submitLabel="Sign in"
      errorStyle={style.errors.style}
      rememberDefault={style.behavior.rememberDefault}
      rememberLabel={style.behavior.rememberLabel}
      nextPath={nextPath}
      footer={footerLinks}
    />
  );

  return (
    <AuthPage vars={vars} mode={style.layout.mode}>
      {style.layout.mode === "centered" ? (
        <div className="sf-auth__center">{form}</div>
      ) : (
        <AuthSplit
          panelSide={style.layout.panelSide}
          ratio={style.layout.ratio}
          mobile={style.layout.mobile}
          panel={panel}
          form={form}
        />
      )}
    </AuthPage>
  );
}
