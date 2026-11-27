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

## Shop chrome primitives (sf-087)

### 1. Look per state
- `SegmentedToggle`: one filled segment (`data-selected="true"`), others muted;
  `data-size="sm|md"` and `disabled` are the only shape hooks.
- `Menu`: panel parks 8px above its final position and slides down when
  `data-open="true"`; `hidden` keeps closed panels out of the a11y tree.
- `FilterDrawer`: scrim + 320px panel (clamped 240–480), `data-side=left|right`,
  sticky action footer; Escape/outside-click are the owner's job.
- `ShopToolbar`: sort, filter trigger with active count, grid switch, result
  status and Pill chips for active filters.
- `GridModeToggle`: two-column/one-column labels over SegmentedToggle.

### 2. Customizable fields
`className` (merged), `style` (merged after internal), all labels/options, and
an `options` object per component. Flat props always win over that object.

### 3. Where a value lives
`lib/shop/models.ts` owns the defaults, option caps (1–6), drawer width clamp
(240–480) and alignment. The stylesheet mirrors those numeric fallbacks in
`var()`; components hold no literals of their own.

### 4. Global rules
`props → JSX`; no fetch/store/CMS import; no `useState`. State reaches CSS only
through `data-*` attrs; paint through `--segmented-*`, `--menu-*`, `--drawer-*`
and `--toolbar-*` vars. Focus-visible ring is fixed, hover is gated off the
selected/disabled faces, and reduced-motion kills the menu/segment transitions.

### 5. Tests
Contract (roles, data hooks, controlled callbacks), resolver-unit (defaults,
clamps, flat-over-object), style-contract (var-only paint, no hex, data hooks,
reduced-motion guard) for all five components.

## ProductRailIsland (`commerce/ProductRailIsland.tsx`) — sf-091

### 1. Look per state
- `carousel`: the shared `PaginatedRail` paints one snap-scrolling cell per CMS
  card, with dots and looped prev/next; `grid` keeps the single grid island.
- The only state is the page index, held in `lib/sections/machine.ts`'s
  `railIndexMachine`; pointer coordinates stay a ref in the dumb rail.

### 2. Customizable fields
`cards`, `label`, `themeFallback` and `tones` arrive from the resolver; the
island adds no defaults of its own.

### 3. Where a value lives
`resolveSections` owns the `carousel|grid` decision from the CMS contract;
`railModel`/`railIndexMachine` own wrap and clamp; globals.css owns paint vars.

### 4. Global rules
Props → JSX below the island; no fetch/store/CMS import in the card painter.
Rejected: N `ProductGridIsland` instances per strip and a route-group island
import from a shared section block (both invert the depth gradient).

### 5. Tests
Resolver-unit (index clamp/wrap), contract (layout dispatch, dots, drag),
style-contract (var-only paint, `data-layout` hook, no hex/opacity).

## Composed shell/commerce artifacts (sf-088)

### 1. Look per state
- `PaginatedRail`: snap-scrolling track, dot row, prev/next; dragging left/right
  past 48px changes page. `data-loop` and `data-motion` carry the behavior.
- `MegaMenu`: CMS-authored groups in a 1–4 column grid with optional promo
  tile; `data-active` marks the hovered group from the route island.
- `OrderSummaryCard`: free-ship progress bar (`--summary-progress`), coupon
  line, shipping/tax/total; `data-free-ship` switches the bar face.
- `Timeline`: five order stages, each `data-state=done|active|upcoming`; the
  active row carries `aria-current="step"`.

### 2. Customizable fields
`className` (merged), `style` (merged after internal), labels/options, action
slots and an `options` object for the resolvers.

### 3. Where a value lives
`lib/sections/railModel.ts` owns page/index math, `lib/shell/megaMenuModel.ts`
owns 2.2.0 group/column caps, `lib/order/summaryModel.ts` owns money math and
`lib/order/timeline.ts` owns status→stage mapping. Components hold no defaults.

### 4. Global rules
`props → JSX`; no fetch/store/CMS service import. PaginatedRail is the only
client component because pointer coordinates are a ref, never rendered state.
MegaMenu is server-renderable from the CMS view model; the route island owns
its open/active interaction. All paint through `.sf-*` vars and data hooks;
reduced-motion kills rail transitions.

### 5. Tests
Contract (roles, links, data hooks, drag/callback parity), resolver-unit
(page wrap/clamp, group caps, progress clamp, status map), style-contract
(var-only paint, no hex, data hooks, reduced-motion guard).
