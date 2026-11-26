/**
 * sf-053a — one command for the live checkout harness.
 *
 * `console` is the CLI interface here (skip reasons must be printed), so it is
 * intentional. This file is written but UNVERIFIED in this wave: no live stack
 * was available to run it against.
 */

import { spawn } from "node:child_process";
import { browserCheckout } from "./browser.mjs";
import { CONVERSION_TIMEOUT_MS, POLL_MS } from "./config.mjs";
import { missingServices, pollUntil, skip } from "./probe.mjs";
import { seedProduct, shopperCredentials } from "./seed.mjs";

const SERVICE_DIRS = [
  ["auth-svc", "../../auth-svc"],
  ["cart-svc", "../../cart-svc"],
  ["catalog-svc", "../../catalog-svc"],
  ["order-svc", "../../order-svc"],
];

function startDetached(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: "ignore", detached: true });
  child.unref();
}

async function bootStack() {
  startDetached(
    "docker",
    ["compose", "-f", "../../ecom-infra/docker-compose.yml", "up", "-d", "postgres", "redis", "kafka"],
    ".",
  );
  for (const [, cwd] of SERVICE_DIRS) startDetached("pnpm", ["start:dev"], cwd);
  const up = await pollUntil(
    async () => (await missingServices()).length === 0,
    CONVERSION_TIMEOUT_MS,
    POLL_MS,
  );
  if (!up) {
    console.log("WARN: services did not become healthy within the boot window");
  }
}

async function main() {
  if (process.argv.includes("--up")) await bootStack();

  const missing = await missingServices();
  if (missing.length > 0) {
    skip(`stack is not up (${missing.join(", ")}) — see e2e/README.md`);
    return;
  }

  const seeded = await seedProduct();
  if (seeded.skipped) return skip(seeded.skipped);
  if (seeded.error) throw new Error(seeded.error);

  const shopper = await shopperCredentials();
  if (shopper.error) throw new Error(shopper.error);

  const result = await browserCheckout(seeded.product.slug, shopper);
  if (result.skipped) return skip(result.skipped);
  if (result.error) throw new Error(result.error);

  const failures = [];
  if (!result.replayMatches) failures.push("duplicate key did not replay the same confirmation");
  if (!result.cartConverted) failures.push("cart was not converted by order.created");
  if (failures.length > 0) throw new Error(failures.join("; "));

  console.log(`PASS: order ${result.orderId}, replay matched, cart converted`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
