"use client";

import { useReducer, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import { Icon } from "@/components/ui";
import { AuthForm, PasswordMeter } from "@/components/auth";
import { submitAuth } from "@/lib/auth/browser";
import { displayFor } from "@/lib/auth/errors";
import type { ErrorStyle } from "@/lib/auth/settings";
import {
  authFormMachine,
  initialAuthFormMachine,
  initialSignupDraftMachine,
  isEmail,
  signupDraftMachine,
  signupValid,
} from "@/lib/auth/machine";

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
  const [draft, draftDispatch] = useReducer(
    signupDraftMachine,
    undefined,
    initialSignupDraftMachine,
  );
  const [request, requestDispatch] = useReducer(
    authFormMachine,
    undefined,
    () => initialAuthFormMachine("signup"),
  );
  const {
    first,
    last,
    email,
    password,
    confirm,
    showPassword: showPw,
    touched,
  } = draft;
  const { status, error } = request;
  const loading = status === "loading";

  const firstBad = touched && first.trim() === "";
  const lastBad = touched && last.trim() === "";
  const emailBad = touched && !isEmail(email);
  const pwBad = touched && password.length < 8;
  const mismatch = touched && confirm !== "" && confirm !== password;
  const valid = signupValid(draft);

  const inputVars = {
    bg: "var(--auth-input-bg)",
    borderColor: "var(--auth-input-border)",
    textColor: "var(--auth-input-text)",
    radius: "var(--auth-input-radius, 10px)",
  } as const;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    draftDispatch({ type: "touch" });
    if (!valid) return;
    requestDispatch({ type: "submit" });

    const failure = await submitAuth("/api/auth/register", {
      email,
      password,
      firstName: first.trim(),
      lastName: last.trim(),
    });
    if (failure !== null) {
      requestDispatch({ type: "error", error: displayFor(failure) });
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
        <Input label="First name" value={first} onChange={(value) => draftDispatch({ type: "field/set", name: "first", value })} placeholder="Ana" required error={firstBad ? "Required" : undefined} {...inputVars} />
        <Input label="Last name" value={last} onChange={(value) => draftDispatch({ type: "field/set", name: "last", value })} placeholder="Silva" required error={lastBad ? "Required" : undefined} {...inputVars} />
      </div>
      <Input label="Email" value={email} onChange={(value) => draftDispatch({ type: "field/set", name: "email", value })} placeholder="ana@example.com" required type="email" error={emailBad ? "Enter a valid email" : undefined} {...inputVars} />
      <Input
        label="Password"
        value={password}
        onChange={(value) => draftDispatch({ type: "field/set", name: "password", value })}
        placeholder="Min. 8 chars, mixed case + number"
        required
        type={showPw ? "text" : "password"}
        error={pwBad ? "Use at least 8 characters" : undefined}
        {...inputVars}
        rightIconInteractive
        rightIcon={
          <button
            type="button"
            onClick={() => draftDispatch({ type: "password/toggle" })}
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
        onChange={(value) => draftDispatch({ type: "field/set", name: "confirm", value })}
        placeholder="Repeat password"
        required
        type="password"
        error={mismatch ? "Passwords don't match (one password is sent)" : undefined}
        {...inputVars}
      />
    </AuthForm>
  );
}
