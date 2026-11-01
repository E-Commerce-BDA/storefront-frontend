/**
 * Hero resolver unit — sections.md §2/§3.
 *
 * The block is dumb; every decision the tests care about lives here: the CTA cap,
 * the ratio fallback, flat-prop precedence, and the one difference a caller
 * cannot express in CSS — an *absent* CTA (keep defaults) versus an *empty* one
 * (render no row).
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_HERO,
  HERO_CTA_LIMIT,
  HERO_DEFAULT_RATIO,
  resolveHero,
  type HeroCta,
} from "@/lib/sections/hero";

describe("resolveHero", () => {
  it("returns DEFAULT_HERO untouched for no fields", () => {
    const hero = resolveHero();
    expect(hero.title).toBe(DEFAULT_HERO.title);
    expect(hero.eyebrow).toBe(DEFAULT_HERO.eyebrow);
    expect(hero.ctas).toEqual(DEFAULT_HERO.ctas);
    expect(hero.align).toBe("left");
    expect(hero.image).toBeUndefined();
  });

  it("treats null/undefined as the default face", () => {
    expect(resolveHero(null).title).toBe(DEFAULT_HERO.title);
    expect(resolveHero(undefined).title).toBe(DEFAULT_HERO.title);
  });

  it("keeps an explicit empty CTA list empty (absent is not the same as none)", () => {
    const hero = resolveHero({ title: "x", ctas: [] });
    expect(hero.ctas).toEqual([]);
  });

  it("caps the CTA list at the CMS limit instead of wrapping it", () => {
    const many: HeroCta[] = Array.from({ length: 5 }, (_, i) => ({
      text: `C${i}`,
      href: `/c/${i}`,
    }));
    const hero = resolveHero({ title: "x", ctas: many });
    expect(hero.ctas).toHaveLength(HERO_CTA_LIMIT);
    expect(hero.ctas.map((c) => c.text)).toEqual(["C0", "C1", "C2"]);
  });

  it("prefers a flat title over the default and ignores a blank one", () => {
    expect(resolveHero({ title: "Real" }).title).toBe("Real");
    expect(resolveHero({ title: "   " }).title).toBe(DEFAULT_HERO.title);
  });

  it("falls a provided image back to the default ratio", () => {
    const hero = resolveHero({ title: "x", image: { src: "/a.jpg", alt: "A" } });
    expect(hero.image?.ratio).toBe(HERO_DEFAULT_RATIO);
  });

  it("keeps a caller's ratio and drops an image with no src", () => {
    expect(resolveHero({ title: "x", image: { src: "/a.jpg", alt: "A", ratio: "16:9" } }).image?.ratio).toBe("16:9");
    expect(resolveHero({ title: "x", image: { src: "  ", alt: "A" } }).image).toBeUndefined();
  });

  it("reads only the two alignments it knows", () => {
    expect(resolveHero({ title: "x", align: "center" }).align).toBe("center");
    expect(resolveHero({ title: "x" } as never).align).toBe("left");
  });

  it("clears an empty eyebrow/body rather than emitting a blank line", () => {
    const hero = resolveHero({ title: "x", eyebrow: "", body: "" });
    expect(hero.eyebrow).toBeUndefined();
    expect(hero.body).toBeUndefined();
  });
});
