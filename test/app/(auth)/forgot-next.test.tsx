// @vitest-environment jsdom
/** A completed reset resumes to the safe ?next= path, never the raw URL. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ForgotForm from "@/app/(auth)/_components/ForgotForm";

const nav = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => nav }));

beforeEach(() => nav.replace.mockReset());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubFetch(status: number, body: unknown = {}) {
  const fetchFn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

describe("ForgotForm resume path (sf-095)", () => {
  it("replaces to the resolved next path after a successful reset", async () => {
    stubFetch(200, { ok: true });
    const { container } = render(
      <ForgotForm
        title="Reset password"
        submitLabel="Reset"
        token="single-use-token"
        nextPath="/checkout"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Min. 8 chars, letter + number"), {
      target: { value: "Longenough1!" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/checkout"));
  });

  it("stays on the neutral page when no resume target was given", async () => {
    stubFetch(200, { ok: true });
    const { container } = render(
      <ForgotForm title="Reset password" submitLabel="Reset" token="single-use-token" />,
    );
    fireEvent.change(screen.getByPlaceholderText("Min. 8 chars, letter + number"), {
      target: { value: "Longenough1!" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/forgot"));
  });
});
