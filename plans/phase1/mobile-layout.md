# Phase 1 mobile layout — A2 2-col grid, A3 /postsByDate filters, A4 fluid hero, A5 single pagination bar, A6 toolbar compaction, B7 hold-to-scrub removal
## Summary
Six verified, CSS/markup-scoped changes for Phase 1 (scope: `plans/phase1/scope.md`). Two important corrections to the tasking, both verified against code: (1) `app/src/lib/imageBrowser.svelte` (the 200px/20px-gap grid component) is **dead code — no route imports it**; the live grids are inline in `/posts`, `/postsByDate/[slug]`, `/postsSmart` plus the shared `ContentGrid`; (2) at 390px the visible `/posts` toolbar is **Review + SIZE + LENGTH only** — the search input and Tags pill live in the sidebar that hides at ≤960px (same as `/postsByDate`), so A6 compacts the three visible controls and does not restore search (out of scope). Desktop guard strategy per item: A2 needs **no** media query (identity proven for viewport ≥ 834px), A3 uses `max-width: 960px` (exactly complementary to the SideBar hide), A4/A6 use `max-width: 768px`, A5/B7 are owner-approved all-viewport behavior changes. B7 deletes ~420 of pageNav.svelte's 602 lines, leaving a ~180-line component with simple prev/next + indicator + `buildUrl` param preservation + 44px coarse-pointer targets + aria attributes; the "return page from post position" feature is fully separable and is kept.
## Current state (verified)
- **Grids (A2).** `app/src/lib/imageBrowser.svelte` (12 lines: `minSize=200`, `repeat(auto-fit, minmax({minSize}px,1fr)`, gap 20px) is imported nowhere (grep `imageBrowser`/`ImageBrowser` over `app/` → only class-name matches). Live grids: `app/src/routes/posts/+page.svelte:98`, `app/src/routes/postsByDate/[slug]/+page.svelte:236`, `app/src/routes/postsSmart/+page.svelte:203` — all `style="grid-template-columns: repeat(auto-fit, minmax({$improvImageSize}px, 1fr)"` with CSS `.imageGrid { display:grid; gap:5px; width:100% }` in each page; `$improvImageSize` is a persistent store defaulting to 200, options 110/150/200/300/350 (`app/src/lib/stores/searchStore.ts`). `app/src/lib/svelteComponents/contentGrid.svelte:65` has `minmax({minSize}px,1fr)`, gap 10px; used by `/postsByDate` (`minSize={220}`, `postsByDate/+page.svelte:71`) and `/postsDynamic` (default 200). `/postGroups` has its **own** grid `minmax(110px,1fr)` (`postGroups/+page.svelte:51`) and its own text pagination — does not share, out of scope (issue #8). At 390px `/posts` has 358px available (390 − 2×1rem `.imageBrowser` padding; `+layout.svelte` zero-margins `.flexContainer` at ≤768px) → 1 column (2×200+5=405 > 358).
- **/postsByDate (A3).** `postsByDate/+page.svelte:51-66`: `SideBar itemCount={3}` wraps SearchBar, `.event-settings` (h3 "Upload Events" :54, label `for="threshold-select"` :55, `select#threshold-select` :56-60 with 8 options 15min–48h bound to `$state selectedThreshold`, `onchange={applyThreshold}` which `goto`es with `threshold`+`skip=0`), `.event-stats` "{totalEvents} events from {totalImagesScanned} images" :61-63, TagSection. `app/src/lib/sideBar.svelte`: `@media (max-width: 960px) { .sideBar { display: none; } }` → at 390px the page has **zero** filtering controls (confirmed in `dev/harness/shots-mobile/m03-postsByDate.png`: only PageNav + one card + "Showing 1 upload events"). `UploadEventCard.svelte:70,73`: 4th thumb cell gets `.overflow-count` "+{imageCount−4}" when `imageCount>4`; its CSS (line 160) is `position:absolute; inset:0; background:rgba(0,0,0,0.5); color:white; 1.5rem bold` — a full-cell dim overlay. In m03 the 4th thumbnail is a bright green test image ("unique 59dc43"), so the cell reads as a flat green slab with a low-contrast "+1".
- **Home hero (A4).** `app/src/routes/+page.svelte` (43 lines): `.midContainer` height 800px (:18); `.Home` width 1200px / max-width 70% / height 800px / `background-color:#2b4f81` / radius 10px (:21-31); `.Home * { margin: 100px }` (:33-35) — note its specificity (0,1,0) **overrides** the declared `h3` margin `0 180px 10px`, so the title effectively has 100px margins; h3 57px Orbitron `#ffecef` (= light theme `--bg-primary`) (:37-42). m01-home.png at 390px: title wrapped to 3 lines, 800px blue slab, search bar 100px-margined. `theme.css` tokens available: `--bg-accent` (light #8dd4b8 / dark #1f6feb), `--text-primary` (light #345d7e / dark #c9d1d9); large-text contrast for the Orbitron title ≈4.0:1 light, ≈3.0:1 dark (both ≥3:1).
- **Pagination bars (A5).** `PageNav` instances (grep, complete): `/posts` **two** — top `posts/+page.svelte:73-78` (passes `length={$imageCount}` :77) and bottom :126-130 (no length); `/postsByDate/[slug]` **two** — :188-193 (length :192) / :268-272 (none); `/postsSmart` **two** — :163-169 (length :168) / :301-306 (none); `/postsDynamic` **two** — single-line :296 / :309 (identical props); `/postsByDate` **one** — :69 (`totalPages={1}`, all links disabled). `/postGroups` uses no PageNav. `pageNav.svelte` `buildUrl` (:60-79) copies the current query string, then sets `page` and `len=length` (default 24) — so the top instances currently preserve the user's Length while a length-less bottom bar would reset `len→24`. Confirmed visually in `shots/02-posts.png` (bars above and below the grid).
- **/posts toolbar (A6).** Children of the `flex-wrap` `.imageBrowser`: top PageNav (removed by A5), `a.reviewLink` "Review" (17px, `#dc3545` outline — existing), two `span` labels + native selects (SIZE 110–350, LENGTH 24–96; `/posts` selects already token-styled: `var(--text-primary)`, `var(--bg-input)`, `var(--border-color)`). m02/m11 at 390px: Review+SIZE row 1, LENGTH row 2 (~90px band).
- **pageNav.svelte (B7).** 602 lines (`</style>` at :602). Full scrub inventory verified with line numbers (cut list below). Repo-wide grep for `scrub|ruler|vibrate|holdMs|holdGrow|holdPulse|rulerUnfurl|rulerThunk|tick-label|tick-line|ruler-thumb|ruler-target`: matches only in `pageNav.svelte` itself, `plans/phase1/scope.md`, `plans/phase0/postgroups-error.md` (historical text), and `.git/logs` (commit messages). **Zero** matches in `dev/` (no harness scenario references scrub) and zero other hits in `app/src`. No caller passes `holdMs`/`tiers`/`size`/`queryParams` to PageNav (all 8 use-sites inspected). No `pageNav` tests exist; the only test file, `app/src/lib/__tests__/returnTo.test.ts`, covers the return-to feature only.
- **Return-page feature (B7 entanglement).** Committed as `c1d9c4af` "Calculate post return page from current post position" + `4cff5298` fix, i.e. *after* the scrub commits (`2d9cf7a`, `1406881`). It spans `lib/returnButton.svelte` (`goto('/posts?imageId=…')`, used by /review), `lib/backToPrevious.svelte` + `lib/returnTo.svelte.ts`, `+layout.svelte` (save/restore listing URL+scroll), `posts/+page.server.ts` (imageId → docsBeforeImage → pageNum), `posts/+page.svelte` onMount (swap URL to `?page=N`, delete `imageId`), and `returnTo.test.ts`. `pageNav.svelte` contains no reference to `imageId`/`returnTo` → **fully separable; keep all of it unchanged**.
## Recommended fix
### A2 — fluid 2-column mobile grid
Change exactly four inline `style` attributes to `repeat(auto-fit, minmax(min(42vw, Npx), 1fr))`; no CSS changes, no media query:
1. `app/src/routes/posts/+page.svelte:98` → `minmax(min(42vw, {$improvImageSize}px), 1fr)`
2. `app/src/routes/postsByDate/[slug]/+page.svelte:236` → same
3. `app/src/routes/postsSmart/+page.svelte:203` → same
4. `app/src/lib/svelteComponents/contentGrid.svelte:65` → `minmax(min(42vw, {minSize}px), 1fr)` (fixes the same 1-col bug on `/postsByDate` + `/postsDynamic`; drop this line if the owner wants only the three image pages — see Risks)
Math (gap 5px / 10px): at 390px `min(42vw,N)=min(163.8,N)` → N=200/300/350 gives **2 columns** (≈176.5px / ≈180px tracks), N=110 stays 3, N=150 stays 2. `min(42vw,N)=N` whenever viewport ≥ N/0.42, so identity holds for all viewports ≥ **834px** (N≤350) on the image pages and ≥ **524px** on ContentGrid; 1440px is byte-identical. `/postGroups` untouched.
### A3 — /postsByDate mobile filter row + overflow badge
`app/src/routes/postsByDate/+page.svelte` — insert as first child of `.content-area` (line 68), **before** `<PageNav>` (:69):
```svelte
<div class="mobile-filter-row">
	<label class="threshold-label" for="threshold-select-mobile">Event gap:</label>
	<select id="threshold-select-mobile" bind:value={selectedThreshold} onchange={applyThreshold}>
		{#each thresholdOptions as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
	<span class="event-stats">{data.totalEvents} events from {data.totalImagesScanned} images</span>
</div>
```
Append to the page `<style>` (existing scoped `.threshold-label`/`.event-stats` rules already apply to these elements; distinct id avoids the duplicate-`#threshold-select` HTML issue):
```css
.mobile-filter-row {
	display: none;
}
@media (max-width: 960px) {
	.mobile-filter-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		padding: 10px 0;
	}
	.mobile-filter-row select {
		padding: 6px 8px;
		border-radius: 6px;
		border: 1px solid var(--border-color);
		background: var(--bg-input);
		color: var(--text-primary);
		font-family: 'Montserrat', sans-serif;
		font-size: 0.9rem;
	}
	.mobile-filter-row .event-stats {
		margin: 0;
	}
}
```
The row is visible exactly when `.sideBar` is hidden (both `max-width: 960px`) → zero controls lost, zero desktop change.
Badge: `app/src/lib/svelteComponents/UploadEventCard.svelte` — append (base `.overflow-count` rule at :160 stays, so >960px keeps today's full-cell overlay = pixel-identical):
```css
@media (max-width: 960px) {
	.overflow-count {
		inset: auto;
		right: 6px;
		bottom: 6px;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.8rem;
	}
}
```
Result: corner pill reusing the existing `rgba(0,0,0,0.5)` scrim + white text (zero new color values); the 4th thumbnail stays visible behind the badge.
### A4 — fluid theme-aware home hero
`app/src/routes/+page.svelte` — append one media block before `</style>` (line 43); existing rules (:13-42) untouched so >768px is byte-identical:
```css
@media (max-width: 768px) {
	.midContainer {
		height: auto;
		min-height: 50vh;
	}
	.Home {
		width: 100%;
		max-width: 100%;
		height: auto;
		min-height: 380px;
		background-color: var(--bg-accent);
	}
	.Home * {
		margin: 0;
	}
	.Home h3 {
		font-size: clamp(28px, 9vw, 44px);
		margin: 40px 16px 32px;
		color: var(--text-primary);
	}
}
```
`.Home h3` (0,1,1) beats `.Home *` (0,1,0) for the title margins; the media `.Home *` wins the base `.Home *` by source order. At 390px: 390px-wide token-tinted hero (dark `#1f6feb` / light `#8dd4b8`), title 35.1px in ≤2 lines, no 800px slab, search bar no longer 100px-margined. At 1440px: unchanged 907×800 `#2b4f81` box, 57px `#ffecef` title.
### A5 — one pagination bar per page (keep BOTTOM)
Per-page edit list (verified line numbers):
| Page | File | Top instance | Bottom instance | Edit |
|---|---|---|---|---|
| /posts | `app/src/routes/posts/+page.svelte` | :73-78 (has `length={$imageCount}` :77) | :126-130 (no length) | Delete :73-78; add `length={$imageCount}` to the bottom instance |
| /postsByDate | `app/src/routes/postsByDate/+page.svelte` | :69 (only instance, `totalPages={1}`) | — | No edit (single bar; see Risks) |
| /postsByDate/[slug] | `app/src/routes/postsByDate/[slug]/+page.svelte` | :188-193 (length :192) | :268-272 (no length) | Delete :188-193; add `length={$imageCount}` to bottom |
| /postsSmart | `app/src/routes/postsSmart/+page.svelte` | :163-169 (length :168) | :301-306 (no length) | Delete :163-169; add `length={$imageCount}` to bottom |
| /postsDynamic | `app/src/routes/postsDynamic/+page.svelte` | :296 (self-closing) | :309 (self-closing) | Delete :296 |
| /postGroups | `app/src/routes/postGroups/+page.svelte` | none (own `.pgnumCont` pagination) | none | No edit |
**The `length` prop move is required, not cosmetic:** `buildUrl` unconditionally sets `len` = the `length` prop (default 24); without it the surviving bottom bar would reset the user's chosen Length (e.g. 96) on every page click. Moving it preserves the behavior the top bar (the one with the prop) currently provides. The removed top bar is a deliberate owner-approved desktop+mobile change; everything else on desktop is unchanged.
### A6 — /posts mobile toolbar compaction
`app/src/routes/posts/+page.svelte` — append to `<style>` before `</style>` (currently line 216). Keeps native selects and current control styling (the `/posts` selects are already token-based); ≥769px untouched:
```css
@media (max-width: 768px) {
	.reviewLink {
		font-size: 14px;
		padding: 3px 10px;
		margin: 5px 6px 5px 0;
	}
	span {
		font-size: 0.7rem;
		margin: 5px 6px 5px 0;
		white-space: nowrap;
	}
	select {
		font-size: 0.8rem;
		padding: 4px 6px;
		margin-right: 8px;
	}
}
```
Budget at 390px (358px available): Review ≈77 + SIZE ≈44 + select ≈62 + LENGTH ≈58 + select ≈54 ≈ **295px → single row, ~45px band** (was ~90px). **Assumption (stated, per tasking):** the A1 design (`plans/phase1/mobile-nav.md`) adds a sticky top bar of **48px + safe-area inset** at ≤768px. A6 stacks below it in-flow; pass criteria are relative (controls share one row), so the exact bar height does not affect A6 verification. The A1 bar is `position: sticky` (in-flow), so no body padding-top compensation is needed anywhere.
### B7 — remove hold-to-scrub pagination (all viewports)
File: `app/src/lib/pageNav.svelte` (602 lines). Delete exactly:
**Script**
- :14-23 — "Hold-to-scrub settings" comment, `export let holdMs = 400`, `export let tiers = [{40→10},{120→50},{240→100}]`
- :25-31 — `RULER_PX = 160`, `maxTierPx`, `rulerScale`, `rulerTicks`, closing comment
- :38-50 — scrub state: `scrubButton`, `arming`, `armed`, `scrubStartY`, `scrubDrag`, `scrubJump`, `scrubTarget`, `thunked`, `suppressClick`, `scrubPointerId`, `armTimer`, `thunkTimer` (+ comment)
- :52-58 — `clamp()` (used only by scrub at :109/:144) and `vibrate()` (`navigator.vibrate`)
- :93-124 `startScrub` (400ms arm timer, 10ms arm haptic, window pointer listeners, `e.preventDefault` link-drag fix), :126-153 `onScrubMove` (drag tiers 40/120/240px → 10/50/100, 15ms tier ticks, 25ms boundary thunk + 180ms `thunkTimer`), :155-163 `resetScrub`, :165-169 `onScrubEnd`, :170-173 `onScrubCancel`, :175-190 `endScrub` (release-only `goto(buildUrl(scrubTarget))`, `suppressClick`), :191-196 `onClickGuard`
**Markup**
- :207 — remove `style="--hold-ms: {holdMs}ms"` from `<nav>` (keep `class="pagination {size}"` + `aria-label="Pagination"`)
- :217-221 + :254 — prev `span.scrub-wrap` (with `class:arming`/`class:armed`); keep the inner `<a>` (:222-232) minus `draggable={false}` (:227), `on:pointerdown` (:228), `on:click={onClickGuard}` (:229)
- :233-253 — prev `{#if armed}` notched-ruler block (`scrub-ruler side-left`, `ruler-track`, `ruler-tick`/`tick-label`/`tick-line` each, `ruler-thumb`, `ruler-target`)
- :258-262 + :295 — next `span.scrub-wrap`; keep inner `<a>` (:263-273) minus :268-270
- :274-294 — next ruler block
**CSS**
- :392-601 — entire "Hold-to-scrub" section: `.scrub-wrap` (+ `margin/touch-action/user-select`), `::before` arming glow, `.arming`/`.armed` states, hover-suppression, state-held look, `@keyframes holdGrow`/`holdPulse`, `.scrub-ruler` (+ side-right/side-left, `rulerUnfurl`), `.ruler-track`, `.ruler-tick`, `.tick-label`, `.tick-line`, active variants, `.ruler-thumb`, `.ruler-target`, `.scrub-ruler.thunk` + `@keyframes rulerThunk`
**Keeps (must remain byte-equivalent):** imports + props `currentPage/totalPages/baseUrl/queryParams/length/size/pageText` (:1-12), `nextPage/prevPage/firstPage/lastPage` (:33-36), `buildUrl` (:60-79, query-param preservation incl. search/notag/threshold + `page`+`len`), `updateUrls` (:84-90), `onMount`/`beforeUpdate` (:198-204), first/last links, `.pagination` + `.pagination-item` (40px base, white/`#808080`, hover pulse), `aria-disabled` dimming, `.page-nav-info` indicator, `@media (pointer: coarse) { 44px }` (:381-385), `:focus-visible` rule. Replacing the scrub-wrap `<span>` with the bare `<a>` keeps 5 flex children; the wrap's `margin:0 5px` equals the item's base `margin: 0 5px` → identical layout. **Estimated resulting size ≈ 180 lines (range 175–195; gate: `wc -l` ≤ 200).**
**Post-change grep gate:** `grep -rn "scrub\|vibrate\|ruler\|holdMs\|tick-label\|tick-line" app/src` → zero matches.
**Return-page entanglement answer: separable — keep it.** No shared code: `pageNav.svelte` never references `imageId`/`returnTo`; the feature's files (`returnButton.svelte`, `backToPrevious.svelte`, `returnTo.svelte.ts`, `+layout.svelte`, `posts/+page.server.ts`, `posts/+page.svelte` onMount, `returnTo.test.ts`) are untouched by B7. The only interaction — `buildUrl` carrying the current query string (so a still-present `imageId` would re-anchor the server) — exists identically today with scrub and is unchanged. No lines of the return feature are modified.
## Alternatives considered
- **A2:** `repeat(2, 1fr)` media-forced columns — rejected (fights the user's SIZE select: 110 should stay 3-col, 350 legitimately 1-col on very narrow screens); reviving dead `imageBrowser.svelte` for all grids — rejected (its 20px gap + `minSize` prop ≠ the pages' 5px + store; a refactor, not a fix); fixed breakpoint at 480px — rejected (non-fluid).
- **A3:** making `SideBar` visible/horizontal at ≤960px — rejected (shared by 6 pages; would restyle every one); moving `.event-settings` out of the sidebar and reflowing with grid areas — rejected (DOM move + brittle cross-breakpoint plumbing); chosen: two bound instances, one always `display:none` (~8 lines duplicated, shared `$state` + `applyThreshold`). Badge alternatives: top-right circular chip vs bottom-right pill — pill chosen (clear of the "N images" header at top-left; reuses existing scrim color).
- **A4:** tokenizing the hero at all sizes — rejected for Phase 1 (breaks 1440 identity; repo-wide tokenization is Phase 2, this item is explicitly the mobile exception); `vh`-fixed hero — rejected (not content-fluid); chosen `min-height` + `clamp`.
- **A5:** keep top/remove bottom — rejected (owner: keep bottom); delete both + re-add one — same result, larger diff; chosen: delete top in place, move `length` prop.
- **A6:** hiding "Size/Length" label text for aria-labeled selects — rejected (tasking: keep current control styling; labels are text, not styling, and hiding them adds a11y work); horizontally scrollable toolbar — rejected (hidden affordance); chosen: shrink font/padding to fit one row.
- **B7:** keeping scrub disabled at ≤768px — rejected (owner: remove at all viewports); replacing with a simpler hold-to-jump — rejected (new feature, opposite of simplification).
## Simplification opportunities
1. `app/src/lib/imageBrowser.svelte` — dead (no importers); delete or adopt in a later lane (not in A2's minimal diff).
2. `app/src/lib/svelteComponents/imageGrid.svelte` — dead **and syntactically broken** (`export const images`, stray `toggleSelectMode();`, unterminated `{onCli }}`); delete.
3. `posts/+page.svelte:147-151` — `@media (min-width: 960px) { .imageGrid { gap: 5px } }` is redundant (base gap already 5px); dead CSS, zero-visual-change removal.
4. `pageNav.svelte` — `size` prop (default `'unused?'` leaks a literal class into the DOM) and `queryParams` prop are unused by all 8 call sites; clean up after B7.
5. `sideBar.svelte` — `itemCount` sets `--item-count`, consumed by no rule.
6. `postsByDate/[slug]/+page.svelte:21` and `postsSmart/+page.svelte:31` — `$: selectionMap` reactives never referenced in templates.
7. B7 itself: −~420/602 lines (−70%) from `pageNav.svelte`.
8. `/postGroups` still carries its own 110px grid + 4-text-link pagination (not `PageNav`) — consistency follow-up (issue #8), not this phase.
## Validation plan
Harness constraints (per `dev/harness/drive.mjs` source): the app has **no `<main>`** — new scenarios must not use `waitFor: "main"` (the built-in smoke preset's post-detail conditional does; avoid that pattern and use concrete selectors); a bare `h1` waitFor resolves to the layout logo h1 (`.logo h1` in `+layout.svelte`, visible at 1440px, `display:none` ≤768px) — scope all heading probes to containers (`.Home h3`, `.event-header-bar h2`); every `eval` probe below is an **IIFE string**. Baseline: per scope process, back up existing shots to `shots-phase1-before*` before implementation.
**Scenarios (impl lane creates):**
1. `phase1-layout-mobile` — viewport 390×844, theme dark, `outDir: dev/harness/shots-mobile`:
   `{route:"/", screenshot:"p1-home"}` → A4 probe; `{route:"/posts", screenshot:"p1-posts"}` (viewport shot) → A2/A5/A6/B7 probes; `{route:"/posts", screenshot:"p1-posts-full", fullPage:true}` (bottom-bar position); `{route:"/postsByDate", screenshot:"p1-postsByDate"}` → A3 probe; `{click:"a.event-card-link", waitFor:".event-header-bar", screenshot:"p1-event"}` → badge probe (seed via existing `seed-uploads.json`, which batch-uploads 5 files → one event with "+1"); `{route:"/postsSmart", screenshot:"p1-postsSmart"}` and `{route:"/postsDynamic", screenshot:"p1-postsDynamic"}` → A2 probes. Optional: `{eval:"(function(){ localStorage.setItem('imageSize','110'); return 1; })()"}`, goto `/posts`, probe 3 columns, then reset `'200'`.
2. `phase1-layout-desktop` — viewport 1440×900, theme dark, `outDir: dev/harness/shots`: full smoke re-capture (`01-home`…`10-post-detail`) plus a conditional event-detail step using `waitFor: ".event-header-bar"` (never `main`).
**Probes and pass criteria:**
- **A2** 390 `/posts`: `(function(){var g=document.querySelector('div.imageBrowser > .imageGrid');var t=getComputedStyle(g).gridTemplateColumns.split(' ');return JSON.stringify({cols:t.length,tracks:t.map(function(x){return Math.round(parseFloat(x));}),gridW:Math.round(g.getBoundingClientRect().width)});})()` → `cols==2`, tracks 165–190, `gridW` 358±4. Same probe at 1440: value must equal the **pre-change baseline** recorded by the impl lane **before** editing (columns + track widths); vision read of the 1440 capture must match `shots-phase1-before/02-posts.png`.
- **A3** 390 /postsByDate: IIFE reading `.mobile-filter-row` display, `.sideBar` display, select `options.length`, `.event-stats` text, badge-vs-cell rects → row display ≠ 'none', sideBar 'none', 8 options, stats contains "events", badge present: badgeH < cellH/2 and badgeRight ≈ cellRight−6 (±1). 1440: row display 'none', sideBar 'flex', badgeW ≥ cellW−1 (old full-cell overlay retained).
- **A4** 390 `/`: IIFE for `.Home` rect + computed bg + h3 color/size/line-count → homeW ≥ 350, homeH 380–560, bg rgb(31,111,235) (dark `--bg-accent`), title rgb(201,209,217), titleSize 28–44px, lines ≤ 2. 1440: homeW 907±2, homeH == 800, bg rgb(43,79,129), title 57px.
- **A5** each listing route: IIFE `document.querySelectorAll('nav.pagination').length` → /posts, /postsByDate/[slug], /postsSmart, /postsDynamic == 1 (was 2); /postsByDate == 1. len-preservation (conditional, seed ≥ 2 pages): click `a[aria-label="Next page"]` → URL keeps `len=24`, page+1; manual spot: `/posts?len=96&page=2` → next → `?len=96&page=3`.
- **A6** 390 /posts: IIFE returning rounded `top` of `.reviewLink` + both `.imageBrowser select` → all within ±2px (single row), band height ≤ 45px.
- **B7** both viewports: IIFE over `nav.pagination` → no `.scrub-wrap`, no `.scrub-ruler` in document, no `--hold-ms` style on nav, aria-labels == [First page, Previous page, Next page, Last page], `.page-nav-info` text "Page 1 / 1", button size == (matchMedia('(pointer: coarse)').matches ? 44 : 40) (headless → 40; 44px rule verified as retained CSS + conditional). No-scrub behavior (conditional, multi-page): pointerdown Next, hold 600ms, drag up 60px, release → URL unchanged, no ruler element. Global: harness `report.ok === true` (no console/page errors, no request failures).
## Risks / open questions
1. **A2 scope (low):** `contentGrid.svelte:65` formula also changes /postsByDate + /postsDynamic mobile (1→2 cols) — same bug, intentional; if owner wants only the three image pages, drop that one line (no other dependency).
2. **A3 markup duplication (low):** two threshold selects bound to the same `$state selectedThreshold` + `applyThreshold`; exactly one visible per breakpoint; distinct ids → no invalid HTML.
3. **A4 desktop tokens deferred (info):** >768px hero stays hardcoded `#2b4f81`/`#ffecef`; tokenizing the desktop hero in Phase 1 would break 1440 pixel identity → scope change if wanted.
4. **A5 /postsByDate single bar (info):** its only PageNav (`postsByDate/+page.svelte:69`, `totalPages={1}`, all links disabled) sits above the content; left in place (minimal diff). Moving it below `ContentGrid` is an optional consistency tweak — flag for owner.
5. **A5 len prop (low):** moving `length={$imageCount}` to the bottom bar preserves the top bar's len behavior; if the owner accepts the bottom bar's historical `len=24` default, skip the prop move (one-line diff difference).
6. **A6 ≤320px (low):** the ~295px compact row can still wrap below ~330px viewports; 390px target unaffected; no mitigation.
7. **A6/A1 coupling (resolved):** A1 (`plans/phase1/mobile-nav.md`) adds a 48px + safe-area `position: sticky` bar at ≤768px. A6 criteria are relative, so the exact bar height can't break A6 verification; the two items compose cleanly (bar above, compact toolbar below).
8. **B7 haptics untestable headless (info):** `navigator.vibrate` isn't exercised by the harness; evidence = post-change grep gate (zero `vibrate|scrub|ruler|holdMs` under `app/src`) + code review.
9. **B7 do-not-touch `holdClick` (medium):** the hold-to-select action (`app/src/lib/actions/holdClick.ts`, used by /postsSmart's grid and dead `svelteComponents/imageGrid.svelte`) is unrelated to the scrub — must not be removed or modified.
10. **Pixel-identity evidence (info):** harness has no pixel-diff tool; 1440 regression = vision read of before/after shots plus identical computed-style probe values (incl. the A2 pre-change baseline capture).
