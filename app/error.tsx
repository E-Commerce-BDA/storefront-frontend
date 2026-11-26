"use client";

import { Button, ErrorState } from "@/components/ui";

/** Root error boundary — Client Component by contract; `retry` re-renders the segment. */
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
      body="We could not render this page. Try again."
      action={
        <Button variant="primary" onClick={retry}>
          Try again
        </Button>
      }
    />
  );
}
