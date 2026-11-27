/**
 * Preview metadata for the 2.2.0 storefront config envelope.
 *
 * The token is minted by our own admin BFF, never by a browser call to cms-svc;
 * public reads carry it as `?preview=` or `x-preview-token` (lib/admin/guard.ts).
 */
export const PREVIEW_METADATA = {
  tokenUrl: "/api/admin/preview/token",
  queryParam: "preview",
  headerName: "x-preview-token",
} as const;
