/**
 * Account-write schemas — sf-059
 *
 * Loose on read shapes, strict on writes. The bounds mirror auth-svc's DTOs
 * (update-profile.dto.ts, change-password.dto.ts, create-address.dto.ts) so a
 * bad body is rejected at the BFF boundary instead of becoming a 400 from a
 * service after the tokens have already been forwarded.
 */

import { z } from "zod";

export const updateProfileSchema = z
  .object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    avatarUrl: z.string().max(2048).optional(),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-zA-Z])(?=.*\d)/),
  })
  .strict();

export const accountAddressSchema = z
  .object({
    type: z.string().max(10).optional(),
    label: z.string().max(50).optional(),
    line1: z.string().min(1).max(255),
    line2: z.string().max(255).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2).optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

/** auth-svc's UpdateAddressDTO makes every field optional (a patch, not a replace). */
export const updateAddressSchema = accountAddressSchema.partial();

export const addressDtoSchema = accountAddressSchema.extend({ id: z.string() });
export const addressListSchema = z.array(addressDtoSchema);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AccountAddressInput = z.infer<typeof accountAddressSchema>;
export type AddressDto = z.infer<typeof addressDtoSchema>;
