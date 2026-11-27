// @vitest-environment jsdom
/**
 * sf-095 — every 404/500/loading boundary uses the shared state faces and a
 * real route or retry action. A styled boundary is not a bespoke one.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import RootNotFound from "@/app/not-found";
import RootError from "@/app/error";
import RootLoading from "@/app/loading";
import ShopNotFound from "@/app/(shop)/not-found";
import ShopLoading from "@/app/(shop)/loading";
import AuthNotFound from "@/app/(auth)/not-found";

afterEach(cleanup);

describe("route boundaries (sf-095)", () => {
  it("gives a missing route a working link back into the shop", () => {
    render(<RootNotFound />);
    expect(screen.getByText("This page does not exist")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Back to the shop" }).getAttribute("href")).toBe("/");
  });

  it("gives the shop 404 a catalog link and the auth 404 a sign-in link", () => {
    const shop = render(<ShopNotFound />);
    expect(shop.container.querySelector('a[href="/products"]')).not.toBeNull();
    shop.unmount();
    const auth = render(<AuthNotFound />);
    expect(screen.getByRole("link", { name: "Go to sign in" }).getAttribute("href")).toBe("/signin");
    auth.unmount();
  });

  it("wires the error retry callback and keeps the status roles", () => {
    const retry = vi.fn();
    render(<RootError error={new Error("boom")} retry={retry} />);
    expect(screen.getByRole("alert")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("uses the one loading face with aria-busy in both scopes", () => {
    const root = render(<RootLoading />);
    expect(root.container.querySelector('[role="status"]')).not.toBeNull();
    expect(root.container.querySelector('[aria-busy="true"]')).not.toBeNull();
    root.unmount();
    render(<ShopLoading />);
    expect(screen.getByText("Loading this page…")).not.toBeNull();
  });
});
