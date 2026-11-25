"use client";

/**
 * Account write port — sf-059. Islands call this origin through `bff`; no
 * Bearer, service URL or refresh-token handling lives in an island.
 */

import { bff } from "@/lib/http/browser";
import {
  addressDtoSchema,
  addressListSchema,
  type AccountAddressInput,
  type AddressDto,
} from "./schemas";

export function fetchAddresses() {
  return bff<AddressDto[]>("/api/account/addresses", { schema: addressListSchema });
}

export function patchProfile(input: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}) {
  return bff<{ id: string }>("/api/account/profile", { method: "PATCH", body: input });
}

export function patchPassword(input: { currentPassword: string; newPassword: string }) {
  return bff<null>("/api/account/password", { method: "PATCH", body: input });
}

export function postAddress(input: AccountAddressInput) {
  return bff<AddressDto>("/api/account/addresses", {
    method: "POST",
    body: input,
    schema: addressDtoSchema,
  });
}

export function patchAddress(id: string, input: Partial<AccountAddressInput>) {
  return bff<AddressDto>(`/api/account/addresses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
    schema: addressDtoSchema,
  });
}

export function deleteAddress(id: string) {
  return bff<null>(`/api/account/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
}
