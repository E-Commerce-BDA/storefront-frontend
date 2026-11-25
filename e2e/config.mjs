/**
 * Live harness configuration. Mirrors lib/services/urls.ts fallbacks so the
 * harness talks to the same ports the storefront BFF talks to.
 */

const trim = (value) => value.replace(/\/+$/, "");

export const SERVICES = {
  auth: trim(process.env.AUTH_SVC_URL ?? "http://localhost:4010"),
  cart: trim(process.env.CART_SVC_URL ?? "http://localhost:4030"),
  catalog: trim(process.env.CATALOG_SVC_URL ?? "http://localhost:4020"),
  order: trim(process.env.ORDER_SVC_URL ?? "http://localhost:4040"),
  storefront: trim(process.env.STOREFRONT_URL ?? "http://localhost:3000"),
};

export const TIMEOUT_MS = 2_000;
export const CONVERSION_TIMEOUT_MS = 30_000;
export const POLL_MS = 500;
