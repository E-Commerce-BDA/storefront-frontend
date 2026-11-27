/**
 * Account forms — sf-086. Pure drafts with one Status lifecycle each; a failed
 * write never clears what the shopper typed, and a successful password change
 * clears the secrets instead of leaving them on screen.
 */
import type { Status } from "@/lib/machine/status";

export interface ProfileFormMachineState {
  first: string;
  last: string;
  status: Status;
}

export type ProfileFormMachineEvent =
  | { type: "field/set"; name: "first" | "last"; value: string }
  | { type: "submit/start" }
  | { type: "submit/success" }
  | { type: "submit/error" };

export function initialProfileFormMachine(firstName = "", lastName = ""): ProfileFormMachineState {
  return { first: firstName, last: lastName, status: "idle" };
}

export function profileFormMachine(
  state: ProfileFormMachineState,
  event: ProfileFormMachineEvent,
): ProfileFormMachineState {
  switch (event.type) {
    case "field/set":
      return { ...state, [event.name]: event.value };
    case "submit/start":
      return { ...state, status: "loading" };
    case "submit/success":
      return { ...state, status: "success" };
    case "submit/error":
      return { ...state, status: "error" };
  }
}

const STRONG_RE = /^(?=.*[a-zA-Z])(?=.*\d)/;

export interface PasswordFormMachineState {
  current: string;
  next: string;
  confirm: string;
  status: Status;
}

export type PasswordFormMachineEvent =
  | { type: "field/set"; name: "current" | "next" | "confirm"; value: string }
  | { type: "submit/start" }
  | { type: "submit/success" }
  | { type: "submit/error" };

export function initialPasswordFormMachine(): PasswordFormMachineState {
  return { current: "", next: "", confirm: "", status: "idle" };
}

export function passwordMismatch(state: PasswordFormMachineState): boolean {
  return state.confirm !== "" && state.confirm !== state.next;
}

export function passwordWeak(state: PasswordFormMachineState): boolean {
  return state.next !== "" && (state.next.length < 8 || !STRONG_RE.test(state.next));
}

export function canChangePassword(state: PasswordFormMachineState): boolean {
  return (
    state.status !== "loading" &&
    state.current !== "" &&
    state.next !== "" &&
    !passwordMismatch(state) &&
    !passwordWeak(state)
  );
}

export function passwordFormMachine(
  state: PasswordFormMachineState,
  event: PasswordFormMachineEvent,
): PasswordFormMachineState {
  switch (event.type) {
    case "field/set":
      return { ...state, [event.name]: event.value };
    case "submit/start":
      return canChangePassword(state) ? { ...state, status: "loading" } : state;
    case "submit/success":
      // Secrets are never echoed back after a successful rotation.
      return { ...initialPasswordFormMachine(), status: "success" };
    case "submit/error":
      return { ...state, status: "error" };
  }
}
