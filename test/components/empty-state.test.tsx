// @vitest-environment jsdom
/**
 * EmptyState contract — optional parts are genuinely optional (no empty
 * wrappers left behind), and the action is a slot the caller composes.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import EmptyState from "@/components/ui/EmptyState";

afterEach(cleanup);

describe("EmptyState", () => {
  it("renders the title alone when nothing else is given", () => {
    const { container } = render(<EmptyState title="Your bag is empty" />);

    expect(screen.getByText("Your bag is empty")).not.toBeNull();
    expect(container.querySelector(".sf-empty__icon")).toBeNull();
    expect(container.querySelector(".sf-empty__body")).toBeNull();
    expect(container.querySelector(".sf-empty__action")).toBeNull();
  });

  it("renders the glyph, body and action slots", () => {
    render(
      <EmptyState
        icon={<span data-testid="glyph" />}
        title="No products matched"
        body="Try a different filter or search term."
        action={<button type="button">Clear filters</button>}
      />,
    );

    expect(screen.getByTestId("glyph")).not.toBeNull();
    expect(screen.getByText("Try a different filter or search term.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Clear filters" })).not.toBeNull();
  });

  it("hides the glyph from assistive tech — the title carries the meaning", () => {
    const { container } = render(<EmptyState icon={<span />} title="Nothing here" />);
    expect(container.querySelector(".sf-empty__icon")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("leaves the action's behaviour to the caller", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Nothing here"
        action={
          <button type="button" onClick={onClick}>
            Browse
          </button>
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Browse" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
