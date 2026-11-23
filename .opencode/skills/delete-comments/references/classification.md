# Classification reference

Four categories, judged against the **adjacent code**, never by keyword alone.

## DELETE — visible in the code

The comment restates what the signature, control flow, types or imports show.
Typical shapes:
- Section dividers: `// --- Variants ---`, `// 1. Initial ingestion`
- Test step labels: `// Payload 2 modifies qty to 5`
- Paraphrases: `// Check minPrice <= maxPrice`, `// Insert order fixture`
- Type labels: `// Admin order list with filtering, searching, and pagination`

A comment with "why" is still DELETE if every claim is visible. Example:
"Clamp once (1–10): a 0-cap would swallow every push, unbounded growth is a
leak" above code that literally clamps to 1–10 — the numbers are in the code;
the rationale is generic and already implied.

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

For each comment, read 5 lines before and 15 lines after. Ask: could a reader
who knows the language recover every claim from those lines alone? If yes →
DELETE. If any claim survives that test → KEEP or POINTER.
