/**
 * CSS structure guard — globals.css must survive the real parser.
 * History (sf-034): a stray `}` sat in the reduced-motion guard from the
 * sf-027 era. webpack's css-loader tolerated it (builds stayed green);
 * Turbopack dev (strict postcss) threw. This test fails on that class
 * weeks before dev does.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "postcss";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");

describe("css structure guard", () => {
  it("parses under postcss (the dev-server parser, not the lenient one)", () => {
    expect(() => parse(rawCss)).not.toThrow();
  });

  it("keeps brace depth non-negative and balanced (stray-close detector)", () => {
    const clean = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");
    let depth = 0;
    let min = 0;
    for (const ch of clean) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      if (depth < min) min = depth;
    }
    expect(min, "a stray closing brace predates its opener").toBe(0);
    expect(depth, "unclosed block at EOF").toBe(0);
  });
});
