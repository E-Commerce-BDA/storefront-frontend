/**
 * Style contract for the Sale nav highlight. The axe gate found 2.81:1 coral
 * text on the white navbar; the fix must stay a real colour change, not a
 * suppressed rule. Compute the ratio from the token so a future "quick" revert
 * to the surface colour fails here.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8");

function luminance(hex: string): number {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("sale nav link colour contrast", () => {
  it("paints the highlight through the accessible text token, not the coral surface", () => {
    const rule = /\.sf-navlinks a\[data-highlight="sale"\](?::hover)?\s*\{[^}]*\}/g;
    const blocks = [...css.matchAll(rule)].map((match) => match[0]);
    expect(blocks).toHaveLength(2);
    for (const block of blocks) {
      expect(block, `highlight must use the AA-safe token: ${block}`).toMatch(
        /color:\s*var\(--color-sale-text\)/,
      );
    }
  });

  it("keeps that token at AA contrast on the navbar and the section wash", () => {
    // The legacy name is now an alias; the concrete value lives in the
    // sf-084 token mirror. Reading the mirror keeps this gate on real paint.
    const token = css.match(/--sf-color-sale-text:\s*(#[0-9a-fA-F]{6})\s*;/i);
    expect(token, "sale-text token missing").not.toBeNull();
    const saleText = token![1]!;
    expect(contrast(saleText, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(saleText, "#f5fafc")).toBeGreaterThanOrEqual(4.5);
  });
});
