# Private Build Plan — PLAEE Polymarket Clone

This is the active build-plan index for this branch.
Per-session handoffs live under `project-notes/sessions/`.

2026-04-19 note: rogue shell work landed in commit `a4044ef` across home/category/crypto/sports surfaces. Session `08R` completed the review gate and queued Session `08A` as the required realignment pass before more implementation continues.

## Session Workflow

For `review session X`:
1. Read this file.
2. Read only `project-notes/sessions/X.md`.
3. Check current repo state, current dependency versions, and current docs only for the APIs/libs touched by Session X.
4. Stress-test the session against current code, current libs, edge cases, and missing verification.

For `fix issues` after a session review:
1. Stay in the same session file by default.
2. Fix the reviewed gaps.
3. Update that session file's checkmarks if completion changed.
4. Commit if the session is complete.

For `implement session X`:
1. Read this file.
2. Read only `project-notes/sessions/X.md`.
3. Implement the session.
4. Before finishing, verify the session file checkmarks against the actual code/tests.
5. Commit at the end of the session.

## Current State

- Current milestone: `Session 08A`
- Shipped core sessions: `01` through `08`
- Out-of-sequence implementation reviewed: commit `a4044ef` advanced homepage/category/crypto/sports shell work ahead of plan, and the accepted follow-up is now a refactor session before realtime
- Carryover: `Session 05` still has one unchecked visual-QA item
- Next implementation session: `08A`
- Default retrieval rule: this file + one session file should be enough for most turns

## Session Index

### 01 — Project Setup And Design System Foundation
- Status: `complete`
- Tags: `bootstrap`, `globals.css`, `fonts`, `tokens`, `vitest`
- Depends on: `none`
- Touches: `app/layout.tsx`, `app/globals.css`, repo scaffold
- File: `project-notes/sessions/01.md`

### 02 — Data Layer, Parsing, And Formatters
- Status: `complete`
- Tags: `gamma`, `parsing`, `types`, `formatters`, `fixtures`
- Depends on: `01`
- Touches: `features/events/types.ts`, `features/events/api/*`, `shared/lib/{format,tags}.ts`
- File: `project-notes/sessions/02.md`

### 03 — Shared UI Primitives
- Status: `complete`
- Tags: `ui`, `button`, `tab`, `chip`, `skeleton`, `probability-bar`
- Depends on: `01`
- Touches: `shared/ui/*`
- File: `project-notes/sessions/03.md`

### 04 — Jotai State Layer And Hydrator
- Status: `complete`
- Tags: `jotai`, `atom-family`, `hydration`, `pricecell`, `flash-state`
- Depends on: `01`, `02`, `03`
- Touches: `features/realtime/{atoms,hooks,Hydrator}.ts*`, `features/events/components/PriceCell.tsx`
- File: `project-notes/sessions/04.md`

### 05 — Event Card Architecture
- Status: `complete-with-follow-up`
- Tags: `cards`, `events`, `binary`, `multi-outcome`, `micro`, `images`
- Depends on: `02`, `03`, `04`
- Touches: `features/events/components/*`, `public/placeholder.svg`, `next.config.ts`
- File: `project-notes/sessions/05.md`

### 06 — Homepage, Responsive Grid, And States
- Status: `complete-with-realignment`
- Tags: `homepage`, `grid`, `loading`, `error`, `empty-state`
- Depends on: `02`, `04`, `05`
- Touches: `app/page.tsx`, `app/loading.tsx`, `app/error.tsx`, `EventGrid`
- File: `project-notes/sessions/06.md`

### 07 — Header, Category Nav, And Routes
- Status: `complete-with-realignment`
- Tags: `header`, `navigation`, `categories`, `server-filtering`, `pathname`
- Depends on: `02`, `06`
- Touches: `features/categories/*`, `app/layout.tsx`, `app/{politics,sports,crypto}/*`
- File: `project-notes/sessions/07.md`

### 08 — Event Detail Page
- Status: `complete`
- Tags: `detail-page`, `market-rows`, `not-found`, `sports-labels`
- Depends on: `02`, `04`, `05`, `06`, `07`
- Touches: `app/event/[slug]/*`, `features/detail/components/*`, event card links
- File: `project-notes/sessions/08.md`

### 08R — Rogue Implementation Review And Realignment
- Status: `complete`
- Tags: `handoff`, `review`, `rogue-implementation`, `planning`, `brainstorming`, `refactor`, `polymarket-parity`
- Depends on: `05`, `06`, `07`, `08`
- Touches: `app/{page,layout,politics,sports,crypto}/*`, `features/{home,categories,crypto,sports}/*`, `features/events/components/EventGrid.tsx`, `shared/lib/tags.ts`, affected build-plan sections
- File: `project-notes/sessions/08R.md`

### 08A — Surface Realignment Before Realtime
- Status: `next`
- Tags: `refactor`, `home`, `shell`, `category-baseline`, `parity`, `event-grid`
- Depends on: `06`, `07`, `08R`
- Touches: `app/{page,layout,politics,crypto,sports}/*`, `features/{home,categories,crypto,sports}/*`, `features/events/components/EventGrid.tsx`
- File: `project-notes/sessions/08A.md`

### 09 — WebSocket Client, Dispatcher, And rAF Batcher
- Status: `blocked-on-08A`
- Tags: `websocket`, `clob`, `dispatcher`, `raf`, `batching`, `jotai-store`
- Depends on: `04`, `08`, `08A`
- Touches: `features/realtime/ws.ts`, `dispatcher.ts`, `rafBatcher.ts`, realtime tests
- File: `project-notes/sessions/09.md`

