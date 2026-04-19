# Build Plan — PLAEE Polymarket Clone

Committed technical spec + 15-session TODO list. Every "if time" path from the spec is collapsed into a single chosen path. No alternatives, no optional tiers below — just build.

API-backed implementation notes live in [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:1). Whenever touching Gamma or WebSocket code, prefer that document over memory.

Interviewer clarification on 2026-04-19 supersedes the older “grid-only homepage” assumption from the first spec pass: homepage hero chrome, breaking-news movers, hot-topics treatment, richer header/footer, and stronger crypto/sports category surfaces are now explicitly in scope. The live Polymarket site also drifted since the earlier reconnaissance: `/crypto` is now closer to a filtered card hub with pill rows than the older expandable-table concept. This plan reflects the newer target.

- Op 1: Sessions 13, 14, 15
- Op 2: wait

## 2. Committed Technical Spec

### Stack
- **Framework:** Next.js 16.2.4 (App Router, Turbopack dev default) + React 19.2.4 + TypeScript strict. **Not adopting Cache Components** (the opt-in `cacheComponents` flag introduced in v16): its per-component `'use cache'` semantics are designed for apps with many data sources and mixed static/dynamic trees. This app has two Gamma endpoints with fixed TTLs, where classic `fetch({ next: { revalidate } })` is strictly simpler, stable, and equally correct. Named as an explicit scope decision in the README so reviewers see the trade-off was considered, not skipped.
- **State:** Jotai + `jotai-family` (`atomFamily` from `jotai-family`, `useHydrateAtoms`)
- **Styling:** CSS Modules + CSS custom properties (no Tailwind). `clsx` for conditional class composition. Global tokens, keyframes, resets, and `@media` breakpoints live in `app/globals.css`; per-component styles live in colocated `*.module.css` files
- **Font:** `next/font/google` Inter Variable → `--font-inter`
- **Icons:** `lucide-react` for UI; `next/image` for event/market images
- **Realtime:** Native `WebSocket` to `wss://ws-subscriptions-clob.polymarket.com/ws/market` — no simulator, no fallback
- **Testing:** Vitest for unit (parser, formatters, WS dispatcher)
- **Package manager:** pnpm

### Architecture
- **RSC** does all REST fetches with `fetch(url, { next: { revalidate: 30 } })` (home + categories) / `{ revalidate: 10 }` (detail). Homepage stays at `limit: 30`; category caps are tuned to stay below Next 16's ~2MB data-cache ceiling while still leaving enough variety for the richer surfaces (`politics: 20`, `crypto: 32`, `sports: 14`). No client-side data library (no TanStack Query, no SWR). See [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:103) and [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:339).
- **Server → Client hydration:** per-route `<Hydrator events={events}>` client component uses `useHydrateAtoms` to seed `priceAtomFamily(tokenId)` from `lastTradePrice` on first paint. Jotai `<Provider>` lives in `app/layout.tsx` so `<Hydrator>` and every `<PriceCell>` share the same store — without this the hydration silently no-ops and prices render as `0` until the first WS tick.
- **Client state:** one atom per price (`priceAtomFamily(tokenId)`), one flash-seq atom per price (`flashAtomFamily(tokenId)` holds an incrementing number). `<PriceCell>` reads only its own atoms, `React.memo` wrapped. Atoms are explicitly removed from the family on unmount to prevent cache leaks across SPA navigations.
- **WebSocket:** single connection per tab. Ref-counted `subscribe(tokenIds)` called from each `<PriceCell>` `useEffect`. No viewport gating — homepage cap + rAF batching already bound the load; IntersectionObserver adds complexity and flicker risk without a measurable win at this scale. Heartbeat `"PING"` every 10s. Exponential backoff 1→2→4→8s, resubscribe on reopen. See [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:183), [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:205), and [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:354).
- **Price-write batching:** rAF-batched last-write-wins `Map<tokenId, Tick>`, flushed each frame. Normalize string→number from WS. This is what caps render pressure regardless of WS volume.
- **Parsing:** hand-written `parseEvent()` with `JSON.parse` on `outcomes`/`outcomePrices`/`clobTokenIds`, `Number()` on market `volume`/`liquidity`. Narrow `isValidEvent()` type guard at boundary. No zod. See [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:124) and [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:150).
- **Category routes:** source of truth = route segment via `usePathname`. Homepage stays on the broad `GET /events` feed; `/politics`, `/sports`, and `/crypto` each fetch their own server-side Gamma slice with `tag_slug`, so category state stays shareable and `/sports` does not collapse to a nearly empty client-filtered grid. No `categoryAtom`.
- **Error states:** every route segment has `error.tsx` with a "Try again" button wired to `unstable_retry()` — not just a static message. Missing detail slugs are a separate case: map Gamma 404s to `notFound()` and render a segment-local `not-found.tsx` instead of the generic error boundary.

### Folder layout
```
app/
  layout.tsx, page.tsx, loading.tsx, error.tsx
  globals.css                                    # tokens, keyframes, resets, breakpoints, body/html
  politics/, sports/, crypto/                    # core category routes
  event/[slug]/page.tsx, loading.tsx, error.tsx
features/
  home/             # homepage selectors + hero/breaking/topics/explore chrome
  events/           # types, api (gamma, parse), components (CardShell, BinaryBody, MultiOutcomeBody, MicroEventBody, EventCard, EventGrid, CardSkeleton, PriceCell) — each component file paired with a sibling *.module.css
  realtime/         # atoms, hooks, ws client, dispatcher, rafBatcher, subscriptions, Hydrator
  categories/       # Header, CategoryNav, footer, category shell helpers — components paired with *.module.css
  detail/           # EventHeader, MarketRow, MarketList, ProbabilityBar — components paired with *.module.css
  crypto/           # filter helpers + CryptoExplorer (pill rows + chip filters over card grid)
  sports/           # parser + SportsHub (live league groups + futures grid)
shared/
  ui/               # Button, Chip, Skeleton, Tab, ProbabilityBar — components paired with *.module.css
  lib/              # format.ts, tags.ts, cn.ts (clsx wrapper)
```

Convention: every component that owns visuals owns its own `Foo.module.css` next to `Foo.tsx`. Class names use camelCase; reference via `styles.card`. Cross-file shared visuals are rare — if needed, promote to `globals.css` under a semantic class.

### Design tokens & global styles (CSS vars only)
All in `app/globals.css`. Tokens live on `:root` (and a `[data-theme="dark"]` selector for future light-theme work, identical values for now):
```css
:root, [data-theme="dark"] {
  --bg-page: #15191D; --bg-surface: #1E2428; --bg-surface-alt: #242B32;
  --border: #2E3841;
  --text-primary: #FFFFFF; --text-secondary: #DEE3E7;
  --text-muted: #7B8996; --text-subtle: #586879;
  --accent-yes: #3DB468; --accent-no: #CB3131;

  --radius-card: 15px;
  --font-sans: var(--font-inter), system-ui, sans-serif;

  /* breakpoints exist as documentation only — @media queries use the values directly */
  --bp-sm: 600px; --bp-md: 1024px; --bp-lg: 1200px;
}

html, body { background: var(--bg-page); color: var(--text-primary); font-family: var(--font-sans); font-variant-numeric: tabular-nums; }
```

