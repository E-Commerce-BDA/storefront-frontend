"use client";

import { useReducer, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import { Icon } from "@/components/ui";
import { AuthForm, PasswordMeter } from "@/components/auth";
import { submitAuth, submitAuthMessage } from "@/lib/auth/browser";
import { displayFor } from "@/lib/auth/errors";
import type { ErrorStyle } from "@/lib/auth/settings";
import {
  authFormMachine,
  forgotDraftMachine,
  forgotResetValid,
  initialAuthFormMachine,
  initialForgotDraftMachine,
  isEmail,
  isStrongPassword,
} from "@/lib/auth/machine";

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
  const router = useRouter();
  // sf-086: the two steps (request + reset) share one draft machine; request
  // status stays separate so a failed reset cannot relabel the request step.
  const [draft, draftDispatch] = useReducer(
    forgotDraftMachine,
    undefined,
    initialForgotDraftMachine,
  );
  const [request, requestDispatch] = useReducer(
    authFormMachine,
    undefined,
    () => initialAuthFormMachine("forgot"),
  );
  const {
    email,
    token: tokenInput,
    newPassword: newPw,
    showPassword: showPw,
    touched,
    sent,
    done,
    message: genericMessage,
  } = draft;
  const { status, error } = request;
  const loading = status === "loading";

  const emailBad = touched && !isEmail(email);
  const resetMode = token !== "" || sent;
  const activeToken = token !== "" ? token : tokenInput;
  const pwBad = touched && newPw !== "" && !isStrongPassword(newPw);

  const inputVars = {
    bg: "var(--auth-input-bg)",
    borderColor: "var(--auth-input-border)",
    textColor: "var(--auth-input-text)",
    radius: "var(--auth-input-radius, 10px)",
  } as const;

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    draftDispatch({ type: "touch" });
    if (!isEmail(email)) return;
    requestDispatch({ type: "submit" });
    const result = await submitAuthMessage("/api/auth/password/forgot", { email });
    if (result.code !== null) {
      requestDispatch({ type: "error", error: displayFor(result.code) });
      return;
    }
    // Identical generic copy for existing/unknown/disabled accounts — no
    // enumeration, and no token in the response or in this island.
    draftDispatch({ type: "request/sent", message: result.message });
    requestDispatch({ type: "success" });
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    draftDispatch({ type: "touch" });
    if (!forgotResetValid(draft, token)) return;
    requestDispatch({ type: "submit" });
    const code = await submitAuth("/api/auth/password/reset", {
      token: activeToken,
      newPassword: newPw,
    });
    if (code !== null) {
      requestDispatch({ type: "error", error: displayFor(code) });
      return;
    }
    draftDispatch({ type: "reset/done" });
    requestDispatch({ type: "success" });
    // A25: a single-use token must not stay in the address bar (history,
    // screenshots, referrers). Replace, not push — there is nothing to go back to.
    if (token !== "") router.replace("/forgot");
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
                onChange={(value) =>
                  draftDispatch({ type: "field/set", name: "token", value })
                }
                placeholder="Paste the token here"
                required
                {...inputVars}
              />
            ) : null}
            <Input
              label="New password"
              value={newPw}
              onChange={(value) => draftDispatch({ type: "field/set", name: "newPassword", value })}
              placeholder="Min. 8 chars, letter + number"
              required
              type={showPw ? "text" : "password"}
              error={pwBad ? "Use 8+ characters with a letter and a number" : undefined}
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
        onChange={(value) => draftDispatch({ type: "field/set", name: "email", value })}
        placeholder="ana@example.com"
        required
        type="email"
        error={emailBad ? "Enter a valid email" : undefined}
        {...inputVars}
      />
    </AuthForm>
  );
}