### 10 — WebSocket Subscriptions And Live UI
- Status: `pending`
- Tags: `subscriptions`, `live-prices`, `PriceCell`, `flash-animation`, `profiler`
- Depends on: `09`, `08`
- Touches: `features/realtime/subscriptions.ts`, `PriceCell`, live QA
- File: `project-notes/sessions/10.md`

### 11 — Crypto Custom Layout
- Status: `blocked-on-08A`
- Tags: `crypto`, `filters`, `list-rows`, `classification`
- Depends on: `05`, `08A`, `10`
- Touches: `features/crypto/*`, `app/crypto/*`
- File: `project-notes/sessions/11.md`

### 12 — Sports Custom Layout
- Status: `blocked-on-08A`
- Tags: `sports`, `league-filters`, `list-rows`, `games-vs-futures`
- Depends on: `05`, `08A`, `10`
- Touches: `features/sports/*`, `app/sports/*`
- File: `project-notes/sessions/12.md`

### 13 — Polish, Animations, Responsive, And A11y
- Status: `pending`
- Tags: `polish`, `hover`, `focus`, `mobile`, `responsive`, `a11y`
- Depends on: `05`, `06`, `07`, `08`, `10`, `11`, `12`
- Touches: cross-cutting CSS modules, `app/globals.css`, image config, QA
- File: `project-notes/sessions/13.md`

### 14 — Tests, Perf Proof, And Reliability QA
- Status: `pending`
- Tags: `tests`, `perf`, `profiler`, `lighthouse`, `reliability`, `artifacts`
- Depends on: `02`, `09`, `10`, `13`
- Touches: tests, docs artifacts, build verification
- File: `project-notes/sessions/14.md`

### 15 — README, Branding, And Final Diff
- Status: `pending`
- Tags: `readme`, `branding`, `favicon`, `metadata`, `submission`
- Depends on: `13`, `14`
- Touches: `README.md`, app icons, metadata, final QA
- File: `project-notes/sessions/15.md`

## Project Rules

- Build for recruiter-grade polish and engineering judgment, not just task completion.
- This is a Polymarket clone. Stay close to Polymarket visually unless the plan explicitly says otherwise.
- Read the relevant guide in `node_modules/next/dist/docs/` before making framework-sensitive Next.js changes.
- When reviewing or planning a session, check current docs for the APIs/libs touched by that session and compare them against installed versions.
- If a better approach exists than the session assumes, surface it, reject or adopt it explicitly, and make the plan airtight.
- Check edge cases and holes in the session before declaring it ready.
- Visual diff after every UI-touching session. Fidelity is the rubric's top priority.
- Do not add features outside scope. If something is nice-to-have, log it and skip it.
- Commit messages: `type(scope): subject` with one sentence explaining why. No AI trailer.

## Technical Spec

### Stack
- Next.js `16.2.4` + React `19.2.4` + strict TypeScript
- Jotai + `jotai-family`
- CSS Modules + CSS custom properties, no Tailwind
- `next/font/google` Inter Variable as `--font-inter`
- `lucide-react` for UI icons
- `next/image` for event and market imagery
- Native `WebSocket` to `wss://ws-subscriptions-clob.polymarket.com/ws/market`
- Vitest for unit tests
- pnpm

### Chosen Architecture
- Use RSC for REST fetches with `fetch(..., { next: { revalidate } })`, not client data libraries.
- Use per-route `<Hydrator>` to seed Jotai atoms from REST before live WS updates.
- Use one atom per price and one flash atom per token. `<PriceCell>` reads only its own atoms.
- Use one WS connection per tab with ref-counted subscriptions and rAF-batched writes.
- Normalize WS string prices to numbers in the dispatcher.
- Use hand-written parsing at the Gamma boundary. No zod.
- Category state comes from the route segment, not a client atom.
- Use route-local `error.tsx` and `not-found.tsx`, not generic fallback UI.

### Folder Shape
- `app/` for routes and route states
- `features/events/` for Gamma types, parsers, cards, grid, and `PriceCell`
- `features/realtime/` for atoms, hydrator, ws client, dispatcher, batcher, subscriptions
- `features/categories/` for header/nav/category helpers
- `features/detail/` for event detail UI
- `features/crypto/` and `features/sports/` for bonus custom layouts
- `shared/ui/` for reusable primitives
- `shared/lib/` for formatting and shared helpers

### Styling And Interaction Rules
- Tokens come from `var(--*)` only. If a token is missing, add it to `app/globals.css` first.
- Every component owns its own `*.module.css`.
- No utility-class soup.
- No inline styles except genuinely dynamic values like probability widths.
- `font-variant-numeric: tabular-nums` is global on `body`.
- Never pass live prices as props. Prices flow through atoms only.

### Card And Flash Contracts
- `<CardShell>` owns chrome. `BinaryBody`, `MultiOutcomeBody`, and `MicroEventBody` plug into it.
- `<EventCard>` dispatches by event shape.
- Flash state uses `{ seq, dir }`. Remounting keyed spans restarts the animation cleanly.

### Shipping Scope
- All 6 core deliverables
- Flash animation
- Crypto custom layout
- Sports custom layout
- README with architecture diagram, profiler screenshot, and GIF

### Not Shipping
- No trade panel or order entry
- No detail-page chart
- No comments / rules / holders tabs
- No order book depth
- No light theme toggle

### PLAEE Touches
- Favicon: purple `P`
- Title: `Polymarket Clone — PLAEE Assignment`
- One-line README signature

## Reference Docs

- API-backed implementation notes: `project-notes/polymarket-api-findings.md`
- Parallel guide: `project-notes/PARALLEL_EXECUTION_GUIDE.md`
- Pre-refactor snapshot: `.claude/archive/pre-refactor-v1.md`
