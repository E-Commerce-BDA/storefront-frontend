"use client";

/** `/account` address book — sf-059 (A6.2). One form for add and edit; writes go through the BFF port. */
import { useEffect, useState } from "react";
import { Button, Input, Toast } from "@/components/ui";
import { deleteAddress, fetchAddresses, patchAddress, postAddress } from "@/lib/account/port";
import type { AccountAddressInput, AddressDto } from "@/lib/account/schemas";
import { useNotice } from "./useNotice";

const EMPTY: AccountAddressInput = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export default function AddressBook() {
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [draft, setDraft] = useState<AccountAddressInput>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notice, notify, close } = useNotice();

  useEffect(() => {
    let alive = true;
    void fetchAddresses().then((res) => {
      if (alive && res.ok) setAddresses(res.data);
    });
    return () => {
      alive = false;
    };
  }, []);

  function startAdd() {
    setDraft(EMPTY);
    setEditing(null);
    setFormOpen(true);
  }

  function startEdit(address: AddressDto) {
    setDraft({
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditing(address.id);
    setFormOpen(true);
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    const result =
      editing === null ? await postAddress(draft) : await patchAddress(editing, draft);
    setBusy(false);
    if (!result.ok) {
      notify("Could not save address", { message: result.message ?? "Please try again.", kind: "error" });
      return;
    }
    setAddresses((prev) =>
      editing === null
        ? [...prev, result.data]
        : prev.map((a) => (a.id === editing ? result.data : a)),
    );
    setFormOpen(false);
    setEditing(null);
    notify(editing === null ? "Address added" : "Address updated");
  }

  async function remove(address: AddressDto) {
    const result = await deleteAddress(address.id);
    if (!result.ok) {
      notify("Could not remove address", { message: result.message ?? "Please try again.", kind: "error" });
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== address.id));
    notify("Address removed");
  }

  return (
    <>
      {addresses.length === 0 ? (
        <p className="m-0 text-sm text-[var(--text-muted)]">No saved addresses yet.</p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0" role="list">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md,10px)] border border-[var(--border)] px-4 py-3"
            >
              <span className="grid gap-0.5 text-sm text-[var(--color-ink)]">
                <span className="font-medium">{address.label || address.line1}</span>
                <span className="text-[var(--text-muted)]">
                  {address.line1}, {address.city} {address.postalCode}, {address.country ?? ""}
                </span>
              </span>
              <span className="flex gap-2">
                <Button variant="light" size="sm" onClick={() => startEdit(address)}>
                  Edit {address.label || "address"}
                </Button>
                <Button variant="ghost-ink" size="sm" onClick={() => void remove(address)}>
                  Remove {address.label || "address"}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Button variant="light" size="sm" onClick={startAdd}>
        {formOpen ? "Cancel" : "Add address"}
      </Button>

      {formOpen ? (
        <form
          className="grid gap-3 rounded-[var(--radius-md,10px)] border border-[var(--border)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Input label="Label" value={draft.label ?? ""} onChange={(v) => setDraft({ ...draft, label: v })} />
          <Input label="Address line 1" value={draft.line1} onChange={(v) => setDraft({ ...draft, line1: v })} required />
          <Input label="Address line 2" value={draft.line2 ?? ""} onChange={(v) => setDraft({ ...draft, line2: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="City" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} required />
            <Input label="State / Province" value={draft.state ?? ""} onChange={(v) => setDraft({ ...draft, state: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Postal code" value={draft.postalCode} onChange={(v) => setDraft({ ...draft, postalCode: v })} required />
            <Input label="Country" value={draft.country ?? ""} onChange={(v) => setDraft({ ...draft, country: v })} maxLength={2} />
          </div>
          <div>
            <Button type="submit" size="sm" disabled={busy || draft.line1.trim() === "" || draft.city.trim() === "" || draft.postalCode.trim() === ""}>
              {busy ? "Saving…" : "Save address"}
            </Button>
          </div>
        </form>
      ) : null}

      <Toast open={notice.open} title={notice.title} message={notice.message} onClose={close} />
    </>
  );
}
