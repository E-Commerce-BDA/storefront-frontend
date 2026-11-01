"use client";

import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

/**
 * `/products` error boundary (plan §8). The page itself already turns catalog
 * failures into an EmptyState, so reaching here means an unexpected throw — the
 * boundary offers a `reset()` retry instead of a dead route.
 */
export default function ProductsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      title="Something went wrong"
      body="We couldn’t load the products. Try again."
      action={
        <Button variant="light" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
