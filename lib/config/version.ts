/**
 * sf-077 — the aggregate config payload the admin app consumes.
 *
 * `configVersion` is the contract shape version (semver-like string); the
 * numeric alias is the old envelope's version and is deprecated for one
 * release. Rejected: reusing the number for the shape version — 2.2.0 needs a
 * string so prereleases are expressible on the wire.
 */
export const STOREFRONT_CONFIG_VERSION_STRING = "2.2.0";

/** @deprecated Use STOREFRONT_CONFIG_VERSION_STRING / the 2.2.0 envelope. */
export const STOREFRONT_CONFIG_VERSION = 1;
