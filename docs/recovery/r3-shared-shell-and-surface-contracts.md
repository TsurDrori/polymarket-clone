# R3 Shared Shell And Surface Contracts

This document is the tracked mirror of the private `R3` recovery decision record. It defines the shared contracts that `R3-exec` implements across the Polymarket clone shell and top-level route families.

## Decision Summary

- Keep one static global shell in `app/layout.tsx`.
- Let each route family own its inner surface modules.
- Use navigation semantics only when route identity changes.
- Keep stable-route top-level filters client-local by default.
- Separate fetched working-set size from the initial visible slice.
- Replace the generic root loading/error assumptions with route-family contracts.
- Treat `/sports` as a permanent canonical redirect to `/sports/live`.

## Shared Contracts

These behaviors should stay shared across the app:

- global header, search entry point, auth chrome, and footer
- mobile bottom navigation
- navigation primitives for route-changing controls
- metadata baseline and canonical redirect policy
- route-neutral root error handling
- reusable continuation affordance such as `Show more markets`

## Route-Owned Contracts

These behaviors stay route-specific even after the shared-shell reset:

- homepage hero, breaking rail, and topic composition
- politics taxonomy and mixed-feed composition
- crypto family taxonomy and card mix
- sports live-row parsing versus futures and props card parsing

## State Ownership Rules

- Use URL navigation when the pathname changes, when the route family changes, or when state must be canonical on first load.
- Keep state client-local when the route should remain stable and parity depends on immediate in-place filtering.
- Do not present route links as `tablist` controls.

## Loading, Empty, And Error Rules

- The root shell should not imply every page is a generic event grid.
- Each top-level family should expose route-shaped loading behavior.
- Client-local filter changes should prefer local pending affordances over route-level skeleton flashes.
- Empty states should preserve route framing and provide a clear recovery action.

## Visible Slice Rules

- Fetch size and initial render size are separate concerns.
- Each collection surface should declare its own initial visible slice.
- Continuation behavior should be explicit and reusable, not accidental.

## Metadata And Redirect Rules

- Root metadata should use product-facing Polymarket copy, not scaffold language.
- Static routes should prefer static `metadata` exports.
- Dynamic routes should use `generateMetadata` only when params or fetched data materially affect the result.
- Fixed canonical redirects should use a real permanent redirect baseline.

## Rejected Alternatives

These were reviewed and rejected in `R3`, and should not be reopened without a new blocker:

- continuing to patch the older four-tab shell
- turning `CategoryPage` and `EventGrid` into the universal parity contract
- forcing all top-level filters into canonical URL state
- rendering route links with tab semantics
- equating fetched working set with first-paint volume
- keeping one generic root grid skeleton for every surface

## Acceptance Baseline

Any shared-shell implementation pass should verify:

- `pnpm build`
- `pnpm test` or targeted Vitest coverage for touched modules
- production-like runtime checks with `pnpm start`
- route smoke coverage for `/`, `/crypto`, `/sports`, `/sports/live`, `/sports/futures`, `/sports/nba/games`, `/sports/nba/props`, `/sports/futures/nba`, and a non-basketball league route
- browser-based parity screenshots across the agreed width matrix
- browser video proof for touched dynamic shell interactions
- HTTP-level redirect verification for `/sports`

## Non-Goals

This contract reset does not cover:

- realtime-derived ranking or hero-selection logic from `R4`
- flattening politics, crypto, and sports into one shared taxonomy model
- unifying sports live parsing with futures and props parsing
- declaring full sports parity while known route-specific follow-ups still exist
