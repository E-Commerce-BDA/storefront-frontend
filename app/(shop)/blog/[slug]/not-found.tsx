import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

/** I-16: a real CMS 404 renders a recoverable not-found, not an error stack. */
export default function BlogPostNotFound() {
  return (
    <EmptyState
      title="This post could not be found"
      body="It may have been unpublished, or the address may be mistyped. The rest of the journal is still here."
      action={<Button variant="light" href="/blog">Back to the journal</Button>}
    />
  );
}
