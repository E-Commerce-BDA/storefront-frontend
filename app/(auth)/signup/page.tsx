import { fetchAuthPageSettings } from "@/lib/cms/pageSettings";
import { resolveAuthSettings } from "@/lib/auth/resolveSettings";
import { authCssVars } from "@/lib/auth/cssVars";
import { safeNextPath } from "@/lib/auth/next";
import { AuthPage, AuthPanel, AuthSplit } from "@/components/auth";
import SignupForm from "../_components/SignupForm";

/**
 * Smart signup route: fetch settings → resolve → vars → props.
 * Success signs the shopper in (register returns the same pair as login), so
 * the form resumes `?next=` exactly like signin does.
 * No header/footer (conversion route renders chromeless until finalized).
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  // CMS-backed: cms-svc → stale cache → builtins. Never blank, never throws.
  const result = await fetchAuthPageSettings("auth");
  const style = resolveAuthSettings({ settings: result.settings, global: null }).signup;
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
  const form = (
    <SignupForm
      title={style.content.formTitle}
      submitLabel="Create account"
      errorStyle={style.errors.style}
      nextPath={nextPath}
      footer={
        <p className="m-0 text-[13px] text-[var(--text-muted)]">
          Already have an account?{" "}
          <a href="/signin" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
            Sign in
          </a>
        </p>
      }
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
