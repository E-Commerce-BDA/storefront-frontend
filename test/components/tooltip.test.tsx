// @vitest-environment jsdom
/**
 * Tooltip contract — zero-JS positioning, three content modes, bare render.
 *
 * Guards: role=tooltip + describedby linkage on the trigger, placement and
 * delay surfaced as data attrs/vars (the entire CSS contract), controlled
 * override, and — critically — no tooltip DOM at all when disabled or
 * textless (the eligibility rule: ineligible elements cost nothing).
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Tooltip from "@/components/ui/Tooltip";

afterEach(cleanup);

describe("Tooltip contract", () => {
  it("renders custom text with role and trigger linkage", () => {
    render(
      <Tooltip content="Delete item">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    const bubble = screen.getByRole("tooltip", { name: "Delete item" });
    expect(bubble.getAttribute("data-placement")).toBe("top");
    expect(bubble.getAttribute("data-arrow")).toBe("on");
    const trigger = screen.getByRole("button", { name: "Delete" });
    expect(trigger.getAttribute("aria-describedby")).toBe(bubble.getAttribute("id"));
  });

  it("resolves product-name and position modes", () => {
    const { unmount } = render(
      <Tooltip mode="product-name" productName="Ocean Linen Shirt">
        <span>tile</span>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { name: "Ocean Linen Shirt" })).not.toBeNull();
    unmount();

    render(
      <Tooltip mode="position" index={1} total={3} placement="bottom">
        <span>dot</span>
      </Tooltip>,
    );
    const bubble = screen.getByRole("tooltip", { name: "2 of 3" });
    expect(bubble.getAttribute("data-placement")).toBe("bottom");
  });

  it("renders bare trigger when disabled or textless", () => {
    const { unmount } = render(
      <Tooltip content="Hi" enabled={false}>
        <span>plain</span>
      </Tooltip>,
    );
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(screen.getByText("plain")).not.toBeNull();
    unmount();

    render(
      <Tooltip mode="product-name" productName="">
        <span>empty</span>
      </Tooltip>,
    );
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it("surfaces delay/maxWidth/arrow/open as data contract", () => {
    render(
      <Tooltip content="Hi" delayMs={0} maxWidth={180} showArrow={false} open>
        <span>forced</span>
      </Tooltip>,
    );
    const bubble = screen.getByRole("tooltip", { name: "Hi" });
    expect(bubble.style.getPropertyValue("--tip-delay")).toBe("0ms");
    expect(bubble.style.getPropertyValue("--tip-max-width")).toBe("180px");
    expect(bubble.getAttribute("data-arrow")).toBe("off");
    expect(document.querySelector("[data-tip-open='on']")).not.toBeNull();
  });

  it("emits default style vars and honors overrides with clamps", () => {
    const { unmount } = render(
      <Tooltip content="Hi">
        <span>plain</span>
      </Tooltip>,
    );
    const plain = screen.getByRole("tooltip", { name: "Hi" });
    expect(plain.getAttribute("data-tip-anim")).toBe("slide");
    expect(plain.style.getPropertyValue("--tip-bg")).toBe("#0a2540");
    expect(plain.style.getPropertyValue("--tip-text")).toBe("#ffffff");
    expect(plain.style.getPropertyValue("--tip-radius")).toBe("8px");
    expect(plain.style.getPropertyValue("--tip-duration")).toBe("160ms");
    expect(plain.style.getPropertyValue("--tip-offset")).toBe("8px");
    unmount();

    render(
      <Tooltip
        content="Hi"
        tipBg="#123456"
        tipTextColor="#fedcba"
        tipBorderWidth={9}
        tipRadius={99}
        tipFontSize={3}
        tipAnimation="fade"
        tipDurationMs={9999}
        tipOffset={1}
      >
        <span>tuned</span>
      </Tooltip>,
    );
    const tuned = screen.getByRole("tooltip", { name: "Hi" });
    expect(tuned.style.getPropertyValue("--tip-bg")).toBe("#123456");
    expect(tuned.style.getPropertyValue("--tip-text")).toBe("#fedcba");
    expect(tuned.style.getPropertyValue("--tip-border-width")).toBe("2px");
    expect(tuned.style.getPropertyValue("--tip-radius")).toBe("16px");
    expect(tuned.style.getPropertyValue("--tip-font-size")).toBe("11px");
    expect(tuned.style.getPropertyValue("--tip-duration")).toBe("500ms");
    expect(tuned.style.getPropertyValue("--tip-offset")).toBe("4px");
    expect(tuned.getAttribute("data-tip-anim")).toBe("fade");
  });

  it("merges styleOverrides under flat props", () => {
    render(
      <Tooltip content="Hi" tipBg="#111111" styleOverrides={{ bg: "#222222", radius: 12 }}>
        <span>merged</span>
      </Tooltip>,
    );
    const bubble = screen.getByRole("tooltip", { name: "Hi" });
    expect(bubble.style.getPropertyValue("--tip-bg")).toBe("#111111");
    expect(bubble.style.getPropertyValue("--tip-radius")).toBe("12px");
  });
});
