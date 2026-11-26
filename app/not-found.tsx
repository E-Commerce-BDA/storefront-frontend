import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

/** Unmatched routes — a real route back into the shop, never a blank page. */
export default function NotFound() {
  return (
    <EmptyState
      title="This page does not exist"
      body="The link may be out of date. The shop is still here."
      action={
        <Button variant="primary" href="/">
          Back to the shop
        </Button>
      }
    />
  );
}
