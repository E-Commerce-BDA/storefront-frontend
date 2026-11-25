// @vitest-environment jsdom
/**
 * CheckoutForm — the `/checkout` island (plan §12 islands tier: "checkout 409
 * path", plus §8's whole error table and §9's key discipline).
 *
 * The headline assertions are the ones a wrong answer would make money on:
 * the same attempt must replay the same `x-idempotency-key`, an
 * IN_PROGRESS poll must wait 1 s and reuse it, and only an
 * ATTEMPT_CLOSED may burn the key. `bff` itself is mocked at the seam —
 * its refresh/relay behaviour is `test/lib/http/browser.test.ts`'s job.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CartItemDto } from "@/lib/cart/schemas";
import type { FailureKind, ServiceFailure, ServiceResult } from "@/lib/http/result";

const cart = vi.hoisted(() => ({
  items: [] as unknown[],
  count: 0,
  subtotal: 0,
  status: "ready" as string,
  clear: vi.fn(async () => true),
}));
const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const bff = vi.hoisted(() => vi.fn());
const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
const addresses = vi.hoisted(() => ({ value: [] as Array<{ id: string; label: string; line1: string; city: string; postalCode: string; country: string }> }));

vi.mock("@/lib/account/port", () => ({
  fetchAddresses: vi.fn(async () => ({ ok: true, data: addresses.value })),
}));

vi.mock("@/app/_components/CartProvider", () => ({
  useCart: () => ({
    items: cart.items,
    count: cart.count,
    subtotal: cart.subtotal,
    status: cart.status,
    clear: cart.clear,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => search.params,
}));
vi.mock("@/lib/http/browser", () => ({ bff }));
// The summary rows are CartLineItem's tested face; the island test only counts them.
vi.mock("@/components/shell/CartLineItem", () => ({
  default: ({ line }: { line: CartItemDto }) => <li>{line.productName}</li>,
}));

import CheckoutForm, { describeFailure } from "@/app/(shop)/_components/CheckoutForm";

const ok = <T,>(data: T): ServiceResult<T> => ({ ok: true, data });
const fail = (status: number, code: string, kind: FailureKind): ServiceFailure => ({
  ok: false,
  kind,
  status,
  code,
  message: code,
});

const confirmation = {
  orderId: "o1",
  orderNumber: "ORD-1",
  status: "paid",
  totals: { subtotal: 10, shipping: 0, tax: 0, discount: 0, grandTotal: 10 },
  items: [],
};

const line = (over: Partial<CartItemDto> = {}): CartItemDto => ({
  id: "i1",
  productId: "p1",
  qty: 1,
  unitPrice: 10,
  productName: "Mug",
  ...over,
});

function fillAddress() {
  fireEvent.change(screen.getByLabelText(/Address line 1/), { target: { value: "1 Main St" } });
  fireEvent.change(screen.getByLabelText(/^City/), { target: { value: "Springfield" } });
  fireEvent.change(screen.getByLabelText(/Postal code/), { target: { value: "12345" } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Place order/ }));
}

beforeEach(() => {
  cart.items = [line()];
  cart.count = 1;
  cart.subtotal = 10;
  cart.status = "ready";
  cart.clear.mockClear();
  push.mockClear();
  replace.mockClear();
  search.params = new URLSearchParams();
  addresses.value = [];
  bff.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CheckoutForm", () => {
  it("places the order, empties the cart, and hands off to the confirmation route", async () => {
    bff.mockResolvedValue(ok(confirmation));
    render(<CheckoutForm />);
    fillAddress();
    submit();

    await waitFor(() => expect(bff).toHaveBeenCalledTimes(1));
    const [, opts] = bff.mock.calls[0];
    expect(opts.method).toBe("POST");
    expect(opts.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(opts.body.items).toEqual([{ productId: "p1", qty: 1 }]);
    expect(opts.body.payment).toEqual({ provider: "mock" });
    // The stripped address: "" optionals stay absent, not empty strings.
    expect(opts.body.shippingAddress).toEqual({
      line1: "1 Main St",
      city: "Springfield",
      postalCode: "12345",
      country: "US",
    });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/checkout/confirmation/o1"));
    expect(cart.clear).toHaveBeenCalled();
  });

  it("submits the discountCode when filled in", async () => {
    bff.mockResolvedValue(ok(confirmation));
    render(<CheckoutForm />);
    fillAddress();
    fireEvent.change(screen.getByLabelText(/Discount code/), { target: { value: "SAVE10" } });
    submit();

    await waitFor(() => expect(bff).toHaveBeenCalledTimes(1));
    const [, opts] = bff.mock.calls[0];
    expect(opts.body.discountCode).toBe("SAVE10");
  });

  it("renders the step chrome, saved-address picker and shipping method (A4.4/A5.1/A5.2)", async () => {
    addresses.value = [
      { id: "a1", label: "Home", line1: "9 Saved St", city: "Portland", postalCode: "97201", country: "US" },
    ];
    bff.mockResolvedValue(ok(confirmation));
    render(<CheckoutForm />);

    expect(screen.getByRole("navigation", { name: "Checkout progress" })).not.toBeNull();
    expect(screen.getAllByText("Details").length).toBeGreaterThan(0);
    const picker = await screen.findByLabelText("Use a saved address");
    fireEvent.change(picker, { target: { value: "a1" } });
    expect((screen.getByLabelText(/Address line 1/) as HTMLInputElement).value).toBe("9 Saved St");
    expect(screen.getByLabelText("Method")).not.toBeNull();
    expect(screen.getByText(/calculates the final shipping fee/)).not.toBeNull();
  });

  it("carries the cart's coupon into the summary as a discount line (A5.3)", async () => {
    search.params = new URLSearchParams("coupon=SAVE10");
    bff.mockImplementation((path: string) =>
      Promise.resolve(
        path === "/api/discount-codes/validate"
          ? ok({ valid: true, code: "SAVE10", discountType: "percent", value: 10 })
          : ok(confirmation),
      ),
    );
    render(<CheckoutForm />);

    await waitFor(() => expect(screen.getByText("Coupon (SAVE10)")).not.toBeNull());
    expect(screen.getByText("-$1")).not.toBeNull();
    expect(screen.getByText("$9")).not.toBeNull();
  });

  it("replays a retry of the same attempt with the SAME key (charged once)", async () => {
    bff
      .mockResolvedValueOnce(fail(503, "CHECKOUT_UNAVAILABLE", "unavailable"))
      .mockResolvedValueOnce(ok(confirmation));
    render(<CheckoutForm />);
    fillAddress();
    submit();

    await waitFor(() => expect(bff).toHaveBeenCalledTimes(1));
    const firstKey = bff.mock.calls[0][1].idempotencyKey;
    // The 503 banner promises the retry keeps one attempt — "Nothing was
    // charged", not "your order is processing".
    await waitFor(() => expect(screen.queryByText("Nothing was charged — try again.")).not.toBeNull());
    submit();
    await waitFor(() => expect(bff).toHaveBeenCalledTimes(2));
    expect(bff.mock.calls[1][1].idempotencyKey).toBe(firstKey);
  });

  it("shows the stock banner with a route back to the cart on 409 (A5.7)", async () => {
    bff.mockResolvedValue(fail(409, "STOCK_INSUFFICIENT", "conflict"));
    render(<CheckoutForm />);
    fillAddress();
    submit();

    await waitFor(() => expect(screen.queryByText("Some items are no longer available.")).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Review cart" }));
    expect(push).toHaveBeenCalledWith("/cart");
    // A stock 409 must not claim the cart changed or clear it.
    expect(cart.clear).not.toHaveBeenCalled();
  });

  it("highlights only the lines named by the 409 structured details (ord-013)", async () => {
    cart.items = [
      line({ id: "i1", productId: "p1", productName: "Mug" }),
      line({ id: "i2", productId: "p2", productName: "Plate" }),
    ];
    cart.count = 2;
    bff.mockResolvedValue({
      ok: false,
      kind: "conflict",
      status: 409,
      code: "STOCK_INSUFFICIENT",
      message: "a prose string that must never be parsed",
      details: { itemIds: ["p1"], items: [{ productId: "p1", variantId: null }] },
    });
    render(<CheckoutForm />);
    fillAddress();
    submit();

    await waitFor(() =>
      expect(screen.getByText("Some items are no longer available.")).not.toBeNull(),
    );
    const highlighted = screen.getByRole("list", { name: "Unavailable items" });
    expect(highlighted.textContent).toContain("Mug");
    expect(highlighted.textContent).not.toContain("Plate");
    expect(highlighted.querySelector('[data-shortfall-item="p1"]')).not.toBeNull();
  });

  it("burns the key only when the attempt was closed", async () => {
    bff.mockResolvedValue(fail(409, "IDEMPOTENCY_CONFLICT", "conflict"));
    render(<CheckoutForm />);
    fillAddress();
    submit();
    await waitFor(() => expect(screen.queryByText("Your attempt was closed — submit again.")).not.toBeNull());

    submit();
    await waitFor(() => expect(bff).toHaveBeenCalledTimes(2));
    expect(bff.mock.calls[1][1].idempotencyKey).not.toBe(bff.mock.calls[0][1].idempotencyKey);
  });

  it("polls an in-progress attempt twice at 1 s with the same key", async () => {
    vi.useFakeTimers();
    bff
      .mockResolvedValueOnce(fail(409, "IDEMPOTENCY_IN_PROGRESS", "conflict"))
      .mockResolvedValueOnce(ok(confirmation));
    render(<CheckoutForm />);
    fillAddress();
    submit();

    await act(async () => void vi.runAllTimersAsync());

    expect(bff).toHaveBeenCalledTimes(2);
    expect(bff.mock.calls[1][1].idempotencyKey).toBe(bff.mock.calls[0][1].idempotencyKey);
    expect(push).toHaveBeenCalledWith("/checkout/confirmation/o1");
  });

  it("routes a dead session to sign-in, back to checkout", async () => {
    bff.mockResolvedValue(fail(401, "TOKEN_EXPIRED", "unauthorized"));
    render(<CheckoutForm />);
    fillAddress();
    submit();

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/signin?next=%2Fcheckout"),
    );
  });

  it("refuses to submit a cart holding optimistic placeholder lines", async () => {
    cart.items = [line({ id: "pending:abc", productId: "p1" })];
    render(<CheckoutForm />);
    fillAddress();
    const button = screen.getByRole("button", { name: /Place order/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(bff).not.toHaveBeenCalled();
  });

  it("bounces an empty cart to /cart instead of a second empty state", async () => {
    cart.items = [];
    cart.count = 0;
    cart.subtotal = 0;
    render(<CheckoutForm />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/cart"));
  });
});

describe("describeFailure — plan §8 table", () => {
  it("picks copy by code family, not by status alone", () => {
    expect(describeFailure(fail(409, "RESERVATION_EXPIRED", "conflict")).toCart).toBe(true);
    expect(describeFailure(fail(409, "IDEMPOTENCY_IN_PROGRESS", "conflict")).retryWithSameKey).toBe(true);
    expect(describeFailure(fail(409, "ORDER_ATTEMPT_CLOSED", "conflict")).rotateKey).toBe(true);
    // 502 = our contract is wrong; 503 = nothing was charged. Different promise,
    // so different copy — and neither may claim an order exists.
    expect(describeFailure(fail(502, "PAYMENT_FAILED", "upstream")).message).toBe("Payment could not be completed.");
    expect(describeFailure(fail(503, "CHECKOUT_UNAVAILABLE", "unavailable")).message).toBe("Nothing was charged — try again.");
    // A null-coded transport failure still lands on honest fallback copy.
    expect(describeFailure({ ok: false, kind: "unavailable", status: 0, code: null, message: null }).message).toBe(
      "Nothing was charged — try again.",
    );
  });
});
