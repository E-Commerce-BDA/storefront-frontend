/**
 * Real browser checkout through the public storefront. Playwright is loaded
 * dynamically so the storefront can ship without a browser dependency; a
 * missing module or binary is a printed SKIP, never a fake HTTP-only checkout.
 *
 * The replay goes through the same browser context so the HttpOnly session and
 * the user-scoped idempotency key are the ones the first attempt used.
 */

import { SERVICES } from "./config.mjs";

export async function browserCheckout(productSlug) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return { skipped: "playwright is not installed (browser checkout unavailable)" };
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
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
    await page.waitForURL(/\/checkout\/confirmation\//, { timeout: 30_000 });

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
