// @vitest-environment jsdom
/**
 * Pill contract — native button, variant/active/state data hooks,
 * caller attrs (aria-pressed, className) forwarded. Fully controlled.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import Pill from "@/components/ui/Pill";

afterEach(cleanup);

describe("Pill", () => {
  it("renders a native button with variant + active hooks", () => {
    render(
      <Pill variant="filter" active aria-pressed onClick={() => {}}>
        All
      </Pill>,
    );
    const btn = screen.getByRole("button", { name: "All" });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("data-pill")).toBe("filter");
    expect(btn.getAttribute("data-active")).toBe("true");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("forwards className, state hook and click", () => {
    const onClick = vi.fn();
    render(
      <Pill variant="action" state="added" className="sf-searchpalette__quickadd" onClick={onClick}>
        Added
      </Pill>,
    );
    const btn = screen.getByRole("button", { name: "Added" });
    expect(btn.className).toContain("sf-pill");
    expect(btn.className).toContain("sf-searchpalette__quickadd");
    expect(btn.getAttribute("data-state")).toBe("added");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("omits the state hook when idle (no data-state attr)", () => {
    render(<Pill variant="chip">Linen shirts</Pill>);
    expect(screen.getByRole("button", { name: "Linen shirts" }).hasAttribute("data-state")).toBe(false);
  });
});
