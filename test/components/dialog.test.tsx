// @vitest-environment jsdom
/**
 * Dialog contract — closed renders nothing; Esc + overlay call onClose;
 * house paint applies only when set (default render byte-identical).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import Dialog from "@/components/ui/Dialog";

afterEach(cleanup);

describe("Dialog", () => {
  it("renders nothing closed; dialog role + title when open", () => {
    const { container, unmount } = render(
      <Dialog open={false} title="Delete?">
        body
      </Dialog>,
    );
    expect(container.firstChild).toBeNull();
    unmount();
    render(
      <Dialog open title="Delete?">
        body
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Delete?" })).not.toBeNull();
    expect(screen.getByText("body")).not.toBeNull();
  });

  it("Esc and overlay click call onClose (state stays parent-owned)", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Delete?">
        body
      </Dialog>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    const wash = document.querySelector(".absolute.inset-0") as HTMLElement;
    fireEvent.click(wash);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("applies house paint only when set (sf-037)", () => {
    const { container, unmount } = render(
      <Dialog open title="T">
        body
      </Dialog>,
    );
    const panel = container.querySelector(".relative") as HTMLElement;
    expect(panel.style.background).toBe("");
    expect(panel.style.maxWidth).toBe("");
    unmount();
    const second = render(
      <Dialog
        open
        title="T"
        panelBg="#111111"
        borderColor="#222222"
        radius={4}
        maxWidth={600}
        titleColor="#333333"
        titleSize={20}
        bodySize={15}
        bodyWeight={600}
        bodyColor="#444444"
      >
        body
      </Dialog>,
    );
    const panel2 = second.container.querySelector(".relative") as HTMLElement;
    expect(panel2.style.background).toBe("rgb(17, 17, 17)");
    expect(panel2.style.maxWidth).toBe("600px");
    expect(panel2.style.borderRadius).toBe("4px");
    expect(panel2.style.fontSize).toBe("15px");
    expect(panel2.style.color).toBe("rgb(68, 68, 68)");
    const h2 = second.container.querySelector("h2") as HTMLElement;
    expect(h2.style.color).toBe("rgb(51, 51, 51)");
    expect(h2.style.fontSize).toBe("20px");
    second.unmount();
  });

  it("custom wash replaces the dim class (sf-037)", () => {
    const { container } = render(
      <Dialog open overlayColor="#123456" overlayAlpha={80}>
        body
      </Dialog>,
    );
    const wash = container.querySelector(".absolute.inset-0") as HTMLElement;
    expect(wash.style.background).toContain("color-mix");
    expect(wash.style.background).toContain("80%");
  });
});
