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

## Auth, blog and legal faces (sf-095)

### 1. Look per state
- Auth stays chromeless (`(auth)` owns no shop navbar/footer); the split, panel
  and meter come from the shared auth components.
- Blog list/detail and `/about`, `/privacy`, `/terms` render CMS documents only;
  an outage uses `DegradedState`, an absent page uses a styled 404.
- Root and group `not-found`/`error`/`loading` boundaries all use the shared
  state faces and a real link or retry callback.

### 2. Customizable fields
`nextPath`, copy, error style, token and panel settings arrive from the route;
the forms and meter hold no presentation defaults.

### 3. Where a value lives
`lib/auth/next.ts` owns the safe-resume guard (also used by the reset step),
`lib/auth/machine.ts` owns draft/request state, `lib/blog/present.ts` and
`lib/pages/richText.ts` own prose shaping.

### 4. Global rules
Private form state lives in route islands; composed auth blocks stay dumb.
Rejected: a new auth layout or a fallback article — both already violate the
one-source CMS rule.

### 5. Tests
Contract (meter bars/guidance, boundary links/retry, reset resume path),
resolver-unit (score, safe next), style-contract (token paint, no hex/opacity).

## Account & compare faces (sf-094)

### 1. Look per state
- `AccountTabs` is a controlled pill strip; panels stay in the DOM and are
  hidden natively, so `?tab=` deep links and page refresh keep the same face.
- `CompareView` toggles the pure differences-only face; `CompareTable` paints
  whichever rows the resolver returned. Tray and order rows remain shared.

### 2. Customizable fields
Active tab and a select callback arrive from the account island; comparison
items arrive from the route. Neither painter holds a default.

### 3. Where a value lives
`lib/account/machine.ts` owns tab parsing/events, `lib/commerce/compare.ts` owns
row mapping, difference filtering and the view machine. `OrderRow` and the
orders machine stay the single order-list vocabulary.

### 4. Global rules
URL is the source of truth for the tab; the island's reducer only translates a
press. Rejected: a checkbox in the server page or a `useState` tab mirror.

### 5. Tests
Resolver-unit (tab deep links, compare row filtering), contract (active tab,
checkbox reporting), style-contract (var paint, data faces, no hex/opacity).

## Money-page chrome (sf-093)

### 1. Look per state
- `OrderSummaryCard` owns the free-ship bar, coupon line and totals on both the
  cart and checkout; `PaymentPill` shows the one real provider plus informational
  brand marks; `QuickPromos` offers the three prototype coupon codes.
- Confirmation uses the shared `Timeline`; loading/error/degraded faces stay the
  shared state faces. No disabled face uses opacity.

### 2. Customizable fields
Money, coupon, actions and selected provider arrive from the islands. The new
painters have no defaults of their own.

### 3. Where a value lives
`lib/order/summaryModel.ts` owns totals and progress, `lib/checkout/payment.ts`
owns the provider vocabulary, `lib/cart/promos.ts` owns the quick-code labels.
Coupon validation, idempotency replay and 409 shortfall stay in `CheckoutForm`.

### 4. Global rules
Props → JSX below the islands; BFF failures keep `error.details` so the shortfall
banner can name the exact lines. Rejected: re-deriving totals inside a pill or
trusting a quick-promo code without the validation BFF.

### 5. Tests
Resolver-unit (providers, promos), contract (radio/pill reporting), style-contract
(var-only paint, data hooks, no opacity/hex).

## Listing shell & PDP tabs (sf-092)

### 1. Look per state
- `ShopToolbar` carries sort, chips and the mobile filter trigger; the drawer
  holds the same `FilterRail` the desktop aside shows.
- The column switch is mobile-only (hidden at ≥1024px) and is passed to the grid
  island as an explicit column count.
- `PdpTabs` shows four pills over panels that stay in the DOM (`hidden`), so
  CMS content remains crawlable and screen-reader visible.

### 2. Customizable fields
Resolved facets, selection, query key, theme/tone props and an optional result
count arrive from the route; the shell adds no defaults of its own.

### 3. Where a value lives
`lib/shop/machine.ts` owns drawer/grid modes, `lib/pdp/tabs.ts` owns grouping and
the active tab, `lib/catalog/listing.ts` owns canonical URL keys (reading the
prototype's `cat`/`sale` aliases but never emitting them).

### 4. Global rules
Filters and sort stay in the URL; only disclosure and column count are island
state — both use the existing pure machines, never `useState`. Rejected: two
sibling islands sharing the mode through a CSS override of inline grid vars.

### 5. Tests
Resolver-unit (mode parse, URL aliases, tab grouping), contract (toolbar/drawer/
chips/grid columns and tab panels), style-contract (var-only paint, mobile
breakpoint, native hidden panels).

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
