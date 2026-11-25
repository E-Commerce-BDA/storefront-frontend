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
