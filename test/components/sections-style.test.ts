/**
 * CMS section style contract — sf-060 (design-system §4/§8, sections.md §4).
 *
 * Three promises, checked against the stylesheet rather than a screenshot:
 * 1. every paint resolves through a `var()` over a token, so an admin retheme is
 *    a data change and a hardcoded hex anywhere in these rules is a bug;
 * 2. every *state* (motion, direction, pause, photos, active star, active slide)
 *    is read from a data attr — the markup sets attrs, the CSS does the painting;
 * 3. the page shell owns the horizontal edge: no section, and not `.sf-shop`
 *    itself, carries a max-width. A `ch` measure on a *text* element is the one
 *    allowed exception (plan decision 6), which is why the rule is about px.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css"),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

/** All rule bodies whose selector mentions one of these vocabularies. */
function rulesFor(...prefixes: string[]): string {
  const out: string[] = [];
  for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = match[1].trim();
    if (prefixes.some((p) => selector.includes(p))) out.push(match[2]);
  }
  return out.join("\n");
}

const SHELL = [
  ".sf-section",
  ".sf-shop",
  ".sf-slideshow",
  ".sf-strip",
  ".sf-showcase",
  ".sf-collection",
  ".sf-testimonials",
  ".sf-quote",
  ".sf-stars",
  ".sf-pill",
  ".sf-blog",
  ".sf-degraded",
  ".sf-pdp-description",
  ".sf-pdp-details",
  ".sf-pdp-trust",
  ".sf-pdp-story",
  ".sf-faq-wrap",
];

const sectionCss = rulesFor(...SHELL);

describe("section paint contract", () => {
  it("found every vocabulary it claims to cover", () => {
    // Guards the matcher itself: a renamed class would silently empty `sectionCss`
    // and every assertion below would pass on nothing.
    for (const name of SHELL) {
      expect(css, `${name} has no rules`).toContain(name);
    }
  });

  it("contains no hardcoded colour outside a var() fallback", () => {
    const withoutFallbacks = sectionCss.replace(/var\([^()]*\)\s*/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });

  it("lets the admin's per-section knobs in through vars", () => {
    expect(sectionCss).toMatch(/background:\s*var\(--section-bg,/);
    expect(sectionCss).toMatch(/color:\s*var\(--section-text,/);
    expect(sectionCss).toMatch(/gap:\s*var\(--grid-gap,/);
    expect(sectionCss).toMatch(/width:\s*var\(--strip-cell,/);
    expect(sectionCss).toMatch(/width:\s*var\(--quote-cell,/);
  });

  it("keeps the horizontal edge with the page shell", () => {
    const shell = css.match(/\.sf-section\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(shell).toMatch(/padding:\s*var\(--section-pad-y,\s*48px\)\s*var\(--section-pad-x,\s*0\)/);
    // Full-bleed: the gutter is `--sf-page-pad` and nothing else. A px max-width
    // anywhere in this vocabulary would reinstate the old 1280 container.
    expect(css.match(/\.sf-shop\s*\{[^}]*\}/)?.[0]).not.toMatch(/max-width/);
    expect(sectionCss).not.toMatch(/max-width:\s*\d+px/);
  });

  it("defines the gutter exactly once and shares it with the bar", () => {
    // The token is the whole layout promise (design-system §4): a 16px floor,
    // 4vw in between, 50px ceiling. Editing it here is the only sanctioned way
    // to move the page edge — a second copy in a component is how the 1280
    // container came back.
    expect(css).toMatch(/--sf-page-pad:\s*clamp\(16px,\s*4vw,\s*50px\);/);
    expect(css.match(/\.sf-shop\s*\{[^}]*\}/)?.[0]).toMatch(/padding-inline:\s*var\(--sf-page-pad\)/);
    expect(css.match(/\.sf-navbar\s*\{[^}]*\}/)?.[0]).toMatch(/padding:\s*0 var\(--sf-page-pad\)/);
  });

  it("allows a measure, but only for prose or a cell — never a px container", () => {
    const maxes = sectionCss.match(/max-width:[^;]+/g) ?? [];
    expect(maxes.length).toBeGreaterThan(0);
    for (const rule of maxes) {
      // `ch` is a text measure, `%` is inside one cell; a px value would be the
      // old 1280 container creeping back in through a section (plan §5).
      expect(rule, `${rule} constrains the page, not the prose`).toMatch(/max-width:\s*(?:\d+ch|\d*%)/);
    }
  });
});

describe("section state contract", () => {
  it("drives the marquee from data attrs, not modifier classes", () => {
    expect(css).toMatch(/\.sf-strip\[data-motion="marquee"\]\s*\.sf-strip__track\s*\{[^}]*animation:/);
    expect(css).toMatch(/\.sf-strip\[data-motion="marquee"\]\[data-direction="right"\]/);
    expect(css).toMatch(/\.sf-testimonials\[data-layout="marquee"\]\s*\.sf-testimonials__track/);
    expect(sectionCss).toMatch(/var\(--marquee-duration,/);
  });

  it("loops exactly one copy of the track", () => {
    const keyframes = css.match(/@keyframes\s+sf-marquee\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(keyframes).toMatch(/translateX\(0\)/);
    expect(keyframes).toMatch(/translateX\(-50%\)/);
  });

  it("keeps the pause promise for pointer and keyboard", () => {
    expect(css).toMatch(
      /\.sf-strip\[data-motion="marquee"\]\[data-pause="true"\]:hover\s*\.sf-strip__track/,
    );
    expect(css).toMatch(/:focus-within\s*\.sf-testimonials__track/);
    expect(css).toMatch(/animation-play-state:\s*paused/);
  });

  it("renders the strip and the quotes static under reduced motion, and drops the loop copy", () => {
    const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/g) ?? [];
    const blob = reduced.join("\n");
    // `[^{]*` because the two tracks share one declaration block — a selector
    // list, not a duplicate rule, is what keeps the two marquees in parity.
    expect(blob).toMatch(/\.sf-strip\[data-motion="marquee"\]\s*\.sf-strip__track[^{]*\{\s*animation:\s*none/);
    expect(blob).toMatch(/\.sf-testimonials\[data-layout="marquee"\]\s*\.sf-testimonials__track/);
    // The duplicate only feeds the animation, so a static row must not show it twice.
    expect(blob).toMatch(/\.sf-strip__cell\[aria-hidden="true"\][^{]*\{\s*display:\s*none/);
    expect(blob).toMatch(/\.sf-quote\[aria-hidden="true"\]/);
  });

  it("paints a star from data, and the tiles from the photo switch", () => {
    expect(css).toMatch(/\.sf-stars__star\[data-on="true"\]/);
    expect(css).toMatch(/\.sf-showcase\[data-photos="false"\]\s*\.sf-showcase__tile/);
    expect(css).toMatch(/\.sf-collection\[data-layout="carousel"\]\s*\.sf-grid/);
  });

  it("gives the carousel rail its own vocabulary so the hero stays motion-free", () => {
    expect(css).toMatch(/\.sf-slideshow__slide\[hidden\]\s*\{\s*display:\s*none/);
    expect(css).toMatch(/\.sf-slideshow__dot\[aria-selected="true"\]/);
  });
});
