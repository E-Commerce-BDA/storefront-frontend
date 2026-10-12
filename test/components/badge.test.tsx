// @vitest-environment jsdom
/**
 * Badge contract — builtin faces, custom-face lookup order
 * (custom > builtin > neutral fail-closed), border-type union guard.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Badge from "@/components/ui/Badge";

afterEach(cleanup);

describe("Badge", () => {
  it("renders builtin faces with solid borders", () => {
    const { container } = render(<Badge tone="success">In stock</Badge>);
    const el = screen.getByText("In stock");
    expect(el.tagName).toBe("SPAN");
    expect((container.firstElementChild as HTMLElement).style.border).toContain("solid");
  });

  it("resolves custom ids first (admin may retint a builtin face)", () => {
    render(
      <Badge tone="success" tones={{ success: { bg: "#111111", text: "#222222" } }}>
        Custom
      </Badge>,
    );
    const el = screen.getByText("Custom");
    expect(el.style.background).toBe("rgb(17, 17, 17)");
    expect(el.style.color).toBe("rgb(34, 34, 34)");
  });

  it("renders full custom faces with border type + tone-on-tone default", () => {
    const { unmount } = render(
      <Badge tone="vip" tones={{ vip: { bg: "#123456", text: "#ffffff", borderStyle: "dashed" } }}>
        VIP
      </Badge>,
    );
    const el = screen.getByText("VIP");
    expect(el.style.border).toContain("dashed");
    // borderColor absent → bg (tone-on-tone ring).
    expect(el.style.border).toContain("rgb(18, 52, 86)");
    unmount();
    render(
      <Badge tone="vip" tones={{ vip: { bg: "#123456", text: "#ffffff", borderStyle: "wavy" as never } }}>
        VIP
      </Badge>,
    );
    expect(screen.getByText("VIP").style.border).toContain("solid");
  });

  it("fails unknown ids closed to neutral (never blank)", () => {
    render(<Badge tone="nope">Mystery</Badge>);
    const el = screen.getByText("Mystery");
    expect(el.style.background).toBe("rgb(255, 255, 255)");
  });
});
