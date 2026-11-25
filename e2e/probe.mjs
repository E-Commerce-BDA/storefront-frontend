/**
 * Stack probe + skip contract. `console` is intentional here: this is a CLI
 * harness, and a printed skip reason *is* the interface (no logger exists in
 * the storefront, and adding one for a script would be bloat).
 */

import { SERVICES, TIMEOUT_MS } from "./config.mjs";

const HEALTH_PATHS = {
  auth: "/health",
  cart: "/health",
  catalog: "/health",
  order: "/health",
  storefront: "/",
};

export function skip(reason) {
  console.log(`SKIP: ${reason}`);
  return true;
}

export async function reachable(name) {
  try {
    const response = await fetch(`${SERVICES[name]}${HEALTH_PATHS[name]}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

export async function missingServices() {
  const names = Object.keys(SERVICES);
  const results = await Promise.all(names.map((name) => reachable(name)));
  return names.filter((_name, index) => !results[index]);
}

export async function pollUntil(check, timeoutMs, intervalMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}
