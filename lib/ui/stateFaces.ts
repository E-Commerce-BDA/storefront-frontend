/**
 * Shared state-face model — sf-080. Pure.
 *
 * Three honest faces (loading / error / degraded) for the moments a route
 * cannot show its real content. Copy defaults and the size decision live here
 * so the dumb components never invent a string or a `??` fallback of their
 * own. Flat props beat the options object; absent means inherit; invalid
 * values clamp to the documented default.
 */
export type StateFaceKind = "loading" | "error" | "degraded";
export type StateFaceSize = "compact" | "regular";

export interface StateFaceOptions {
  size?: StateFaceSize;
}

export interface ResolvedStateFace {
  size: StateFaceSize;
}

export const STATE_FACE_SIZES: readonly StateFaceSize[] = ["compact", "regular"];

export const DEFAULT_STATE_FACE_COPY: Readonly<Record<StateFaceKind, { title: string; body?: string }>> = {
  loading: { title: "Loading…" },
  error: { title: "Something went wrong", body: "Please try again shortly." },
  degraded: { title: "Some content is unavailable", body: "The rest of the page is still usable." },
};

/** Caller copy wins; an empty string is absent, not a blank heading. */
export function resolveStateFaceCopy(kind: StateFaceKind, override?: string): string {
  return override !== undefined && override.trim() !== ""
    ? override
    : DEFAULT_STATE_FACE_COPY[kind].title;
}

/**
 * Flat `size` wins over `options.size`; an unknown value clamps to `regular`.
 * Rejected alternative: letting the component do `size ?? options?.size ??
 * "regular"` — that distributes the default across every consumer.
 */
export function resolveStateFace(
  input: { size?: StateFaceSize; options?: StateFaceOptions } = {},
  fallback: StateFaceSize = "regular",
): ResolvedStateFace {
  const candidate = input.size ?? input.options?.size ?? fallback;
  return { size: STATE_FACE_SIZES.includes(candidate) ? candidate : fallback };
}
