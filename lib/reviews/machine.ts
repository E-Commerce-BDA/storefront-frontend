/**
 * Review form machine — sf-086. Pure. A submission is queued for moderation,
 * never published locally: the reducer cannot claim a review is live.
 */
import type { Status } from "@/lib/machine/status";

export interface ReviewFormMachineState {
  open: boolean;
  rating: number;
  title: string;
  body: string;
  status: Status;
  queued: boolean;
}

export type ReviewFormMachineEvent =
  | { type: "open/toggle" }
  | { type: "rating/set"; rating: number }
  | { type: "title/set"; title: string }
  | { type: "body/set"; body: string }
  | { type: "submit/start" }
  | { type: "submit/success" }
  | { type: "submit/error" };

export function initialReviewFormMachine(): ReviewFormMachineState {
  return { open: false, rating: 0, title: "", body: "", status: "idle", queued: false };
}

export function canSubmitReview(state: ReviewFormMachineState): boolean {
  return state.status !== "loading" && state.rating > 0 && state.body.trim() !== "";
}

export function reviewFormMachine(
  state: ReviewFormMachineState,
  event: ReviewFormMachineEvent,
): ReviewFormMachineState {
  switch (event.type) {
    case "open/toggle":
      return { ...state, open: !state.open };
    case "rating/set":
      return { ...state, rating: Math.min(5, Math.max(0, Math.trunc(event.rating))) };
    case "title/set":
      return { ...state, title: event.title };
    case "body/set":
      return { ...state, body: event.body };
    case "submit/start":
      return canSubmitReview(state) ? { ...state, status: "loading" } : state;
    case "submit/success":
      return { ...state, status: "success", queued: true, open: false };
    case "submit/error":
      // The draft survives a refused write so the shopper can retry it.
      return { ...state, status: "error" };
  }
}
