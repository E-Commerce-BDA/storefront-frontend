/**
 * Style contract for the sf-084 token layer.
 *
 * The body-level var map is emitted in JS, so the stylesheet must mirror every
 * name in :root; a missing mirror is an undefined var on a route that renders
 * before the layout style lands. Paint must resolve through vars — a hardcoded
 * literal in an alias would freeze the admin's edit at the CSS layer.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEFAULT_PALETTE, resolveComponentGroups } from "@/lib/theme/palette";
import { paletteToThemeVars } from "@/lib/theme/vars";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css"),
  "utf8",
);
const root = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "";
const inline = css.match(/@theme inline\s*\{([\s\S]*?)\}/)?.[1] ?? "";
const emitted = paletteToThemeVars(
  DEFAULT_PALETTE,
  resolveComponentGroups({ palette: DEFAULT_PALETTE }),
);
const declared = new Set([...root.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

describe("theme token style contract", () => {
  it("mirrors every emitted token in :root", () => {
    const missing = Object.keys(emitted).filter((name) => !declared.has(name));
    expect(missing, "a var emitted on <body> has no CSS fallback mirror").toEqual([]);
  });

  it("defines every --sf-* reference and gives it no hardcoded fallback", () => {
    const bare = [...css.matchAll(/var\(\s*(--sf-[a-z0-9-]+)\s*\)/g)]
      .map((m) => m[1])
      .filter((name) => !declared.has(name) && !(name in emitted));
    expect([...new Set(bare)]).toEqual([]);

    const painted = [...css.matchAll(/var\(\s*(--sf-[a-z0-9-]+)\s*,\s*([^)]*)\)/g)]
      .filter((m) => /#(?:[0-9a-fA-F]{3,8})|(?:rgba?|hsla?)\(/.test(m[2]))
      .map((m) => m[0]);
    expect(painted, "a semantic token must not carry a literal paint fallback").toEqual([]);
  });

  it("keeps legacy aliases as references, never a second literal", () => {
    // Only the palette emitter's legacy names are aliases; component families
    // keep their own concrete CSS fallbacks (px/ms) and mirror those as-is.
    const paletteEmitted = paletteToThemeVars(DEFAULT_PALETTE);
    const aliases = Object.keys(paletteEmitted).filter((name) => !name.startsWith("--sf-"));
    expect(aliases.length).toBeGreaterThan(20);
    for (const name of aliases) {
      const matches = [...root.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, "g"))];
      expect(matches.length, `${name} is not mirrored in :root`).toBe(1);
      expect(matches[0][1].trim(), `${name} must alias an --sf-* token`).toMatch(/^var\(--sf-/);
    }
  });

  it("aliases --color-card instead of redeclaring white in @theme inline", () => {
    expect(inline).toMatch(/--color-card:\s*var\(/);
    expect(inline).not.toMatch(/--color-card:\s*#/);
    expect(inline).toMatch(/--color-primary:\s*var\(--sf-color-brand\)/);
  });

  it("lets the component-group marquee tokens drive the existing track rules", () => {
    expect(css).toMatch(/animation-direction:\s*var\(--marquee-direction,\s*normal\)/);
    expect(css).toMatch(/animation-play-state:\s*var\(--marquee-play-state,\s*paused\)/);
  });

  it("keeps section-sized families out of :root so their per-section fallbacks survive", () => {
    expect(root).not.toMatch(/--grid-gap\s*:/);
    expect(root).not.toMatch(/--marquee-duration\s*:/);
  });
});
