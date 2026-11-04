// @vitest-environment jsdom
/**
 * SocialIcon — the footer's dumb social brand mark.
 *
 * A known platform paints an inline `currentColor` glyph (so it inherits the
 * footer's text color and needs no per-theme artwork); an unknown platform must
 * degrade to its label rather than a blank box, mirroring PaymentIcon's
 * fail-closed rule.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import SocialIcon, { SOCIAL_ICON_PATHS } from "@/components/shell/SocialIcon";

describe("SocialIcon", () => {
  it("paints an inline glyph for a known platform", () => {
    const { container } = render(
      <SocialIcon platform="instagram" label="Instagram" className="sf-footer__social-icon" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class")).toBe("sf-footer__social-icon");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelector("path")).not.toBeNull();
  });

  it("matches the platform key case-insensitively", () => {
    const { container } = render(<SocialIcon platform="X" label="X" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("falls back to the label text for an unknown platform", () => {
    const { container } = render(<SocialIcon platform="mastodon" label="Mastodon" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).toBe("Mastodon");
  });

  it("maps every documented platform to a path", () => {
    for (const platform of Object.keys(SOCIAL_ICON_PATHS)) {
      const { container } = render(<SocialIcon platform={platform} label={platform} />);
      expect(container.querySelector("svg path"), platform).not.toBeNull();
      container.remove();
    }
  });
});
