# Live checkout harness (sf-053a)

This directory is **harness code only**. It was run against a live stack on
2026-11-26; see "Live verification" below for what actually passed.

## Contract

One command: `pnpm test:e2e:live` (optionally `-- --up` to boot infra and the
four services first). The harness:

1. Probes auth, cart, catalog, order and the storefront. If any is down it
   prints `SKIP: <reason>` and exits 0 — a missing stack is not a failure.
2. Seeds one active product with stock via catalog-svc's admin API. Requires
   `E2E_ADMIN_TOKEN`; without it the harness prints a SKIP reason.
3. Registers a shopper through auth-svc, signs in via the storefront's public
   `/signin?next=/cart` route, then runs a **real browser** checkout through
   the storefront with Playwright, capturing the `x-idempotency-key` on the
   `/api/checkout` request. Missing Playwright or browser binary is a printed
   SKIP, not an invented checkout.
4. Polls the BFF's `GET /api/cart` until the cart is empty. The island's own
   `DELETE /api/cart` is suppressed in the browser, so an empty cart can only
   have come from the order-svc `order.created` consumer.
5. Replays the captured key and body through the same signed-in browser context
   against `POST /api/checkout` and requires the same confirmation body (no
   second order, no second charge).

## Live verification (2026-11-26)

`pnpm test:e2e:live` with `E2E_ADMIN_TOKEN` set and all five services up:
exit 0, `PASS: order … replay matched, cart converted`. Assertions that ran and
passed: product seed, shopper registration, browser sign-in, add-to-cart,
`POST /api/checkout` 201 with an order id, captured `x-idempotency-key`, same-key
replay body equality, and cart emptied with the browser's own DELETE suppressed
(so the `order.created` consumer did it). No assertion failed; the probe and
Playwright SKIP branches did not fire. Playwright is deliberately not a
storefront dependency — a clone without a resolvable `playwright` still SKIPs.

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
