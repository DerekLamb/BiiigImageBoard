# Phase 1 A1 — Sticky mobile top app bar, active-route indicator, 600–768px band fix

## Summary

Replace the bottom-right fixed hamburger FAB with a **sticky top app bar** (compact `b..d` brand mark + hamburger, top-right) at `≤768px`, collapse the nav's two overlapping media queries (600px / 768px) into a **single 768px boundary** in both `navigation.svelte` and `slideMenu.svelte`, and add an **active-route indicator** (`class="active"` + `aria-current="page"`, derived from the `$app/state` page rune) to the nav links in **both** the desktop navbar and the mobile SlideMenu. Bar height: **48px content + `env(safe-area-inset-top, 0px)`**, in-flow `position: sticky` (no fixed positioning, no page-level padding changes). The 600–768px band gets the bar; the menu is visible whenever the hamburger is, by construction (same breakpoint, hamburger lives inside the bar). Desktop `>768px` is byte-for-byte the same layout, gaining only the active indicator. All new/changed CSS uses existing `theme.css` tokens. No changes to `+layout.svelte`, no second theme toggle, no new hardcoded colors.

Two important verified corrections to the incoming brief are called out in *Current state (verified)* and *Risks*: (1) at 600–768px the SlideMenu is **not** invisible today — it resolves to `display: flex` (the later-declared `max-width:768px` block wins the cascade); the verified band defect is "no top nav, no brand, orphaned FAB"; (2) `navigation.svelte` is currently a **legacy-mode** (non-runes) component, so adding the required runes forces a mode switch including 10× `on:click` → `onclick` conversions.

## Current state (verified)

All line numbers are against HEAD `3e1a517` (branch `main`, verified via `.git/refs/heads/main`; matches the Phase 0 tip listed in `plans/phase1/scope.md`).

**`app/src/lib/navigation.svelte` (332 lines, scoped `<style>` at 58–332, legacy Svelte 5 mode — no runes):**

