"use client";

import { Button, ErrorState } from "@/components/ui";

/** Auth error boundary — no chrome; retry re-renders the form surface. */
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
      body="We could not load this form. Try again."
      action={
        <Button variant="primary" onClick={retry}>
          Try again
        </Button>
      }
    />
  );
}
