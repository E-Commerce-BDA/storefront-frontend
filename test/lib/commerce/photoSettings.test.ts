import { describe, expect, it } from "vitest";
import { resolvePhotoSettings } from "@/lib/commerce/photoSettings";
import { DEFAULT_THEME } from "@/lib/cms/themeSettings";

const global = DEFAULT_THEME.photoSettings;

describe("resolvePhotoSettings", () => {
  it("falls back to the global face with no higher layers", () => {
    expect(resolvePhotoSettings([], global)).toEqual(global);
  });

  it("lets product beat section beat global", () => {
    const resolved = resolvePhotoSettings(
      [
        { gutter: 2, layout: "grid", blendMode: "multiply" },
        { gutter: 10, showPhotos: false, ratio: "16:9" },
      ],
      global,
    );
    expect(resolved.gutter).toBe(2);
    expect(resolved.layout).toBe("grid");
    expect(resolved.blendMode).toBe("multiply");
    expect(resolved.showPhotos).toBe(false);
    expect(resolved.ratio).toBe("16:9");
  });

  it("inherits absent keys and ignores wrong-typed values", () => {
    const resolved = resolvePhotoSettings(
      [{ ratio: "bogus", gutter: "many", showPhotos: "no" }],
      global,
    );
    expect(resolved.ratio).toBe(global.ratio);
    expect(resolved.gutter).toBe(global.gutter);
    expect(resolved.showPhotos).toBe(global.showPhotos);
  });

  it("clamps numeric knobs to the documented limits", () => {
    const resolved = resolvePhotoSettings(
      [{ gutter: 99, widthPercent: 1, customRatio: 9 }],
      global,
    );
    expect(resolved.gutter).toBe(48);
    expect(resolved.widthPercent).toBe(25);
    expect(resolved.customRatio).toBe(2.5);
  });
});
