import { fetchAuthSettings } from "@/lib/cms/authSettings";
import { resolveAuthSettings } from "@/lib/auth/resolveSettings";
import { authCssVars } from "@/lib/auth/cssVars";
import { AuthPage, AuthPanel, AuthSplit } from "@/components/auth";
import ForgotForm from "../_components/ForgotForm";

/**
 * Smart forgot route: request step, or reset step when ?token= is present
 * (post-link state — single-use expiring token, enforced server-side).
 * Identical response whether the email exists (no enumeration).
 * No header/footer (conversion route renders chromeless until finalized).
 */
export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // TODO(cms-svc): createCmsSource(process.env.CMS_BASE_URL) + Redis cache.
  const result = await fetchAuthSettings("auth", {
    source: { fetchPage: async () => null },
    cache: { get: () => null, set: () => {} },
  });
  const style = resolveAuthSettings({ settings: result.settings, global: null }).forgot;
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
    <ForgotForm
      title={style.content.formTitle}
      submitLabel="Send reset link"
      errorStyle={style.errors.style}
      token={typeof token === "string" ? token : ""}
      footer={
        <p className="m-0 text-[13px] text-[var(--text-muted)]">
          Remembered it?{" "}
          <a href="/signin" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
            Back to sign in
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
