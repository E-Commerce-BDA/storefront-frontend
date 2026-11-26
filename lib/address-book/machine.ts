/**
 * Address book island machine — sf-074 (A13). Pure.
 * A13: Cancel resets the draft and closes the form; remove is guarded by the
 * same busy flag as save, so a double click cannot issue two deletes.
 */
import type { AccountAddressInput, AddressDto } from "@/lib/account/schemas";
import type { Status } from "@/lib/machine/status";

export const EMPTY_ADDRESS_DRAFT: AccountAddressInput = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export interface AddressBookMachineState {
  addresses: AddressDto[];
  draft: AccountAddressInput;
  editing: string | null;
  formOpen: boolean;
  busy: boolean;
  status: Status;
  error: string | null;
}

export type AddressBookMachineEvent =
  | { type: "load/start" }
  | { type: "load/success"; addresses: AddressDto[] }
  | { type: "load/error"; message: string }
  | { type: "edit/start"; address: AddressDto }
  | { type: "add/start" }
  | { type: "cancel" }
  | { type: "draft/change"; patch: Partial<AccountAddressInput> }
  | { type: "save/start" }
  | { type: "save/success"; address: AddressDto; wasEditing: string | null }
  | { type: "save/error"; message: string }
  | { type: "remove/start" }
  | { type: "remove/success"; id: string }
  | { type: "remove/error"; message: string };

export function initialAddressBookMachine(): AddressBookMachineState {
  return {
    addresses: [],
    draft: EMPTY_ADDRESS_DRAFT,
    editing: null,
    formOpen: false,
    busy: false,
    status: "idle",
    error: null,
  };
}

export function addressBookMachine(
  state: AddressBookMachineState,
  event: AddressBookMachineEvent,
): AddressBookMachineState {
  switch (event.type) {
    case "load/start":
      return { ...state, status: "loading" };
    case "load/success":
      return { ...state, addresses: event.addresses, status: "ready" };
    case "load/error":
      return { ...state, status: "error", error: event.message };
    case "edit/start":
      return {
        ...state,
        draft: {
          label: event.address.label,
          line1: event.address.line1,
          line2: event.address.line2,
          city: event.address.city,
          state: event.address.state,
          postalCode: event.address.postalCode,
          country: event.address.country ?? "US",
          isDefault: event.address.isDefault,
        },
        editing: event.address.id,
        formOpen: true,
      };
    case "add/start":
      return { ...state, draft: EMPTY_ADDRESS_DRAFT, editing: null, formOpen: true };
    case "cancel":
      // A13: no half-edited draft survives a cancel.
      return { ...state, draft: EMPTY_ADDRESS_DRAFT, editing: null, formOpen: false };
    case "draft/change":
      return { ...state, draft: { ...state.draft, ...event.patch } };
    case "save/start":
      return state.busy ? state : { ...state, busy: true, error: null };
    case "save/success":
      return {
        ...state,
        busy: false,
        formOpen: false,
        editing: null,
        draft: EMPTY_ADDRESS_DRAFT,
        addresses:
          event.wasEditing === null
            ? [...state.addresses, event.address]
            : state.addresses.map((a) => (a.id === event.wasEditing ? event.address : a)),
      };
    case "save/error":
      return { ...state, busy: false, error: event.message };
    case "remove/start":
      return state.busy ? state : { ...state, busy: true, error: null };
    case "remove/success":
      return {
        ...state,
        busy: false,
        addresses: state.addresses.filter((a) => a.id !== event.id),
      };
    case "remove/error":
      return { ...state, busy: false, error: event.message };
  }
}
