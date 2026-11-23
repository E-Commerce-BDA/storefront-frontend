# Classification reference

Four categories, judged against the **adjacent code**, never by keyword alone.

## DELETE — visible in the code

The comment restates what the signature, control flow, types or imports show.
Typical shapes:
- Section dividers: `// --- Variants ---`, `// 1. Initial ingestion`
- Test step labels: `// Payload 2 modifies qty to 5`
- Paraphrases: `// Check minPrice <= maxPrice`, `// Insert order fixture`
- Type labels: `// Admin order list with filtering, searching, and pagination`

A comment with "why" is DELETE only if its reason is visible too. An obvious
action is not enough. Example: "Clamp once (1–10): a 0-cap would swallow every
push, unbounded growth is a leak" above code that clamps to 1–10 is KEEP — the
numbers are visible, but the two rejected alternatives are not. Pass 2 cut this
comment and had to restore it; that was a doc error, not a review error.

## KEEP — not visible in the code

- **Rejected alternative**: "we chose X rather than Y because Z"
- **External constraint**: a service's contract, a browser API behaviour, a
  DB index that forces an order of operations
- **Non-local invariant**: a rule spanning files or a race condition the local
  code cannot prove
- **Reason-required constructs** (AGENTS.md §5): `??`/fallback outside a
  resolver, `!important`, `console.*`, emojis in UI

## POINTER — decision prose replaced by a reference

Long paragraphs explaining architecture move to
`Documentation/ARCHITECTURE_DECISIONS.md`; the source keeps one line:
`// ADR-testing: topic explicit so DLQ names fail loudly`

## NEVER TOUCH

`@deprecated`, lint/TS directives, `/// <reference>`, ADR pointers, generated
files (`next-env.d.ts`, `dist/`, `node_modules/`, `.next/`).

## Method

For each comment, read 5 lines before and 15 lines after, then ask two questions:

1. Is every factual claim recoverable from those lines alone?
2. Is there any reason, rejected alternative, external constraint or cross-file
   fact that those lines do NOT show?

DELETE only when (1) is yes AND (2) is no. A yes to (2) always wins, even when
the action itself is obvious — otherwise the comment is the only copy of a
decision.
