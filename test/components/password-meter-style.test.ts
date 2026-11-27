import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components", "auth", "PasswordMeter.tsx"),
  "utf8",
);

describe("PasswordMeter style contract (sf-095)", () => {
  it("resolves every bar colour through a token, never a hex literal", () => {
    expect(source).toMatch(/var\(--color-error\)/);
    expect(source).toMatch(/var\(--color-success\)/);
    expect(source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });

  it("keeps the meter decorative and hides no live guidance", () => {
    expect(source).toMatch(/aria-hidden="true"/);
    expect(source).not.toMatch(/aria-hidden[^\n]*hint/);
  });
});
