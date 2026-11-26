// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DegradedState, ErrorState, LoadingState } from "@/components/ui";

afterEach(cleanup);

describe("shared state faces", () => {
  it("announces loading once and hides the decorative spinner", () => {
    const { container } = render(<LoadingState label="Fetching products" />);
    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Fetching products")).not.toBeNull();
    expect(container.querySelector(".sf-state__spinner")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".sf-state")?.getAttribute("data-size")).toBe("regular");
  });

  it("renders the error face with only the slots it was given", () => {
    const { container, rerender } = render(<ErrorState title="Bag unavailable" />);
    expect(screen.getByRole("alert").textContent).toBe("Bag unavailable");
    expect(container.querySelector(".sf-state__body")).toBeNull();
    rerender(
      <ErrorState
        title="Bag unavailable"
        body="Try again shortly."
        action={<button type="button">Retry</button>}
        size="compact"
      />,
    );
    expect(screen.getByText("Try again shortly.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).not.toBeNull();
    expect(container.querySelector(".sf-state")?.getAttribute("data-size")).toBe("compact");
  });

  it("defaults the degraded face to compact and lets a flat size win", () => {
    const { container, rerender } = render(<DegradedState title="Partial content" />);
    expect(container.querySelector(".sf-state")?.getAttribute("data-size")).toBe("compact");
    expect(screen.getByRole("status").textContent).toContain("Partial content");
    rerender(<DegradedState title="Partial content" size="regular" />);
    expect(container.querySelector(".sf-state")?.getAttribute("data-size")).toBe("regular");
  });
});
