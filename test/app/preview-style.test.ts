/**
 * Style contract for the admin draft patch (sf-096 follow-up).
 *
 * Admin-authored paint may only reach CSS through the --sf-* resolver. No raw
 * CSS string, admin token name or inline HTML is accepted or emitted anywhere
 * on the preview path.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { previewThemeVars } from "@/lib/preview/vars";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sources = [
  "lib/preview/draft.ts",
  "lib/preview/vars.ts",
  "app/(shop)/_components/PreviewDraftBridge.tsx",
].map((path) => readFileSync(join(root, path), "utf8"));

describe("preview style contract", () => {
  it("never parses CSS text or writes admin tokens from a message", () => {
    for (const source of sources) {
      expect(source).not.toMatch(/dangerouslySetInnerHTML|innerHTML/);
      expect(source).not.toMatch(/cssText/);
    }
    // The validator names --adm-* only to reject it; the applier must never.
    expect(sources.slice(1).join("\n")).not.toMatch(/--adm-/);
  });

  it("emits only resolver vars, even for a hostile-looking draft", () => {
    const hostile = {
      palette: { brand: { brand: "#123456" } },
      navbar: { bg: "#ffffff" },
      cssText: "--adm-color: red;",
      "--sf-color-brand": "red",
    };
    const vars = previewThemeVars(undefined, hostile as never);
    const emitted = Object.entries(vars);

    expect(emitted.length).toBeGreaterThan(10);
    expect(emitted.every(([name]) => name.startsWith("--"))).toBe(true);
    expect(emitted.some(([name]) => name.startsWith("--adm-"))).toBe(false);
    expect(emitted.some(([, value]) => String(value).includes("--adm-"))).toBe(false);
    expect(vars["--sf-color-brand"]).toBe("#123456");
  });

  it("merges a sparse draft over the published theme instead of resetting it", () => {
    const vars = previewThemeVars(
      { palette: { brand: { brand: "#published", brandHover: "#aaaaaa" } } },
      { palette: { brand: { brand: "#123456" } } },
    );
    expect(vars["--sf-color-brand"]).toBe("#123456");
    expect(vars["--sf-color-brand-hover"]).toBe("#aaaaaa");
  });
});
