// @vitest-environment jsdom
/**
 * Textarea contract — controlled value, paint props feed style/vars,
 * themed-focus hook present only when set. Defaults render identically
 * (white surface, accent focus, radius 10).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import Textarea from "@/components/ui/Textarea";

afterEach(cleanup);

describe("Textarea", () => {
  it("controls value and defaults (white surface, accent focus hook off)", () => {
    const onChange = vi.fn();
    render(<Textarea label="Bio" value="hi" onChange={onChange} />);
    const box = screen.getByLabelText("Bio");
    expect(box.tagName).toBe("TEXTAREA");
    fireEvent.change(box, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello", expect.anything());
    expect(box.style.background).toContain("var(--color-navbar-bg");
    expect(box.getAttribute("data-focus")).toBe("default");
  });

  it("feeds house paint through style and the focus var", () => {
    render(
      <Textarea
        label="Bio"
        value=""
        bg="#111111"
        textColor="#222222"
        borderColor="#333333"
        focusBorderColor="#444444"
        radius={4}
      />,
    );
    const box = screen.getByLabelText("Bio") as HTMLElement;
    expect(box.style.background).toBe("rgb(17, 17, 17)");
    expect(box.style.color).toBe("rgb(34, 34, 34)");
    expect(box.style.border).toContain("rgb(51, 51, 51)");
    expect(box.style.getPropertyValue("--ta-focus")).toBe("#444444");
    expect(box.getAttribute("data-focus")).toBe("custom");
    expect(box.style.borderRadius).toBe("4px");
  });
});