Per-component CSS Module files reference these via `var(--bg-surface)` etc. Responsive layout uses `@media (min-width: 600px) { ... }` etc. directly — no Tailwind-style screen names.

`shared/lib/cn.ts` wraps `clsx`. Use as `cn(styles.card, isActive && styles.active, className)` to merge module classes with the consumer-passed `className` prop.

### Card architecture
`<CardShell>` owns chrome (317×180, `15px` radius, `1px` border, volume footer). Three bodies (`BinaryBody`, `MultiOutcomeBody`, `MicroEventBody`) plug into the shell. Single `<EventCard>` dispatches by `event.markets.length` / `showAllOutcomes`.

### Flash animation
`flashAtomFamily(tokenId)` holds `{ seq, dir }`. On every WS write: `setFlash(prev => ({ seq: prev.seq + 1, dir }))`. `<PriceCell>` renders `<span key={seq} className={cn(styles.price, dir === 'up' && styles.flashUp, dir === 'down' && styles.flashDown)}>`. The `key` change remounts the span → restarts the keyframe → no timeout race, no dropped flashes on rapid ticks. Keyframes (`flash-up`, `flash-down`) live in `globals.css`: 600ms ease-out, `background 0.4 → 0 + subtle ↑/↓ translateY`. The `PriceCell.module.css` `.flashUp`/`.flashDown` classes apply `animation: flash-up 600ms ease-out;` etc.

### Scope — shipping
- All 6 core deliverables
- Homepage hero / featured strip
- Breaking-news movers strip + hot-topics rail
- Richer header + Polymarket-style footer chrome
- Flash animation (bonus rubric line)
- Crypto filtered hub with time-bucket, market-type, and asset chips
- Sports hub with live league groups + futures fallback grid
- README with architecture diagram + Profiler screenshot + GIF

### Scope — not shipping (logged in README limitations)
- No trade panel / order entry
- No chart on detail page
- No comments / rules / market context / top holders tabs
- No email signup capture, live social embed, or bottom mobile tab bar
- No order book depth
- No light theme toggle
- No deep crypto / sports sub-routes beyond the top-level hubs in this pass

### Git hygiene
Conventional Commits. ~25 small commits across the 15 sessions. No AI co-author trailer. Each commit body: one sentence of *why*.

### PLAEE touches
Favicon (purple P), `<title>` = `"Polymarket Clone — PLAEE Assignment"`, one-line README signature.

---

## 3. 15-Session TODO List

Each session is ~1.5-2h. Total budget: ~22-28h. Commit at the end of every session. Run visual diff vs `polymarket.com` at 1280×800 after every session that touches UI.

---

### Session 1 — Project setup & design system foundation

**Goal:** Bootstrapped repo with tokens, fonts, breakpoints, empty folder scaffold.

- [x] `pnpm create next-app@latest . --ts --no-tailwind --app --eslint --src-dir=false --import-alias "@/*"` — explicitly skip Tailwind
- [x] `pnpm add jotai jotai-family clsx lucide-react`
- [x] `pnpm add -D vitest @vitest/ui @testing-library/react jsdom @types/node`
- [x] Confirm Next.js 16.2.4 CSS Modules support is on by default (no config needed; `*.module.css` next to a component just works)
- [x] Configure `next/font/google` Inter Variable → expose as `--font-inter` on `<html>`
- [x] `app/globals.css`:
  - [x] Tokens under `:root, [data-theme="dark"]` per §1 Design tokens block (colors, `--radius-card`, `--font-sans`)
  - [x] CSS reset: `*, *::before, *::after { box-sizing: border-box; }`, `body { margin: 0; }`, `button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }`, `a { color: inherit; text-decoration: none; }`
  - [x] Globals: `html, body { background: var(--bg-page); color: var(--text-primary); font-family: var(--font-sans); font-variant-numeric: tabular-nums; }`
  - [x] Flash keyframes: `@keyframes flash-up`, `@keyframes flash-down` (600ms, bg `rgba(61,180,104,0.4) → 0` for up / `rgba(203,49,49,0.4) → 0` for down, translateY `-1px → 0`)
  - [x] `@font-face` not needed — `next/font` injects it
- [x] Folder scaffold: create empty `features/{events,realtime,categories,detail,crypto,sports}/`, `shared/{ui,lib}/`
- [x] `app/layout.tsx`: Jotai `Provider` at the root (shared store identity for `<Hydrator>` + `<PriceCell>`), `<html lang="en" data-theme="dark" className={inter.variable}>`, `import './globals.css'`, metadata with title + description
- [x] `shared/lib/cn.ts`: `export const cn = (...args: ClassValue[]) => clsx(args)` (one-liner; used everywhere to merge module classes)
- [x] Favicon placeholder (keep default Next favicon for now; replace in Session 15)
- [x] Vitest config (`vitest.config.ts`): jsdom env, path alias matching `tsconfig.json`, `css: { modules: { classNameStrategy: 'non-scoped' } }` so component tests can match class names if ever needed
- [x] `.gitignore` check, `README.md` stub (single line)
- [x] **Commit:** `chore: scaffold next app with css module tokens, fonts, and folder structure`

---

### Session 2 — Data layer, parsing, and formatters

**Goal:** Typed Gamma fetch layer and parsing helpers are in place, verified against fixtures, and ready for UI work.

Reference before implementation: [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:103)

- [x] `features/events/types.ts` — define parsed app-facing types for `PolymarketEvent`, `PolymarketMarket`, and `PolymarketTag`:
  - [x] Market parsed arrays: `outcomes: string[]`, `outcomePrices: number[]`, `clobTokenIds: string[]`
  - [x] Market normalized numerics (from REST strings): `volumeNum: number`, `liquidityNum: number`
  - [x] Market pass-through numerics (already numeric in REST): `lastTradePrice`, `bestBid`, `bestAsk`, `volume24hr`, `oneDayPriceChange`, `spread`. These arrive as strings over WS — coercion there happens in Session 9's dispatcher, not here.
- [x] `features/events/api/parse.ts`:
  - [x] `parseEvent(raw)` — `JSON.parse` on `outcomes` / `outcomePrices` / `clobTokenIds`, then `.map(Number)` on `outcomePrices` so the app-facing type is `number[]`; `Number()` on market `volume` / `liquidity`
  - [x] `isValidEvent(raw)` narrow type guard — rejects when `slug`, `title`, or `markets` are missing/empty, or any market lacks `clobTokenIds` / `outcomePrices` / `outcomes` / `question`
  - [x] image fallback helper: `event.image -> event.icon -> first market image/icon -> null`
