import PageHeader from "@/components/shell/PageHeader";
import LoadingState from "@/components/ui/LoadingState";

/** Shared (shop) loading boundary — the page shell, then the one loading face. */
export default function Loading() {
  return (
    <>
      <PageHeader title="Loading" />
      <LoadingState label="Loading this page…" />
    </>
  );
}
