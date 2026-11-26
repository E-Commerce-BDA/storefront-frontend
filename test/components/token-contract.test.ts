/**
 * Canonical token contract — sf-078.
 *
 * Two regressions this file exists to catch:
 *   1. A second base `.sf-pill {}` rule. The last one wins on `border-radius`,
 *      so a stray duplicate silently defeats the admin's `--pill-radius`.
 *   2. A `var(--x)` with no fallback and no definition anywhere. It resolves to
 *      nothing, so the declaration is dropped and the face falls back to the
 *      browser default instead of a theme value.
 *
 * Names that only appear as a fallback are allowed to be undefined: CSS never
 * evaluates them when the outer token exists (e.g. `--surface` behind
 * `--surface-raised`). Names emitted as inline style keys from a resolver are
 * definitions too — the stylesheet cannot see them.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const rawCss = readFileSync(join(root, "app", "globals.css"), "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const source = ["app", "components", "lib"]
  .flatMap((dir) => sourceFiles(join(root, dir)))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

describe("canonical token contract", () => {
  it("has exactly one base .sf-pill rule, and it owns --pill-radius", () => {
    const baseRules = css.match(/(?:^|\n)\s*\.sf-pill\s*\{/g) ?? [];
    expect(baseRules, "a second base .sf-pill rule shadows admin pillRadius").toHaveLength(1);
    const base = css.match(/\.sf-pill\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(base).toMatch(/border-radius:\s*var\(--pill-radius/);
  });

  it("references no undefined var without a fallback", () => {
    const declared = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const emitted = new Set(
      [...source.matchAll(/["'`](--[a-z0-9-]+)["'`]\s*:/g)].map((m) => m[1]),
    );
    const fallbacks = new Set<string>();
    for (const m of css.matchAll(/var\(--[a-z0-9-]+,([^)]*)\)/g)) {
      for (const name of m[1].matchAll(/(--[a-z0-9-]+)/g)) fallbacks.add(name[1]);
    }

    const bare = [...css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/g)]
      .map((m) => m[1])
      .filter((name) => !declared.has(name) && !emitted.has(name) && !fallbacks.has(name));

    expect([...new Set(bare)], "a bare var() resolves to nothing").toEqual([]);
  });
});
