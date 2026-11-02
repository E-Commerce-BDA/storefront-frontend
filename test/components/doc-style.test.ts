/**
 * Blog/legal style contract — sf-063
 *
 * The post/page/prose block CSS paints only through `--post-*`/`--page-*`/
 * `--prose-*`/`--doc-*`/`--faq-*` vars with a token fallback, caps the *text
 * measure* (never the page — design-system §4 / decision §10.2), and reuses the
 * home teaser's `.sf-blog-card` painter instead of defining a second card.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const docCss = [
  ...css.matchAll(/\.(?:sf-post|sf-page|sf-prose|sf-faq|sf-bloglist)[^{]*\{([^}]*)}/g),
]
  .map((m) => m[1])
  .join("\n");

describe("blog/legal style contract", () => {
  it("exists — the routes are styled, not scaffolded", () => {
    expect(docCss.trim().length).toBeGreaterThan(0);
  });

  it("paints only through doc vars and tokens", () => {
    for (const prop of [
      /color:\s*var\(--doc-title/,
      /color:\s*var\(--prose-text/,
      /color:\s*var\(--prose-link/,
      /border-left:\s*3px solid var\(--post-quote-border/,
      /color:\s*var\(--faq-q/,
      /background:\s*var\(--faq-bg/,
    ]) {
      expect(docCss, `doc paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("measures the text, never the page", () => {
    expect(css).toMatch(/\.sf-prose\s*\{[^}]*max-width:\s*var\(--prose-measure/);
    expect(css).toMatch(/\.sf-post__title[^}]*max-width:\s*var\(--doc-title-measure/);
    // The article/page wrappers carry no max-width of their own.
    expect(css).not.toMatch(/\.sf-post\s*\{[^}]*max-width/);
    expect(css).not.toMatch(/\.sf-page\s*\{[^}]*max-width/);
  });

  it("plain post/page paragraphs honour line breaks without an HTML sink", () => {
    expect(css).toMatch(/\.sf-post p[^}]*white-space:\s*pre-line/);
    expect(css).toMatch(/\.sf-page p[^}]*white-space:\s*pre-line/);
  });

  it("contains no raw hex paint outside var() fallbacks", () => {
    const withoutFallbacks = docCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
