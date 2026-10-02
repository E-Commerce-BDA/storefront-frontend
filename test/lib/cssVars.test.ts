/**
 * Auth CSS var emitter — every paint knob emits a var; gradient renders
 * valid CSS for all three types. (AGENTS.md §4 trio, resolver-unit leg.)
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_AUTH_SETTINGS } from "@/lib/auth/settings";
import { authCssVars, panelBackground, panelBackgroundValue } from "@/lib/auth/cssVars";

describe("authCssVars", () => {
  it("emits the full paint contract with today's values", () => {
    const vars = authCssVars(DEFAULT_AUTH_SETTINGS.signin);
    expect(vars["--auth-form-bg"]).toBe("#ffffff");
    expect(vars["--auth-form-radius"]).toBe("12px");
    expect(vars["--auth-form-width"]).toBe("400px");
    expect(vars["--auth-form-border"]).toBe("1px solid #dce8ee");
    expect(vars["--auth-input-focus-ring-width"]).toBe("3px");
    expect(vars["--auth-input-focus-shadow"]).toBe("0 0 0 3px #0077b633");
    expect(vars["--auth-input-error-border"]).toBe("#d92d20");
    expect(vars["--auth-panel-bg"]).toBe("linear-gradient(135deg, #023e8a 0%, #0077b6 60%, #48cae4 100%)");
    expect(vars["--auth-panel-overlay-opacity"]).toBe("0");
    expect(vars["--auth-font"]).toContain("Outfit");
    expect(vars["--auth-headline-size"]).toBe("30px");
    expect(vars["--auth-page-fade"]).toBe("200ms");
  });

  it("renders all three gradient types to valid CSS", () => {
    expect(
      panelBackgroundValue({ type: "radial", shape: "circle", at: "30% 20%", stops: [{ color: "#111111", at: 0 }, { color: "#222222", at: 100 }] }),
    ).toBe("radial-gradient(circle at 30% 20%, #111111 0%, #222222 100%)");
    expect(
      panelBackgroundValue({ type: "conic", from: 45, at: "center", stops: [{ color: "#111111", at: 0 }, { color: "#222222", at: 100 }] }),
    ).toBe("conic-gradient(from 45deg at center, #111111 0%, #222222 100%)");
  });

  it("maps bg modes without inventing values", () => {
    const base = DEFAULT_AUTH_SETTINGS.signin;
    expect(panelBackground({ ...base, panel: { ...base.panel, bgMode: "solid", solid: "#123456" } })).toBe("#123456");
    expect(panelBackground({ ...base, panel: { ...base.panel, bgMode: "none" } })).toBe("transparent");
    expect(panelBackground({ ...base, panel: { ...base.panel, bgMode: "image", imageUrl: "" } })).toBe("transparent");
    expect(
      panelBackground({ ...base, panel: { ...base.panel, bgMode: "image", imageUrl: "https://cdn/x.jpg" } }),
    ).toBe('url("https://cdn/x.jpg")');
  });
});
