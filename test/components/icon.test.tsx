// @vitest-environment jsdom
/**
 * Icon contract — the shared SVG system behind IconButton, Button/Input
 * adornments, and Checkbox ticks.
 *
 * Guards: every mapped icon is a currentColor stroke svg (dark on white,
 * white on dark — no color props), decorative by default, correctly sized,
 * fillable for active states, and unknown CMS-driven names fail closed.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Icon, { ICON_NAMES } from "@/components/ui/icons/Icon";

afterEach(cleanup);

describe("Icon contract", () => {
  it.each(ICON_NAMES)("icon %s renders a currentColor svg, hidden from AT", (name) => {
    const { unmount } = render(<Icon name={name} />);
    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    unmount();
  });

  it("sizes the svg box from the size prop (default 20)", () => {
    const { unmount } = render(<Icon name="x" />);
    expect(document.querySelector("svg")?.getAttribute("width")).toBe("20");
    expect(document.querySelector("svg")?.getAttribute("height")).toBe("20");
    unmount();

    render(<Icon name="x" size={16} />);
    expect(document.querySelector("svg")?.getAttribute("width")).toBe("16");
  });

  it("uses a 2px stroke by default and fills only when asked", () => {
    const { unmount } = render(<Icon name="heart" />);
    const svg = document.querySelector("svg");
    expect(svg?.getAttribute("stroke-width")).toBe("2");
    expect(svg?.getAttribute("fill")).toBe("none");
    unmount();

    render(<Icon name="heart" filled />);
    expect(document.querySelector("svg")?.getAttribute("fill")).toBe("currentColor");
  });

  it("exposes a titled standalone icon as an image", () => {
    render(<Icon name="store" title="Our flagship store" />);
    const svg = document.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(screen.getByTitle("Our flagship store")).not.toBeNull();
  });

  it("fails closed on unknown names (renders nothing, warns in dev)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      // @ts-expect-error runtime guard for CMS-driven strings
      <Icon name="nope-not-an-icon" />,
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
