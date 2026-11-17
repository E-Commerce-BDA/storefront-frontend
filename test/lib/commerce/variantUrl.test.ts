import { describe, expect, it } from "vitest";
import {
  selectionFromQuery,
  selectionToQuery,
  valueSlug,
} from "@/lib/commerce/variantUrl";
import type { ProductOptionDto, ProductVariantDto } from "@/lib/catalog/schemas";

const options: ProductOptionDto[] = [
  {
    id: "opt-color",
    name: "Color",
    position: 0,
    displayType: "swatch",
    values: [
      { id: "c-blue", value: "Ocean Blue", position: 0 },
      { id: "c-red", value: "Crimson", position: 1 },
    ],
  },
  {
    id: "opt-size",
    name: "Size",
    position: 1,
    displayType: "pill",
    values: [
      { id: "s-m", value: "M", position: 0 },
      { id: "s-l", value: "L", position: 1 },
    ],
  },
];

const variants: ProductVariantDto[] = [
  {
    id: "v1",
    sku: "BLUE-M",
    price: 40,
    stock: 5,
    isActive: true,
    options: [
      { optionId: "opt-color", optionName: "Color", optionValueId: "c-blue", value: "Ocean Blue" },
      { optionId: "opt-size", optionName: "Size", optionValueId: "s-m", value: "M" },
    ],
  },
  {
    id: "v2",
    sku: "RED-M",
    price: 42,
    stock: 0,
    isActive: true,
    options: [
      { optionId: "opt-color", optionName: "Color", optionValueId: "c-red", value: "Crimson" },
      { optionId: "opt-size", optionName: "Size", optionValueId: "s-m", value: "M" },
    ],
  },
];

describe("variant URL codec", () => {
  it("slugifies value labels", () => {
    expect(valueSlug("Ocean Blue")).toBe("ocean-blue");
    expect(valueSlug("Crème Brûlée")).toBe("creme-brulee");
  });

  it("maps a shared link to the exact variant", () => {
    const parsed = selectionFromQuery(
      new URLSearchParams("Color=ocean-blue&Size=m"),
      options,
      variants,
    );
    expect(parsed.selection).toEqual({ Color: "c-blue", Size: "s-m" });
    expect(parsed.rewritten).toBe(false);
  });

  it("uses the builtin opening selection when no variant keys are present", () => {
    const parsed = selectionFromQuery(new URLSearchParams("q=x"), options, variants);
    expect(parsed.selection).toEqual({ Color: "c-blue", Size: "s-m" });
    expect(parsed.rewritten).toBe(false);
  });

  it("repairs a sold-out combination to the nearest in-stock variant", () => {
    const parsed = selectionFromQuery(
      new URLSearchParams("Color=crimson&Size=m"),
      options,
      variants,
    );
    expect(parsed.rewritten).toBe(true);
    expect(parsed.selection.Color).toBe("c-blue");
  });

  it("ignores an unknown key and repairs the URL", () => {
    const parsed = selectionFromQuery(
      new URLSearchParams("Color=ghost&Size=m"),
      options,
      variants,
    );
    expect(parsed.rewritten).toBe(true);
    expect(parsed.selection.Size).toBe("s-m");
  });

  it("emits a canonical query in fixed option order", () => {
    expect(
      selectionToQuery({ Size: "s-m", Color: "c-blue" }, options),
    ).toBe("Color=ocean-blue&Size=m");
  });
});