- Markup 16–30: `.navContainer > .navbar` containing 7 hardcoded links (19–25: `/posts`, `/postsByDate`, `/review`, `/tags`, `/upload`, `/`, `/login`) + round moon `.theme-toggle` button (26–28) calling `toggleTheme()` → `theme.toggle()` (script 11–13, store `app/src/lib/stores/themeStore.ts:31-40`).
- Markup 32–37: standalone `<button class="menu-button" class:open={menuOpen} on:click={toggleMenu}>` with three `<i>` bars — the fixed FAB.
- Markup 39–56: `{#key menuOpen}<SlideMenu {menuOpen}>` with the 7 menu links (43–49, each `on:click={toggleMenu}`) and the Phase 0 theme row as **last** item (50–54, `on:click={toggleTheme}` only — no `toggleMenu`, so the menu stays open after toggling; confirmed by `dev/harness/shots-mobile/m13-slide-menu-after-theme-toggle.png`).
- `@media (min-width: 600px)` (59–71): `.navbar`/`.navContainer` `display:flex`, `.menu-button` `display:none`.
- `@media (max-width: 768px)` (73–84): `.menu-button` `display:block` (74–76), `.navbar` `display:none` (77–79), `.navContainer` `display:none` (81–83).
- Cascade at 600–768px: both blocks match; same specificity; **the later-declared `max-width:768px` block wins per property** → mobile mode: FAB visible, navbar hidden. Verified, matches the brief.
- Base rules: `.navContainer` (85–88: `justify-content: space-between; padding: 1rem;`), `.navbar` (90–92: `align-self: stretch;`), `.navbar a` (94–101: `var(--nav-text)`, Montserrat 1.2rem, `display: inline`), `.theme-toggle` (103–124: 36px circle, `var(--button-bg)`), `li` (126–133: styles the SlideMenu slot items, which carry this component's scope hash), `a:hover` blinkFade (135–137), `a`/`a:visited` (139–145), `@keyframes blinkFade` (147–152).
- `.menu-button` (155–169): `position: fixed; right: 30px; bottom: 30px;` + **transform quirk**: `transform: translateX(-50%);` (164) then `transform: translateY(-50%);` (165) — the second declaration wins, so the effective transform is `translateY(-50%)` = −35px (half the 70px border box); the first is dead. `z-index: 1000` (167). Geometry: `width/height: 50px` + `padding: 10px` with **no global box-sizing** (grep: `box-sizing` appears only per-component, e.g. `lib/video.svelte:60`) → rendered FAB is a 70px circle, not 50px.
- `.menu-button i` (171–178), nth-child entry animations (179–197), `.menu-button.open i` exit animations (198–209), 12 keyframe rules (211–331) — all still needed by the in-bar button.
- `on:click` occurs at lines 26, 33, 43–49, 51 = **10 occurrences** (parent-verified via grep 2026-09-21); `let menuOpen = false;` at line 5. No runes anywhere in the file.

**`app/src/lib/svelteComponents/slideMenu.svelte` (54 lines):**

- Markup 5: `<div class="menu-container" class:open={menuOpen} role="menu" tabindex="0">` wrapping `<nav><ul><slot/></ul></nav>` — no `id`, no backdrop.
- `@media (min-width: 600px)` (14–18): `.menu-container { display: none; }`.
- `@media (max-width: 768px)` (20–26): `.menu-container { display: flex; flex-direction: column; justify-content: end; }`.
- **Verified correction to the brief:** at 600–768px both media blocks match; the `max-width:768px` block is **declared after** the `min-width:600px` block, so `display: flex` wins. The menu is therefore **visible** today in the band (the "invisible menu" claim is not supported by the source). The verified 600–768px defects are: no top navbar, no brand, and an orphaned bottom-right FAB.
- Base (28–40): `position: fixed; top: 0; bottom: 0; left: -200px; width: 200px;` `var(--bg-secondary)` background, `box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2)`, `transition: left 0.3s, background-color 0.3s ease;`, `z-index: 1000`. `.open` (51–53) slides to `left: 0`. Items sit **bottom-aligned** (confirmed in `shots-mobile/m12-slide-menu-open.png`: Posts…Login stacked at the bottom, theme row below them; content stays interactive — no scrim).

**`app/src/routes/+layout.svelte`:**

- Structure 53–65: `.mainFlex > .boxContainer > (.logo, .flexContainer)`, where `.flexContainer` (60–63) holds `<Navigation/>` above `<slot/>`. None of `.mainFlex`/`.boxContainer`/`.flexContainer`/`body` sets `overflow` → `position: sticky` will work for an in-flow bar (verified by reading all four rule sets, 67–140).
- Logo markup 55–58 (`b..d` h1 + tagline h3); `.logo h1` style 100–105: `font-family: 'Orbitron', sans-serif; color: var(--text-accent);` (size = browser h1 default). Tagline h3 107–112.
- `@media (max-width: 1450px)` (114–123): tagline hidden, `.boxContainer` full width. `@media (max-width: 768px)` (132–140): `.logo { display: none; }` and `.flexContainer { margin: 0 0; }` → **no mobile brand identity today**, verified. No changes to this file are proposed.

**Tokens (`app/src/lib/styles/theme.css`):** light (4–22) / dark (25–50) palettes. Available: `--bg-primary/secondary/accent/input/card`, `--text-primary/secondary/accent/hover/blink/muted/icon`, `--nav-bg`, `--nav-text`, `--button-bg/text/primary/hover`, `--border-color`. **`--nav-bg` is defined (20, 47) but consumed nowhere** (grep across `app/src`) — the bar therefore uses `--bg-secondary` (solid, theme-correct) rather than the transparent `--nav-bg`.

**Page-state runes precedent:** `import { page } from '$app/state'` (rune, accessed without `$`) already in use at `routes/+error.svelte:5`, `routes/postsDynamic/+page.svelte:32-34`, `routes/postGroups/+page.svelte:7` — SvelteKit `^2.66.0` / Svelte `^5.56.3` (`app/package.json`). Legacy `$app/stores` still exists in other files but is not the pattern we follow.

**Phase 0 mobile surfaces that must not break:**

- `/review`: `reviewContainer` `min-height: calc(100vh - 80px)` (241), `@media (max-width: 960px)` column layout (448–452), `@media (max-width: 768px)` `min-height: 100vh` + compact toolbar (454–485: gap/padding/ellipsis only — no `position`/`top` assumptions, verified), `confirmOverlay` `position: fixed; inset: 0; z-index: 1000` (368–373).
- `/posts`: toolbar is an in-flow flex row (`.imageBrowser`: PageNav + Review link + two selects) — no fixed/absolute elements (verified by full read); sidebar hidden `≤960px` (`lib/sideBar.svelte:14-18`).
- Home `routes/+page.svelte`: no `position: fixed/absolute/sticky` (grep: no matches) — no top-edge conflict.
- z-index peers: `postsByDate/[slug]/+page.svelte` overlay `z:999` / `.batch-menu z:1000` (466–475), `postsSmart/+page.svelte` `.batch-menu z:1000` (431–434), `postsDynamic/+page.svelte` modal overlay (413+).

**Screenshots (read-only reference):** `shots-mobile/m11-mobile-posts.png` (FAB bottom-right on /posts, dark), `shots-mobile/m12-slide-menu-open.png` (open menu: 200px left rail, bottom-aligned items, theme row at bottom). Harness scenarios are 390×844 only (`scenarios/mobile-audit.json`, `scenarios/nav-ia-validation.json`) — **no existing 600–768px shots**; the validation plan adds one.

## Recommended fix

### 1. Decisions (explicit)

| Decision | Value | Rationale |
|---|---|---|
| Bar mechanism | `position: sticky; top: 0` on the existing `.navContainer`, in normal flow | No page-level padding edits, no layout shift on load, `/review`'s `min-height: 100vh` and `/posts` toolbar only translate down 48px. Sticky is safe: no ancestor sets `overflow` (verified). |
| Bar height | **48px content** + `env(safe-area-inset-top, 0px)`, `box-sizing: border-box` (incl. 1px bottom border) | Fits the 44px touch target with 2px slack; ~5.7% of an 844px viewport. |
| Breakpoint | Single `768px` boundary: `@media (min-width: 769px)` (desktop) + `@media (max-width: 768px)` (mobile bar), mutually exclusive, in **both** files. The 600px breakpoint is deleted entirely. | 768 is already the app's mobile boundary elsewhere (`+layout.svelte:132`, `review/+page.svelte:454`); the 600px boundary was nav-only noise. |
| Brand mark | New `<a class="mobileBrand" href="/">b..d</a>` **inside** `.navContainer` (mobile-only), reusing the layout logo's typography (Orbitron, `var(--text-accent)`) at 1.25rem | Keeps `+layout.svelte` untouched; brand + hamburger share one flex row (`justify-content: space-between` already on `.navContainer`). |
| Hamburger | The existing `.menu-button` element **moved** (not duplicated, not deleted) into `.navContainer` after `.navbar`, restyled from fixed FAB to a 44px in-flow circle, top-right | Same `toggleMenu`/`menuOpen`/`{#key}`/SlideMenu wiring — the off-canvas menu is unchanged. |
| Active route | `import { page } from '$app/state'` + `let currentPath = $derived(page.url.pathname)` + `isActive(href)` = `currentPath === href || currentPath.startsWith(href + '/')`; applied as `class:active` + `aria-current="page"` on **both** link sets | No `window.location`. Prefix rule verified for every link: `/posts/[uploadDate]` and `/postsByDate/[slug]` detail routes highlight their parent; `/postsByDate` does **not** false-match `/posts` (`'/postsByDate'.startsWith('/posts/')` is false); `href='/'` → `'//'` prefix never matches, so Home is exact-only. `/review`, `/tags`, `/upload`, `/login` have no sub-routes (verified in `routes/`). |
| Layering | Bar `z-index: 1000` (in MQ, mobile only). SlideMenu keeps `z-index: 1000`; it is later in DOM than `.navContainer`, so the open rail paints **over** the bar's brand corner while the top-right hamburger stays fully clickable (rail is 200px wide; button sits at `right: 12px`). | Matches existing z regime (menu/FAB already 1000). No z-index changes elsewhere. |
| Theme toggle | Unchanged: desktop navbar keeps its toggle (26–28), SlideMenu keeps its Phase 0 row (50–54). **No toggle in the bar.** | Per task. |
| Safe area | `env(safe-area-inset-top, 0px)` in bar height + padding-top only | `app.html:5` lacks `viewport-fit=cover` (viewport meta is explicitly deferred to Phase 2/3 in scope.md), so iOS currently reports 0 — the bar simply sits at the physical top today and will auto-grow into the notch when the meta is fixed. No other safe-area work. |

### 2. Complete edit list

**File 1 — `app/src/lib/navigation.svelte`**

1. **Script (1–14).** Add `import { page } from '$app/state';`. Add:
   ```js
   const NAV_LINKS = [
       { href: '/posts', label: 'Posts' },
       { href: '/postsByDate', label: 'By Date' },
       { href: '/review', label: 'Review' },
       { href: '/tags', label: 'Tags' },
       { href: '/upload', label: 'Upload' },
       { href: '/', label: 'Home' },
       { href: '/login', label: 'Login' }
   ];

   let currentPath = $derived(page.url.pathname);

   function isActive(href) {
       return currentPath === href || currentPath.startsWith(href + '/');
   }
   ```
   Convert `let menuOpen = false;` (5) → `let menuOpen = $state(false);`.
   **⚠ Mode switch:** adding `$state`/`$derived` switches this component from legacy to runes mode. Convert **all 10** `on:click` → `onclick` (lines 26, 33, 43–49, 51) or the build fails / state silently stops updating. `slideMenu.svelte` is **not** touched script-wise (stays legacy; prop passing is unaffected).
2. **Markup (16–56).**
   - Inside `.navContainer` (17), before `.navbar` (18), insert: `<a class="mobileBrand" href="/">b..d</a>`
   - Replace the 7 hardcoded desktop links (19–25) with:
     ```svelte
     {#each NAV_LINKS as link}
         <a href={link.href} class:active={isActive(link.href)}
             aria-current={isActive(link.href) ? 'page' : undefined}>{link.label}</a>
     {/each}
     ```
     Theme toggle button (26–28) stays as the last child of `.navbar`.
   - Move the FAB element (32–37) **into** `.navContainer`, after `.navbar`, and give it `aria-label="Menu" aria-expanded={menuOpen}`.
   - Replace the 7 hardcoded menu links (43–49) with the same `{#each}`, keeping `onclick={toggleMenu}` on each `<a>`. Theme row (50–54) unchanged.
3. **CSS — media-query restructure (replaces 59–84 exactly):**
   ```css
   @media (min-width: 769px) {
       .navbar {
           display: flex;
       }

       .navContainer {
           display: flex;
       }

       .menu-button {
           display: none;
       }

       .mobileBrand {
           display: none;
       }
   }

   @media (max-width: 768px) {
       .navbar {
           display: none;
       }

       .mobileBrand {
           display: inline;
       }

       .menu-button {
           display: flex;
           flex-direction: column;
           justify-content: center;
       }

       .navContainer {
           display: flex;
           position: sticky;
           top: 0;
           z-index: 1000;
           align-items: center;
           height: calc(48px + env(safe-area-inset-top, 0px));
           box-sizing: border-box;
           padding: 0 12px;
           padding-top: env(safe-area-inset-top, 0px);
           background-color: var(--bg-secondary);
           border-bottom: 1px solid var(--border-color);
       }
   }
   ```
   Base `.navContainer` (85–88) keeps `justify-content: space-between; padding: 1rem;` (desktop; mobile padding is overridden in the MQ). **Source-order trap:** the MQ blocks sit *before* the base rules in this file; never give `.navContainer`/`.navbar`/`.menu-button`/`.mobileBrand` a `display` outside these two MQ blocks, or the later base rule will override the MQ.
4. **CSS — new base rule** (place with the other base rules, e.g. after 88):
   ```css
   .mobileBrand {
       margin: 0;
       font-family: 'Orbitron', sans-serif;
       font-weight: 600;
       font-size: 1.25rem;
       color: var(--text-accent);
       text-decoration: none;
   }
   ```
5. **CSS — FAB removal (replace 155–169):** delete `position: fixed;` `right: 30px;` `bottom: 30px;` **both** `transform` lines (164–165, the quirk) and `z-index: 1000;`; change `height`/`width` 50px → 44px; add `box-sizing: border-box; flex-shrink: 0;`. Result:
   ```css
   .menu-button {
       cursor: pointer;
       width: 44px;
       height: 44px;
       padding: 10px;
       box-sizing: border-box;
       flex-shrink: 0;
       border-radius: 50%;
       background-color: var(--button-bg);
       border: none;
   }
   ```
   (The `display: flex; flex-direction: column; justify-content: center;` lives in the `max-width: 768px` MQ above, so the bars — 22px tall in a 24px content box — center vertically.)
6. **CSS — active indicator:** after the `a:visited` rule (145), add:
   ```css
   a.active {
       color: var(--text-accent);
       font-weight: 600;
   }
   ```
   One rule covers **both** surfaces: the desktop `.navbar a` links and the SlideMenu `li a` links are all in this component's scope (slot content compiles with the parent's scope hash). Specificity (0,1,1) beats `a`/`a:visited`; placement after `a:visited` wins the source-order tie.