- [x] `features/events/api/gamma.ts`:
  - [x] `const GAMMA_BASE = 'https://gamma-api.polymarket.com'` at the top of the file
  - [x] `listEvents({ limit, offset, order, ascending })` against `GET /events` — hardcode `next: { revalidate: 30 }` in the `fetch` call; callers don't pass fetch options
  - [x] `getEventBySlug(slug)` against `GET /events/slug/{slug}` — hardcode `next: { revalidate: 10 }` in the `fetch` call
  - [x] centralize fetch error handling so route-level `error.tsx` can own the recovery UI later
- [x] `shared/lib/format.ts` — specific shapes:
  - [x] `formatPct(0.1715) → "17%"` (integer percent, rounded)
  - [x] `formatCents(0.172) → "17.2¢"` (one decimal)
  - [x] `formatVolume(13_653_342) → "$13M"` (K/M/B abbreviated with `$`)
  - [x] `formatFullUSD(13_653_342) → "$13,653,342"` (comma-grouped, no decimals)
  - [x] `formatEndDate('2026-07-20T00:00:00Z') → "Jul 20, 2026"`
- [x] `shared/lib/tags.ts` — exports `getVisibleTags(event)` (filters out tags where `forceHide === true` or slug is `hide-from-new`) and `hasTagSlug(event, slug)` (used for `politics` / `sports` / `crypto` category checks)
- [x] Tests:
  - [x] `features/events/api/parse.test.ts` — loads `fixtures/gamma-event-sample.json` and asserts against `fixture.events[0]` (fixture is a hand-assembled `{ events: [...] }` harness; live `listEvents` returns a bare array)
  - [x] `shared/lib/format.test.ts` for `0`, typical, and edge values
- [x] **Commit:** `feat(data): add gamma fetchers, parsers, and shared formatters`

### Session 3 — Shared UI primitives

**Goal:** Reusable buttons, chips, skeletons, tabs, probability bars — all with hover/focus/active states.

Each component below is a `Foo.tsx` + `Foo.module.css` pair. CSS uses `var(--*)` tokens; variants use `data-variant="yes"` / `data-size="sm"` selectors so the JSX stays clean (one `className`, no class-list bloat). All components accept `className` passthrough merged via `cn()`. `Button` and `Tab` use `forwardRef` (both may be focused programmatically or wrapped by `next/link`); `Chip`, `ProbabilityBar`, and `Skeleton` don't need refs.

- [x] `shared/ui/Button.tsx` (+ `.module.css`) — variants: `yes` (green bg), `no` (red bg); sizes: `sm`, `md`. Ship only the variants with callers in this plan; add `ghost`/`pill` later if needed. Default `type="button"` to avoid accidental form submits. CSS:
  - base: `color: var(--text-primary)` (white on both accent bgs), `font-weight: 600`, `border-radius: 8px`, `padding: 8px 12px` (md) / `6px 10px` (sm via `[data-size="sm"]`)
  - `[data-variant="yes"] { background: var(--accent-yes); }`, `[data-variant="no"] { background: var(--accent-no); }`
  - `:hover { filter: brightness(1.1); }`, `:active { filter: brightness(0.95); transform: scale(0.98); }`
  - `:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }`
  - `:disabled { opacity: 0.5; cursor: not-allowed; filter: none; }` (not used in this plan but cheap to include)
- [x] `shared/ui/Tab.tsx` (+ `.module.css`) — renders as `<Link>` when an `href` prop is passed, otherwise a `<button>`. This is specifically so `CategoryNav` (Session 7) can use `Tab` with `next/link` prefetch + client-side nav instead of rewrapping. Accepts `aria-selected` from the caller (derived from `usePathname`). Styles: text color `var(--text-muted)` default, `var(--text-primary)` when `[aria-selected="true"]`; animated underline via `::after { content: ''; position: absolute; bottom: 0; left: 0; height: 2px; width: 0; background: var(--text-primary); transition: width 200ms ease-out; }` and `[aria-selected="true"]::after { width: 100%; }`. Position the wrapper `relative` so `::after` anchors.
- [x] `shared/ui/Chip.tsx` (+ `.module.css`) — filter pill, `border-radius: 9999px`, `padding: 6px 12px`, `font-size: 13px`, `font-weight: 500`. Default state: `background: var(--bg-surface); color: var(--text-secondary);`. `[data-active="true"] { background: var(--text-primary); color: var(--bg-page); }`. `:hover { background: var(--bg-surface-alt); }` (hover overridden by active state specificity). `:focus-visible` matches Button.
- [x] `shared/ui/ProbabilityBar.tsx` (+ `.module.css`) — props `{ price: number }`, clamp `const p = Math.max(0, Math.min(1, price ?? 0))` before rendering.
  - `.track { height: 4px; width: 100%; background: var(--bg-surface-alt); border-radius: 9999px; overflow: hidden; }`
  - `.fill { height: 100%; background: var(--accent-yes); border-radius: inherit; }` with `style={{ width: \`${p * 100}%\` }}` inline
- [x] `shared/ui/Skeleton.tsx` (+ `.module.css`) — base pulsing block. Sizing API: consumers pass `className` (or inline `style`) for width/height; `Skeleton` itself only owns the pulse + base bg. CSS: `background: var(--bg-surface-alt); border-radius: 4px;`, keyframe `@keyframes skeleton-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }`, `animation: skeleton-pulse 1.5s ease-in-out infinite`. (Keyframe defined inside `Skeleton.module.css`, not globals — only used here.)
- [x] **Commit:** `feat(ui): add button, chip, tab, probability bar, and skeleton primitives`

---

### Session 4 — Jotai state layer + Hydrator

**Goal:** Atoms wired; `<Hydrator>` seeds prices from RSC data; `<PriceCell>` reads only its own atom.

- [x] `features/realtime/atoms.ts`:
  - [x] Import `atomFamily` from `jotai-family`
  - [x] `priceAtomFamily(tokenId) -> atom<Tick>({ price: 0, bestBid: 0, bestAsk: 0, ts: 0 })`
  - [x] `flashAtomFamily(tokenId) -> atom<{ seq: number; dir: 'up' | 'down' | null }>({ seq: 0, dir: null })`
- [x] `features/realtime/hooks.ts`:
  - [x] `useLivePrice(tokenId)` → returns `Tick`
  - [x] `useFlash(tokenId)` → returns `{ seq, dir }`
- [x] `features/realtime/Hydrator.tsx` — client component, uses `useHydrateAtoms` to seed `priceAtomFamily(tokenId)` from each market's `lastTradePrice`; runs once per route
- [x] `features/events/components/PriceCell.tsx` (+ `PriceCell.module.css` with `.flashUp { animation: flash-up 600ms ease-out }`, `.flashDown { animation: flash-down 600ms ease-out }`, and `.price` for any local font-size/weight needs):
  ```tsx
  const PriceCell = React.memo(({ tokenId, format }: Props) => {
    const { price } = useLivePrice(tokenId);
    const { seq, dir } = useFlash(tokenId);
    return (
      <span
        key={seq}
        className={cn(styles.price, dir === 'up' && styles.flashUp, dir === 'down' && styles.flashDown)}
      >
        {format(price)}
      </span>
    );
  });
  ```
  (`tabular-nums` is global on `body`, so no per-element class needed.)
