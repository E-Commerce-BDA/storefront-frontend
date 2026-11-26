/**
 * One total status vocabulary for every island machine (sf-074).
 * The six states are exhaustive so no island can invent a seventh face or
 * leave a transitional state unnamed. `empty` is a settled result, not a
 * loading miss — that distinction is what stops cold-load bounce bugs.
 */
export type Status = "idle" | "loading" | "ready" | "empty" | "error" | "success";

export function statusForItems(length: number): Status {
  return length === 0 ? "empty" : "ready";
}

export function isSettled(status: Status): boolean {
  return status === "ready" || status === "empty" || status === "success" || status === "error";
}
