---
name: Delete Comments
description: Audit and remove comments whose content is already visible in the code, using a per-comment, per-code review. Use for comment-cleanup passes across the polyrepo.
---

# Delete Comments

Remove comments that restate what the code already shows, while keeping every
comment that records a decision the code cannot prove.

## Rules

1. **Never delete by keyword or by length.** A comment containing "why",
   "because" or "deliberate" is not automatically keepable, and a short comment
   is not automatically deletable. An obvious action is not deletable when its
   reason is invisible. Judge each comment against its code.
2. **The test:** first ask whether every factual claim is recoverable from the
   signature, control flow, types or imports on the adjacent lines. Then ask
   whether any reason, rejected alternative, external constraint or non-local
   invariant is NOT recoverable there. Delete only when the first answer is yes
   and the second is no. Pass 2 had to restore 81 comments that failed the
   second question after a mechanical first pass cut them.
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
4. After approval, sweep the delete list a second time looking only for
   reason-invisible comments. Before applying, confirm every decision value is
   lowercase (`delete` / `keep`) — the apply script matches exactly and silently
   no-ops on uppercase. After applying, confirm `skipped 0` and a diff with zero
   added lines.
5. Run `python3 scripts/apply-decisions.py <decisions.csv>` (bottom-to-top per
   file, whole-comment ranges only, newline-preserving).
6. Run the repo gates (`tsc`, tests) and record the tally in
   `state-for-agents/comment-audit-summary.md`.

## Output

A decisions CSV with columns `repo,file,start,end,decision,reason`, plus a
summary table in the conversation. Bulk deletes are one commit per repo.
