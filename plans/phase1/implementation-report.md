# Phase 1 implementation report

Implemented 2026-09-21 by the single-writer impl lane (main tree, dev stack
serving from here). All approved items from `plans/phase1/scope.md`
(A1–A6, B2–B7; B1 excluded per owner) are complete. Nothing committed —
post-impl commit is the parent's step.

Net diff: **229 insertions / 570 deletions** across 16 modified files + 1 new
server file + 5 new harness scenarios. The bulk of the deletion is B7.

## Per-item changes

### Workstream B (simplifications, done first)

| Item | Files | Change |
|---|---|---|
| B2 | `app/src/routes/review/+page.server.ts` | Deleted dead `actions.delete` export (was :55-75) + its `imageController` import (was :3). `redirect`/`ImageModel` kept (used by `load`). |
| B3 | `app/src/routes/signUp/+page.svelte` | Deleted `let username = $state('')` (was :9) and the "Username (Optional)" field block (was :46-49). `handleSignUp` and its console.logs untouched (deferred candidate #4). |
| B4 | `app/src/lib/searchBar.svelte` | Deleted the entire never-bound `onSubmit` function (was :4-11), including the no-op `e.preventDefault` and `console.log`. The `<form action="/posts">` is untouched — native GET submit behavior preserved by construction. |
| B5 | **new** `app/src/lib/server/reviewFilter.ts`; `app/src/routes/review/+page.server.ts`; `app/src/routes/api/review/page/+server.ts` | `REVIEW_PAGE_SIZE = 200` + `buildReviewFilter(searchTerm, notag)` (the `$all`/`$not` block moved verbatim). Both call sites import it; everything else (param extraction, sort, skip math, response shapes) kept verbatim. |
| B6 | `app/src/routes/tags/+page.svelte` | Added `@media (max-width: 768px)` with `h1 { margin-top: 20px; margin-left: 20px; }` after the existing `h1` rule (page-scoped only). |
| B7 | `app/src/lib/pageNav.svelte` | Removed hold-to-scrub at all viewports: settings (`holdMs`/`tiers`), ruler geometry, all scrub state, `clamp`/`vibrate`, `startScrub`/`onScrubMove`/`resetScrub`/`onScrubEnd`/`onScrubCancel`/`endScrub`/`onClickGuard`, both `span.scrub-wrap` + ruler blocks (bare `<a>` kept), `--hold-ms` style attr, and the entire "Hold-to-scrub" CSS section. **Kept:** all 7 props, the 4 links (First/Previous/Next/Last page, aria-labels + `aria-disabled`), `.page-nav-info` indicator, `buildUrl` param preservation, `updateUrls`, 44px coarse / 40px fine targets, hover pulse, focus rules. 602 → **185 lines**. Return-page feature untouched (separable — no `imageId`/`returnTo` refs in pageNav). `holdClick.ts` untouched. |

### Workstream A (mobile IA, second)

| Item | Files | Change |
|---|---|---|
| A1 | `app/src/lib/navigation.svelte`, `app/src/lib/svelteComponents/slideMenu.svelte` | Sticky 48px+safe-area top bar at ≤768px on `.navContainer` (in-flow `position: sticky; top: 0; z-index: 1000`, `--bg-secondary` bg, 1px `--border-color` bottom border). New `.mobileBrand` `b..d` (Orbitron 1.25rem `--text-accent`) inside the bar, hidden >768px. FAB moved into the bar after `.navbar`, restyled to a 44px in-flow circle (fixed positioning, both dead `transform` lines, and `z-index` removed; `aria-label="Menu" aria-expanded` added). Breakpoints collapsed to a single 768px boundary: `min-width: 600px` → `min-width: 769px` in **both** files, mutually exclusive with `max-width: 768px`. `NAV_LINKS` array + `{#each}` replaces the 7 hardcoded links in both navs (single source, desktop/mobile parity). Active route: `import { page } from '$app/state'`, `let currentPath = $derived(page.url.pathname)`, `isActive(href)` (exact or `href + '/'` prefix), applied as `class:active` + `aria-current="page"` on both surfaces; `a.active` rule (`--text-accent`, weight 600). `/postGroups`, `/postsSmart`, `/postsDynamic` intentionally unmapped (owner call). **Mode switch:** `let menuOpen = $state(false)` + all 10× `on:click` → `onclick`; `<script>` → `<script lang="ts">` (needed for the `href: string` annotation). |
| A2 | `app/src/routes/posts/+page.svelte`, `app/src/routes/postsByDate/[slug]/+page.svelte`, `app/src/routes/postsSmart/+page.svelte`, `app/src/lib/svelteComponents/contentGrid.svelte` | The four live grid `style` attrs changed to `repeat(auto-fit, minmax(min(42vw, Npx), 1fr))` (N = `$improvImageSize` / `{minSize}`). No media query. **Side discovery:** the pre-existing inline values were *unbalanced* (`repeat(auto-fit, minmax(Npx, 1fr)` — missing final paren); Chromium lenient-parses them, which is why desktop still showed 4 columns. The new values are balanced; at ≥834px they resolve to the same 200px minimum → desktop byte-identical (proven by probe, below). `/postGroups` untouched. |
| A3 | `app/src/routes/postsByDate/+page.svelte`, `app/src/lib/svelteComponents/UploadEventCard.svelte` | New `.mobile-filter-row` (Event gap select bound to the same `$state selectedThreshold` + `onchange={applyThreshold}`, distinct id `threshold-select-mobile`, event-count `<span class="event-stats">`) inserted as first child of `.content-area`; `display:none` base + flex at ≤960px (exactly complementary to `sideBar`'s 960px hide). `.overflow-count` becomes a corner pill (`right/bottom: 6px`, radius 999px, 0.8rem) at ≤960px; >960px keeps the full-cell overlay (base rule untouched). |
| A4 | `app/src/routes/+page.svelte` | One appended `@media (max-width: 768px)` block: `.midContainer` height auto / min-height 50vh; `.Home` 100% wide, height auto, min-height 380px, `background-color: var(--bg-accent)`; `.Home *` margins 0; `.Home h3` `clamp(28px, 9vw, 44px)` + 40/16/32 margins + `var(--text-primary)`. All existing rules untouched → >768px byte-identical. |
| A5 | `app/src/routes/posts/+page.svelte`, `app/src/routes/postsByDate/[slug]/+page.svelte`, `app/src/routes/postsSmart/+page.svelte`, `app/src/routes/postsDynamic/+page.svelte` | Top `PageNav` instances removed (posts, postsByDate/[slug], postsSmart, postsDynamic). **`length={$imageCount}` moved to the surviving bottom instance** on /posts, /postsByDate/[slug], /postsSmart (owner-approved behavior preservation — without it the bottom bar would reset `len→24` on every click). /postsByDate's single disabled bar and /postGroups' own pagination untouched (owner call). |
| A6 | `app/src/routes/posts/+page.svelte` | Appended `@media (max-width: 768px)` block compacting `.reviewLink` (14px), `span` labels (0.7rem, nowrap), `select` (0.8rem, tighter padding) → Review+SIZE+LENGTH on one ~45px row. ≥769px untouched. |

Not touched (per owner/task constraints): `SearchTxtToFilter.ts`,
`holdClick.ts`, the 5 deferred "Additional candidates", `theme.css`,
`+layout.svelte`, all `shots*-before*` backups, `dev/harness/.run/state.json`.

## Validation evidence

**Static**
- `npm run check`: **97 errors / 34 warnings / 38 files** vs baseline
  97 / 35 / 39. Zero new diagnostics (per-diagnostic diff: the only changes
  are −1 a11y warning — the old unlabeled mobile menu button now has
  `aria-label="Menu"` — and −1 file with diagnostics). One transient error
  (`isActive` param implicitly `any`) caught by the first run and fixed with
  a `href: string` annotation + `lang="ts"` script tag before continuing.
- `npm run test`: **28/28 passed** (5 files, incl. `returnTo.test.ts` — the
  return-page feature B7 had to keep).
- vite.log: no compile errors during any hot-reload (only "error-template.js
  page reload" filename matches, pre-existing pattern).

**B gates**
- B7 grep gate (word-bounded `scrub|ruler|vibrate|tick-label|tick-line|holdMs`
  over `app/src`): **zero matches** (a naive grep matches `thresholdMs` in
  `uploadEventController.ts` — unrelated event-gap parameter, pre-existing).
- `pageNav.svelte` line count: **185** (gate ≤200; doc estimate 175-195).
- B5 parity: `GET /api/review/page` for `{}`, `?search=cat`, `?notag=dog`,
  `?search=cat&notag=dog`, `?page=1` → **byte-identical JSON** before/after
  (5/5 `cmp` clean).
- B2: authenticated `POST /review` → **405 Method Not Allowed** (route exports
  no actions).

**Harness scenarios (all created + run)**
- `scenarios/phase1-nav.json` (390×844): **13/13**. Bar `position:sticky`,
  48px, brand visible, `.menu-button` `position:static` (fixed FAB gone),
  navbar hidden; menu opens (`.menu-container.open`, `display:flex`),
  "Posts" active in both link sets; theme toggle flips
  `data-theme` dark→light with menu staying open.
- `scenarios/phase1-nav-band.json` (700×900, mid-band): **6/6**. Brand +
  hamburger visible, navbar hidden, bar sticky, menu `display:flex` in the
  band (the 600-768px band is resolved: bar present, menu visible iff
  hamburger visible).
- `scenarios/phase1-layout-mobile.json` (390×844): **18/18**, all probes on
  spec:
  - A4: hero 390w × 422h, bg `rgb(31,111,235)` (dark `--bg-accent`), title
    `rgb(201,209,217)` 35.1px, 1 line.
  - A2: **2 columns**, tracks 177/177 (spec 165-190), gridW 358.
  - A5: exactly **1** `nav.pagination`, info "Page 1 / 1".
  - A6: `.reviewLink` top 53, both selects top 53 (±2px, single row), link
    height 27 → ~37px band (spec ≤45).
  - B7: no `.scrub-wrap`/`.scrub-ruler`/`--hold-ms`; aria-labels
    [First, Previous, Next, Last page]; button 40px (headless fine pointer;
    44px coarse rule retained in CSS).
  - A3: row `display:flex` with sideBar `display:none`, 8 options, stats
    "N events from M images"; postsSmart + postsDynamic 2-col + 1 bar.
  - A3 badge (follow-up seed run, 5th image uploaded to the existing event):
    `{"badge":true,"text":"+1","badgeH":23,"cellH":114,"badgeRightGap":6,
    "badgeBottomGap":6}` — pill (23 < 114/2), 6px gaps exactly per spec.
    Note: the DB had dropped to 4 images before this run (a Phase 0-era
    delete); the seed upload of `1786767551613.jpg` restored a 5-image event.
    First seed attempt used a file already in the DB → "Duplicate image
    skipped" (upload dedupe working as designed).
- `scenarios/phase1-layout-desktop.json` (1440×900): **11/11**, all
  invariants:
  - A2: **`250.266px × 4` — byte-identical to the pre-change baseline**
    recorded before editing (Chromium lenient parse of the old unbalanced
    value); 4 columns.
  - A4: hero 907×800, `rgb(43,79,129)`, title 57px (unchanged).
  - A3: row `display:none`, sideBar `flex`, badge 506px = cell 506px
    (full-cell overlay retained >960px).
  - A5: 1 bar on /posts, event detail, /postsSmart, /postsDynamic.
  - Nav: `position:static` bar, brand/menu `display:none`, active link
    "Posts"/"Home" via `aria-current="page"`.
- `--preset smoke` (desktop re-capture into `shots/`): 12/13 — the single
  failure is the **known pre-existing** `waitFor 'main'` timeout (app has no
  `<main>`; same in Phase 0). 0 console/http errors.
- `scenarios/mobile-audit.json` re-run (into `shots-mobile/`): **9/9**, 0
  console/page errors — no Phase 0 regressions.
- `scenarios/phase1-simplifications.json` (390×844): 14/16 steps; the 2
  failures are the expected `/posts`-at-390 `fill #searchQueryInput` timeout
  (SearchBar lives in the sidebar, hidden ≤960px by design — not a
  regression). Passes: B4 home search → full-document nav to
  `/posts?search=home`; B6 `/tags` h1 at top=68 (48px bar + 20px margin),
  left=20; B3 `/signUp` (after Sign Out) renders exactly 3 inputs
  (Name/Email/Password), `#username` absent.
- B4 /posts-at-1440 follow-up (fresh login): `/posts` → fill "test" → Enter
  → **`/posts?search=test`** (native submit preserved).

**Visual sanity (after-screenshots read)**
- `shots-mobile/p1nav-mobile-posts.png` — top bar (brand left, hamburger
  right), 2-col grid, single-row toolbar, single bottom bar, no FAB, no
  ruler.
- `shots-mobile/p1-home.png` — full-width fluid token hero, 1-line title,
  compact search.
- `shots-mobile/p1nav-menu-open.png` — off-canvas menu, "Posts" active,
  theme row at bottom.
- `shots-mobile/p1-badge-postsByDate.png` — mobile filter row + "+1" corner
  pill with 4th thumbnail visible behind.
- `shots-mobile/p1nav-band-700-posts.png` — 700px band: bar + brand, 3-col
  grid, single-row toolbar, one bottom bar.
- `shots-mobile/m05-review.png` — Phase 0 fix intact under the new bar:
  compact toolbar fits (Prev / "1 / 5 — 17867…" ellipsized / Next / Delete),
  full-width image, no horizontal overflow.
- `shots/p1d-posts.png` — 1440: 4-col grid unchanged, active "Posts" nav
  link (the only allowed desktop visual delta), top pagination bar removed
  (intended A5 change).

## Deviations from the docs

1. **`navigation.svelte` gained `lang="ts"`** — the doc's edit list didn't
   call this out, but svelte-check flags the doc's unannotated
   `function isActive(href)` as a new error ("implicitly has an 'any' type"),
   and an annotation requires TS mode. One attribute, behavior-neutral.
2. **`/posts` 390px B4 search step is untestable by harness** (SearchBar is
   inside the ≤960px-hidden sidebar — pre-existing, also noted by the
   mobile-layout doc's A2/A6 "search not in toolbar" correction). B4 verified
   from home (390) and /posts (1440) instead.
3. **Badge seed required one extra upload** — the DB had 4 images at impl
   time (a Phase 0-era delete), so the 5-image "+1" event had to be
   re-established by uploading `app/images/1786767551613.jpg` (visible in
   after-shots as "v2 2791ba"). First attempt used an already-seeded file and
   was correctly dedupe-skipped.
4. **The pre-existing grid inline styles were unbalanced** (missing final `)`
   on all four `repeat(auto-fit, minmax(...)` values). Chromium lenient-parses
   them, so desktop behavior was real, not dead CSS. A2's balanced
   replacements preserve the resolved track sizes (probed identical at 1440)
   — recorded here so the verify lane doesn't flag the paren as a regression.

## Residual risks

- **iOS safe-area:** `env(safe-area-inset-top)` resolves 0 until
  `viewport-fit=cover` lands (Phase 2/3); bar auto-grows when it does.
- **~48px extra scroll at bottom of mobile /review** — accepted owner call
  (A1 risk note); retune to `calc(100vh - 48px - ...)` in Phase 3 if it
  bothers.
- **Open menu paints over the bar's brand corner** (both z-index 1000, menu
  later in DOM) — intended per design; hamburger stays tappable to close.
- **A6 row can still wrap below ~330px viewports** — 390px target unaffected
  (doc risk 6, no mitigation by design).
- **`batch-menu-overlay` (z:999) dims the page but not the z:1000 bar** —
  cosmetic, pre-existing z regime (doc risk, not touched).
- **Faux-bold active links** — Montserrat 600 is synthetic (weight not
  loaded); consistent with existing 600 usage; font weights are Phase 2.
- **DB now has 5 images / 1 event** (4 pre-existing + 1 seed upload) — the
  "v2 2791ba" green image is test data, same class as the existing probes.
- **Deferred candidates remain** (5 items in `simplifications.md` "Additional
  candidates", plus dead `imageBrowser.svelte` / broken
  `svelteComponents/imageGrid.svelte` from the layout doc) — owner decides
  later; none touched.
