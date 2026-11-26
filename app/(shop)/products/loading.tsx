import PageHeader from "@/components/shell/PageHeader";
import LoadingState from "@/components/ui/LoadingState";

/**
 * `/products` loading UI (plan §8). The grid is a client island that fills once
 * the server resolves catalog, so a pending navigation shows the shell with an
 * honest "Loading" line rather than a blank region that reads as a broken page.
 */
export default function ProductsLoading() {
  return (
    <>
      <PageHeader title="Products" />
      <LoadingState label="Loading products…" />
    </>
  );
}
