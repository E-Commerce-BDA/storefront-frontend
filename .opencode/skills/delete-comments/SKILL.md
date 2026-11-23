---
name: Delete Comments
description: Audit and remove comments whose content is already visible in the code, using a per-comment, per-code review. Use for comment-cleanup passes across the polyrepo.
---

# Delete Comments

Remove comments that restate what the code already shows, while keeping every
comment that records a decision the code cannot prove.

## Rules

1. **Never delete by keyword.** A comment containing "why", "because" or
   "deliberate" is not automatically keepable, and a short comment is not
   automatically deletable. Judge each comment against its code.
2. **The test:** could a reader who understands the language recover every
   claim in the comment from the signature, control flow, types or imports
   on the adjacent lines? If yes, delete it. If any claim is a rejected
   alternative, an external constraint, or a non-local invariant, keep it.
3. **Never delete** `@deprecated`, `eslint-disable`, `oxlint-disable`,
   `@ts-ignore`, `@ts-expect-error`, `prettier-ignore`, `/// <reference>`,
   or `// ADR-*:` pointers.
4. **Generated files are out of scope** (`next-env.d.ts`, `dist/`,
   `node_modules/`, `.next/`).
5. **Long decision prose** is moved to
   `Documentation/ARCHITECTURE_DECISIONS.md` and replaced by a one-line
   `// ADR-<heading>: <topic>` pointer, not deleted outright.
6. **Apply only after a review table is approved.** This skill never deletes
   during the audit step.

## Workflow

1. Read `references/classification.md`.
2. Run `python3 scripts/extract-comments.py <repo-path>` to emit a review
   table: file, line range, comment text, and the code before/after it.
3. For each row, write DECISION (`delete` / `keep` / `pointer`) and a one-line
   reason. Show the table to the user; do not edit source yet.
4. After approval, run `python3 scripts/apply-decisions.py <decisions.csv>`
   (bottom-to-top per file, whole-comment ranges only, newline-preserving).
5. Run the repo gates (`tsc`, tests) and record the tally in
   `state-for-agents/comment-audit-summary.md`.

## Output

A decisions CSV with columns `repo,file,start,end,decision,reason`, plus a
summary table in the conversation. Bulk deletes are one commit per repo.
