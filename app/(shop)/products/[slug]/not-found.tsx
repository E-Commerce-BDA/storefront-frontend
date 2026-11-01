import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

/**
 * `/products/[slug]` not-found (plan §8). `page.tsx` calls `notFound()` only for a
 * real 404 (an unknown slug), so this is the honest "that product does not exist"
 * face — with a way back to the listing rather than a dead end.
 */
export default function ProductNotFound() {
  return (
    <>
      <PageHeader title="Product not found" />
      <EmptyState
        title="We couldn't find that product."
        body="The link may be old, or the product was removed from the catalog."
        action={
          <Button variant="light" href="/products">
            Browse all products
          </Button>
        }
      />
    </>
  );
}
