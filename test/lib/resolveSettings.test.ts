/**
 * Auth settings resolver-unit — cascade, clamps, stop fill, sanitizer.
 *
 * AGENTS.md §4 trio, part 2 (resolver-unit). Pure in → complete out;
 * no mocks needed. Every test pins one locked rule from auth-design.md.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_AUTH_SETTINGS } from "@/lib/auth/settings";
import { resolveAuthSettings, sanitizeAuthHtml } from "@/lib/auth/resolveSettings";

describe("resolveAuthSettings", () => {
  it("resolves today's look out of nothing (full outage = usable page)", () => {
    const r = resolveAuthSettings({});
    expect(r).toEqual(DEFAULT_AUTH_SETTINGS);
    expect(r.signin.layout.mode).toBe("split");
    expect(r.signup.layout.panelSide).toBe("right");
    expect(r.forgot.layout.mode).toBe("centered");
  });

  it("treats null scopes as absent (CMS unreadable is a miss, not an error)", () => {
    const r = resolveAuthSettings({ settings: null, global: null });
    expect(r).toEqual(DEFAULT_AUTH_SETTINGS);
  });

  it("page scope wins over shared over global (per-field cascade)", () => {
    const r = resolveAuthSettings({
      global: { form: { radius: 1 } },
      settings: {
        shared: { form: { radius: 2 } },
        pages: { signin: { mode: "centered", panelSide: "right" } },
      },
    });
    // Page layout comes from the page scope; form radius from shared (beats global).
    expect(r.signin.layout).toEqual({ mode: "centered", panelSide: "right", ratio: "50-50", mobile: "stacked" });
    expect(r.signin.form.radius).toBe(2);
    // Untouched page inherits shared too.
    expect(r.signup.form.radius).toBe(2);
  });

  it("forgot's own style replaces shared groups wholesale", () => {
    const r = resolveAuthSettings({
      settings: {
        shared: { form: { radius: 20, width: 440 } },
        pages: { forgot: { style: { form: { radius: 4 } } } },
      },
    });
    expect(r.forgot.form.radius).toBe(4);
    expect(r.forgot.form.width).toBe(400); // builtin, NOT shared 440
    expect(r.signin.form.radius).toBe(20); // shared still applies to signin
  });

  it("clamps numerics (angle 400→360, 5 stops→4, overlay/width/radius)", () => {
    const r = resolveAuthSettings({
      settings: {
        shared: {
          form: { radius: 99, width: 9999 },
          panel: {
            gradient: {
              type: "linear",
              angle: 400,
              stops: [
                { color: "#111111" },
                { color: "#222222" },
                { color: "#333333" },
                { color: "#444444" },
                { color: "#555555" },
              ],
            },
            overlay: -5,
          },
        },
      },
    });
    expect(r.signin.form.radius).toBe(24);
    expect(r.signin.form.width).toBe(480);
    const g = r.signin.panel.gradient;
    expect(g.type).toBe("linear");
    if (g.type === "linear") {
      expect(g.angle).toBe(360);
      expect(g.stops).toHaveLength(4);
      expect(g.stops.map((s) => s.at)).toEqual([0, 33, 67, 100]);
    }
    expect(r.signin.panel.overlay).toBe(0);
  });

  it("degrades <2 stops to solid (a gradient needs two colors)", () => {
    const r = resolveAuthSettings({
      settings: { shared: { panel: { gradient: { type: "linear", angle: 90, stops: [{ color: "#123456" }] } } } },
    });
    expect(r.signin.panel.gradient).toEqual(DEFAULT_AUTH_SETTINGS.signin.panel.gradient);
  });

  it("keeps explicit stop positions, clamps them 0–100", () => {
    const r = resolveAuthSettings({
      settings: {
        shared: {
          panel: {
            gradient: {
              type: "linear",
              angle: 90,
              stops: [{ color: "#aaaaaa", at: 60 }, { color: "#bbbbbb", at: 10 }],
            },
          },
        },
      },
    });
    const g = r.signin.panel.gradient;
    if (g.type === "linear") {
      expect(g.stops.map((s) => s.at)).toEqual([10, 60]); // sorted
    } else {
      throw new Error("expected linear");
    }
  });
});

describe("sanitizeAuthHtml", () => {
  it("strips scripts, handlers and javascript: but keeps rich text", () => {
    const out = sanitizeAuthHtml(
      `<h3>Hi</h3><script>alert(1)</script><p onclick="x()">A <strong>bold</strong> <a href="javascript:evil()">link</a> <a href="/products">shop</a></p>`,
    );
    expect(out).not.toMatch(/script|onclick|javascript:/i);
    expect(out).toContain("<h3>Hi</h3>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain('<a href="/products">shop</a>');
    expect(out).toContain("link");
  });

  it("returns empty for non-strings (corrupt CMS content is absent, not an error)", () => {
    expect(sanitizeAuthHtml(null)).toBe("");
    expect(sanitizeAuthHtml(42)).toBe("");
    expect(sanitizeAuthHtml("")).toBe("");
  });
});
