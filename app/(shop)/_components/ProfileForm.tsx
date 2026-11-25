"use client";

/** `/account` profile editor — sf-059 (A6.1). Route island: it owns the draft and the notice, not the data. */
import { useState } from "react";
import { Button, Input, Toast } from "@/components/ui";
import { patchProfile } from "@/lib/account/port";
import { useNotice } from "./useNotice";

export interface ProfileFormProps {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export default function ProfileForm({ email, firstName, lastName }: ProfileFormProps) {
  const [first, setFirst] = useState(firstName ?? "");
  const [last, setLast] = useState(lastName ?? "");
  const [saving, setSaving] = useState(false);
  const { notice, notify, close } = useNotice();

  async function save() {
    if (saving) return;
    setSaving(true);
    const result = await patchProfile({ firstName: first, lastName: last });
    setSaving(false);
    notify(
      result.ok ? "Profile saved" : "Could not save profile",
      result.ok ? undefined : { message: result.message ?? "Please try again.", kind: "error" },
    );
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
        <Input label="Email" value={email} disabled />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" value={first} onChange={setFirst} maxLength={100} />
          <Input label="Last name" value={last} onChange={setLast} maxLength={100} />
        </div>
        <div>
          <Button type="submit" size="sm" disabled={saving || (first === (firstName ?? "") && last === (lastName ?? ""))}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
      <Toast
        open={notice.open}
        title={notice.title}
        message={notice.message}
        onClose={close}
      />
    </>
  );
}
