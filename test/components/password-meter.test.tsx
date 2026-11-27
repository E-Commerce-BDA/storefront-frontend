// @vitest-environment jsdom
/** sf-095 contract tier — the meter is a courtesy painter, never a validator. */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import PasswordMeter, { passwordScore } from "@/components/auth/PasswordMeter";

afterEach(cleanup);

describe("passwordScore", () => {
  it("is zero for empty and grows with length, case, digit and symbol", () => {
    expect(passwordScore("")).toBe(0);
    expect(passwordScore("short")).toBe(0);
    expect(passwordScore("longenough")).toBe(1);
    expect(passwordScore("Longenough")).toBe(2);
    expect(passwordScore("Longenough1")).toBe(3);
    expect(passwordScore("Longenough1!")).toBe(4);
  });
});

describe("PasswordMeter", () => {
  it("paints four decorative bars with a linked guidance line", () => {
    const { container } = render(<PasswordMeter id="signup-password" value="Longenough1!" />);
    const meter = container.querySelector(".pw-meter") as HTMLElement;
    expect(meter.getAttribute("aria-hidden")).toBe("true");
    expect(meter.children).toHaveLength(4);
    expect(container.querySelector("#signup-password-hint")?.textContent).toBe("Strong password.");
  });

  it("keeps an empty value at zero bars", () => {
    const { container } = render(<PasswordMeter id="pw" value="" />);
    const bars = Array.from(container.querySelectorAll(".pw-meter span")) as HTMLElement[];
    expect(bars.every((bar) => bar.style.background.startsWith("var("))).toBe(true);
  });
});
