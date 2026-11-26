import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

/** Shared (shop) not-found face — a real route back to the catalog. */
export default function NotFound() {
  return (
    <EmptyState
      title="We could not find that page"
      body="It may have moved, or the link may be out of date."
      action={
        <Button variant="primary" href="/products">
          Browse products
        </Button>
      }
    />
  );
}
