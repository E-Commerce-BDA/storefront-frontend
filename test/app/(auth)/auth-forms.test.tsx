// @vitest-environment jsdom
/**
 * Route islands — validation display, loading, submit wiring.
 * Owned by app/(auth) routes only (AGENTS.md §3.7: islands ship with
 * their route's tests). Submits hit marked stubs until the thin-client
 * slice lands; tests pin display behavior, never backend truth.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import SigninForm from "@/app/(auth)/_components/SigninForm";
import SignupForm from "@/app/(auth)/_components/SignupForm";
import ForgotForm from "@/app/(auth)/_components/ForgotForm";

afterEach(cleanup);

function submit(root: HTMLElement) {
  // jsdom doesn't reliably submit forms from button clicks — submit directly.
  const form = root.querySelector("form") as HTMLFormElement;
  fireEvent.submit(form);
}

describe("SigninForm", () => {
  it("blocks invalid email with inline guidance (courtesy validation)", () => {
    const { container } = render(<SigninForm title="Welcome back" submitLabel="Sign in" />);
    const email = screen.getByPlaceholderText("ana@example.com");
    fireEvent.change(email, { target: { value: "bad@" } });
    submit(container as unknown as HTMLElement);
    expect(screen.getByText("Enter a valid email")).not.toBeNull();
  });

  it("shows loading then the generic envelope error (no enumeration)", async () => {
    const { container } = render(<SigninForm title="Welcome back" submitLabel="Sign in" />);
    fireEvent.change(screen.getByPlaceholderText("ana@example.com"), { target: { value: "ana@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secret123" } });
    submit(container as unknown as HTMLElement);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Invalid email or password."), {
      timeout: 3000,
    });
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
  it("flags mismatched confirmation without sending (UI-only check)", () => {
    const { container } = render(<SignupForm title="Create" submitLabel="Create account" />);
    fireEvent.change(screen.getByPlaceholderText("Ana"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByPlaceholderText("Silva"), { target: { value: "Silva" } });
    fireEvent.change(screen.getByPlaceholderText("ana@example.com"), { target: { value: "ana@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 chars, mixed case + number"), { target: { value: "Secret123" } });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: "Other123" } });
    submit(container as unknown as HTMLElement);
    expect(screen.getByText(/Passwords don't match/)).not.toBeNull();
  });

  it("surfaces the documented 409 on submit (stub until thin client)", async () => {
    const { container } = render(<SignupForm title="Create" submitLabel="Create account" />);
    fireEvent.change(screen.getByPlaceholderText("Ana"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByPlaceholderText("Silva"), { target: { value: "Silva" } });
    fireEvent.change(screen.getByPlaceholderText("ana@example.com"), { target: { value: "ana@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 chars, mixed case + number"), { target: { value: "Secret123" } });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: "Secret123" } });
    submit(container as unknown as HTMLElement);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("already exists"), {
      timeout: 3000,
    });
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
