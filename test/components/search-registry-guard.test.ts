/**
 * Registry guard (sf-046 CI guarantee, source level) — the search
 * registry is the ONLY production importer of overlay modules. Static
 * overlay imports outside the showcase (app/components, deleted at
 * launch) and the registry itself fail this test: a single static
 * import would pull every variant into the page bundle and silently
 * void the selection model.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const OVERLAY_MODULES = ["SearchSheet", "SearchEditorial", "SearchPalette"];
// Static import of an overlay module (dynamic import() calls excluded —
// the registry's chunk-splitting mechanism depends on them).
const STATIC_IMPORT = new RegExp(`from\\s+["'][^"']*(${OVERLAY_MODULES.join("|")})["']`);
// Showcase is the sole static-import exemption (deleted at launch per
// the launch checklist; production never ships it).
const SHOWCASE = `${sep}app${sep}components${sep}`;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.tsx?$/.test(name) && !full.includes(SHOWCASE) && !full.endsWith("searchRegistry.ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("search registry guard", () => {
  it("has no static overlay imports in production paths", () => {
    const offenders: string[] = [];
    for (const file of walk(join(ROOT, "components")).concat(walk(join(ROOT, "app")))) {
      const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
      if (STATIC_IMPORT.test(src)) offenders.push(file);
    }
    expect(offenders, `static overlay imports void code-splitting: ${offenders.join(", ")}`).toEqual([]);
  });

  it("registers every built variant (null only for unbuilt ids)", async () => {
    const { resolveSearchOverlay } = await import("@/components/shell/searchRegistry");
    for (const id of ["sheet", "editorial", "palette"] as const) {
      expect(resolveSearchOverlay(id), `${id} must resolve a loader`).not.toBeNull();
    }
    expect(resolveSearchOverlay("classic")).toBeNull();
  });
});
