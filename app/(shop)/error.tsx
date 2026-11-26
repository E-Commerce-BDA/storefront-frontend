"use client";

import { Button, ErrorState } from "@/components/ui";

/** Shared (shop) error boundary. Retry re-renders the segment, not the shell. */
export default function Error({
  error: _error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      title="Something went wrong"
      body="We could not load this page. Try again."
      action={
        <Button variant="primary" onClick={retry}>
          Try again
        </Button>
      }
    />
  );
}