- [x] Cleanup: `priceAtomFamily.remove(tokenId)` and `flashAtomFamily.remove(tokenId)` in an unmount effect — without this the family cache accumulates every token the user has ever viewed across SPA navigations
- [x] **Commit:** `feat(state): add price/flash atom families, hooks, and hydrator`

---

### Session 5 — Event card architecture (3 variants)

**Goal:** All three card shapes rendering correctly from parsed data; dispatch by event shape.

Each component is `Foo.tsx` + `Foo.module.css`. The shell owns chrome (image, title, volume footer) via typed props; the body is a single `children` slot so each body component stays focused on its own layout and none duplicate header markup.

Width note: shell is **fluid** (`width: 100%`), not `317px`. Session 6's grid uses `1fr` columns, so a locked width would either overflow or leave gutters. 317×180 is the design target at wide breakpoints, not a hard dimension.

Payload note from live Gamma checks on 2026-04-19: multi-market events are not uniformly `Yes/No` labeled, and the highest-volume market in some sports events has `groupItemTitle: null`. Render from payload data, not assumptions.

- [x] `features/events/components/CardShell.tsx` (+ `.module.css`) — props `{ event: PolymarketEvent; children: ReactNode }`. Renders: 40×40 event image (top-left) via `next/image` with `getEventImage(event)` and `/placeholder.svg` fallback when null; 2-line clamped title next to image; `children` body fills the middle; `formatVolume(event.volume) + ' Vol.'` footer bottom-left. CSS:
  - `.shell { width: 100%; height: 180px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 12px; display: grid; grid-template-rows: auto 1fr auto; gap: 8px; }`
  - `.shell:hover { background: var(--bg-surface-alt); transform: translateY(-1px); transition: background-color 150ms, transform 150ms; }`
  - Title clamp: `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`
