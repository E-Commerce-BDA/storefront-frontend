// @vitest-environment jsdom
/**
 * Toast contract — renders nothing closed; polite status with title,
 * message and icon when open; X dismisses. Timing belongs to the owner.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import Toast from "@/components/ui/Toast";

afterEach(cleanup);

describe("Toast", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<Toast open={false} title="Added" onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("announces politely with title, message and icon when open", () => {
    const onClose = vi.fn();
    render(
      <Toast open title="Added to bag" message="Ocean Linen Shirt" icon={<span data-testid="lead">✓</span>} onClose={onClose} />,
    );
    expect(screen.getByRole("status").textContent).toContain("Added to bag");
    expect(screen.getByText("Ocean Linen Shirt")).not.toBeNull();
    expect(screen.getByTestId("lead")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
