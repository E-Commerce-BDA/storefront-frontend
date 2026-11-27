"use client";

/** `/account` password change — sf-059 (A6.6). auth-svc owns the policy and revokes sessions on success. */
import { useReducer } from "react";
import { Button, Input, Toast } from "@/components/ui";
import { patchPassword } from "@/lib/account/port";
import {
  canChangePassword,
  initialPasswordFormMachine,
  passwordFormMachine,
  passwordMismatch,
  passwordWeak,
} from "@/lib/account/formsMachine";
import { useNotice } from "./useNotice";

export default function PasswordForm() {
  const [draft, dispatch] = useReducer(
    passwordFormMachine,
    undefined,
    initialPasswordFormMachine,
  );
  const { current, next, confirm, status } = draft;
  const busy = status === "loading";
  const { notice, notify, close } = useNotice();

  const mismatch = passwordMismatch(draft);
  const weak = passwordWeak(draft);

  async function save() {
    if (!canChangePassword(draft)) return;
    dispatch({ type: "submit/start" });
    const result = await patchPassword({ currentPassword: current, newPassword: next });
    if (!result.ok) {
      dispatch({ type: "submit/error" });
      notify("Could not change password", {
        message: result.message ?? "Check your current password and try again.",
        kind: "error",
      });
      return;
    }
    // The reducer clears the secrets on success; nothing is echoed back.
    dispatch({ type: "submit/success" });
    notify("Password changed", { message: "Other devices may need to sign in again." });
  }

  return (
    <>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Input label="Current password" type="password" value={current} onChange={(value) => dispatch({ type: "field/set", name: "current", value })} required />
        <Input
          label="New password"
          type="password"
          value={next}
          onChange={(value) => dispatch({ type: "field/set", name: "next", value })}
          error={weak ? "Use at least 8 characters with a letter and a number." : undefined}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(value) => dispatch({ type: "field/set", name: "confirm", value })}
          error={mismatch ? "Passwords do not match." : undefined}
          required
        />
        <div>
          <Button
            type="submit"
            size="sm"
            disabled={busy || current === "" || next === "" || mismatch || weak}
          >
            {busy ? "Changing…" : "Change password"}
          </Button>
        </div>
      </form>
      <Toast open={notice.open} title={notice.title} message={notice.message} onClose={close} />
    </>
  );
}
