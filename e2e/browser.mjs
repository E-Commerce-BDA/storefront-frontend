/**
 * Real browser checkout through the public storefront. Playwright is loaded
 * dynamically so the storefront can ship without a browser dependency; a
 * missing module or binary is a printed SKIP, never a fake HTTP-only checkout.
 *
 * Checkout is signed-in-only: the proxy redirects a guest to `/signin`, so the
 * harness signs in through that public route before it reaches the form. The
 * replay goes through the same browser context so the HttpOnly session and the
 * user-scoped idempotency key are the ones the first attempt used.
 */

import { SERVICES } from "./config.mjs";

export async function browserCheckout(productSlug, shopper) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return { skipped: "playwright is not installed (browser checkout unavailable)" };
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // The island clears its own cart after success. Swallow only that DELETE,
    // so an empty server cart can only have come from the order.created
    // consumer — otherwise the conversion assertion proves nothing.
    await page.route("**/api/cart", (route) => {
      if (route.request().method() === "DELETE") return route.fulfill({ status: 204 });
      return route.continue();
    });
    let captured = null;
    page.on("request", (request) => {
      if (!request.url().endsWith("/api/checkout") || request.method() !== "POST") return;
      const key = request.headers()["x-idempotency-key"];
      const data = request.postData();
      if (typeof key === "string" && typeof data === "string") {
        captured = { key, body: JSON.parse(data) };
      }
    });

    await page.goto(`${SERVICES.storefront}/products/${encodeURIComponent(productSlug)}`);
    await page.getByRole("button", { name: /add to cart/i }).first().click();
    await page.goto(`${SERVICES.storefront}/cart`);

    // `next=/cart` resumes the basket the guest just filled: the BFF merges it
    // into the account on sign-in, so checkout still has the seeded item.
    await page.goto(
      `${SERVICES.storefront}/signin?next=${encodeURIComponent("/cart")}`,
    );
    await page.getByLabel(/^Email/).fill(shopper.email);
    await page.getByLabel(/^Password/).fill(shopper.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/cart$/, { timeout: 30_000 });

    await page.getByRole("button", { name: "Checkout" }).click();

    await page.getByLabel(/Address line 1/).fill("1 E2E Street");
    await page.getByLabel(/^City/).fill("Springfield");
    await page.getByLabel(/Postal code/).fill("12345");
    const placed = page.waitForResponse(
      (response) => response.url().endsWith("/api/checkout") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Place order/ }).click();
    const confirmationResponse = await placed;
    const confirmation = await confirmationResponse.json();
    // Success is the 201 with an order id, not the client route: the island
    // clears its local cart and pushes to confirmation, but its empty-cart
    // effect can replace that push with /cart. Waiting on the URL would fail a
    // checkout that already created the order.
    if (typeof confirmation?.orderId !== "string") {
      return { error: "checkout response had no orderId" };
    }

    if (captured === null) {
      return { error: "storefront did not send an x-idempotency-key on /api/checkout" };
    }

    // Same key + same body + same session = a replay, not a second order.
    const replayResponse = await page.request.post(`${SERVICES.storefront}/api/checkout`, {
      data: captured.body,
      headers: { "x-idempotency-key": captured.key },
    });
    if (!replayResponse.ok()) {
      return { error: `idempotency replay failed with ${replayResponse.status()}` };
    }
    const replay = await replayResponse.json();

    // Conversion is the order.created consumer's job, not the browser's. Poll
    // the BFF with the same session until the cart comes back empty.
    let cartConverted = false;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const cartResponse = await page.request.get(`${SERVICES.storefront}/api/cart`);
      if (cartResponse.ok()) {
        const cart = await cartResponse.json();
        if (Array.isArray(cart?.items) && cart.items.length === 0) {
          cartConverted = true;
          break;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return {
      orderId: confirmation?.orderId ?? null,
      idempotencyKey: captured.key,
      replayMatches: JSON.stringify(confirmation) === JSON.stringify(replay),
      cartConverted,
    };
  } finally {
    await browser.close();
  }
}
