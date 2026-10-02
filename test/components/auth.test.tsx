// @vitest-environment jsdom
/**
 * Auth composed blocks — contract: output shape, data hooks, var scoping.
 *
 * AGENTS.md §4 trio, part 1 (contract). Composed-dumb: props in, JSX out —
 * sessions, CMS and versions are invisible at this depth by construction.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { AuthForm, AuthPage, AuthPanel, AuthSplit } from "@/components/auth";
import { DEFAULT_AUTH_SETTINGS } from "@/lib/auth/settings";
import { authCssVars } from "@/lib/auth/cssVars";

const vars = authCssVars(DEFAULT_AUTH_SETTINGS.signin);

afterEach(cleanup);

describe("AuthPage", () => {
  it("applies the var map once and exposes mode", () => {
    render(
      <AuthPage vars={vars} mode="centered">
        <span>inner</span>
      </AuthPage>,
    );
    const root = screen.getByText("inner").parentElement as HTMLElement;
    expect(root.getAttribute("data-mode")).toBe("centered");
    expect(root.style.getPropertyValue("--auth-form-radius")).toBe("12px");
    expect(root.style.getPropertyValue("--auth-panel-bg")).toContain("linear-gradient");
  });
});

describe("AuthSplit", () => {
  it("exposes side/ratio/mobile as data hooks (CSS reads attrs, not classes)", () => {
    const { container } = render(
      <AuthSplit panelSide="right" ratio="60-40" mobile="hidden-panel" panel={<span>panel</span>} form={<span>form</span>} />,
    );
    const split = container.firstElementChild as HTMLElement;
    expect(split.getAttribute("data-side")).toBe("right");
    expect(split.getAttribute("data-ratio")).toBe("60-40");
    expect(split.getAttribute("data-mobile")).toBe("hidden-panel");
    expect(screen.getByText("panel")).not.toBeNull();
    expect(screen.getByText("form")).not.toBeNull();
  });
});

describe("AuthPanel", () => {
  it("renders sanitized HTML slots and logo, skips empties", () => {
    const { container } = render(
      <AuthPanel
        logoUrl="https://cdn/logo.svg"
        headline="<h3>Hi</h3>"
        sub="<p>Sub</p>"
        bulletsHtml=""
        quoteHtml="<p>Q</p>"
      />,
    );
    expect(container.querySelector("img.sf-auth__logo")?.getAttribute("src")).toBe("https://cdn/logo.svg");
    expect(container.querySelector(".sf-auth__headline")?.innerHTML).toBe("<h3>Hi</h3>");
    expect(container.querySelector(".sf-auth__bullets")).toBeNull();
    expect(container.querySelector(".sf-auth__quote")?.innerHTML).toBe("<p>Q</p>");
  });
});

describe("AuthForm", () => {
  it("renders title, children, banner error and loading submit", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <AuthForm
        title="Welcome back"
        error={{ code: "INVALID_CREDENTIALS", message: "Invalid email or password." }}
        errorStyle="banner"
        submitLabel="Sign in"
        loading
        onSubmit={onSubmit}
      >
        <input aria-label="Email" />
      </AuthForm>,
    );
    expect(screen.getByText("Welcome back")).not.toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("INVALID_CREDENTIALS");
    const btn = screen.getByRole("button", { name: "Sign in" });
    expect(btn.hasAttribute("disabled")).toBe(true); // loading = disabled face
    fireEvent.click(btn);
    expect(onSubmit).not.toHaveBeenCalled(); // dead button never submits
  });

  it("renders inline errors under the submit", () => {
    render(
      <AuthForm
        title="T"
        error={{ code: "EMAIL_TAKEN", message: "Taken." }}
        errorStyle="inline"
        submitLabel="Go"
        onSubmit={(e) => e.preventDefault()}
      >
        <span />
      </AuthForm>,
    );
    expect(document.querySelector(".sf-auth__err-inline")?.textContent).toContain("EMAIL_TAKEN");
    expect(document.querySelector(".sf-auth__err-banner")).toBeNull();
  });

  it("renders nothing error-shaped without an error", () => {
    render(
      <AuthForm title="T" submitLabel="Go" onSubmit={(e) => e.preventDefault()}>
        <span />
      </AuthForm>,
    );
    expect(document.querySelector("[role='alert']")).toBeNull();
  });
});
