/**
 * Checkout field machine — sf-086. Pure.
 *
 * `lib/checkout/machine.ts` owns the attempt (coupon + submit + banner); this
 * reducer owns the editable form. Splitting them means a failed POST never
 * rewrites what the shopper typed, and a coupon answer never touches addresses.
 */
import type { AddressDto } from "@/lib/account/schemas";
import type { Status } from "@/lib/machine/status";

export interface AddressFields {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutFieldsState {
  savedAddresses: AddressDto[];
  selectedAddress: string;
  shippingMethod: string;
  shipping: AddressFields;
  sameBilling: boolean;
  billing: AddressFields;
  notes: string;
  status: Status;
}

export type CheckoutFieldsEvent =
  | { type: "addresses/success"; addresses: AddressDto[] }
  | { type: "address/select"; id: string }
  | { type: "field/set"; group: "shipping" | "billing"; name: keyof AddressFields; value: string }
  | { type: "same-billing/set"; same: boolean }
  | { type: "method/set"; method: string }
  | { type: "notes/set"; notes: string };

export const EMPTY_ADDRESS_FIELDS: AddressFields = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export function initialCheckoutFields(): CheckoutFieldsState {
  return {
    savedAddresses: [],
    selectedAddress: "",
    shippingMethod: "standard",
    shipping: EMPTY_ADDRESS_FIELDS,
    sameBilling: true,
    billing: EMPTY_ADDRESS_FIELDS,
    notes: "",
    status: "idle",
  };
}

/** Address fields are shared by both groups, so one fill rule serves them. */
export function withField(
  fields: AddressFields,
  name: keyof AddressFields,
  value: string,
): AddressFields {
  return { ...fields, [name]: value };
}

function addressFromSaved(address: AddressDto): AddressFields {
  return {
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state ?? "",
    postalCode: address.postalCode,
    country: address.country ?? "US",
  };
}

export function checkoutFieldsMachine(
  state: CheckoutFieldsState,
  event: CheckoutFieldsEvent,
): CheckoutFieldsState {
  switch (event.type) {
    case "addresses/success":
      return { ...state, savedAddresses: event.addresses, status: "ready" };
    case "address/select": {
      const address = state.savedAddresses.find((saved) => saved.id === event.id);
      return {
        ...state,
        selectedAddress: event.id,
        shipping: address === undefined ? state.shipping : addressFromSaved(address),
      };
    }
    case "field/set":
      return event.group === "shipping"
        ? { ...state, shipping: withField(state.shipping, event.name, event.value) }
        : { ...state, billing: withField(state.billing, event.name, event.value) };
    case "same-billing/set":
      return { ...state, sameBilling: event.same };
    case "method/set":
      return { ...state, shippingMethod: event.method };
    case "notes/set":
      return { ...state, notes: event.notes };
  }
}

/** "" optional fields go out as absent, not empty strings — order-svc validates length-2 country etc. */
export function stripAddress(form: AddressFields) {
  return {
    line1: form.line1.trim(),
    ...(form.line2.trim() === "" ? {} : { line2: form.line2.trim() }),
    city: form.city.trim(),
    ...(form.state.trim() === "" ? {} : { state: form.state.trim() }),
    postalCode: form.postalCode.trim(),
    country: form.country,
  };
}
