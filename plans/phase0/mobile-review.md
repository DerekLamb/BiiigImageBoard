# Phase 0 — Fix `/review` on mobile (390×844) — DESIGN ONLY

Status: **design only, no code edits.** Single file touched by the eventual implementation: `app/src/routes/review/+page.svelte` (its `<style>` block only). No markup, script, server, or shared-component changes.

---

## 1. Evidence & root causes

Evidence: `dev/harness/shots-mobile/m05-review.png` (390×844, dark) vs baseline `dev/harness/shots/05-review.png` (1440, dark). Mobile screenshot shows: `← Prev` (disabled) at x≈125, status `1 / 5 — 1787543920199.png` clipped at the right viewport edge, **Next and Delete absent**, image ≈220px wide centered in a large dark void, hamburger FAB bottom-right.

Root causes (verified in code):

- **RC-1 — The page has zero responsive CSS; the `.sidebar` column never collapses.**
  `app/src/routes/review/+page.svelte` contains no `@media` queries at all. `.reviewContainer { display: flex }` (L238) is always a row. The *component* `SideBar` hides itself ≤960px (`app/src/lib/sideBar.svelte:16` `@media (max-width: 960px) { .sideBar { display: none } }`), but the page's wrapper `.sidebar` (L244) and its child `.navLinks` → "Back to Grid" (L250) stay visible and keep the column ~118px wide at 390px. `.mainArea { flex: 1 }` (L265) is therefore squeezed to ≈272px (≈240px content after its `padding: 8px 16px`).
- **RC-2 — Toolbar is a non-shrinkable nowrap row → Next/Delete pushed out and hard-clipped.**
  `.toolbar` (L273) is `display:flex; gap:12px` with no wrap. `.position { white-space: nowrap }` (L318) is a flex item with default `min-width: auto`, so it cannot shrink below its content (filename + formatted date ≈ 300px+). Prev (≈73px) + status (≈300px) + gaps exhaust the squeezed ≈240px; `Next` and `.deleteBtn { margin-left: auto }` (L304) land beyond the right edge and are **clipped by `.mainArea { overflow: hidden }` (L270)** — not scrollable, unreachable.
- **RC-3 — Image width is a consequence of RC-1.** `.reviewMedia { max-width: 100% }` (L343) is relative to the squeezed `.imageArea`, so the image caps at ≈220–240px. The "~500px empty space" is dark `body` background around the squeezed main area — the image is actually *full-width of its shrunken container*.
- **RC-4 (minor) — stale 80px header reservation on mobile.** `.reviewContainer { min-height: calc(100vh - 80px) }` (L241) assumes the desktop navbar height, but the navbar is `display: none` ≤768px (`app/src/lib/navigation.svelte` `@media (max-width: 768px)`), so mobile leaves an ~80px dead band at the bottom. (The 80px also overestimates the real desktop navbar ≈55px — desktop behavior unchanged either way.)

---

## 2. Design decisions

### 2.1 Toolbar: **compact single row with ellipsizing status text (chosen)**

| Option | How it works | Verdict |
|---|---|---|
| **A. Compact row: buttons `flex-shrink:0`, status `min-width:0` + `overflow:hidden` + `text-overflow:ellipsis`, hide `.date`, tighten padding/gap (all ≤768px)** | One row; status degrades gracefully (`1 / 5 — 1787…`); buttons keep exact current labels/positions | **Chosen** |
| B. Two-row wrapping toolbar (`flex-wrap: wrap`, status on row 2) | Also works, but +~40px of header height on every phone, and wrap behavior is content-dependent (row breaks shift with filename length) | Rejected: more vertical cost, less predictable geometry |
| C. Sticky bottom action bar (fixed bar with Prev/Next/Delete) | Actions always reachable | Rejected: the global mobile hamburger is `position: fixed; right:30px; bottom:30px; z-index:1000` on **every** page (`navigation.svelte`) — a full-width bottom bar would collide with it at 390px (would need ≥110px right padding or moving the shared FAB = cross-page scope creep). Also moves Delete off its desktop position (violates "preserve desktop layout") and requires new markup/state |

