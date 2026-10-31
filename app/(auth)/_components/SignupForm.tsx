"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import { Icon } from "@/components/ui";
import { AuthForm, PasswordMeter, type AuthFormError } from "@/components/auth";
import { submitAuth } from "@/lib/auth/browser";
import { displayFor } from "@/lib/auth/errors";
import type { ErrorStyle } from "@/lib/auth/settings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Route island: signup fields + courtesy validation + confirm-match
 * (UI-only — one password is sent) + submit state.
 * Owned by app/(auth)/signup only.
 *
 * Register signs the shopper in: auth-svc returns the same pair as login, so
 * the BFF can set the cookies and this island lands straight in the account
 * instead of asking for the password again. `409` is the one failure worth
 * naming (EMAIL_TAKEN) — everything else falls through `displayFor`.
 */
export interface SignupFormProps {
  title: string;
  submitLabel: string;
  errorStyle?: ErrorStyle;
  /** Resume path after success — same contract as SigninForm's. */
  nextPath?: string;
  footer?: ReactNode;
}

export default function SignupForm({
  title,
  submitLabel,
  errorStyle = "banner",
  nextPath = "/account",
  footer,
}: SignupFormProps) {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthFormError | null>(null);
  const [touched, setTouched] = useState(false);

  const firstBad = touched && first.trim() === "";
  const lastBad = touched && last.trim() === "";
  const emailBad = touched && !EMAIL_RE.test(email);
  const pwBad = touched && password.length < 8;
  const mismatch = touched && confirm !== "" && confirm !== password;
  const valid =
    first.trim() !== "" && last.trim() !== "" && EMAIL_RE.test(email) && password.length >= 8 && confirm === password;

  const inputVars = {
    bg: "var(--auth-input-bg)",
    borderColor: "var(--auth-input-border)",
    textColor: "var(--auth-input-text)",
    radius: "var(--auth-input-radius, 10px)",
  } as const;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    setError(null);

    const failure = await submitAuth("/api/auth/register", {
      email,
      password,
      firstName: first.trim(),
      lastName: last.trim(),
    });
    if (failure !== null) {
      setLoading(false);
      setError(displayFor(failure));
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <AuthForm
      title={title}
      error={error}
      errorStyle={errorStyle}
      submitLabel={submitLabel}
      loading={loading}
      onSubmit={onSubmit}
      footer={footer}
    >
      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" value={first} onChange={setFirst} placeholder="Ana" required error={firstBad ? "Required" : undefined} {...inputVars} />
        <Input label="Last name" value={last} onChange={setLast} placeholder="Silva" required error={lastBad ? "Required" : undefined} {...inputVars} />
      </div>
      <Input label="Email" value={email} onChange={setEmail} placeholder="ana@example.com" required type="email" error={emailBad ? "Enter a valid email" : undefined} {...inputVars} />
      <Input
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="Min. 8 chars, mixed case + number"
        required
        type={showPw ? "text" : "password"}
        error={pwBad ? "Use at least 8 characters" : undefined}
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
      <PasswordMeter value={password} id="auth-su-pw" />
      <Input
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        placeholder="Repeat password"
        required
        type="password"
        error={mismatch ? "Passwords don't match (one password is sent)" : undefined}
        {...inputVars}
      />
    </AuthForm>
  );
}
