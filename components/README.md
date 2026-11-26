# Component docs (repo-local index)

Shared component rules live in `AGENTS.md` §3 and the cross-repo design docs.
This file indexes the dumb components owned here; each entry follows the
five-section shape of `Documentation/components/button.md`.

## CheckoutSteps (`shell/CheckoutSteps.tsx`) — sf-058

### 1. Look per state (normative)
- `active`: navy outline, bold label, navy filled index disc.
- `done`: success-filled index disc, muted label, no outline.
- `upcoming`: bordered, muted label and grey index disc.
- No timers, no motion, no clickable steps: the route owns which step is active.

### 2. Customizable fields
`className` (merged, never replaces) and `style` (merged after internal).
Step labels and order are resolved in `lib/checkout/steps.ts`, not in the component.

### 3. Where a value lives
`CHECKOUT_STEPS` owns labels; `resolveCheckoutSteps(activeIndex)` owns clamping
and the `done|active|upcoming` decision. The component has no defaults.

### 4. Global rules
`props → JSX`; no fetch/store/CMS import. State reaches CSS only through
`data-state`. A11y: `nav[aria-label="Checkout progress"]`, ordered list, and
`aria-current="step"` on the active row.

### 5. Tests
Contract (rendered order + `aria-current`), resolver-unit (defaults/clamps),
style-contract (paint through vars, no hex outside fallbacks, data-state hooks).

## State faces (`ui/LoadingState.tsx`, `ui/ErrorState.tsx`, `ui/DegradedState.tsx`) — sf-080

### 1. Look per state
- `loading`: solid spinner plus a status sentence; `role="status"`, `aria-busy`.
- `error`: error-coloured title, optional body and one primary action; `role="alert"`.
- `degraded`: compact neutral note plus optional action — the page is still usable.
- `data-size="compact|regular"` is the only size hook; no opacity anywhere.

### 2. Customizable fields
`title`/`label`, `body`, an `action` slot (the caller passes a real
`variant="primary"` `Button`), `size`, `options.size`, `className` (merged) and
`style` (merged after internal).

### 3. Where a value lives
`lib/ui/stateFaces.ts` owns the copy defaults, the size list and the resolver;
flat `size` beats `options.size`, absent clamps to the documented fallback
(`regular`, or `compact` for a degraded face). Components hold no defaults.

### 4. Global rules
`props → JSX`; no fetch/store/CMS import. The spinner is decorative
(`aria-hidden`) and its animation is killed under `prefers-reduced-motion`.
A11y roles are fixed, not customizable.

### 5. Tests
Contract (roles, optional slots, aria-hidden spinner), resolver-unit
(defaults, clamp, flat-over-object), style-contract (paint through `--state-*`,
no hex outside fallbacks, `data-size` hooks, reduced-motion guard).