- [x] `public/placeholder.svg` — simple dark square (matches `var(--bg-surface-alt)`); ship now so image rendering works today
- [x] `next.config.ts` — add `images.remotePatterns` for the current live host `polymarket-upload.s3.us-east-2.amazonaws.com` **in this session**, not Session 13. Use the object form (`protocol`, exact `hostname`, empty `port`, `pathname: '/**'`, `search: ''`) so the allowlist stays as specific as Next 16 recommends. Widen only if live payloads prove another host is required. Without this, `<Image>` throws at runtime the moment cards render. (Session 13's polish bullet can stay as a sanity-check pass.)
- [x] `features/events/components/BinaryBody.tsx` (+ `.module.css`) — layout A:
  - Big live chance: `<PriceCell tokenId={market.clobTokenIds[0]} format={formatPct} />` — **not** static from `outcomePrices[0]`, or the headline freezes at first paint
  - `<Button variant="yes">Buy Yes <PriceCell tokenId={market.clobTokenIds[0]} format={formatCents}/></Button>`
  - `<Button variant="no">Buy No <PriceCell tokenId={market.clobTokenIds[1]} format={formatCents}/></Button>` — Yes token is `[0]`, No is `[1]`; both must wire
- [x] `features/events/components/MultiOutcomeBody.tsx` (+ `.module.css`) — layout B: top 2 markets by `volumeNum`, each row = `{m.groupItemTitle ?? m.question}` label · `<PriceCell tokenId={m.clobTokenIds[0]} format={formatPct}/>` · `<Button variant="yes" size="sm">{m.outcomes[0]} <PriceCell tokenId={m.clobTokenIds[0]} format={formatCents}/></Button>` · `<Button variant="no" size="sm">{m.outcomes[1]} <PriceCell tokenId={m.clobTokenIds[1]} format={formatCents}/></Button>`. Do **not** hardcode `Yes` / `No` labels here; sports and totals markets in live Gamma payloads use team names and `Over` / `Under`. Keep the visual green/red left-right treatment, but the text must come from `outcomes[0]` and `outcomes[1]`.
- [x] `features/events/components/MicroEventBody.tsx` (+ `.module.css`) — layout C for `LIVE · {coin}` crypto tick events: badge top-left, big live `<PriceCell format={formatPct}/>`, `[Up] [Down]` buttons below. **Build the component now, but don't dispatch it from `EventCard`** — dispatching "is this a micro event" needs the market-type classifier that lands in Session 11 (`features/crypto/parse.ts`). Session 11's `/crypto` list renders this body directly against classified markets. Keeping it out of the homepage dispatcher also keeps Session 5's branching simple and testable.
- [x] `features/events/components/EventCard.tsx` — `React.memo(EventCard)` so category filter state and nav transitions don't re-render the card tree (only `<PriceCell>` ticks — this is what the Session 14 Profiler screenshot has to show). Dispatch, two branches only:
  - `event.showAllOutcomes && event.markets.length > 1` → `MultiOutcomeBody`
  - else → `BinaryBody`
- [x] `features/events/components/CardSkeleton.tsx` (+ `.module.css`) — fluid width, 180px height, 3 skeleton rows mimicking title / body / footer
- [x] Tests: `features/events/components/EventCard.test.tsx` (or split by component if cleaner) covering:
  - `showAllOutcomes && markets.length > 1` dispatches `MultiOutcomeBody`
  - single-market event dispatches `BinaryBody`
  - multi-outcome rows render `outcomes[0]` / `outcomes[1]` text instead of hardcoded `Yes` / `No`
  - row label falls back to `question` when `groupItemTitle` is null
- [ ] Visual QA vs `polymarket.com` at 1280×800 — binary card (e.g. `will-the-us-invade-iran-before-2027`), multi-outcome card (e.g. FIFA winner)
- [x] **Commit:** `feat(events): add card shell and three card body variants with dispatcher`

---

### Session 6 — Homepage chrome + responsive grid + skeleton/error states

**Goal:** Home renders the real Gamma feed plus the clarified homepage chrome: featured hero, breaking-news movers, hot-topics rail, and “explore all” controls above the responsive grid.

Shipped in commit `5f61ba5`.

- [x] `shared/lib/tags.ts` — add `isEventVisible(event)` returning `event.tags.every(t => !t.forceHide && t.slug !== 'hide-from-new')`. The existing `hasTagSlug` ignores `forceHide`, so a bare slug filter would miss `forceHide`-flagged tags. One helper, reused by every category page.
- [x] `app/page.tsx` (RSC): `await listEvents({ limit: 30, order: 'volume_24hr', ascending: false })` — **snake_case** `volume_24hr` is the Gamma sort token ([polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:141)); the camelCase `volume24hr` is the response *field* name and is silently ignored as a sort param, which would ship an unsorted feed. Filter with `isEventVisible`. No per-event parsing — [features/events/api/gamma.ts:39](/Users/tsur/projects/polymarket-clone/features/events/api/gamma.ts:39) already drops invalid events via `parseEventList`. Render `<><Hydrator events={visible}/><HomePage events={visible}/></>` so the hero, movers, topic rail, and grid all read from the same live slice.
- [x] `features/home/HomePage.tsx` (+ `.module.css`) — client-side home shell that derives:
  - [x] a varied featured set (main hero + 4 side cards)
  - [x] a breaking-news strip from highest absolute `oneDayPriceChange` movers
  - [x] a hot-topics rail from aggregated visible tags
  - [x] “Explore all” chips with topic and hide toggles above the grid
- [x] `features/events/components/EventGrid.tsx` (+ `.module.css`) — promoted to a lightweight **client** layout component so the new home/crypto/sports filter shells can reuse it without crossing an RSC boundary. `.grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; } @media (min-width: 768px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } } @media (min-width: 1200px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }` — `minmax(0, 1fr)` prevents grid blow-out from long unbroken title tokens (grid items' default min-width is `auto`, not `0`).
- [x] `app/loading.tsx` — grid of 12 `<CardSkeleton>` matching final layout (12 = 4 cols × 3 rows at 1200px+, still a reasonable shimmer at every narrower breakpoint)
- [x] `app/error.tsx` — **must start with `'use client'`** (App Router requirement for error boundaries). Props: `{ error, unstable_retry }`. Centered message + "Try again" button wired to `unstable_retry()`. In current Next 16 docs, `unstable_retry()` is the preferred recovery API for refetching and rerendering the segment; `reset()` remains available for the narrower "clear error without refetch" case.
- [x] Empty state (`visible.length === 0`): centered message rendered inline from `page.tsx`. Same copy whether Gamma returned `[]` or the filter removed everything — the distinction isn't meaningful to the user.
- [x] Visual QA at 1280×800, 1024×768, 600×960, 375×812
- [x] **Commit:** `feat(home): render featured hero, breaking movers, and responsive home grid`

Follow-up fixes applied after QA:
- The home grid now stays single-column until `768px`, avoiding the cramped `600px` 2-column tablet layout that showed up in responsive QA.
- `isEventVisible()` now hides only events carrying the explicit `hide-from-new` slug; `forceHide` remains a tag-level visibility concern for `getVisibleTags()`, not a whole-event suppression rule.

---

### Session 7 — Header + category nav + category routes

**Goal:** Top nav with 4 tabs; clicking a tab navigates to `/politics`, `/sports`, `/crypto`; each category page fetches its own Gamma slice server-side; site-wide header/footer chrome better matches the live Polymarket shell.

Reference for the routing decision: the route is the only source of truth for category state. Do not introduce a `categoryAtom` or any URL-sync effect here.

Payload note from live Gamma checks on 2026-04-19: `listEvents({ limit: 30, order: 'volume_24hr' })` filtered client-side yields only **2 sports events** (and 7 crypto, 15 politics). A `/sports` grid with 2 cards looks broken. Gamma supports `tag_slug=politics` as a server-side filter — use it. Client-side filtering stays only for the `isEventVisible` (forceHide / hide-from-new) pass from Session 6.

- [x] [features/events/api/gamma.ts:16](features/events/api/gamma.ts#L16) — extend `ListEventsParams` with optional `tagSlug?: string`; `buildListUrl` serializes `params.set("tag_slug", tagSlug)` when present. Keep `listEvents` signature additive; homepage call stays unchanged.
- [x] `features/categories/components/Header.tsx` (+ `.module.css`) — **server component** (no client hooks), `position: sticky; top: 0;` with a translucent backdrop, logo left, desktop browse/topic rows above the core 4-tab nav, and the recruiter-required local routes (`Trending`, `Politics`, `Sports`, `Crypto`) preserved in `<CategoryNav>`.
- [x] `features/categories/components/CategoryNav.tsx` (+ `.module.css`) — **client component** (`'use client'` for `usePathname`). 4 tabs: `Trending` (`/`), `Politics` (`/politics`), `Sports` (`/sports`), `Crypto` (`/crypto`). Wrapper is a plain `<nav aria-label="Categories">` — **not** `role="tablist"` (tab/tablist pattern is wrong for links that navigate to different URLs). Default `<Link>` prefetch stays on (prod prefetches 3 extra category fetches eagerly; Data Cache dedupes via the shared `revalidate: 30` window — cheap).
- [x] `features/categories/activeTab.ts` — pure helper `isTabActive(pathname: string, href: string): boolean`:
  - `href === '/'` → `pathname === '/'` (otherwise Trending would match every route)
  - else → `pathname === href || pathname.startsWith(href + '/')` (so `/sports/live` keeps the `Sports` tab highlighted once Session 12 lands)
  - One unit test (`activeTab.test.ts`) locking in the three cases above; cheap guard, 10 lines.
- [x] Tab primitive wiring: when `<Link>` is active, pass **both** `aria-current="page"` (correct nav semantic) and `aria-selected={true}` (keeps the existing `[aria-selected="true"]` styles in [shared/ui/Tab.module.css](shared/ui/Tab.module.css) working without a CSS change). No Tab primitive rewrite needed.
- [x] `app/politics/page.tsx`, `app/sports/page.tsx`, `app/crypto/page.tsx` — each RSC:
  - `await listEvents({ tagSlug: 'politics', limit: 30, order: 'volume_24hr', ascending: false })` (and `'sports'` / `'crypto'` respectively)
  - Apply `isEventVisible` filter (resolved after Session 6 QA: it hides only the explicit `hide-from-new` slug, not any event carrying a `forceHide` tag)
  - Render `<><Hydrator events={visible}/><EventGrid events={visible}/></>` — **per-route Hydrator is required**, not just on `/`; without it prices render `0` on the category page until the first WS tick (atoms are store-scoped, not route-scoped, but Hydrator seeds one tokenId set per render).
  - Empty state + error state inherited from `app/error.tsx` / inline empty branch in each page (same copy as homepage)
- [x] `app/politics/loading.tsx`, `app/sports/loading.tsx`, `app/crypto/loading.tsx` — re-export homepage `loading.tsx` content (12-card skeleton grid); duplicated file, shared body. No shared layout file needed just for this.
- [x] Active tab animated underline already lives in [shared/ui/Tab.module.css](shared/ui/Tab.module.css) via `[aria-selected="true"]::after` — no new CSS
- [x] `features/categories/components/Footer.tsx` (+ `.module.css`) — global footer with market-topic column, support/social links, product links, legal copy, and submission signature. Rendered once from `app/layout.tsx` under `{children}` so every route shares the same chrome.
- [x] Header rendered once in `app/layout.tsx` above `{children}` (inside `<Providers>`, outside the route slot) so it persists across all routes including `/event/[slug]`
- [x] Drop the `features/categories/filter.ts` plan entry — with server-side `tag_slug`, the category routes no longer filter client-side. If a later sub-filter needs it, add then. `shared/lib/tags.ts::hasTagSlug` already exists for detail-page logic.
- [x] Visual QA at 1280×800 and 375×812 — header 57px, 4 tabs fit both widths (P-logo-only at 375px), animated underline, back/forward restores active tab. Card counts with the corrected `isEventVisible`: `/` 29, `/politics` 22, `/sports` 10 (the other 20 events in the `tag_slug=sports` slice fail `isValidEvent` because their secondary markets carry `outcomePrices: null`), `/crypto` 29. QA surfaced two real bugs, both fixed in Session 7:
  - `isEventVisible` was filtering on `tag.forceHide`, which hid every category event because Gamma flags the headline tags (`sports`, `politics`, `crypto`) as `forceHide: true`. Narrowed to the `hide-from-new` slug only; `forceHide` stays a tag-chip visibility flag via `getVisibleTags`. Matches the Session 6 follow-up.
  - Active `<Tab>` was only emitting `aria-current="page"` — added `aria-selected={true}` alongside so the plan's dual-attribute contract holds even if the CSS later depends on only one.
- [x] **Commit:** `feat(nav): add sticky header and per-category routes with server-side tag filtering`

---

### Session 8 — Event detail page

**Goal:** `/event/[slug]` renders header + market list for valid slugs, supports both single-market and multi-market events, and returns a real segment-local 404 for missing slugs.

- [x] `app/event/[slug]/page.tsx` (RSC): type with `PageProps<'/event/[slug]'>`, `const { slug } = await params`, call `getEventBySlug(slug)`, wrap the result in `<Hydrator>`, and map Gamma 404s to `notFound()` instead of the generic segment error UI. Keep slug-based detail fetch aligned with [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:117)
- [x] `app/event/[slug]/not-found.tsx` — missing/invalid slug state with the same visual language as the app, not the generic runtime error card
- [x] Detail entry point: make each event card navigate to `/event/${event.slug}` via `next/link` (entire card or stretched-link pattern), keeping keyboard focus visible and preserving the existing card hover treatment
- [x] `features/detail/components/EventHeader.tsx` (+ `.module.css`) — 80×80 image via the existing event image fallback chain, `<h1>` title, sub-line `{formatFullUSD(volume)} Vol.` and append ` · {formatEndDate(endDate)}` only when `endDate` exists and parses cleanly
- [x] `features/detail/components/MarketRow.tsx` (+ `.module.css`) — `.row { height: 72px; }`:
  - Label: `market.groupItemTitle || market.question` for every row, not only the single-market case; sports moneyline rows can have `groupItemTitle: null`
  - Big probability on the right comes from outcome 0's token via `<PriceCell tokenId={clobTokenIds[0]} format={formatPct} />` with a `0%` fallback when the token is missing
  - Probability bar is seeded from `market.outcomePrices[0]` in Session 8 and explicitly upgraded in Session 10 to read the live outcome-0 price state on the detail page too, so the headline percent and bar stay in sync once subscriptions land
  - Two buttons use payload labels, not hardcoded copy: `<Button variant="yes">{market.outcomes[0] ?? 'Yes'} <PriceCell tokenId={clobTokenIds[0]} format={formatCents}/></Button>` and the same pattern for outcome 1 / `clobTokenIds[1]`
  - Zebra via `:nth-child(even) { background: var(--bg-page); }` in `MarketList.module.css` targeting `.row`
- [x] `features/detail/components/MarketList.tsx` (+ `.module.css`) — maps markets to rows; owns the zebra rule
- [x] Single-market event case: one row, header title = `event.title`, row label still falls back through `market.groupItemTitle || market.question`
- [x] Multi-market event case: one row per market, regardless of whether the outcome labels are `Yes/No`, team names, or `Over/Under`
- [x] `app/event/[slug]/loading.tsx` — header skeleton + 5 row skeletons
- [x] `app/event/[slug]/error.tsx`
- [x] Tests: lock in `groupItemTitle || market.question`, non-`Yes/No` outcome labels on sports rows, and 404 mapping for an invalid slug
- [x] Test with: `2026-fifa-world-cup-winner-595` (multi, 60 markets), `will-the-us-invade-iran-before-2027` (single-market), `nba-hou-lal-2026-04-18` (sports with mixed row label shapes)
- [x] **Commit:** `feat(detail): add event detail pages and market rows`

---

### Session 9 — WebSocket client + dispatcher + rAF batcher

**Goal:** Can connect to CLOB WS, parse both message shapes, batch atom writes per frame — verified against fixtures.

Reference before implementation: [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:183)

- [ ] `features/realtime/ws.ts`:
  - [ ] Browser-only singleton `WebSocket` to `wss://ws-subscriptions-clob.polymarket.com/ws/market` — endpoint and channel semantics per [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:183). Guard with `typeof window !== 'undefined'` so any RSC import is a no-op. Stash the live socket on `globalThis.__pmWs` to survive Next dev HMR without opening a duplicate connection
  - [ ] **Lazy connect** — do not open the socket at module load. Open on the first call to a `connect(getAssetIds)` (or `setAssetIds()` from Session 10) so we never connect with an empty subscription set, which the server closes per [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:286)
  - [ ] `onopen` → send `{ assets_ids: getAssetIds(), type: 'market' }` immediately, per [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:205); flush any messages buffered while `readyState !== OPEN`
  - [ ] `safeSend(payload)` helper — if `readyState === OPEN`, send; otherwise push onto a small pre-OPEN buffer flushed in `onopen`. Used for the initial subscribe, PING, and (Session 10) dynamic subscribe/unsubscribe diffs
  - [ ] `setInterval(() => safeSend('PING'), 10_000)`, ignore `'PONG'` in `onmessage` (string equality check before `JSON.parse`), per [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:235). `clearInterval` on every `onclose` so reconnects don't accumulate timers
  - [ ] Exponential backoff `1 → 2 → 4 → 8s` on close, **capped and held at 8s** on continued failure (do not reset to 1s until a successful `onopen`)
  - [ ] **Reopen contract** — expose `onReopen(cb: () => void)` that fires after every successful reconnect; Session 10's subscriptions module registers a callback that re-pushes the full asset-id set. Defining the contract here keeps Session 10 from retrofitting it
- [ ] `features/realtime/dispatcher.ts`:
  - [ ] `handleMessage(raw)` — drop control frames (`raw === 'PONG'`) before parsing; wrap `JSON.parse` in try/catch and drop unparseable input; then `Array.isArray(msg) ? msg : [msg]`
  - [ ] Switch on `m.event_type`: `'book'` → `applyBook`, `'price_change'` → `applyPriceChange`, **default → ignore** (covers `tick_size_change`, `last_trade_price`, future types). Required by [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:372)
  - [ ] `applyBook(m)` — enqueue partial tick `{ price: Number(m.last_trade_price), ts: Number(m.timestamp) || Date.now() }` keyed by `m.asset_id`. Skip if `Number.isNaN(price)` or `price === 0`
  - [ ] `applyPriceChange(m)` — iterate `m.price_changes`; for each entry enqueue `{ price: Number(p.price), bestBid: Number(p.best_bid), bestAsk: Number(p.best_ask), ts: Number(m.timestamp) || Date.now() }` keyed by `p.asset_id`. The `best_bid`/`best_ask` fields **must** flow through — they are the only WS source of bid/ask updates, matching [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:332). Skip entries with `NaN` price
  - [ ] Normalize all price strings → numbers here, matching [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:150)
- [ ] `features/realtime/rafBatcher.ts`:
  - [ ] Browser-only — guard `requestAnimationFrame` access; the dispatcher unit test must not transitively import this module's rAF path (mock `enqueue` at the module boundary)
  - [ ] `enqueue(tokenId, partialTick: Partial<Tick>)` writes to `Map<string, Partial<Tick>>` (last-write-wins per token); schedules rAF only if not already scheduled (a single `scheduled: boolean` guard — never schedule from inside the flush callback, only from `enqueue`, or you'll burn CPU in a zombie loop on idle)
  - [ ] Single `requestAnimationFrame` flush, per token: read `prev = store.get(priceAtomFamily(tokenId))` once, compute `next = { ...prev, ...partial }` so REST-seeded `bestBid`/`bestAsk` survive a `book` tick that only carries `price`, then `store.set(priceAtomFamily(tokenId), next)`. Clears the map and resets the guard
  - [ ] Flash atom: only write when `next.price !== prev.price` — set `{ seq: prev.seq + 1, dir: next.price > prev.price ? 'up' : 'down' }`. Equality is a no-op (no seq bump, no keyframe replay)
  - [ ] Uses Jotai's imperative `store.set` (via `getDefaultStore()`). Verify no `<Provider>` wraps the app in `app/layout.tsx`; if one is added later it must use the default store, otherwise hydrated seeds and live ticks land in different stores
- [ ] Unit test `dispatcher.test.ts`: feed `fixtures/ws-message-samples.json` through `handleMessage` with a mocked `enqueue` — assert (1) array-wrapped `book` enqueues `{price, ts}` for the right `asset_id`, (2) object `price_change` enqueues one entry per `price_changes[]` with `price`, `bestBid`, `bestAsk` populated from `best_bid`/`best_ask`, (3) `'PONG'` and an unknown `event_type` are silent no-ops
- [ ] Unit test `rafBatcher.test.ts`: with `vi.useFakeTimers()` + a `requestAnimationFrame` polyfill, assert (1) the schedule guard prevents duplicate frames when `enqueue` is called twice in one tick, (2) last-write-wins per token, (3) partial tick merges with prev (REST-seeded `bestBid`/`bestAsk` preserved when only `price` arrives), (4) equal price does not bump flash `seq`
- [ ] **Commit:** `feat(realtime): add ws client, dispatcher, and raf-batched writer with tests`

---

### Session 10 — WebSocket subscription management + live ticks on UI

**Goal:** Prices tick live on home, category pages, and detail page. Flash animation visible. Reconnects cleanly.

- [ ] `features/realtime/subscriptions.ts`:
  - [ ] Ref-counted `Map<tokenId, count>`
  - [ ] `subscribe(tokenIds)` increments counts, diffs current subscription set, sends WS update if changed; use the documented dynamic subscribe behavior in [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:205)
  - [ ] `unsubscribe(tokenIds)` decrements, removes when count hits 0; use the documented unsubscribe message in [polymarket-api-findings.md](/Users/tsur/projects/polymarket-clone/project-notes/polymarket-api-findings.md:205)
  - [ ] Debounce WS sends to 50ms to coalesce mount storms
- [ ] `PriceCell` `useEffect`: `subscribe([tokenId])` on mount, `unsubscribe([tokenId])` on unmount
- [ ] Manual QA:
  - [ ] Home tickers: flash animations visible, no layout shift, numbers don't jitter (thanks `tabular-nums`)
  - [ ] FIFA detail page: 60-market stress test, no UI jank
  - [ ] Wi-Fi disconnect → reconnect cycle works, prices resume
  - [ ] Chrome DevTools → React Profiler → confirm only `<PriceCell>` renders on tick
- [ ] **Commit:** `feat(realtime): wire live websocket prices with ref-counted subscriptions`

---

### Session 11 — Crypto custom layout (Tier 2 bonus)

**Goal:** `/crypto` upgrades from a plain filtered grid to the current live-site shape: a card grid wrapped in time-bucket pills, market-type chips, asset chips, and sort chrome.

- [x] `features/crypto/filters.ts` — classify each event by time bucket (`5M`, `15M`, `1H`, `4h`, `daily`, `weekly`, `monthly`, `yearly`, `pre-market`), market type (`up-down`, `above-below`, `price-range`, `hit-price`), and lead asset (`bitcoin`, `ethereum`, `solana`, `xrp`, `dogecoin`, `bnb`, `microstrategy`)
- [x] `features/crypto/components/CryptoExplorer.tsx` (+ `.module.css`) — `All | 5 Min | 15 Min | 1 Hour | 4 Hours | Daily | Weekly | Monthly | Yearly | Pre-Market` pill row with live counts, asset chip row, static `24hr Volume` sort chrome, and market-type chips above the existing card grid
- [x] `app/crypto/page.tsx` — fetch crypto-tagged events (`limit: 32` to stay inside the Next data-cache ceiling), hydrate once, and render `<CryptoExplorer>`
- [x] Loading skeleton remains the shared card-grid skeleton because the live crypto page is card-first again, not an expandable-table surface
- [x] Tests: `features/crypto/filters.test.ts`
- [x] **Commit:** `feat(crypto): add pill-filtered crypto hub chrome`

---

### Session 12 — Sports custom layout (Tier 3 bonus)

**Goal:** `/sports` upgrades from a generic grid to a sportsbook-style hub: live league-grouped rows for game events plus a futures tab that reuses the card grid for championship-style markets.

- [x] `features/sports/parse.ts` — bucket sports events into live-style games vs futures; classify moneyline, spread, and total markets; derive league labels from tags; format spread/total button labels
- [x] `features/sports/components/SportsHub.tsx` (+ `.module.css`) — `Live | Futures` switcher, league filter chips, grouped league sections, and moneyline/spread/total button rows in cents for live events
- [x] `app/sports/page.tsx` — fetch sports-tagged events (`limit: 14` to stay inside the Next data-cache ceiling), hydrate once, and render `<SportsHub>`
- [x] Futures fall back to the existing `EventGrid` so the route still shows broader sports markets once the user flips tabs
- [x] Tests: `features/sports/parse.test.ts`
- [x] **Commit:** `feat(sports): add league-grouped sports hub`

---

### Session 13 — Polish: hover, animations, responsive, a11y

**Goal:** Every interactive element has polished hover/active/focus states; mobile looks intentional; keyboard nav works.

- [ ] Audit all interactive elements — ensure `:hover`, `:active`, `:focus-visible` states in every component's `.module.css` (button, tab, chip, card, row)
- [ ] Card hover (`CardShell.module.css`): `.shell:hover { background: var(--bg-surface-alt); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: background-color 150ms, transform 150ms, box-shadow 150ms; }`
- [ ] Button active (`Button.module.css`): `.button:active { transform: scale(0.98); }`
- [ ] Tab underline (`Tab.module.css`): `::after { width: 0; transition: width 200ms ease-out; }`, `[aria-selected="true"]::after { width: 100%; }`
- [ ] Chip active (`Chip.module.css`): `[data-active="true"] { background: var(--text-primary); color: var(--bg-page); }`
- [ ] Keyboard: Tab order through header → category nav → grid; Enter activates category links; `CategoryNav` stays a plain `<nav aria-label="Categories">` with `aria-current="page"` and styling keyed off `aria-selected`, not a `tablist`
- [ ] Mobile + tablet QA at 375/414/600/768/1024 — fix any broken spacing, overflow, or touch targets (<44px), and re-check the home grid after the Session 6 follow-up moved the 2-column breakpoint to `768px`
- [ ] Flash animation timing: tune keyframe curve in `globals.css` so it feels instant-then-fade, not linear
- [ ] `next/image` config: `remotePatterns` for `polymarket-upload.s3.*.amazonaws.com`; `sizes` attr on card/detail images
- [ ] Placeholder SVG for missing images (`public/placeholder.svg` — simple dark square)
- [ ] `globals.css`: `html { scroll-behavior: smooth; scrollbar-gutter: stable; }`
- [ ] **Commit:** `style: polish hover, active, focus states and mobile responsiveness`

---

### Session 14 — Tests, perf proof, and reliability QA

**Goal:** Full test suite green; Profiler screenshot captured; reconnection verified; ready for README.

- [ ] Test coverage is intentionally scoped: `parse.test.ts` (fixture parses; stringified JSON fields become arrays; image fallback chain; `isValidEvent` rejects missing fields), `format.test.ts` (each formatter: 0, typical, one edge — NaN-safe for volume, negative for price), `dispatcher.test.ts` (one `book` array message, one `price_change` object message — spy on batcher `enqueue`). No component tests, no E2E — Profiler screenshot is the render-isolation proof
- [ ] `pnpm test` — all green
- [ ] Profiler capture:
  - [ ] Chrome DevTools → React → Profiler → start recording → let WS tick for 10s on home page
  - [ ] Confirm only `<PriceCell>` entries in the flame graph (no `<EventCard>`, `<EventGrid>`)
  - [ ] Screenshot → save to `docs/profiler-surgical-renders.png`
- [ ] GIF capture of flash animation: 3-5s at 30fps, save to `docs/flash-demo.gif` (use Kap/CleanShot)
- [ ] Reconnection QA: toggle Wi-Fi for 10s → verify WS reconnects with backoff, subscriptions resume, prices resume
- [ ] Lighthouse run on home + detail; screenshot scores to `docs/lighthouse-home.png`, `docs/lighthouse-detail.png`
- [ ] Verify no console errors/warnings in production build (`pnpm build && pnpm start`)
- [ ] `docs/` folder committed with all artifacts
- [ ] **Commit:** `test: complete test suite and capture performance artifacts`

---

### Session 15 — README, PLAEE touches, final visual diff

**Goal:** Submission-ready. README reads like an experienced engineer wrote it. Favicon + title + signature in place.

- [ ] Favicon: generate a purple `P` on `#15191D` square (use `favicon.io` or hand-make SVG) → `app/favicon.ico`, `app/icon.svg`
- [ ] `app/layout.tsx` metadata: `title: 'Polymarket Clone — PLAEE Assignment'`, description, Open Graph image
- [ ] `README.md` — structured as:
  1. **Title + one-line pitch**
  2. **Quick start:** `pnpm i`, `pnpm dev`, localhost link
  3. **What's included** — checklist mirroring brief deliverables 1-6 + bonus Crypto + bonus Sports + flash animation
  4. **Architecture** — one mermaid diagram (RSC → Gamma REST, Client → Jotai ← WS → CLOB)
  5. **Realtime approach** — 3 paragraphs: connection lifecycle, rAF batching, surgical re-renders; embed `docs/profiler-surgical-renders.png` and `docs/flash-demo.gif`
  6. **Performance notes** — `jotai-family` `atomFamily`, memoization, RSC caching, `next/image`, IntersectionObserver gating; embed Lighthouse screenshots
  7. **Scope decisions** (bullets, each one sentence): no trade panel, no chart, no comments tabs, no email signup/social embed/mobile bottom nav, WS-only no simulator, no zod, no TanStack Query, CSS Modules + CSS variables instead of Tailwind (scannable JSX, RSC-clean, zero runtime, design tokens stay first-class), classic `fetch` revalidation instead of Next 16 Cache Components (two endpoints with fixed TTLs don't justify the new model's per-component `'use cache'` cognitive cost), no React Compiler (surgical re-render architecture via atoms + memo is already demonstrably minimal in the Profiler capture)
  8. **Known limitations** (same bullets as spec §8)
  9. **Tech stack**
  10. **Footer signature:** `Built by [name] for the PLAEE Frontend Assignment, April 2026.`
- [ ] Final visual diff sweep against `polymarket.com`:
  - [ ] Home at 1280×800 — card spacing, typography, colors, icons
  - [ ] Home at 600×960 — verify the responsive grid breakpoint choice after Session 13 polish
  - [ ] Home at 375×812 — mobile
  - [ ] Event detail — `will-the-us-invade-iran-before-2027` + `2026-fifa-world-cup-winner-595`
  - [ ] Crypto page — pill nav + chips + group rendering
  - [ ] Sports/live — league groups + game rows
- [ ] Fix any visible gaps spotted in diff
- [ ] Final test run, final production build
- [ ] Push to GitHub, create public repo, ensure `README.md` renders correctly
- [ ] **Commit:** `docs: add readme, architecture diagram, perf artifacts, and plaee branding`
- [ ] **Final commit (if needed):** `chore: final polish pass`

---

## 3. Running Rules

- **Visual diff after every UI-touching session.** Open Polymarket live, side-by-side at matching widths. Fidelity is the rubric's #1 criterion.
- **Never pass prices as props.** Prices flow through atoms only. Violating this breaks the re-render proof.
- **`font-variant-numeric: tabular-nums` is set globally on `body` in `globals.css`.** No per-element class needed; if you ever override `font-family`, re-apply tabular-nums there too.
- **Commit messages: `type(scope): subject` + one-sentence body explaining *why*.** No AI co-author trailer.
- **If stuck >20 min on a single issue, move on and leave a TODO comment.** Come back at polish time.
- **Do not add features not in this plan.** Brief explicitly says "not adding features." If you think of something "nice to have," log it in README limitations and skip.
- **CSS Modules discipline:** every component owns its own `*.module.css`. No utility-class soup in JSX, no inline `style={{}}` except for genuinely dynamic values (e.g. `width: ${p*100}%` on the probability bar). Variants ride on `data-*` attributes and CSS attribute selectors, not on long `cn(...)` chains.
- **Tokens come from `var(--*)` only.** Never hard-code a hex from §2.1 inside a module file — if a token is missing, add it to `globals.css` first.
