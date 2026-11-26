"use client";

import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";

/**
 * `/products` error boundary (plan §8). The page itself already turns catalog
 * failures into an ErrorState, so reaching here means an unexpected throw — the
 * boundary offers a `reset()` retry instead of a dead route.
 */
export default function ProductsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Something went wrong"
      body="We couldn’t load the products. Try again."
      action={
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
