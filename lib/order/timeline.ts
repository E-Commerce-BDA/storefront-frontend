/**
 * Order timeline resolver — sf-088. Pure. A single status string decides the
 * one active step; an unknown service status never claims a later stage.
 */
export type OrderStage = "placed" | "paid" | "packed" | "shipped" | "delivered";

export const ORDER_STAGES: readonly OrderStage[] = [
  "placed",
  "paid",
  "packed",
  "shipped",
  "delivered",
];

export interface ResolvedTimeline {
  stage: OrderStage;
  index: number;
  steps: readonly { key: OrderStage; state: "done" | "active" | "upcoming" }[];
}

function stageFor(status: string): OrderStage {
  const value = status.toLowerCase();
  if (value === "delivered" || value === "complete" || value === "completed") return "delivered";
  if (value === "shipped" || value === "in_transit") return "shipped";
  if (value === "packed" || value === "packing") return "packed";
  if (value === "paid" || value === "confirmed" || value === "processing") return "paid";
  return "placed";
}

export function resolveTimeline(status: string): ResolvedTimeline {
  const stage = stageFor(status);
  const index = ORDER_STAGES.indexOf(stage);
  return {
    stage,
    index,
    steps: ORDER_STAGES.map((key, step) => ({
      key,
      state: step < index ? "done" : step === index ? "active" : "upcoming",
    })),
  };
}
