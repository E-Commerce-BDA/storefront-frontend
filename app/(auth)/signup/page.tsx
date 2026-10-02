import { fetchAuthSettings } from "@/lib/cms/authSettings";
import { resolveAuthSettings } from "@/lib/auth/resolveSettings";
import { authCssVars } from "@/lib/auth/cssVars";
import { AuthPage, AuthPanel, AuthSplit } from "@/components/auth";
import SignupForm from "../_components/SignupForm";

/**
 * Smart signup route: fetch settings → resolve → vars → props.
 * Success signs the user in (no second login) once the thin-client
 * slice lands; the stub surfaces the documented 409 today.
 * No header/footer (conversion route renders chromeless until finalized).
 */
export default async function SignupPage() {
  // TODO(cms-svc): createCmsSource(process.env.CMS_BASE_URL) + Redis cache.
  const result = await fetchAuthSettings("auth", {
    source: { fetchPage: async () => null },
    cache: { get: () => null, set: () => {} },
  });
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