**Justification of A:** smallest diff (CSS-only, zero markup change), no new fixed elements, no interaction with the shared FAB, desktop pixel-identical, and the status text that gets sacrificed is the low-value part (formatted timestamp date; the filename is an epoch-timestamp name that ellipsizes harmlessly).

**Why breakpoint ≤768px (not 640px):** at 641–768px the stacked layout gives mainArea content ≈ `w − 10vw − 32px` (layout margins are `5vw` above 768px, `+layout.svelte`). Worst-case nowrap status (≈330px) + buttons (≈272px) overflows by up to ~30px in the 641–672px band. Raising the compaction breakpoint to 768px covers it; the 769–960px band still fits unwrapped (≥660px content vs ≈602px worst case, assuming filenames ≤ ~40 chars — true for this data: epoch-timestamp names).

**Width budget at 390px (after fix, ≤768px rules):** mainArea content = 390 − 32 = **358px**. Prev ≈67px + Next ≈61px + Delete ≈88px + gaps 3×8 = **262px fixed** → **≈96px** left for `.position`, rendering `1 / 5 — 1787…` with ellipsis. All three buttons fully in-viewport with ≥44px tap targets (current buttons are ≈30px tall; `padding: 6px 10px` + 13.6px font ≈ 30px — keep; requirement "tappable" = fully visible and enabled, met; see residual risks for the 44px ideal).

### 2.2 Layout: **stack `.reviewContainer` to a column at ≤960px**

Aligns with the existing `SideBar` collapse breakpoint (≤960px), so the sidebar column disappears exactly when its contents already do. DOM order already has `.sidebar` before `.mainArea`, so "Back to Grid" becomes a full-width top row (≈36px) with **no DOM reordering** — it stays in the same place it already renders in the broken mobile screenshot. This un-squeezes `.mainArea` to full width, which alone fixes the image width (RC-3) with **no change to `.reviewMedia`**.

At ≤768px the container also switches to `min-height: 100vh` (navbar hidden there) — kills the dead 80px band (RC-4). At 769–960px the desktop navbar is still visible, so `calc(100vh - 80px)` stays correct.

### 2.3 Delete confirmation dialog (small fit)

