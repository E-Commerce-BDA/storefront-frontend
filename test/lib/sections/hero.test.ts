/**
 * Hero resolver unit — sections.md §2/§3.
 *
 * The block is dumb; every decision the tests care about lives here: the CTA cap,
 * the ratio fallback, and the trim rules. There is no default hero to fall back
 * to since sf-060 — cms-svc owns the copy, so a slide with nothing to say is
 * dropped by `resolveSections`, not papered over with house copy from here.
 */
import { describe, expect, it } from "vitest";
import {
  HERO_CTA_LIMIT,
  HERO_DEFAULT_RATIO,
  resolveHero,
  toCssRatio,
  type HeroCta,
  type HeroFields,
} from "@/lib/sections/hero";

const base = { title: "Winter drop" } satisfies HeroFields;

describe("resolveHero", () => {
  it("paints exactly what the slide said and nothing more", () => {
    const hero = resolveHero(base);
    expect(hero.title).toBe("Winter drop");
    expect(hero.eyebrow).toBeUndefined();
    expect(hero.body).toBeUndefined();
    expect(hero.image).toBeUndefined();
    expect(hero.ctas).toEqual([]);
    expect(hero.align).toBe("left");
    expect(hero.height).toBe("auto");
    expect(hero.bgColor).toBeUndefined();
    expect(hero.textColor).toBeUndefined();
  });

  it("reads only the alignments and heights it knows", () => {
    expect(resolveHero({ ...base, align: "center" }).align).toBe("center");
    expect(resolveHero({ ...base, align: "right" as never }).align).toBe("left");
    expect(resolveHero({ ...base, height: "viewport" }).height).toBe("viewport");
    expect(resolveHero({ ...base, height: "tall" as never }).height).toBe("auto");
  });

  it("clears whitespace-only copy rather than emitting a blank line", () => {
    const hero = resolveHero({ ...base, eyebrow: "", body: "   ", bgColor: "  " });
    expect(hero.eyebrow).toBeUndefined();
    expect(hero.body).toBeUndefined();
    expect(hero.bgColor).toBeUndefined();
  });

  it("keeps an absent and an empty CTA list both empty — neither invents a row", () => {
    expect(resolveHero(base).ctas).toEqual([]);
    expect(resolveHero({ ...base, ctas: [] }).ctas).toEqual([]);
  });

  it("caps the CTA list at the CMS limit instead of wrapping it", () => {
    const many: HeroCta[] = Array.from({ length: 5 }, (_, i) => ({
      text: `C${i}`,
      href: `/c/${i}`,
    }));
    const hero = resolveHero({ ...base, ctas: many });
    expect(hero.ctas).toHaveLength(HERO_CTA_LIMIT);
    expect(hero.ctas.map((c) => c.text)).toEqual(["C0", "C1", "C2"]);
  });

  it("drops a CTA that goes nowhere before the cap is applied", () => {
    const hero = resolveHero({
      ...base,
      ctas: [{ text: "Dead", href: "  " }, { text: " ", href: "/x" }, { text: "Shop", href: "/products" }],
    });
    expect(hero.ctas.map((c) => c.text)).toEqual(["Shop"]);
  });

  it("forwards the CMS paint keys untouched", () => {
    const hero = resolveHero({
      ...base,
      textColor: "#0a2540",
      ctas: [{ text: "Shop", href: "/products", bg: "#0077b6", borderWidth: 2, borderRadius: 999 }],
    });
    expect(hero.textColor).toBe("#0a2540");
    expect(hero.ctas[0]).toMatchObject({ bg: "#0077b6", borderWidth: 2, borderRadius: 999 });
  });

  it("keeps an image only with a src, and gives it a ratio to paint", () => {
    expect(resolveHero({ ...base, image: { src: "/a.jpg", alt: "A" } }).image?.ratio).toBe(HERO_DEFAULT_RATIO);
    expect(resolveHero({ ...base, image: { src: "  ", alt: "A" } }).image).toBeUndefined();
    expect(
      resolveHero({ ...base, image: { src: "/a.jpg", alt: "A", ratio: "16:9" } }).image?.ratio,
    ).toBe("16 / 9");
  });

  it("passes a customRatio through as the plain number CSS wants", () => {
    const hero = resolveHero({ ...base, image: { src: "/a.jpg", alt: "A", ratio: "1.5" } });
    expect(hero.image?.ratio).toBe("1.5");
  });
});

describe("toCssRatio", () => {
  it("converts the CMS colon enum into a CSS aspect-ratio value", () => {
    expect(toCssRatio("3:4")).toBe("3 / 4");
  });

  it("leaves a number alone and treats absence as absence", () => {
    expect(toCssRatio("1.5")).toBe("1.5");
    expect(toCssRatio(undefined)).toBeUndefined();
    expect(toCssRatio("   ")).toBeUndefined();
  });

  it("is the only ratio converter the hero family needs", () => {
    // A caller that passes a colon ratio gets the CSS form back from the
    // resolver, so no block may hand `ratio` to a style var untranslated.
    expect(toCssRatio(HERO_DEFAULT_RATIO)).toBe(HERO_DEFAULT_RATIO);
  });
});
