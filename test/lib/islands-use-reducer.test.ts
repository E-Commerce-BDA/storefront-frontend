/**
 * sf-086 regression guard: the 13 migrated islands must not reintroduce
 * useState. Timers, abort controllers and focus stay in refs/effects; every
 * interaction decision belongs to a pure machine in lib.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const islands = [
  "components/commerce/QuickViewDialog.tsx",
  "app/_components/NavbarMount.tsx",
  "components/shell/SearchMount.tsx",
  "app/(shop)/_components/CheckoutForm.tsx",
  "app/(shop)/_components/CartView.tsx",
  "app/(auth)/_components/SigninForm.tsx",
  "app/(auth)/_components/SignupForm.tsx",
  "app/(auth)/_components/ForgotForm.tsx",
  "app/(shop)/_components/ReviewForm.tsx",
  "app/(shop)/_components/ProfileForm.tsx",
  "app/(shop)/_components/PasswordForm.tsx",
  "components/sections/HeroCarousel.tsx",
  "components/commerce/ProductGridIsland.tsx",
];

describe("island state ownership (sf-086)", () => {
  it.each(islands)("%s has no useState", (file) => {
    const source = readFileSync(join(root, file), "utf8");
    expect(source).not.toMatch(/\buseState\b/);
    expect(source).toMatch(/\buseReducer\b/);
  });
});