**File 2 — `app/src/lib/svelteComponents/slideMenu.svelte`**

7. **Line 14 only:** `@media (min-width: 600px)` → `@media (min-width: 769px)`. The `max-width: 768px` block (20–26) stays as-is. The two blocks are now mutually exclusive: `≥769px` hidden, `≤768px` flex/visible — i.e. **the menu is visible exactly when the bar (and thus the hamburger) is visible**, resolving the band structurally. No markup/script changes.

**FAB removal without dead CSS:** every removed declaration (5 geometry + 2 transforms + z-index) dies with the FAB concept; the element itself survives in the bar, so `.menu-button i` (171–178), nth-child (179–197), `.open` (198–209) and all 12 keyframes (211–331) still match real elements. The old `display: block` (75) is replaced by `display: flex` in the MQ. No selector is left without an element, and no new selector references a missing element.

**Where the existing navbar CSS lives (for the impl lane):** everything is in `navigation.svelte`'s scoped `<style>` (58–332) as itemized above; SlideMenu styles in `slideMenu.svelte` (13–54); tokens in `theme.css`; the brand typography being reused is in `+layout.svelte` (100–105) and is **not** moved. There is no other global nav CSS.

## Alternatives considered

1. **`position: fixed` bar + `padding-top` compensation** on every mobile page (or a `body::before` spacer). Rejected: out-of-flow bar requires page-level edits in 8+ routes, interacts badly with `/review`'s `min-height: 100vh` assumption, and changes initial paint. Sticky achieves the identical UX in-flow with zero page edits.
2. **Keep the 600px breakpoint and patch the band** (e.g. make the menu/nav visible at 600–768). Rejected: preserves two overlapping MQs and a 600px boundary used nowhere else in the app (sidebar hides at 960; review compacts at 768/960; layout logo hides at 768). Single 768 boundary is simpler and matches every other mobile breakpoint.
3. **Reveal the existing `+layout.svelte` `.logo` on mobile instead of an in-bar brand.** Rejected: the logo is a sibling *above* `.flexContainer`, left-aligned with `margin-left: 50px` at 2em — it cannot share a row with a top-right hamburger without restructuring the layout flex and its 1450px/768px rules. A 1.25rem in-bar mark is smaller, keeps `+layout.svelte` untouched, and reuses the same Orbitron/accent identity.
4. **Add a theme toggle to the bar.** Explicitly rejected by the task (Phase 0 placed it as the last SlideMenu item; a second toggle would duplicate state and clutter the 390px bar).
5. **Active route via `window.location` + `$effect`.** Rejected: forbidden by the task, and `$app/state` runes are already the established pattern in 3 components.
6. **`aria-current` without a visual change.** Rejected: the requirement is class + attribute; a color/weight affordance is the point, and `var(--text-accent)` reads in both themes.

