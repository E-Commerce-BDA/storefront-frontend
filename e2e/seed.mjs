/**
 * Seed one active product with stock through catalog-svc's admin API, and
 * create a shopper through auth-svc. Both are HTTP-only; no service client is
 * imported from the storefront app.
 */

import { SERVICES } from "./config.mjs";

export async function seedProduct() {
  const token = process.env.E2E_ADMIN_TOKEN;
  if (!token) return { skipped: "E2E_ADMIN_TOKEN is not set (catalog writes are admin-gated)" };

  const sku = `E2E-${Date.now()}`;
  const slug = `e2e-${Date.now()}`;
  const response = await fetch(`${SERVICES.catalog}/api/v1/catalog/products`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      sku,
      name: "E2E Linen Shirt",
      slug,
      price: 42,
      stock: 25,
      status: "active",
    }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    return { error: `catalog seed failed with ${response.status}` };
  }
  const body = await response.json();
  const product = body?.product ?? body;
  if (typeof product?.id !== "string" || typeof product?.slug !== "string") {
    return { error: "catalog seed response had no product id/slug" };
  }
  return { product: { id: product.id, slug: product.slug } };
}

export async function shopperSession() {
  const email = `e2e-${Date.now()}@example.test`;
  const password = "linen1234";
  const registered = await fetch(`${SERVICES.auth}/api/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, firstName: "E2E", lastName: "Shopper" }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!registered.ok) return { error: `shopper register failed with ${registered.status}` };

  const loggedIn = await fetch(`${SERVICES.auth}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!loggedIn.ok) return { error: `shopper login failed with ${loggedIn.status}` };
  const body = await loggedIn.json();
  if (typeof body?.accessToken !== "string") return { error: "login response had no accessToken" };
  return { accessToken: body.accessToken };
}
