import { describe, expect, it } from "vitest";
import {
  authFormMachine,
  forgotDraftMachine,
  forgotResetValid,
  initialAuthFormMachine,
  initialForgotDraftMachine,
  initialSigninDraftMachine,
  initialSignupDraftMachine,
  isStrongPassword,
  signinDraftMachine,
  signinValid,
  signupDraftMachine,
  signupValid,
} from "@/lib/auth/machine";

const failure = { code: "INVALID_CREDENTIALS", message: "Invalid email or password." };

describe("auth form machine", () => {
  it("uses the Status vocabulary for signin/signup/forgot", () => {
    for (const kind of ["signin", "signup", "forgot"] as const) {
      const idle = initialAuthFormMachine(kind);
      expect(idle.status).toBe("idle");
      const loading = authFormMachine(idle, { type: "submit" });
      expect(loading.status).toBe("loading");
      expect(authFormMachine(loading, { type: "error", error: failure }).status).toBe("error");
      expect(authFormMachine(loading, { type: "success" }).status).toBe("success");
      expect(authFormMachine(loading, { type: "reset" }).status).toBe("idle");
    }
  });

  it("refuses a second submit while one is in flight", () => {
    const loading = authFormMachine(initialAuthFormMachine(), { type: "submit" });
    expect(authFormMachine(loading, { type: "submit" })).toBe(loading);
  });

  it("resets copy when the mode changes", () => {
    const errored = authFormMachine(initialAuthFormMachine(), { type: "error", error: failure });
    const changed = authFormMachine(errored, { type: "mode/set", kind: "forgot" });
    expect(changed.kind).toBe("forgot");
    expect(changed.status).toBe("idle");
    expect(changed.error).toBeNull();
  });
});

describe("auth draft machines", () => {
  it("keeps signin validation and the reveal flag in the draft", () => {
    const empty = initialSigninDraftMachine();
    expect(signinValid(empty)).toBe(false);
    const typed = signinDraftMachine(
      signinDraftMachine(empty, { type: "field/set", name: "email", value: "ana@x.com" }),
      { type: "field/set", name: "password", value: "secret" },
    );
    expect(signinValid(typed)).toBe(true);
    expect(signinDraftMachine(typed, { type: "password/toggle" }).showPassword).toBe(true);
    expect(signinDraftMachine(typed, { type: "remember/set", remember: false }).remember).toBe(false);
    expect(signinDraftMachine(empty, { type: "touch" }).touched).toBe(true);
    expect(initialSigninDraftMachine(false).remember).toBe(false);
  });

  it("requires all signup fields and a matching confirm", () => {
    let state = initialSignupDraftMachine();
    for (const [name, value] of [
      ["first", "Ana"],
      ["last", "Silva"],
      ["email", "ana@x.com"],
      ["password", "Secret123"],
      ["confirm", "Secret123"],
    ] as const) {
      state = signupDraftMachine(state, { type: "field/set", name, value });
    }
    expect(signupValid(state)).toBe(true);
    const mismatch = signupDraftMachine(state, { type: "field/set", name: "confirm", value: "no" });
    expect(signupValid(mismatch)).toBe(false);
    expect(signupDraftMachine(state, { type: "password/toggle" }).showPassword).toBe(true);
    expect(signupDraftMachine(state, { type: "touch" }).touched).toBe(true);
  });

  it("gates the forgot reset on a token and a strong password", () => {
    const initial = initialForgotDraftMachine();
    const typed = forgotDraftMachine(initial, {
      type: "field/set",
      name: "newPassword",
      value: "longer123",
    });
    expect(isStrongPassword("longer123")).toBe(true);
    expect(isStrongPassword("short")).toBe(false);
    expect(forgotResetValid(typed, "")).toBe(false);
    expect(forgotResetValid(typed, "tok_1")).toBe(true);
    const sent = forgotDraftMachine(typed, { type: "request/sent", message: "Check your email" });
    expect(sent.sent).toBe(true);
    expect(forgotResetValid(sent, "")).toBe(false);
    const withToken = forgotDraftMachine(sent, {
      type: "field/set",
      name: "token",
      value: "tok_1",
    });
    expect(forgotResetValid(withToken, "")).toBe(true);
    expect(forgotDraftMachine(withToken, { type: "reset/done" }).done).toBe(true);
    expect(forgotDraftMachine(initial, { type: "password/toggle" }).showPassword).toBe(true);
    expect(forgotDraftMachine(initial, { type: "touch" }).touched).toBe(true);
  });
});
