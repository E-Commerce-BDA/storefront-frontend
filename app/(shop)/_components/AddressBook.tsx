"use client";

/** `/account` address book — sf-059 (A6.2). One form for add and edit; writes go through the BFF port. */
import { useEffect, useReducer } from "react";
import { Button, Input, Toast } from "@/components/ui";
import { deleteAddress, fetchAddresses, patchAddress, postAddress } from "@/lib/account/port";
import type { AddressDto } from "@/lib/account/schemas";
import { addressBookMachine, initialAddressBookMachine } from "@/lib/address-book/machine";
import { useNotice } from "./useNotice";

export default function AddressBook() {
  const [machine, dispatch] = useReducer(addressBookMachine, undefined, initialAddressBookMachine);
  const { addresses, draft, editing, formOpen, busy } = machine;
  const { notice, notify, close } = useNotice();

  useEffect(() => {
    let alive = true;
    dispatch({ type: "load/start" });
    void fetchAddresses().then((res) => {
      if (!alive) return;
      if (res.ok) dispatch({ type: "load/success", addresses: res.data });
      else dispatch({ type: "load/error", message: res.message ?? "Could not load addresses." });
    });
    return () => {
      alive = false;
    };
  }, []);

  function startAdd() {
    dispatch({ type: "add/start" });
  }

  function startEdit(address: AddressDto) {
    dispatch({ type: "edit/start", address });
  }

  /** A13: cancel is a reset, not just a hide. */
  function cancel() {
    dispatch({ type: "cancel" });
  }

  async function save() {
    if (busy) return;
    const wasEditing = editing;
    dispatch({ type: "save/start" });
    const result =
      editing === null ? await postAddress(draft) : await patchAddress(editing, draft);
    if (!result.ok) {
      dispatch({ type: "save/error", message: result.message ?? "Please try again." });
      notify("Could not save address", { message: result.message ?? "Please try again.", kind: "error" });
      return;
    }
    dispatch({ type: "save/success", address: result.data, wasEditing });
    notify(wasEditing === null ? "Address added" : "Address updated");
  }

  async function remove(address: AddressDto) {
    // A13: one delete at a time, sharing the save guard.
    dispatch({ type: "remove/start" });
    const result = await deleteAddress(address.id);
    if (!result.ok) {
      dispatch({ type: "remove/error", message: result.message ?? "Please try again." });
      notify("Could not remove address", { message: result.message ?? "Please try again.", kind: "error" });
      return;
    }
    dispatch({ type: "remove/success", id: address.id });
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
        Add address
      </Button>
      {formOpen ? (
        <Button variant="ghost-ink" size="sm" onClick={cancel}>
          Cancel
        </Button>
      ) : null}

      {formOpen ? (
        <form
          className="grid gap-3 rounded-[var(--radius-md,10px)] border border-[var(--border)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Input label="Label" value={draft.label ?? ""} onChange={(v) => dispatch({ type: "draft/change", patch: { label: v }})} />
          <Input label="Address line 1" value={draft.line1} onChange={(v) => dispatch({ type: "draft/change", patch: { line1: v }})} required />
          <Input label="Address line 2" value={draft.line2 ?? ""} onChange={(v) => dispatch({ type: "draft/change", patch: { line2: v }})} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="City" value={draft.city} onChange={(v) => dispatch({ type: "draft/change", patch: { city: v }})} required />
            <Input label="State / Province" value={draft.state ?? ""} onChange={(v) => dispatch({ type: "draft/change", patch: { state: v }})} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Postal code" value={draft.postalCode} onChange={(v) => dispatch({ type: "draft/change", patch: { postalCode: v }})} required />
            <Input label="Country" value={draft.country ?? ""} onChange={(v) => dispatch({ type: "draft/change", patch: { country: v }})} maxLength={2} />
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
