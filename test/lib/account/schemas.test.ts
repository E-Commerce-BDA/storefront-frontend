import { describe, expect, it } from "vitest";
import {
  accountAddressSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/account/schemas";

describe("account write schemas (sf-059)", () => {
  it("accepts partial profile updates and rejects unknown keys", () => {
    expect(updateProfileSchema.safeParse({ firstName: "Ada" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ roles: ["admin"] }).success).toBe(false);
  });

  it("mirrors auth-svc's password policy", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "longer123" }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "short1" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "letters" }).success).toBe(false);
  });

  it("requires the address fields auth-svc requires", () => {
    expect(
      accountAddressSchema.safeParse({ line1: "1 Main", city: "Springfield", postalCode: "12345", country: "US" }).success,
    ).toBe(true);
    expect(accountAddressSchema.safeParse({ line1: "", city: "Springfield", postalCode: "12345" }).success).toBe(false);
    expect(accountAddressSchema.safeParse({ line1: "1 Main", city: "Springfield", postalCode: "12345", country: "USA" }).success).toBe(false);
  });
});
