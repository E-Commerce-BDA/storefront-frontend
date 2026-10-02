"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Input from "@/components/ui/Input";
import { Icon } from "@/components/ui";
import { AuthForm, PasswordMeter, type AuthFormError } from "@/components/auth";
import type { ErrorStyle } from "@/lib/auth/settings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Route island: forgot-password request + post-link reset demo.
 * `token` present (from ?token=) renders the reset step directly.
 * Success copy is demo-grade — TODO(auth-copy): move to settings content
 * slots when the thin-client slice lands the real flow.
 * Owned by app/(auth)/forgot only.
 * TODO(auth-client): replace stubs with lib/auth/client forgot()/reset().
 */
export interface ForgotFormProps {
  title: string;
  submitLabel: string;
  errorStyle?: ErrorStyle;
  token?: string;
  footer?: ReactNode;
}

export default function ForgotForm({ title, submitLabel, errorStyle = "banner", token = "", footer }: ForgotFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<AuthFormError | null>(null);

  const emailBad = touched && !EMAIL_RE.test(email);
  const resetMode = token !== "" || sent;

  const inputVars = {
    bg: "var(--auth-input-bg)",
    borderColor: "var(--auth-input-border)",
    textColor: "var(--auth-input-text)",
    radius: "var(--auth-input-radius, 10px)",
  } as const;

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(email)) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSent(true); // identical response whether the email exists (no enumeration)
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
  }

  if (resetMode) {
    return (
      <AuthForm
        title="Choose a new password"
        error={error}
        errorStyle={errorStyle}
        submitLabel="Set new password"
        loading={loading}
        onSubmit={onReset}
        footer={footer}
      >
        {sent && token === "" && (
          <p role="status" className="sf-auth__ok">
            If an account exists for that email, a reset link is on its way. Demo below shows the post-link state.
          </p>
        )}
        {done ? (
          <p role="status" className="sf-auth__ok">
            Password updated — all other sessions signed out.
          </p>
        ) : (
          <>
            <Input
              label="New password"
              value={newPw}
              onChange={setNewPw}
              placeholder="Min. 8 chars"
              required
              type={showPw ? "text" : "password"}
              error={touched && newPw !== "" && newPw.length < 8 ? "Use at least 8 characters" : undefined}
              {...inputVars}
              rightIconInteractive
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  aria-pressed={showPw}
                  className="inline-flex cursor-pointer border-0 bg-transparent p-1 text-[var(--text-muted)]"
                >
                  <Icon name={showPw ? "eye-off" : "eye"} size={18} />
                </button>
              }
            />
            <PasswordMeter value={newPw} id="auth-fp-pw" />
          </>
        )}
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title={title}
      error={error}
      errorStyle={errorStyle}
      submitLabel={submitLabel}
      loading={loading}
      onSubmit={onRequest}
      footer={footer}
    >
      <Input
        label="Email"
        value={email}
        onChange={(v) => {
          setEmail(v);
          setError(null);
        }}
        placeholder="ana@example.com"
        required
        type="email"
        error={emailBad ? "Enter a valid email" : undefined}
        {...inputVars}
      />
    </AuthForm>
  );
}
