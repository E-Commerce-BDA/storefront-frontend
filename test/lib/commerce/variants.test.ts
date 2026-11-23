import { describe, expect, it } from "vitest";
import type { ProductOptionDto, ProductVariantDto } from "@/lib/catalog/schemas";
import {
  defaultSelection,
  isPurchasable,
  orderedOptions,
  resolveVariant,
  selectionFits,
  selectionOptions,
} from "@/lib/commerce/variants";

const COLOR = "color";
const SIZE = "size";
const RED = "v-red";
const BLUE = "v-blue";
const S = "v-s";
const M = "v-m";

const options = [
  {
    id: "o-color",
    name: COLOR,
    position: 0,
    displayType: "swatch",
    values: [
      { id: RED, value: "Red", swatchHex: "#c00" },
      { id: BLUE, value: "Blue", swatchHex: "#00c" },
    ],
  },
  {
    id: "o-size",
    name: SIZE,
    position: 1,
    displayType: "pill",
    values: [
      { id: S, value: "S" },
      { id: M, value: "M" },
    ],
  },
] as unknown as ProductOptionDto[];

function variant(
  id: string,
  color: string,
  size: string,
  overrides: Partial<ProductVariantDto> = {},
): ProductVariantDto {
  return {
    id,
    sku: id,
    price: 20,
    stock: 3,
    options: [
      { optionId: "o-color", optionName: COLOR, optionValueId: color, value: color },
      { optionId: "o-size", optionName: SIZE, optionValueId: size, value: size },
    ],
    ...overrides,
  } as ProductVariantDto;
}

const variants = [variant("red-s", RED, S), variant("blue-s", BLUE, S), variant("blue-m", BLUE, M)];

describe("isPurchasable", () => {
  it("needs stock and an active row", () => {
    expect(isPurchasable(variant("a", RED, S, { stock: 1 }))).toBe(true);
    expect(isPurchasable(variant("a", RED, S, { stock: 0 }))).toBe(false);
    expect(isPurchasable(variant("a", RED, S, { isActive: false }))).toBe(false);
  });
});

describe("selectionFits / resolveVariant", () => {
  it("matches a variant on every selected option", () => {
    expect(selectionFits({ [COLOR]: BLUE, [SIZE]: M }, variants[2])).toBe(true);
    expect(selectionFits({ [COLOR]: RED, [SIZE]: M }, variants[0])).toBe(false);
  });

  it("treats a partial selection as fitting broadly", () => {
    expect(selectionFits({ [COLOR]: BLUE }, variants[1])).toBe(true);
  });

  it("returns the variant the selection names", () => {
    expect(resolveVariant(variants, { [COLOR]: BLUE, [SIZE]: M })?.id).toBe("blue-m");
  });

  it("still returns a sold-out match — the panel must show its own price", () => {
    const soldOut = [variant("red-s", RED, S, { stock: 0 })];
    expect(resolveVariant(soldOut, { [COLOR]: RED, [SIZE]: S })?.id).toBe("red-s");
  });

  it("answers null when nothing matches", () => {
    expect(resolveVariant(variants, { [COLOR]: RED, [SIZE]: M })).toBeNull();
  });
});

describe("defaultSelection", () => {
  it("opens on the first purchasable variant", () => {
    const selection = defaultSelection(options, [
      variant("red-s", RED, S, { stock: 0 }),
      variant("blue-m", BLUE, M),
    ]);

    expect(selection).toEqual({ [COLOR]: BLUE, [SIZE]: M });
  });

  it("falls back to the first variant when every row is sold out", () => {
    const selection = defaultSelection(options, [variant("red-s", RED, S, { stock: 0 })]);
    expect(selection).toEqual({ [COLOR]: RED, [SIZE]: S });
  });

  it("skips a variant that does not carry every option", () => {
    const partial = {
      id: "only-color",
      sku: "x",
      price: 10,
      stock: 5,
      options: [{ optionId: "o-color", optionName: COLOR, optionValueId: BLUE, value: "Blue" }],
    } as unknown as ProductVariantDto;

    expect(defaultSelection(options, [partial, variant("red-s", RED, S)])).toEqual({
      [COLOR]: RED,
      [SIZE]: S,
    });
  });

  it("is empty for a product without variants", () => {
    expect(defaultSelection(options, [])).toEqual({});
  });
});

describe("selectionOptions", () => {
  it("marks a value unavailable when no in-stock variant carries it", () => {
    const views = selectionOptions(options, variants, { [COLOR]: BLUE, [SIZE]: S });
    const sizes = views[1].values;
    const red = views[0].values;

    expect(sizes.find((value) => value.id === S)?.available).toBe(true);
    expect(sizes.find((value) => value.id === M)?.available).toBe(true);
    expect(red.find((value) => value.id === RED)?.available).toBe(true);
  });

  it("judges an option against the rest of the selection, not in isolation", () => {
    const views = selectionOptions(options, variants, { [COLOR]: BLUE, [SIZE]: M });
    const red = views[0].values.find((value) => value.id === RED);

    expect(red?.available).toBe(false);
  });

  it("keeps every value in the row — unavailable is a flag, never a removal", () => {
    const views = selectionOptions(options, variants, { [COLOR]: BLUE, [SIZE]: M });
    expect(views[0].values).toHaveLength(2);
  });

  it("shows the plain picture from inside a dead end, so the shopper can leave", () => {
    // Red/M matches no variant at all; greying every other value would trap them.
    const views = selectionOptions(options, variants, { [COLOR]: RED, [SIZE]: M });
    const sizes = views[1].values;

    expect(sizes.find((value) => value.id === S)?.available).toBe(true);
  });

  it("passes display type and swatch data through", () => {
    const views = selectionOptions(options, variants, {});
    expect(views[0]).toMatchObject({ name: COLOR, displayType: "swatch" });
    expect(views[0].values[0]).toMatchObject({ value: "Red", swatchHex: "#c00" });
  });

  it("ignores sold-out and retired rows when deciding availability", () => {
    const soldOut = [variant("red-s", RED, S, { stock: 0 })];
    const views = selectionOptions(options, soldOut, {});

    expect(views[0].values.every((value) => value.available)).toBe(false);
  });
});

describe("orderedOptions", () => {
  it("sorts by position — the URL key order", () => {
    const unordered = [options[1], options[0]];
    expect(orderedOptions(unordered).map((option) => option.name)).toEqual([COLOR, SIZE]);
  });
});
