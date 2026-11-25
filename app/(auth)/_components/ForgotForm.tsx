"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Input from "@/components/ui/Input";
import { Icon } from "@/components/ui";
import { AuthForm, PasswordMeter, type AuthFormError } from "@/components/auth";
import { submitAuth, submitAuthMessage } from "@/lib/auth/browser";
import { displayFor } from "@/lib/auth/errors";
import type { ErrorStyle } from "@/lib/auth/settings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG = /^(?=.*[a-zA-Z])(?=.*\d)/;

/**
 * Route island: forgot-password request + post-link reset (au-007).
 * `token` present (from ?token=) renders the reset step directly; the demo
 * post-link state additionally asks for a real token because auth-svc does not
 * deliver email yet and deliberately never returns the token. No token is
 * invented here — a test/DB read must supply it.
 * Owned by app/(auth)/forgot only.
 */
export interface ForgotFormProps {
  title: string;
  submitLabel: string;
  errorStyle?: ErrorStyle;
  token?: string;
  footer?: ReactNode;
}

export default function ForgotForm({
  title,
  submitLabel,
  errorStyle = "banner",
  token = "",
  footer,
}: ForgotFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<AuthFormError | null>(null);
  const [genericMessage, setGenericMessage] = useState<string | null>(null);

  const emailBad = touched && !EMAIL_RE.test(email);
  const resetMode = token !== "" || sent;
  const activeToken = token !== "" ? token : tokenInput;
  const pwBad = touched && newPw !== "" && (newPw.length < 8 || !STRONG.test(newPw));

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
    const result = await submitAuthMessage("/api/auth/password/forgot", { email });
    setLoading(false);
    if (result.code !== null) {
      setError(displayFor(result.code));
      return;
    }
    // Identical generic copy for existing/unknown/disabled accounts — no
    // enumeration, and no token in the response or in this island.
    setGenericMessage(result.message);
    setSent(true);
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (activeToken === "" || newPw.length < 8 || !STRONG.test(newPw)) return;
    setLoading(true);
    const code = await submitAuth("/api/auth/password/reset", {
      token: activeToken,
      newPassword: newPw,
    });
    setLoading(false);
    if (code !== null) {
      setError(displayFor(code));
      return;
    }
    setError(null);
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
        {done ? (
          <p role="status" className="sf-auth__ok">
            Password updated — all other sessions signed out.
          </p>
        ) : (
          <>
            {sent && token === "" ? (
              <p role="status" className="sf-auth__ok">
                {genericMessage ?? "If an account exists for that email, a reset link has been sent."}{" "}
                Delivery is not wired yet: the link is not emailed. Paste a test token below to try
                the reset step; the storefront never invents one.
              </p>
            ) : null}
            {token === "" ? (
              <Input
                label="Reset token (from a test/DB read)"
                value={tokenInput}
                onChange={(v) => {
                  setTokenInput(v);
                  setError(null);
                }}
                placeholder="Paste the token here"
                required
                {...inputVars}
              />
            ) : null}
            <Input
              label="New password"
              value={newPw}
              onChange={setNewPw}
              placeholder="Min. 8 chars, letter + number"
              required
              type={showPw ? "text" : "password"}
              error={pwBad ? "Use 8+ characters with a letter and a number" : undefined}
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