## Simplification opportunities

- **Single source for the 7 links:** today the labels are hardcoded twice (19–25 and 43–49); the `NAV_LINKS` {#each} in this design removes the duplication and guarantees desktop/mobile parity (this change does it).
- **Dead transform quirk** (164–165) and **dead FAB positioning** declarations removed (this change does it).
- **600px breakpoint deleted** from both files — the app now has one mobile boundary at 768px (this change does it).
- **`--nav-bg` is defined but never consumed** (`theme.css:20,47`) — candidate for deletion in the Phase 2 tokenization pass (out of scope here; the bar uses `--bg-secondary` instead).
- **12 duplicated `-webkit-` keyframe blocks** (211–331) could be modernized — deliberately **not** touched (zero behavior delta, keeps the diff reviewable).
- **Duplicate `<meta name="viewport">`** in `app.html:5` and `:11` — pre-existing quirk; viewport meta work is explicitly deferred (scope.md Phase 2/3).

## Validation plan

(Design lane is read-only: `npm run check` runs `svelte-kit sync`, which writes `app/.svelte-kit/`, so none of the below was run by the lane. These are for the impl + harness-verify lane.)

1. **Static:** `cd app && npm run check` (svelte-check — catches the runes-mode/`on:click` mistakes) and `npm run test` (existing vitest suite, `lib/__tests__/returnTo.test.ts` — must stay green; no nav tests exist today).
2. **Existing harness scenarios (selectors unchanged by this design):**
   - `scenarios/nav-ia-validation.json` (390×844, dark): m11-mobile-posts must show the **top bar** (brand left, hamburger right) and **no bottom-right FAB**; m12-slide-menu-open must still open from `click: .menu-button` with `waitFor: .menu-container.open` (selectors both survive); m13 theme toggle in-menu still flips `data-theme` with the menu staying open; m14/m15 expectations unchanged.
   - `scenarios/verify-menu.json`: `button.menu-button` and `.menu-container.open` still match. (Note: its `waitForSelector: .theme-toggle-button` is already stale against current code — the class is `.theme-toggle` — pre-existing, unrelated to this change.)
3. **New band scenario** (add to `dev/harness/scenarios/`, e.g. `nav-ia-band.json`), viewports **700×900** (mid-band) and **768×1024** (boundary):
   - `/posts`: expect `.mobileBrand` visible, `button.menu-button` visible, `.navbar` hidden; `eval` `getComputedStyle(document.querySelector('.menu-button')).position` === `'static'` (proves the fixed FAB is gone); screenshot.
   - `click: .menu-button` → `waitFor: .menu-container.open` → `eval` `getComputedStyle(document.querySelector('.menu-container')).display` === `'flex'` (menu visible in the band); screenshot.
4. **Desktop regression scenario**, viewport 1280×800: `/posts` → exactly one `.navbar a[aria-current="page"]` with text "Posts"; `/postsByDate` → "By Date"; `/` → "Home"; `/login` → "Login"; post detail (`/posts/[uploadDate]`, via the conditional-step pattern in `mobile-audit.json`) → "Posts" still active (prefix match); `eval` `getComputedStyle(document.querySelector('.navContainer')).position` === `'static'` and `.mobileBrand`/`.menu-button` computed `display: none`; screenshots for the before/after diff.
5. **Mobile Phase 0 regression**, 390×844: `/review` — compact toolbar renders **below** the bar on one row (Phase 0 fix intact: gap/ellipsis rules are width-based, not position-based, verified), `eval` `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal overflow), confirm dialog still covers full viewport; `/posts` — PageNav + Review + selects row below the bar, no overlap; `/` — hero visually unchanged vs `m01-home.png`.
6. **Visual diff** per scope.md process: pre-impl backup to `shots-phase1-before*`, then compare all `shots-mobile/m01–m15` and desktop `shots/01–10` (desktop delta = active-link styling only) plus the new band shots.
7. **Manual (owner, iPhone):** notch/safe-area (expect 0 inset until `viewport-fit=cover` lands in Phase 2/3), open-menu layering (rail over brand, hamburger tappable to close), and the ~48px extra scroll at the bottom of mobile `/review`.

## Risks / open questions

- **Severity: note — brief discrepancy (verified):** at 600–768px the SlideMenu is **not** invisible today. `slideMenu.svelte:20-26` (`max-width:768px`, `display:flex`) is declared **after** `:14-18` (`min-width:600px`, `display:none`), so it wins the cascade and the menu renders in the band. The verified band defect is "no top nav, no brand, orphaned FAB" (`navigation.svelte:73-84, 155-169`). The design resolves the band regardless (single 768 boundary; hamburger lives in the bar; menu-visible-iff-hamburger-visible is structural). Owner should confirm the corrected problem statement.
- **Severity: blocker-if-missed (for impl) — runes mode switch:** `navigation.svelte` is legacy-mode; the required `$app/state` rune usage forces conversion to runes mode, which requires `let menuOpen = $state(false)` and all 10× `on:click` → `onclick`. Missing any leaves a broken build or silent non-reactive menu. Mitigated in the edit list; caught by `npm run check`.
- **Severity: note — `/review` mobile extra scroll:** Phase 0 set `min-height: 100vh` at `≤768px` (`review/+page.svelte:454-457`) assuming the toolbar starts at the viewport top. The 48px in-flow bar makes mobile `/review` ≈ 48px taller than the viewport → ~48px of extra scroll at the bottom (last slice of the image area). Toolbar compaction itself is unaffected (rules are width-based, verified). Accept for A1; the A6/mobile-layout lane may retune to `calc(100vh - 48px - env(safe-area-inset-top, 0px))` if the owner objects.
- **Severity: note — z-index peers:** `batch-menu-overlay` is `z:999` (`postsByDate/[slug]/+page.svelte:466-470`, `postsDynamic` modal `:413+`) — it will dim the page but **not** the `z:1000` bar, so the bar stays bright under an open batch menu. Cosmetic only; not touched (out of A1 scope). Open `.batch-menu`/confirm dialogs are `z:1000` and later in DOM, so they still paint above the bar.
- **Severity: note — open menu over the bar:** with equal `z:1000`, the 200px rail (later in DOM) paints over the bar's brand corner while open. Intended and harmless (rail top area is empty background); hamburger remains clickable. If the owner prefers the rail *under* the bar, set its `top` to the bar height — a one-line follow-up, not recommended.
- **Severity: note — safe area is a no-op today:** without `viewport-fit=cover` (`app.html:5`; viewport meta explicitly deferred to Phase 2/3), `env(safe-area-inset-top)` resolves to 0 on iOS. The bar is future-proof: it will grow into the notch automatically once the meta is fixed. No action now.
- **Severity: note — faux bold:** Montserrat is loaded without a 600 weight (`app.html:8-12`), so `font-weight: 600` on active links renders as synthetic bold — consistent with existing usage (`/posts` `span` and `.reviewLink` already use 600). Font weights are a Phase 2 item.
- **Open question:** routes not present in the menu (`/postGroups`, `/postsSmart`, `/postsDynamic`) intentionally light up **no** active link. If the owner wants them mapped (e.g. to `Posts`), `NAV_LINKS` + `isActive` already support it with no other change.
- **Unverified by the lane (no browser/build in a read-only lane):** computed styles at 600–768px are inferred from source-level cascade analysis (high confidence, standard CSS); rendered pixel geometry of the current FAB (70px border box from 50px + 10px padding, content-box) is arithmetic, not a browser measurement. The harness steps in the Validation plan settle both empirically.
