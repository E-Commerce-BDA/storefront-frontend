/**
 * Auth form machines — sf-085. Pure.
 *
 * The prototype's AuthModeMachine (signin|signup|forgot) and the per-form
 * loading faces are expressed as two layers: one status machine that owns the
 * request lifecycle (Status vocabulary) and explicit draft reducers that own
 * field values. Keeping drafts separate from request status is what stops a
 * failed submit from clearing what the shopper typed.
 */
import type { Status } from "@/lib/machine/status";

export type AuthFormKind = "signin" | "signup" | "forgot";

/** Structural mirror of `components/auth`'s AuthFormError — lib never imports UI. */
export interface AuthFormFailure {
  code: string;
  message: string;
}

export interface AuthFormMachineState {
  kind: AuthFormKind;
  status: Status;
  error: AuthFormFailure | null;
}

export type AuthFormMachineEvent =
  | { type: "mode/set"; kind: AuthFormKind }
  | { type: "submit" }
  | { type: "success" }
  | { type: "error"; error: AuthFormFailure }
  | { type: "reset" };

export function initialAuthFormMachine(kind: AuthFormKind = "signin"): AuthFormMachineState {
  return { kind, status: "idle", error: null };
}

export function authFormMachine(
  state: AuthFormMachineState,
  event: AuthFormMachineEvent,
): AuthFormMachineState {
  switch (event.type) {
    case "mode/set":
      // A mode change is a new intent: stale copy must not follow the shopper.
      return initialAuthFormMachine(event.kind);
    case "submit":
      // A second submit while one is in flight would burn a second session.
      return state.status === "loading" ? state : { ...state, status: "loading", error: null };
    case "success":
      return { ...state, status: "success", error: null };
    case "error":
      // The draft stays untouched; only the request face changes.
      return { ...state, status: "error", error: event.error };
    case "reset":
      return { ...state, status: "idle", error: null };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_RE = /^(?=.*[a-zA-Z])(?=.*\d)/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && STRONG_RE.test(value);
}

export interface SigninDraftState {
  email: string;
  password: string;
  touched: boolean;
  showPassword: boolean;
  remember: boolean;
}

export type SigninDraftEvent =
  | { type: "field/set"; name: "email" | "password"; value: string }
  | { type: "touch" }
  | { type: "password/toggle" }
  | { type: "remember/set"; remember: boolean };

export function initialSigninDraftMachine(remember = true): SigninDraftState {
  return { email: "", password: "", touched: false, showPassword: false, remember };
}

export function signinDraftMachine(
  state: SigninDraftState,
  event: SigninDraftEvent,
): SigninDraftState {
  switch (event.type) {
    case "field/set":
      return { ...state, [event.name]: event.value };
    case "touch":
      return { ...state, touched: true };
    case "password/toggle":
      return { ...state, showPassword: !state.showPassword };
    case "remember/set":
      return { ...state, remember: event.remember };
  }
}

export function signinValid(state: SigninDraftState): boolean {
  return isEmail(state.email) && state.password !== "";
}

export interface SignupDraftState {
  first: string;
  last: string;
  email: string;
  password: string;
  confirm: string;
  touched: boolean;
  showPassword: boolean;
}

export type SignupDraftEvent =
  | { type: "field/set"; name: "first" | "last" | "email" | "password" | "confirm"; value: string }
  | { type: "touch" }
  | { type: "password/toggle" };

export function initialSignupDraftMachine(): SignupDraftState {
  return { first: "", last: "", email: "", password: "", confirm: "", touched: false, showPassword: false };
}

export function signupDraftMachine(
  state: SignupDraftState,
  event: SignupDraftEvent,
): SignupDraftState {
  switch (event.type) {
    case "field/set":
      return { ...state, [event.name]: event.value };
    case "touch":
      return { ...state, touched: true };
    case "password/toggle":
      return { ...state, showPassword: !state.showPassword };
  }
}

export function signupValid(state: SignupDraftState): boolean {
  return (
    state.first.trim() !== "" &&
    state.last.trim() !== "" &&
    isEmail(state.email) &&
    state.password.length >= 8 &&
    state.confirm === state.password
  );
}

export interface ForgotDraftState {
  email: string;
  token: string;
  newPassword: string;
  touched: boolean;
  showPassword: boolean;
  /** Request answered; the reset step is now reachable without a URL token. */
  sent: boolean;
  /** Reset succeeded; the success copy stays until the island unmounts. */
  done: boolean;
  message: string | null;
}

export type ForgotDraftEvent =
  | { type: "field/set"; name: "email" | "token" | "newPassword"; value: string }
  | { type: "touch" }
  | { type: "password/toggle" }
  | { type: "request/sent"; message: string }
  | { type: "reset/done" };

export function initialForgotDraftMachine(): ForgotDraftState {
  return {
    email: "",
    token: "",
    newPassword: "",
    touched: false,
    showPassword: false,
    sent: false,
    done: false,
    message: null,
  };
}

export function forgotDraftMachine(
  state: ForgotDraftState,
  event: ForgotDraftEvent,
): ForgotDraftState {
  switch (event.type) {
    case "field/set":
      // A newly pasted token clears the old envelope copy with the same event.
      return { ...state, [event.name]: event.value, message: state.sent ? state.message : null };
    case "touch":
      return { ...state, touched: true };
    case "password/toggle":
      return { ...state, showPassword: !state.showPassword };
    case "request/sent":
      return { ...state, sent: true, message: event.message };
    case "reset/done":
      return { ...state, done: true };
  }
}

export function forgotResetValid(state: ForgotDraftState, urlToken: string): boolean {
  return (urlToken !== "" || state.token !== "") && isStrongPassword(state.newPassword);
}
