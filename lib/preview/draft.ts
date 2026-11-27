/**
 * Versioned admin draft patch — sf-096 follow-up. Pure validator.
 *
 * The iframe receives `{ type, configVersion, revision, config }` from the
 * admin BFF surface. Only the 2.2.0 shape is understood here: theme is parsed
 * by the contracts theme schema (strict nested fields, no CSS-var keys), and
 * navigation/footer are bounded nested documents with the same no-raw-CSS
 * guard. A patch from another version is ignored rather than guessed at.
 *
 * Rejected: accepting arbitrary `theme` records or `var(--adm-*)` values. That
 * would let a message write the admin's paint namespace into the storefront.
 */

import { themeSettingsSchema, type ThemeSettings } from "@ecom/contracts";
import { STOREFRONT_CONFIG_VERSION_STRING } from "@/lib/config/version";

export const PREVIEW_MESSAGE_TYPE = "ecom:storefront-preview-draft@1";
export const PREVIEW_DRAFT_KEYS = ["theme", "navigation", "footer"] as const;
export const PREVIEW_CONFIG_KEYS = ["type", "configVersion", "revision", "config"] as const;

const RAW_CSS = /--adm-|--sf-|var\s*\(|url\s*\(|expression\s*\(|^\s*--[a-z0-9-]+\s*:/i;
const BANNED_KEYS = new Set([
  "css",
  "csstext",
  "stylesheet",
  "style",
  "innerhtml",
  "dangerouslysetinnerhtml",
]);
const MAX_DEPTH = 12;
const MAX_ITEMS = 500;

export interface PreviewDraftMessage {
  type: typeof PREVIEW_MESSAGE_TYPE;
  configVersion: typeof STOREFRONT_CONFIG_VERSION_STRING;
  revision: number;
  config: {
    theme?: ThemeSettings;
    navigation?: Record<string, unknown> | unknown[];
    footer?: Record<string, unknown> | unknown[];
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Rejects CSS-var keys, admin namespaces and CSS function/declaration text. */
function isSafeNested(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false;
  if (value === null || typeof value === "boolean" || typeof value === "number") return true;
  if (typeof value === "string") return !RAW_CSS.test(value);
  if (Array.isArray(value)) {
    return value.length <= MAX_ITEMS && value.every((item) => isSafeNested(item, depth + 1));
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    return (
      entries.length <= MAX_ITEMS &&
      entries.every(
        ([key, child]) =>
          key !== "" &&
          !key.startsWith("--") &&
          !BANNED_KEYS.has(key.toLowerCase()) &&
          isSafeNested(child, depth + 1),
      )
    );
  }
  return false;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

/**
 * Returns null for every malformed or foreign-shape message. Callers ignore it
 * silently: a preview patch is advisory and must never throw into a shopper.
 */
export function parsePreviewDraftMessage(value: unknown): PreviewDraftMessage | null {
  if (!isRecord(value)) return null;
  if (!hasOnlyKeys(value, PREVIEW_CONFIG_KEYS)) return null;
  if (value.type !== PREVIEW_MESSAGE_TYPE) return null;
  if (value.configVersion !== STOREFRONT_CONFIG_VERSION_STRING) return null;
  if (typeof value.revision !== "number" || !Number.isInteger(value.revision) || value.revision < 0) {
    return null;
  }
  if (!isRecord(value.config) || !hasOnlyKeys(value.config, PREVIEW_DRAFT_KEYS)) return null;
  if (!isSafeNested(value.config)) return null;

  const config: PreviewDraftMessage["config"] = {};
  if (value.config.theme !== undefined) {
    const theme = themeSettingsSchema.safeParse(value.config.theme);
    if (!theme.success) return null;
    config.theme = theme.data;
  }
  for (const key of ["navigation", "footer"] as const) {
    const document = value.config[key];
    if (document !== undefined) {
      if (!isRecord(document) && !Array.isArray(document)) return null;
      config[key] = document as Record<string, unknown> | unknown[];
    }
  }
  // An empty `config` is the explicit "show published state" patch; the bridge
  // reads it as a revert instead of ignoring the message.
  return {
    type: PREVIEW_MESSAGE_TYPE,
    configVersion: STOREFRONT_CONFIG_VERSION_STRING,
    revision: value.revision,
    config,
  };
}
