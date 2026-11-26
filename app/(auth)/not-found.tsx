import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

/** Auth not-found face — send the visitor to the sign-in form. */
export default function NotFound() {
  return (
    <EmptyState
      title="This page does not exist"
      body="The sign-in page is still here."
      action={
        <Button variant="primary" href="/signin">
          Go to sign in
        </Button>
      }
    />
  );
}
