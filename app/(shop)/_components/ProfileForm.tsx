"use client";

/** `/account` profile editor — sf-059 (A6.1). Route island: it owns the draft and the notice, not the data. */
import { useReducer } from "react";
import { Button, Input, Toast } from "@/components/ui";
import { patchProfile } from "@/lib/account/port";
import {
  initialProfileFormMachine,
  profileFormMachine,
} from "@/lib/account/formsMachine";
import { useNotice } from "./useNotice";

export interface ProfileFormProps {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export default function ProfileForm({ email, firstName, lastName }: ProfileFormProps) {
  const [draft, dispatch] = useReducer(
    profileFormMachine,
    undefined,
    () => initialProfileFormMachine(firstName ?? "", lastName ?? ""),
  );
  const { first, last, status } = draft;
  const saving = status === "loading";
  const { notice, notify, close } = useNotice();

  async function save() {
    if (saving) return;
    dispatch({ type: "submit/start" });
    const result = await patchProfile({ firstName: first, lastName: last });
    dispatch({ type: result.ok ? "submit/success" : "submit/error" });
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
          <Input label="First name" value={first} onChange={(value) => dispatch({ type: "field/set", name: "first", value })} maxLength={100} />
          <Input label="Last name" value={last} onChange={(value) => dispatch({ type: "field/set", name: "last", value })} maxLength={100} />
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
