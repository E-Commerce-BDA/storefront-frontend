"use client";

/**
 * Write-review affordance for a delivered order — sf-059 (A3.10).
 * A submission is *queued for moderation*, never shown as published here:
 * catalog-svc decides when a review becomes visible.
 */
import { useReducer } from "react";
import { Button, Input, Textarea, Toast } from "@/components/ui";
import { bff } from "@/lib/http/browser";
import { createdReviewSchema } from "@/lib/reviews/schemas";
import {
  canSubmitReview,
  initialReviewFormMachine,
  reviewFormMachine,
} from "@/lib/reviews/machine";
import { useNotice } from "./useNotice";

export interface ReviewFormProps {
  productId: string;
  productName: string;
}

export default function ReviewForm({ productId, productName }: ReviewFormProps) {
  const [review, dispatch] = useReducer(
    reviewFormMachine,
    undefined,
    initialReviewFormMachine,
  );
  const { open, rating, title, body, status, queued } = review;
  const busy = status === "loading";
  const { notice, notify, close } = useNotice();

  async function submit() {
    if (!canSubmitReview(review)) return;
    dispatch({ type: "submit/start" });
    const result = await bff<{ id: string }>("/api/reviews", {
      // I-18: explicit marker — the 201 body is {id,productId,status,createdAt}
      // but this form only needs the id, so the contract is checked at the BFF.
      schema: createdReviewSchema.pick({ id: true }),
      method: "POST",
      // catalog-svc strips undeclared keys, so orderId is not sent at all.
      // The required `body` is always present; limits match the service.
      body: {
        productId,
        rating,
        ...(title.trim() === "" ? {} : { title: title.trim().slice(0, 120) }),
        body: body.trim().slice(0, 2000),
      },
    });
    if (!result.ok) {
      dispatch({ type: "submit/error" });
      notify("Could not submit review", { message: result.message ?? "Try again later.", kind: "error" });
      return;
    }
    dispatch({ type: "submit/success" });
    notify("Review queued for moderation");
  }

  if (queued) {
    return (
      <p className="m-0 text-sm text-[var(--color-success)]" role="status">
        Thanks — your review of {productName} is awaiting moderation.
      </p>
    );
  }

  return (
    <>
      <Button variant="light" size="sm" onClick={() => dispatch({ type: "open/toggle" })}>
        {open ? "Cancel review" : `Write a review for ${productName}`}
      </Button>
      {open ? (
        <form
          className="mt-3 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-1 p-0 text-sm font-medium text-[var(--color-ink)]">Rating</legend>
            <div className="flex gap-1" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  aria-pressed={rating === star}
                  onClick={() => dispatch({ type: "rating/set", rating: star })}
                  className="rounded-[var(--radius-sm,6px)] px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  {star}
                </button>
              ))}
            </div>
          </fieldset>
          <Input label="Review title" value={title} onChange={(value) => dispatch({ type: "title/set", title: value })} maxLength={120} />
          <Textarea label="Your review" value={body} onChange={(value) => dispatch({ type: "body/set", body: value })} rows={3} maxLength={2000} />
          <div>
            <Button type="submit" size="sm" disabled={busy || rating === 0 || body.trim() === ""}>
              {busy ? "Submitting…" : "Submit review"}
            </Button>
          </div>
        </form>
      ) : null}
      <Toast open={notice.open} title={notice.title} message={notice.message} onClose={close} />
    </>
  );
}
