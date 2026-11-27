// @vitest-environment jsdom
/**
 * Contract tier for the preview bridge island (sf-096 follow-up).
 *
 * The DOM is the boundary: only a message from the exact admin origin with a
 * valid 2.2.0 patch may change paint vars, and reverting must remove exactly
 * what the draft added (published vars live on <body> and stay untouched).
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import PreviewDraftBridge from "@/app/(shop)/_components/PreviewDraftBridge";
import { PREVIEW_MESSAGE_TYPE } from "@/lib/preview/draft";

const ADMIN = "https://admin.test";
const OTHER = "https://evil.test";

function message(overrides: Record<string, unknown> = {}) {
  return {
    type: PREVIEW_MESSAGE_TYPE,
    configVersion: "2.2.0",
    revision: 7,
    config: { theme: { palette: { brand: { brand: "#123456" } } } },
    ...overrides,
  };
}

function post(data: unknown, origin = ADMIN) {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { origin, data }));
  });
}

afterEach(() => {
  cleanup();
  document.documentElement.style.cssText = "";
});

describe("PreviewDraftBridge", () => {
  it("applies a valid draft through the --sf-* resolver only", () => {
    const { container } = render(<PreviewDraftBridge adminOrigin={ADMIN} />);
    expect(container.querySelector('[data-preview-draft-bridge="https://admin.test"]')).not.toBeNull();

    post(message());

    expect(document.documentElement.style.getPropertyValue("--sf-color-brand")).toBe("#123456");
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand-hover")).not.toBe("");
  });

  it("merges a sparse draft over the published theme", () => {
    render(
      <PreviewDraftBridge
        adminOrigin={ADMIN}
        publishedTheme={{ palette: { brand: { brand: "#published", brandHover: "#aaaaaa" } } }}
      />,
    );
    post(message());
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand")).toBe("#123456");
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand-hover")).toBe("#aaaaaa");
  });

  it("reverts by dropping draft vars, leaving published body vars alone", () => {
    document.body.style.setProperty("--sf-color-brand", "#published");
    render(<PreviewDraftBridge adminOrigin={ADMIN} />);
    post(message());
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand")).toBe("#123456");

    post(message({ config: {} }));
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand")).toBe("");
    expect(document.body.style.getPropertyValue("--sf-color-brand")).toBe("#published");
    document.body.style.removeProperty("--sf-color-brand");
  });

  it("ignores a foreign origin even with a perfectly shaped patch", () => {
    render(<PreviewDraftBridge adminOrigin={ADMIN} />);
    post(message({ config: { theme: { palette: { brand: { brand: "#ffffff" } } } } }), OTHER);
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand")).toBe("");
  });

  it("ignores malformed and raw-CSS patches", () => {
    render(<PreviewDraftBridge adminOrigin={ADMIN} />);
    post(message({ configVersion: "2.1.0" }));
    post(message({ config: { theme: { "--sf-color-brand": "#fff" } } }));
    post(message({ config: { theme: { navbar: { bg: "var(--adm-color-bg)" } } } }));
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand")).toBe("");
    expect(document.documentElement.style.cssText).not.toContain("--adm-");
  });

  it("accepts a header-normalised admin origin and drops the listener on unmount", () => {
    const view = render(<PreviewDraftBridge adminOrigin="https://admin.test:443/some/path" />);
    post(message());
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand")).toBe("#123456");

    view.unmount();
    expect(document.documentElement.style.getPropertyValue("--sf-color-brand")).toBe("");
  });
});
