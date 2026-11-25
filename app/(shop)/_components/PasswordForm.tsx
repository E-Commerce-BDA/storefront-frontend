"use client";

/** `/account` password change — sf-059 (A6.6). auth-svc owns the policy and revokes sessions on success. */
import { useState } from "react";
import { Button, Input, Toast } from "@/components/ui";
import { patchPassword } from "@/lib/account/port";
import { useNotice } from "./useNotice";

const STRONG = /^(?=.*[a-zA-Z])(?=.*\d)/;

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const { notice, notify, close } = useNotice();

  const mismatch = confirm !== "" && confirm !== next;
  const weak = next !== "" && (next.length < 8 || !STRONG.test(next));

  async function save() {
    if (busy || mismatch || weak) return;
    setBusy(true);
    const result = await patchPassword({ currentPassword: current, newPassword: next });
    setBusy(false);
    if (!result.ok) {
      notify("Could not change password", {
        message: result.message ?? "Check your current password and try again.",
        kind: "error",
      });
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
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
        <Input label="Current password" type="password" value={current} onChange={setCurrent} required />
        <Input
          label="New password"
          type="password"
          value={next}
          onChange={setNext}
          error={weak ? "Use at least 8 characters with a letter and a number." : undefined}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={setConfirm}
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
