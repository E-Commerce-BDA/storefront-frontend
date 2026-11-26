import LoadingState from "@/components/ui/LoadingState";

/** Root loading fallback — the one loading face, no route chrome. */
export default function Loading() {
  return <LoadingState label="Loading…" />;
}