`.confirmDialog` (L378) has `max-width: 400px`, no horizontal margins, `box-sizing` default. At 390px it can reach viewport edges with long filenames (`word-break: break-all` on `.confirmName` doesn't stop the padded box itself from getting wide). Add a ≤768px fit: `max-width: calc(100vw - 48px); margin: 0 16px; box-sizing: border-box;` — Delete is a core action, its confirm is part of the flow, so this stays in Phase 0 scope.

### 2.4 Explicit non-goals (scope guard)

- No tokenization of the hardcoded colors (listed in §5) — noted, deferred.
- No DOM/markup edits, no TS/script edits, no `+page.server.ts` changes, no shared-component (nav/FAB/theme) changes, no desktop restyle.

---

## 3. Exact changes per file (pseudocode/CSS level)

### 3.1 `app/src/routes/review/+page.svelte` — `<style>` block only

All new rules are appended as **new `@media` blocks** (the file currently has none), so every existing desktop rule is untouched. No changes to markup, `<script>`, or existing rules.

```css
/* (1) Tablet/phone: collapse the sidebar column (SideBar contents already hide <=960px) */
@media (max-width: 960px) {
	.reviewContainer {           /* L238 */
		flex-direction: column;
	}
	/* .sidebar (L244) now stretches full-width automatically (column flex,
	   align-items: stretch) and renders as a ~36px "Back to Grid" top row.
	   .mainArea (L265) gets the full remaining width.
	   (Optional guard, only if overflow is observed: .mainArea { min-width: 0; } ) */
}

/* (2) Phone: navbar is hidden here, so reclaim the full viewport height */
@media (max-width: 768px) {
	.reviewContainer {
		min-height: 100vh;        /* overrides L241 calc(100vh - 80px) */
	}

	/* --- compact toolbar (decision 2.1) --- */
	.toolbar {                    /* L273 */
		gap: 8px;                  /* was 12px */
	}
	.toolBtn {                    /* L282 */
		flex-shrink: 0;            /* buttons keep their natural width */
		padding: 6px 10px;         /* was 6px 14px */
	}
	.position {                   /* L314: THE core fix for RC-2 */
		flex: 1 1 auto;
		min-width: 0;              /* overrides flex-item min-width:auto — allows shrink */
		overflow: hidden;
		text-overflow: ellipsis;   /* white-space: nowrap (L318) stays */
	}
	.date {                       /* L327: low-value formatted timestamp */
		display: none;
	}
	.filename {                   /* L321: no change needed; ellipsizes inside .position */
	}
	.deleteBtn {                  /* L303 */
		margin-left: 0;            /* .position flex:1 now consumes the free space */
	}

	/* --- delete-confirm dialog fit (decision 2.3) --- */
	.confirmDialog {              /* L378 */
		box-sizing: border-box;
		max-width: calc(100vw - 48px);
		margin: 0 16px;
	}

	/* --- optional hardening (include if the img2 screenshot shows the
	       fixed hamburger FAB (navigation.svelte, bottom:30/right:30) overlapping
	       the bottom-right corner of a very tall portrait image): ---
	.imageArea {                  /* L333 */
		padding-bottom: 64px;
	}
}
```

**Expected result geometry at 390×844:** "Back to Grid" row ≈36px → toolbar ≈46px → `.imageArea` ≈750px tall, full 358px content width. The 1.14-aspect seed image renders ≈358×409 centered (width = 100% of container). No horizontal overflow: the only nowrap content (`.position`) now has `min-width:0` + ellipsis; buttons can't grow.

### 3.2 `app/src/routes/review/+page.server.ts`
No changes (Phase 0). Dead-code findings for Phase 1 in §6.

### 3.3 Shared components (`navigation.svelte`, `sideBar.svelte`, `+layout.svelte`, `theme.css`)
No changes. Their existing breakpoints (≤960 sideBar, ≤768 navbar/logo, ≤1450 margins) are the contract this design aligns to.

### 3.4 New dev artifact (validation only, not app code)
`dev/harness/scenarios/mobile-review-fix.json` — see §7.

---

## 4. What the fix does NOT change (desktop preservation)

Every new rule sits inside `@media (max-width: 960px|768px)`. At ≥961px (desktop baseline 1440) no rule applies → toolbar, sidebar, and image layout are pixel-identical to `dev/harness/shots/05-review.png`. Regression-verified by re-running the smoke preset (§7).

---

## 5. Hardcoded colors noted (NOT tokenized in Phase 0)

`+page.svelte` `<style>` ignores `app/src/lib/styles/theme.css` tokens (Bootstrap-ish palette): `#007bff` (.navLink), `#dee2e6` (.toolbar border), `#ced4da`/`#f8f9fa`/`#495057`/`#e9ecef` (.toolBtn), `#dc3545`/`#c82333` (.deleteBtn, .confirmDelete), `#495057` (.position), `#6c757d`/`#545b62` (.filename, .loadingSpinner, .emptyState, .confirmCancel), `#adb5bd` (.date, .keyHint), `#343a40` + `white` (.confirmDialog). Consequence: the delete-confirm dialog stays white-on-dark in dark theme. Deferred: token swap (→ `--border-color`, `--text-secondary`, `--bg-secondary`, `--button-primary`, …) is a separate, theme-wide pass.

---

## 6. Simplification opportunities flagged for Phase 1 (input only — not designed here)

1. **Dead SvelteKit action + duplicated delete path.** `+page.server.ts` exports `actions.delete` (formData, `imageController.getImage`), but the page markup has **no form** — `deleteCurrent()` in `+page.svelte` POSTs JSON to `/api/review/delete` (JSON, `ImageModel.getImageById`). Two divergent implementations of the same delete; the action is unreachable. Keep one.
2. **Duplicated filter construction.** The `searchTerm`/`notag` filter block and `PAGE_SIZE = 200` are copy-pasted between `+page.server.ts` `load` and `api/review/page/+server.ts`.
3. **Mostly-dead review sidebar.** `TagSection imageTags={[]} editable={false}` renders a permanently empty "Tags" pill (visible in the desktop baseline); `SearchBar`'s submit navigates away to `/posts?search=…` (and its `onSubmit` contains `e.preventDefault;` — **missing parentheses, a no-op** — plus a `console.log(data)` debug leftover); `ReturnButton` renders a stray `<input type="hidden" name="contentId">` **outside any form** and duplicates the "Back to Grid" link (which itself is duplicated in `.emptyState`).
4. **`loadingMore` state has no visible UI** — the background page-fetch is silent (no indicator, no failure surfacing beyond `console.error`).
5. **`formatDate` assumes a numeric-ms string** (`parseInt(dateStr)`) with a raw-string fallback — works for current data, fragile otherwise.
6. **`$effect`-based state resync** from `data` (resetting `images`/`currentIndex` on every soft-nav data change) is a subtle pattern that silently discards client-appended pages if `data` identity churns.

---

## 7. Validation plan

**Precondition:** `dev/harness/up.sh`; review queue has ≥2 images (currently 5 per `m05-review.png` "1 / 5"; if empty, run `node dev/harness/drive.mjs --scenario dev/harness/scenarios/seed-uploads.json`).

**New scenario** `dev/harness/scenarios/mobile-review-fix.json` (drive.mjs semantics verified against `dev/harness/drive.mjs`: `eval` results are recorded in the report, `expect` only does selector+text, clicks on disabled buttons would time out — hence probe rects first, click Next after):

```jsonc
{
  "name": "mobile-review-fix",
  "viewport": { "width": 390, "height": 844 },
  "theme": "dark",
  "outDir": "dev/harness/shots-mobile",
  "steps": [
    { "goto": "/review", "wait": 1500 },
    { "eval": "() => ({ scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, innerWidth: window.innerWidth })" },
    { "eval": "() => { const s = { prev: 'button[title=\"Previous (Left Arrow)\"]', next: 'button[title=\"Next (Right Arrow)\"]', del: 'button[title=\"Delete (Delete key)\"]' }; const r = {}; for (const [k, sel] of Object.entries(s)) { const el = document.querySelector(sel); if (!el) { r[k] = null; continue; } const b = el.getBoundingClientRect(); r[k] = { left: b.left, right: b.right, top: b.top, bottom: b.bottom, h: b.height, disabled: el.disabled, inViewport: b.left >= 0 && b.right <= window.innerWidth && b.top >= 0 && b.bottom <= window.innerHeight }; } return r; }" },
    { "eval": "() => { const m = document.querySelector('.reviewMedia'); const ma = document.querySelector('.mainArea'); return m ? { mediaW: m.getBoundingClientRect().width, mediaH: m.getBoundingClientRect().height, mainContentW: ma.clientWidth } : { mediaW: 0 }; }" },
    { "screenshot": "m05fix-toolbar", "selector": ".toolbar" },
    { "screenshot": "m05fix-viewport" },
    { "click": "button[title=\"Next (Right Arrow)\"]", "wait": 1000 },
    { "eval": "() => { const s = { prev: 'button[title=\"Previous (Left Arrow)\"]', next: 'button[title=\"Next (Right Arrow)\"]', del: 'button[title=\"Delete (Delete key)\"]' }; const r = {}; for (const [k, sel] of Object.entries(s)) { const el = document.querySelector(sel); if (!el) { r[k] = null; continue; } const b = el.getBoundingClientRect(); r[k] = { inViewport: b.left >= 0 && b.right <= window.innerWidth && b.top >= 0 && b.bottom <= window.innerHeight, disabled: el.disabled, h: b.height }; } return r; }" },
    { "screenshot": "m05fix-viewport-img2" },
    { "click": "button[title=\"Delete (Delete key)\"]", "wait": 400 },
    { "eval": "() => { const d = document.querySelector('.confirmDialog'); if (!d) return null; const b = d.getBoundingClientRect(); return { left: b.left, right: b.right, within: b.left >= 0 && b.right <= window.innerWidth }; }" },
    { "screenshot": "m05fix-confirm" },
    { "press": ["body", "Escape"], "wait": 300 },
    { "eval": "() => !document.querySelector('.confirmOverlay')" }
  ]
}
```

Run: `node dev/harness/drive.mjs --scenario dev/harness/scenarios/mobile-review-fix.json`

**Pass criteria** (harness records `eval` values; the report `dev/harness/.run/last-report.json` must be checked, since `eval` doesn't assert):
1. `scrollWidth <= 390` and `bodyScrollWidth <= 390` (no horizontal overflow).
2. Step 3: all three button rects `inViewport: true` (Prev may be `disabled: true` at index 0 — visible is the bar). Step 7 (after Next): all three `inViewport: true` **and** `disabled: false` → all tappable; `h >= 24`.
3. `mediaW >= 0.9 × mainContentW` (≈ ≥322px at 390px) — image ~full width.
4. Confirm dialog `within: true` at 390px; overlay removed after Escape.
5. Vision check of `m05fix-toolbar.png` / `m05fix-viewport*.png`: Prev, `1 / 5 — …` (ellipsized, date hidden), Next, red Delete all visible; no clipped controls; image spans the content width.
6. No new `consoleErrors` / `pageErrors` / `requestFailures` vs the pre-fix run.

**Desktop regression:** `node dev/harness/drive.mjs --preset smoke` (1440×900) → visually compare `dev/harness/shots/05-review.png` against the existing baseline; expected identical layout.

---

## 8. Residual risks

- **iOS Safari dynamic toolbar vs `100vh`:** `min-height: 100vh` can overshoot under the URL bar (existing app-wide pattern, `calc(100vh - 80px)` has the same class of issue). Low severity; optional follow-up: `100dvh` with fallback.
- **Hamburger FAB overlap** for very tall portrait images (FAB is fixed bottom-right on every page). The optional `.imageArea { padding-bottom: 64px }` hardening covers it; keep or drop based on the img2 screenshot.
- **641–768px band** relies on the ≤768px compaction; if a filename ever exceeds ~40 chars, even the ellipsized status is fine but the 769–960 band (unwrapped) could clip — noted assumption, monitor via the smoke pass.
- **44px tap-target ideal:** buttons are ≈30px tall (unchanged from desktop); they are fully visible/enabled, but sub-44px. Phase 1 could bump mobile padding to `8px 12px` for a ~36–40px target.

## 9. Findings summary (severity)

- **blocker** — `app/src/routes/review/+page.svelte:318,270,304,273` (with `:244`/`:265`): at 390px the toolbar's nowrap `.position` can't shrink (flex `min-width:auto`) and `.mainArea { overflow: hidden }` clips Next + Delete entirely — core review actions unreachable.
- **high** — `app/src/routes/review/+page.svelte:238,244,265` (no `@media` anywhere in file): `.sidebar` column (~118px) never collapses on mobile, squeezing the image to ~220px (RC-1/RC-3).
- **medium** — `app/src/routes/review/+page.svelte:241`: 80px navbar reservation on mobile where the navbar is hidden (`navigation.svelte` ≤768px) → dead bottom band.
- **low** — `app/src/routes/review/+page.svelte:378`: confirm dialog has no mobile horizontal margin/box-sizing.
- **note** — hardcoded non-theme colors throughout the page `<style>` (§5); Phase 1 dead code: unused `actions.delete` in `app/src/routes/review/+page.server.ts` (client uses `app/src/routes/api/review/delete/+server.ts`), duplicated filter logic vs `app/src/routes/api/review/page/+server.ts`, no-op `e.preventDefault;` + `console.log` in `app/src/lib/searchBar.svelte`, stray hidden input in `app/src/lib/returnButton.svelte`, always-empty `TagSection` on the review page, `loadingMore` without visible UI.

---