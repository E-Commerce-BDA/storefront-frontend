import LoadingState from "@/components/ui/LoadingState";

/** Auth loading face — no storefront chrome, matching the conversion surface. */
export default function Loading() {
  return <LoadingState label="Loading…" />;
}
