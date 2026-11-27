"use client";

/**
 * Preview draft bridge — sf-096 follow-up.
 *
 * The admin iframe posts a versioned contract patch to this document. This
 * island is the only listener: it accepts a message solely from the exact
 * configured admin origin, validates the full shape in pure lib code, and
 * resolves accepted theme fields through the same --sf-* emitters a published
 * read uses. Vars are written to <html> (the published map lives on <body>), so
 * reverting simply removes the keys this bridge added.
 *
 * No token is passed here, no CSS text is parsed, and no UI state is created —
 * a ref tracks imperative style keys only.
 */
import { useEffect, useRef } from "react";
import { resolveAdminOrigin } from "@/lib/preview/origin";
import { parsePreviewDraftMessage } from "@/lib/preview/draft";
import { previewThemeVars } from "@/lib/preview/vars";
import type { ThemeVars } from "@/lib/theme/vars";

export interface PreviewDraftBridgeProps {
  /** Canonical origin resolved on the server, never a browser-supplied value. */
  adminOrigin: string;
  /** Published theme document; a sparse draft is merged over it before paint. */
  publishedTheme?: unknown;
}

export default function PreviewDraftBridge({ adminOrigin, publishedTheme }: PreviewDraftBridgeProps) {
  const applied = useRef<Set<string>>(new Set());
  const allowed = resolveAdminOrigin(adminOrigin);

  useEffect(() => {
    if (allowed === null) return;

    function revert() {
      for (const name of applied.current) {
        document.documentElement.style.removeProperty(name);
      }
      applied.current.clear();
    }

    function apply(vars: ThemeVars) {
      revert();
      for (const [name, value] of Object.entries(vars)) {
        document.documentElement.style.setProperty(name, String(value));
        applied.current.add(name);
      }
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== allowed) return;
      const draft = parsePreviewDraftMessage(event.data);
      if (draft === null) return;
      // Empty config (or a nav/footer-only patch) means "show published state".
      if (draft.config.theme === undefined) {
        revert();
        return;
      }
      apply(previewThemeVars(publishedTheme, draft.config.theme));
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      revert();
    };
  }, [allowed, publishedTheme]);

  return <span hidden aria-hidden="true" data-preview-draft-bridge={allowed ?? "invalid"} />;
}
