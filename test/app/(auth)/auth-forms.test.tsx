// @vitest-environment jsdom
/**
 * Route islands — validation display, loading, submit wiring.
 * Owned by app/(auth) routes only (AGENTS.md §3.7: islands ship with
 * their route's tests).
 *
 * sf-049 moved the submit path from a 900 ms stub to `fetch('/api/auth/*')`,
 * so these tests mock `fetch` and assert the wire contract the island owns:
 * which route it posts to, that the body carries no token, that a code maps
 * through `displayFor`, and that success navigates with `replace`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SigninForm from "@/app/(auth)/_components/SigninForm";
import SignupForm from "@/app/(auth)/_components/SignupForm";
import ForgotForm from "@/app/(auth)/_components/ForgotForm";

const nav = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => nav }));

function submit(root: HTMLElement) {
  // jsdom doesn't reliably submit forms from button clicks — submit directly.
  const form = root.querySelector("form") as HTMLFormElement;
  fireEvent.submit(form);
}

function stubFetch(status: number, body: unknown = {}) {
  const fetchFn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

function bodyOf(fetchFn: ReturnType<typeof stubFetch>): Record<string, unknown> {
  const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}

beforeEach(() => {
  nav.replace.mockReset();
  nav.refresh.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SigninForm", () => {
  it("blocks invalid email with inline guidance (courtesy validation)", () => {
    const fetchFn = stubFetch(200);
    const { container } = render(<SigninForm title="Welcome back" submitLabel="Sign in" />);
    const email = screen.getByPlaceholderText("ana@example.com");
    fireEvent.change(email, { target: { value: "bad@" } });
    submit(container as unknown as HTMLElement);
    expect(screen.getByText("Enter a valid email")).not.toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("posts to the BFF and shows the generic envelope code (no enumeration)", async () => {
    const fetchFn = stubFetch(401, { error: { code: "INVALID_CREDENTIALS" } });
    const { container } = render(<SigninForm title="Welcome back" submitLabel="Sign in" />);
    fireEvent.change(screen.getByPlaceholderText("ana@example.com"), { target: { value: "ana@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secret123" } });
    submit(container as unknown as HTMLElement);

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Invalid email or password."));

    const [url] = fetchFn.mock.calls[0] as unknown as [string];
    expect(url).toBe("/api/auth/login");
    expect(bodyOf(fetchFn)).toEqual({ email: "ana@x.com", password: "secret123" });
    expect(JSON.stringify(bodyOf(fetchFn))).not.toContain("Token");
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("surfaces SERVICE_UNAVAILABLE when the BFF cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const { container } = render(<SigninForm title="Welcome back" submitLabel="Sign in" />);
    fireEvent.change(screen.getByPlaceholderText("ana@example.com"), { target: { value: "ana@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secret123" } });
    submit(container as unknown as HTMLElement);

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("couldn't reach sign-in"));
  });

  it("navigates with replace (never push) and refreshes the shell on success", async () => {
    stubFetch(200, { user: { id: "u1", email: "ana@x.com" } });
    const { container } = render(
      <SigninForm title="Welcome back" submitLabel="Sign in" nextPath="/checkout" />,
    );
    fireEvent.change(screen.getByPlaceholderText("ana@example.com"), { target: { value: "ana@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secret123" } });
    submit(container as unknown as HTMLElement);

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/checkout"));
    expect(nav.refresh).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("toggles password visibility with a named, perceivable control", () => {
    render(<SigninForm title="Welcome back" submitLabel="Sign in" />);
    const eye = screen.getByRole("button", { name: "Show password" });
    fireEvent.click(eye);
    expect(screen.getByRole("button", { name: "Hide password" })).not.toBeNull();
    expect((screen.getByPlaceholderText("••••••••") as HTMLInputElement).type).toBe("text");
  });
});

describe("SignupForm", () => {
  function fill(values: { confirm: string }) {
    fireEvent.change(screen.getByPlaceholderText("Ana"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByPlaceholderText("Silva"), { target: { value: "Silva" } });
    fireEvent.change(screen.getByPlaceholderText("ana@example.com"), { target: { value: "ana@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 chars, mixed case + number"), {
      target: { value: "Secret123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: values.confirm } });
  }

  it("flags mismatched confirmation without sending (UI-only check)", () => {
    const fetchFn = stubFetch(201);
    const { container } = render(<SignupForm title="Create" submitLabel="Create account" />);
    fill({ confirm: "Other123" });
    submit(container as unknown as HTMLElement);
    expect(screen.getByText(/Passwords don't match/)).not.toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("surfaces the documented 409 from the BFF", async () => {
    const fetchFn = stubFetch(409, { error: { code: "EMAIL_TAKEN" } });
    const { container } = render(<SignupForm title="Create" submitLabel="Create account" />);
    fill({ confirm: "Secret123" });
    submit(container as unknown as HTMLElement);

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("already exists"));

    const [url] = fetchFn.mock.calls[0] as unknown as [string];
    expect(url).toBe("/api/auth/register");
    // Confirmation is UI-only: one password leaves the browser.
    expect(bodyOf(fetchFn)).toEqual({
      email: "ana@x.com",
      password: "Secret123",
      firstName: "Ana",
      lastName: "Silva",
    });
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("signs the new shopper straight in on 201", async () => {
    stubFetch(201, { user: { id: "u1", email: "ana@x.com" } });
    const { container } = render(<SignupForm title="Create" submitLabel="Create account" />);
    fill({ confirm: "Secret123" });
    submit(container as unknown as HTMLElement);

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/account"));
    expect(nav.refresh).toHaveBeenCalled();
  });
});

describe("ForgotForm", () => {
  it("answers identically and reveals the reset demo (no enumeration)", async () => {
    const { container } = render(<ForgotForm title="Reset" submitLabel="Send reset link" />);
    fireEvent.change(screen.getByPlaceholderText("ana@example.com"), { target: { value: "nobody@x.com" } });
    submit(container as unknown as HTMLElement);
    await waitFor(
      () => expect(screen.getByRole("status").textContent).toContain("reset link is on its way"),
      { timeout: 3000 },
    );
    expect(screen.getByPlaceholderText("Min. 8 chars")).not.toBeNull();
  });

  it("renders the reset step directly with ?token=", () => {
    render(<ForgotForm title="Reset" submitLabel="Send reset link" token="tok_123" />);
    expect(screen.getByText("Choose a new password")).not.toBeNull();
  });
});
