// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccountMenu from "@/components/shell/AccountMenu";
import { resolveAccountMenu } from "@/lib/shell/accountMenu";

afterEach(cleanup);

const MODEL = resolveAccountMenu();

describe("AccountMenu contract (sf-072)", () => {
  it("renders the account links and a visible sign-out control", () => {
    render(<AccountMenu model={MODEL} open onClose={vi.fn()} />);
    expect(screen.getByRole("navigation", { name: "Account menu" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "My account" }).getAttribute("href")).toBe("/account");
    expect(screen.getByRole("link", { name: "Orders" }).getAttribute("href")).toBe("/account/orders");
    expect(screen.getByRole("button", { name: "Sign out" })).not.toBeNull();
  });

  it("posts a form to the logout handler — never a GET anchor", () => {
    const { container } = render(<AccountMenu model={MODEL} open onClose={vi.fn()} />);
    const form = container.querySelector("form.sf-accountmenu__form");
    expect(form?.getAttribute("action")).toBe("/api/auth/logout");
    expect(form?.getAttribute("method")).toBe("post");
    expect(container.querySelector('input[name="next"]')?.getAttribute("value")).toBe("/");
    expect(container.querySelector('a[href="/api/auth/logout"]')).toBeNull();
  });

  it("stays hidden when closed and reports state through data-open", () => {
    const { container } = render(<AccountMenu model={MODEL} open={false} onClose={vi.fn()} />);
    expect(container.querySelector(".sf-accountmenu")?.hasAttribute("hidden")).toBe(true);
    expect(container.querySelector(".sf-accountmenu")?.getAttribute("data-open")).toBe("false");
  });

  it("closes when a link is chosen (parent owns the state)", () => {
    const onClose = vi.fn();
    render(<AccountMenu model={MODEL} open onClose={onClose} />);
    screen.getByRole("link", { name: "Wishlist" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
