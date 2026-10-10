"use client";

/**
 * Source-injected inspect preview — lazy product detail for the hovered /
 * keyboard-selected row. Null id renders nothing (no preview without a
 * target); stale hovers abort (sweeps must never resolve out of order).
 * Skeleton status drives the panel's loading state.
 */
import { useEffect, useRef, useState } from "react";
import type { ProductDetail, ProductDetailSource } from "@/lib/search/pdp";

export type PreviewStatus = "idle" | "loading" | "done" | "error";

export interface UseInspectPreview {
  detail: ProductDetail | null;
  status: PreviewStatus;
}

export function useInspectPreview(
  source: ProductDetailSource,
  productId: string | null,
): UseInspectPreview {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const seq = useRef(0);

  useEffect(() => {
    if (productId === null) {
      setDetail(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const id = ++seq.current;
    const controller = new AbortController();
    source
      .fetchProduct(productId, controller.signal)
      .then((row) => {
        // Stale hovers never overwrite: only the latest inspect lands.
        if (seq.current === id) {
          setDetail(row);
          setStatus("done");
        }
      })
      .catch((err: unknown) => {
        if (seq.current === id && !(err instanceof Error && err.message === "aborted")) {
          setDetail(null);
          setStatus("error");
        }
      });
    return () => {
      controller.abort();
    };
  }, [productId, source]);

  return { detail, status };
}
