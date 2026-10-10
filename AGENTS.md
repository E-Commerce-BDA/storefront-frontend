# AGENTS.md — storefront-ui (per-repo constitution)

> Every file proposed in this repo cites a line below for where it lives.
> If no line fits, the structure — not the code — gets amended here first.
> Status: Active | Version 1.0 | Date: 2026-09-27

---

## 1. Identity

Next.js 16.3 + React 19 + TypeScript (strict) + Tailwind v4. Polyrepo: this
repo owns UI + thin seams only. Shared types/events arrive versioned from
`@ecom/contracts` — never from sibling service code. Stack pins live in
`Documentation/2.Tech-Stack.md`; this file governs *how code goes where*.

## 2. Structure (the gradient: smart → pure → dumb)

```text
app/(shop)/, app/(auth)/                # routes own state, validation display,
                                        # ?next=, loading (conversion vs shop chrome)
app/api/<domain>/<action>/route.ts      # ONE action per handler:
                                        # validate → forward → cookies
lib/<domain>/*.ts                       # pure: types, DEFAULT_*, resolvers,
                                        # var emitters. No React, no fetch, no DB
components/ui/*.tsx                     # dumb: props → JSX only
components/<domain>/*.tsx               # composed dumb: domain-arranged
                                        # props → JSX (AuthPage/Split/Panel/Form);
                                        # still no fetch/store/state (see §3)
app/**/_components/*.tsx                # route-colocated client islands ("use client"):
                                        # stateful forms owned by their route only;
                                        # never imported across routes (share via
                                        # components/<domain>/ instead)
test/                                   # mirrors source (test/lib ↔ lib,
                                        # test/components ↔ components)
proxy.ts                                # repo root, edge-safe
                                        # (Next 16 name — never middleware.ts)
```

Importance lives close to the application; everything gets dumber with depth.
Route segments own orchestration, `lib` owns decisions, `components/ui`
owns pixels.

## 3. Dumb-component guide

(Consolidated from `button.md` §4, `tooltip.md` §4–5, `icons.md` §4 — those
docs defer to this section where wording differs.)

1. **`props → JSX`.** No fetch, no store, no CMS imports in `components/ui`
   — ever.
2. **Controlled-only; parent owns all state.** Exits require an allowlist
   entry here with a documented reason. Allowlist today: *(empty)*.
   Note: `Dialog`'s Escape/overlay handling is NOT an exit — `open` state
   and `onClose` stay parent-owned; Escape/overlay merely *call* the
   parent's callback.
3. **Flat props win over the options object**, object wins over resolver
   defaults; absent = inherit; reset deletes keys, never writes `null`.
   Numerics clamp to stated limits.
4. **Defaults live in exactly one place.** The resolver owns values; CSS
   fallbacks mirror them (and must match). `??` and fallbacks anywhere
   else — scattered component-level defaults, defensive `||` chains,
   duplicated literals — need a reason, stated in a comment at the site.
   Test: if removing your `??` changes nothing, it was bloat and it goes.
5. **State reaches CSS only through `data-*` attrs** — never class toggles
   for state.
6. **A11y is fixed, not customizable:** focus-visible ring, keyboard parity
   (`:focus-within` shows what `:hover` shows), `prefers-reduced-motion`
   kills motion, real `role`/label association (`aria-describedby`, never
   `aria-hidden` on live content).
7. **Every component ships five artifacts:** model section in `lib`, CSS
   block, component file, doc (5-section button shape), barrel export in
   `components/ui/index.ts`. Composed `components/<domain>/` blocks share
   their domain's `lib` entry (no model file per block) but keep their own
   tests; route islands in `app/**/_components/` ship with their route's
   tests only.
8. **Paint/state/motion → `.sf-*` CSS (themeable, testable); layout/
   positioning → Tailwind utilities (disposable, unthemed).** State
   selectors, pseudo-elements, keyframes, and var() fallbacks live in the
   stylesheet where the style-contract tests can read them; one-off flex,
   gap, and spacing stay inline utilities. Either end of the spectrum is
   legal — invented middle layers (e.g. per-component CSS Modules) are not.

## 4. Tests (trio mandatory — no merges without all three)

1. **Contract** — rendered output + data attrs + linkage.
2. **Resolver-unit** — defaults, clamps, flat-over-object precedence.
3. **Style-contract** — paint resolves only through vars; hardcoded values
   fail CI. Dead/disabled elements assert *no* motion; geometry assertions
   (e.g. wave-park) wherever shapes exist.

## 5. Construct rules (reason-required vs hard-banned)

We don't write bloated code and we don't write clever code — every construct
justifies its existence or it doesn't ship.

**Reason-required** (a *why* at the site; review challenges the why, not
the existence): `??`/fallbacks outside the resolver · `!important`
(hardest — comment + a non-`!important` follow-up plan) · `console.*`
(use the logger) · emojis in UI code.

**Hard-banned** (no legitimate use — bugs by definition, tests prove it):
hex literals in `components/` (bypasses theming) · `localStorage` anywhere
(tokens stay out of JS) · `opacity` disabled faces (destroys contrast —
explicit solids) · bare `:hover` on disabled selectors (`:hover` matches
disabled elements; every hover rule gates `:not([disabled])`).

## 6. Workflow

* **Docs-first for new patterns** — rule doc or amendment before code.
* **One commit per component**, doc row indexed same-commit
  (`components/README.md` + `0.Project-Overview.md` §14).
* **Merge gate:** `pnpm test` + `tsc --noEmit` + `next build --webpack`
  all green.
* **Agent bootstrap** — skill guidance lives in
  `E:/E-Commerce/state-for-agents/` (`SKILL-ROUTER.md` first, then the
  chained skills). That folder is the cross-repo memory; this file is the
  per-repo constitution. Update both together when behavior changes.

## 7. Learning Mode (always on)

Speed of *your* learning matters more than speed of task completion.
These rules are active every turn — bypass one task only by saying
`"skip learning mode for this"` explicitly.

1. **Never hand over code you can't explain back.** Before non-trivial
   code, the approach is stated in plain language first. Afterward, one
   short question confirms you understood the key part. No answer = explain
   before continuing.
2. **Explain before generating** unfamiliar territory: mental model + key
   decisions first, implementation after you confirm the shape (or after
   your own first attempt).
3. **Your first attempt stays yours.** If you're about to try it yourself,
   no preemptive solutions — help arrives after your attempt or your stuck.
4. **Why, not just how.** Every design decision states its reason plus one
   rejected alternative. Answers without reasons are incomplete.
5. **Senior-grade review of your code** — security, edge cases, performance,
   conventions — even beyond what you asked. Flag what matters unasked.
6. **Diagnose before solving.** Errors and stack traces: you read first
   (what do you think is going on?), fixes come after you try or say stuck.
