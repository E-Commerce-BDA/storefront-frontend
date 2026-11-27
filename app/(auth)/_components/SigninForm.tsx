"use client";

import { useReducer, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui";
import { AuthForm } from "@/components/auth";
import { submitAuth } from "@/lib/auth/browser";
import { displayFor } from "@/lib/auth/errors";
import type { ErrorStyle } from "@/lib/auth/settings";
import {
  authFormMachine,
  initialAuthFormMachine,
  initialSigninDraftMachine,
  isEmail,
  signinDraftMachine,
  signinValid,
} from "@/lib/auth/machine";

/**
 * Route island: signin fields + courtesy validation + submit state.
 * Owned by app/(auth)/signin only.
 *
 * Posts to the BFF (`/api/auth/login`), which is the only place the token pair
 * ever exists; this component gets back `{ user }` or `{ error: { code } }`
 * and maps the code through `displayFor`. On success it does `replace` (not
 * `push`) so the back button cannot return to a form the shopper already
 * used, then `refresh` so the server-rendered shell picks up the new cookie.
 */
export interface SigninFormProps {
  title: string;
  submitLabel: string;
  errorStyle?: ErrorStyle;
  rememberDefault?: boolean;
  rememberLabel?: string;
  /** Resume path after success (used by the thin-client slice on login). */
  nextPath?: string;
  footer?: ReactNode;
}

export default function SigninForm({
  title,
  submitLabel,
  errorStyle = "banner",
  rememberDefault = true,
  rememberLabel = "Remember me",
  nextPath = "/account",
  footer,
}: SigninFormProps) {
  const router = useRouter();
  // sf-086: draft fields and the request lifecycle are separate machines, so
  // a failed submit never clears what the shopper typed.
  const [draft, draftDispatch] = useReducer(
    signinDraftMachine,
    undefined,
    () => initialSigninDraftMachine(rememberDefault),
  );
  const [request, requestDispatch] = useReducer(
    authFormMachine,
    undefined,
    () => initialAuthFormMachine("signin"),
  );
  const { email, password, showPassword: showPw, remember, touched } = draft;
  const { status, error } = request;
  const loading = status === "loading";

  const emailBad = touched && !isEmail(email);
  const pwBad = touched && password === "";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    draftDispatch({ type: "touch" });
    if (!signinValid(draft)) return;
    requestDispatch({ type: "submit" });

    const failure = await submitAuth("/api/auth/login", { email, password });
    if (failure !== null) {
      requestDispatch({ type: "error", error: displayFor(failure) });
      return;
    }

    // Deliberately still loading: the navigation is the success state, and a
    // second click while it runs would burn a second session.
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
      <Input
        label="Email"
        value={email}
        onChange={(value) => draftDispatch({ type: "field/set", name: "email", value })}
        placeholder="ana@example.com"
        required
        type="email"
        error={emailBad ? "Enter a valid email" : undefined}
        bg="var(--auth-input-bg)"
        borderColor="var(--auth-input-border)"
        textColor="var(--auth-input-text)"
        radius="var(--auth-input-radius, 10px)"
      />
      <Input
        label="Password"
        value={password}
        onChange={(value) => draftDispatch({ type: "field/set", name: "password", value })}
        placeholder="••••••••"
        required
        type={showPw ? "text" : "password"}
        error={pwBad ? "Password is required" : undefined}
        bg="var(--auth-input-bg)"
        borderColor="var(--auth-input-border)"
        textColor="var(--auth-input-text)"
        radius="var(--auth-input-radius, 10px)"
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
      {/* Still cosmetic: auth-svc fixes the pair at 15m/30d, so there is no
          longer session to opt into yet. Logged as an auth-svc follow-up
          rather than silently extending a cookie the service would reject. */}
      <Checkbox
        checked={remember}
        onChange={(value) => draftDispatch({ type: "remember/set", remember: value })}
        label={rememberLabel}
      />
    </AuthForm>
  );
}
