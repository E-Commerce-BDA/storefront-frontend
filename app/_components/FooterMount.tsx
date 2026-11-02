"use client";

import Footer from "@/components/shell/Footer";
import type { Footer as FooterDocument } from "@ecom/contracts";

/**
 * Route island: mounts the global footer — sf-062
 *
 * The footer document itself is resolved by the root layout (server), so an
 * outage is decided before hydration and the minimal face is in the HTML.
 */
export default function FooterMount({ footer }: { footer: FooterDocument | null }) {
  return <Footer footer={footer} />;
}
