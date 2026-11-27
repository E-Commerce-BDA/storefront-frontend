/**
 * Contract tier for the admin's versioned draft patch (sf-096 follow-up).
 *
 * A message is advisory input from another origin: anything outside the 2.2.0
 * shape is ignored, never merged. The tests mirror admin's
 * `lib/preview/model.ts` so the two sides cannot drift unnoticed.
 */
import { describe, expect, it } from "vitest";
import {
  parsePreviewDraftMessage,
  PREVIEW_MESSAGE_TYPE,
} from "@/lib/preview/draft";
import { STOREFRONT_CONFIG_VERSION_STRING } from "@/lib/config/version";

const valid = {
  type: PREVIEW_MESSAGE_TYPE,
  configVersion: STOREFRONT_CONFIG_VERSION_STRING,
  revision: 7,
  config: {
    theme: { palette: { brand: { brand: "#123456" } }, navbar: { height: 64 } },
    navigation: { shared: { links: { items: [{ label: "Shop", href: "/products" }] } } },
    footer: { wordmark: "foreafcbeta" },
  },
};

describe("parsePreviewDraftMessage", () => {
  it("accepts the exact 2.2.0 shape and keeps nested contract fields", () => {
    const parsed = parsePreviewDraftMessage(valid);
    expect(parsed).not.toBeNull();
    expect(parsed?.revision).toBe(7);
    expect(parsed?.config.theme?.palette?.brand?.brand).toBe("#123456");
    expect(parsed?.config.theme?.navbar?.height).toBe(64);
    expect(parsed?.config.navigation).toEqual(valid.config.navigation);
  });

  it("accepts an empty config as the explicit published-state patch", () => {
    const parsed = parsePreviewDraftMessage({ ...valid, config: {} });
    expect(parsed?.config).toEqual({});
  });

  it.each([
    ["a foreign message type", { ...valid, type: "not-the-preview-type" }],
    ["a draft from another shape version", { ...valid, configVersion: "2.1.0" }],
    ["a numeric configVersion", { ...valid, configVersion: 2 }],
    ["a negative revision", { ...valid, revision: -1 }],
    ["a fractional revision", { ...valid, revision: 1.5 }],
    ["a string revision", { ...valid, revision: "7" }],
    ["an extra envelope key", { ...valid, token: "secret" }],
    ["a missing config", { type: valid.type, configVersion: valid.configVersion, revision: 1 }],
    ["an extra config key", { ...valid, config: { ...valid.config, bad: {} } }],
    ["a string navigation document", { ...valid, config: { navigation: "shared" } }],
  ])("rejects %s", (_label, message) => {
    expect(parsePreviewDraftMessage(message)).toBeNull();
  });

  it.each([
    ["a raw CSS-var theme key", { theme: { "--sf-color-brand": "#fff" } }],
    ["an admin paint key", { theme: { navbar: { "--adm-color-bg": "#fff" } } }],
    ["raw CSS text", { theme: { palette: { type: { fontSans: "url(evil); color:red" } } } }],
    ["an admin var reference", { theme: { navbar: { bg: "var(--adm-color-surface)" } } }],
    ["a raw cssText field", { theme: { palette: { brand: { brand: "#fff" } } }, cssText: "--x:1" }],
    ["a nested CSS key in navigation", { navigation: { shared: { "--adm-color": "red" } } }],
  ])("rejects %s", (_label, config) => {
    expect(parsePreviewDraftMessage({ ...valid, config })).toBeNull();
  });

  it("ignores values that are not objects at all", () => {
    expect(parsePreviewDraftMessage(null)).toBeNull();
    expect(parsePreviewDraftMessage("draft")).toBeNull();
    expect(parsePreviewDraftMessage([])).toBeNull();
  });
});
