import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const paint = [
  ...css.matchAll(/\.(?:sf-rail|sf-megamenu|sf-summary|sf-timeline)[^{]*\{([^}]*)}/g),
]
  .map((match) => match[1])
  .join("\n");

describe("composed style contract (sf-088)", () => {
  it("paints every surface through vars and tokens", () => {
    for (const pattern of [
      /background:\s*var\(--rail-dot-bg/,
      /background:\s*var\(--mega-bg/,
      /background:\s*var\(--summary-bg/,
      /background:\s*var\(--timeline-dot-bg/,
      /width:\s*var\(--summary-progress/,
    ]) {
      expect(paint, `paint must resolve ${pattern} through a var`).toMatch(pattern);
    }
  });

  it("drives pages, groups, progress and stages through data hooks", () => {
    expect(css).toMatch(/\.sf-rail\[data-motion="off"\]/);
    expect(css).toMatch(/\.sf-rail__dot\[aria-selected="true"\]/);
    expect(css).toMatch(/\.sf-megamenu__group\[data-columns="2"\]/);
    expect(css).toMatch(/\.sf-summary\[data-free-ship="true"\]/);
    expect(css).toMatch(/\.sf-timeline__step\[data-state="active"\]/);
  });

  it("gates hover off non-links and kills rail motion under reduced motion", () => {
    expect(css).toMatch(/\.sf-megamenu__item a:hover/);
    expect(css).toMatch(/\.sf-megamenu__item a:focus-within/);
    const guard = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(guard).toMatch(/\.sf-rail__dot/);
    expect(guard).toMatch(/\.sf-rail__track/);
    expect(paint).not.toMatch(/opacity/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = paint.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});
