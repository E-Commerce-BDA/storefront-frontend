# Live checkout harness (sf-053a) — UNVERIFIED

This directory is **harness code only**. It has never been run against a live
stack in this wave, so no acceptance criterion below is claimed as passing.

## Contract

One command: `pnpm test:e2e:live` (optionally `-- --up` to boot infra and the
four services first). The harness:

1. Probes auth, cart, catalog, order and the storefront. If any is down it
   prints `SKIP: <reason>` and exits 0 — a missing stack is not a failure.
2. Seeds one active product with stock via catalog-svc's admin API. Requires
   `E2E_ADMIN_TOKEN`; without it the harness prints a SKIP reason.
3. Registers + logs in a shopper through auth-svc, then runs a **real browser**
   checkout through the storefront with Playwright, capturing the
   `x-idempotency-key` on the `/api/checkout` request. Missing Playwright or
   browser binary is a printed SKIP, not an invented checkout.
4. Polls `GET /api/v1/cart` until the cart is empty — the `order.created`
   consumer is what converts it, not the browser.
5. Replays the captured key directly against order-svc and requires the same
   confirmation body (no second order, no second charge).

## Why skip instead of fail

The storefront CI has no brokers, databases or running services. A hard failure
there would make every local `pnpm test` red for infrastructure reasons, which
is exactly the noise the skip contract exists to avoid.

## Deliberate limitations

- `--up` starts infra from `../../ecom-infra/docker-compose.yml` and the four
  Nest services from their repos; it assumes their dependencies are installed.
- Product seeding needs an admin JWT because catalog writes are admin-gated.
  There is no backdoor in the harness.
- The browser flow uses the public storefront routes only; it never imports a
  service client or a token into the page.
