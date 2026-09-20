

# Phase 0 Design — `/postGroups` 500 error & missing themed error pages

Status: **design only — no code edits made in this pass.** All findings below were verified against the live code, the compiled SSR output, the dev-server log, and the harness screenshot.

---

## 1. Verified root causes

### RC1 — `window` access during SSR causes the 500 (CONFIRMED, with one scope correction)

- `app/src/routes/postGroups/+page.svelte:30`:
  `const pathname = $derived(new URL(window.location.href).pathname);`
- `dev/harness/.run/vite.log` shows repeated
  `[500] GET /postGroups — ReferenceError: window is not defined`
  with the stack bottoming at `at _page (src/routes/postGroups/+page.svelte:21:13)` and the `window` reference at `+page.svelte:30:36` (the log's `21:13` is the compiled component entry; the source line is 30).
- It is the **only** route page that reads `window.location` in render scope. Grep of `app/src/routes/**/+page.svelte` shows every other listing page uses SvelteKit URL state:
  - `posts/+page.svelte:8,43,57` — `import { page } from '$app/stores'` → `$page.url`
  - `postsDynamic/+page.svelte:4,32` — `import { page } from '$app/state'` → `page.url` inside `$derived`
  - `postsByDate/+page.svelte:9,43`, `postsSmart/+page.svelte:11,44`, `postsByDate/[slug]/+page.svelte:9,66,139` — `$app/stores` + `$page.url`
  - The `window.location.reload()` calls in `postsDynamic`/`posts/[slug]` are inside event handlers (never run in SSR) — safe.
- **Correction to the launch premise:** the 500 does **not** hit "everyone, logged in or not." `app/src/routes/postGroups/+page.server.ts:11-14` runs `redirect(307, '/login')` when `!locals.user`, *before* the page component is rendered. Anonymous users get a 307; **the 500 occurs for logged-in users only**, during SSR of the component. (The lone `"no user"` line in the log is the anonymous case.) The validation plan below therefore requires the admin cookie — which the launch already specified.

### RC2 — "swapped" pagination links (VERIFIED — but the stated symptom does not occur; it is a naming trap)

Current code (`postGroups/+page.svelte:33-42`, template `:52-58`):

| Variable | Formula | Bound to (template) | Rendered href on page *p* of *N* |
|---|---|---|---|
| `nextPage` (l.33-35) | `page = p−1` | left button `<<<` (l.54) | previous page ✓ positionally |
| `prevPage` (l.37-39) | `page = p+1` | right button `>>>` (l.57) | next page ✓ positionally |
| `firstPage` (l.41) | `page = 1` | left button `<<` (l.53) | first ✓ |
| `lastPage` (l.42) | `page = N` | right button `>>` (l.58) | last ✓ |

The variable names are swapped **relative to the codebase convention** (`app/src/lib/pageNav.svelte:60-63`: `prevPage = currentPage−1`, `nextPage = currentPage+1`), but the template wires the mismatched names to the *opposite* buttons, so **the double swap cancels out: the rendered hrefs are behaviorally correct** (left side goes back, right side goes forward). I confirmed this in the compiled SSR output (`.svelte-kit/output/server/entries/pages/postGroups/_page.svelte.js:43`): left container gets `firstPage()` and the `p−1` link, right container gets the `p+1` link and `lastPage()`.

**Consequence for the fix:** this is a maintainability hazard, not a user-visible bug. Any future change that "fixes" only the names *or* only the bindings would introduce a real backwards-navigation bug. Design decision in §3: rename **and** rebind as a single paired change, with rendered output byte-identical (validated in §5, step V4).

**Bonus finding (cosmetic, same lines):** the outer button labels contain entity typos. Compiled SSR text (same file, l.43) renders `<a class="pageNum">&lt;&lt;/</a>` and `<a class="pageNum">\&gt&gt</a>` — i.e. the "first" button displays as `<</` (stray slash) and the "last" button as `\>>` (stray backslash). Recommend correcting to `&lt;&lt;` / `&gt;&gt;` in the same edit (zero behavioral impact).

### RC3 — no themed error pages (CONFIRMED)

- No `+error.svelte` or `+notfound.svelte` anywhere under `app/src` (glob search: zero hits).
- `dev/harness/shots/04-postGroups.png` shows SvelteKit's **default** error markup (bare `500` / `Internal Error` text, ~`#333`-ish) painted on the dark theme body (`--bg-primary: #0d1117` from `app/src/lib/styles/theme.css`) — near-invisible. Note the site chrome (logo, nav, theme toggle) **is** present, because SvelteKit wraps `+error.svelte` in the root `+layout.svelte`, which also imports `theme.css`. So a root-level `+error.svelte` automatically inherits the chrome, fonts (`Montserrat`/`Orbitron` are loaded globally in `app/src/app.html:7-10`), and the theme toggle.
- Nuance: the dark-on-dark problem is **dark-theme-specific**; in the light theme (`--bg-primary: #ffecef`) the default text is at least legible. A token-based error page fixes both and stays consistent.

---

## 2. Fix 1 — SSR-safe pathname (minimal)

**File:** `app/src/routes/postGroups/+page.svelte`

Replace line 30 and add one import. Match the **newest established pattern** in the repo (`postsDynamic/+page.svelte:4,32` — Svelte 5 runes page, same as postGroups; `@sveltejs/kit` is `^2.66.0`, so `$app/state` is fully supported):

```ts
// import
import { page } from '$app/state';

// line 30 becomes
const pathname = $derived(page.url.pathname);
```

Rationale / edge cases:
- `page.url` is the request URL on the server and the current URL in the browser → SSR-safe, no `window`, no `browser` guard needed.
- Keeps `$derived` (reactive if the user navigates within the route) and keeps the value (`/postGroups`) identical to what `window.location.href`'s pathname would have been → no behavior change beyond "stops crashing."
- Alternative `const pathname = '/postGroups'` rejected: matches no existing pattern and hardcodes the route.
- No other change in this file for Fix 1.

## 3. Fix 2 — swapped-links decision

**Decision: rename the deriveds to match their semantics *and* swap the two template bindings in the same commit. Rendered HTML must be byte-identical.**

Target state (names now match `pageNav.svelte` convention; bindings follow the names):

```ts
const prevPage = $derived(
    data.currPage > 1 ? `${pathname}?page=${data.currPage - 1}${numImageParam}` : null
);
const nextPage = $derived(
    data.currPage < data.pageNum ? `${pathname}?page=${data.currPage + 1}${numImageParam}` : null
);
```
```svelte
<div class="prevPageCont">
    <a href={firstPage} class="pageNum">&lt;&lt;</a>
    <a href={prevPage} class="pageNum">&lt;&lt;&lt;</a>
</div>
<div class="nextPageCont">
    <a href={nextPage} class="pageNum">&gt;&gt;&gt;</a>
    <a href={lastPage} class="pageNum">&gt;&gt;</a>
</div>
```

- Both halves of the change are required; doing only one **would** create the backwards-navigation bug. This must be a single edit/commit.
- Rejected alternatives:
  - *Leave as-is + comment* — keeps the trap for the next reader; cheap to eliminate properly.
  - *Refactor to the shared `PageNav` component (as `posts` does)* — changes the 4-button layout, adds hold-to-scrub behavior the page doesn't have, and `PageNav.buildUrl` uses `window.location` inside `onMount`/`beforeUpdate` (SSR-safe but a bigger behavioral surface). Out of scope for Phase 0; candidate for a later consistency pass (existing plan `plans/batch-image-management-and-fixes.md` tracks related `/postGroups` work, items #5 and #8).
- Also fix the two label typos (`&lt;&lt;`, `&gt;&gt;`) in the same lines — cosmetic, zero risk.

## 4. Fix 3 — themed `+error.svelte` (and optional `+notfound.svelte`)

**New file:** `app/src/routes/+error.svelte` (root level → covers `/postGroups` and every route; wrapped by root `+layout.svelte` so it gets nav + theme for free).

Requirements:
- SSR-safe: no `window`/`document` in render scope (only in click handlers, which never run server-side).
- SvelteKit 2 / Svelte 5 runes props: `let { status, message, error } = $props();` (`status: number`, `message: string` — SvelteKit supplies "Internal Error" etc. in prod; dev shows the real message).
- Theme via **CSS variables only** (no JS theme branching) from `app/src/lib/styles/theme.css`; the root layout sets `data-theme` on `<html>` client-side, so both themes work and toggling live on the error page works. First SSR paint for dark-preferring users is light tokens (pre-existing app-wide behavior, not a regression).
- Tokens with verified contrast in both themes:
  - Status number: `--text-primary` (light `#345d7e` on `#ffecef` ≈ 6:1; dark `#c9d1d9` on `#0d1117` ≈ 12:1). Do **not** use `--text-accent` for body text (light `#7bafd4` on `#ffecef` is ~2.2:1) — reserve it for decorative accents only.
  - Message: `--text-primary`; secondary hint text: `--text-secondary`.
  - Dev-only stack (optional): `pre` with `--bg-secondary` bg, `--border-color` border, `--text-secondary` text, gated by `import { building } from '$app/environment'` → `{#if !building && error?.stack}`.
- Layout: fill the content area (inside the layout's `.flexContainer` slot), centered: `min-height: calc(100vh - 160px); display: grid; place-items: center;` with a simple card: `background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 2.5rem 3rem; text-align: center;`.
- Typography: number `font-family: 'Orbitron', sans-serif; font-size: 4rem;` (matches logo); message `font-family: 'Montserrat', sans-serif; font-size: 1rem;` (matches app UI text); both fonts are global via `app.html`.
- Actions (minimal): one primary link `Go home` → `href="/"` styled `background: var(--button-bg); color: var(--button-text); border-radius: 8px; padding: 6px 16px; font-family: 'Montserrat';` (mirrors button styling already used in `posts/+page.svelte`), plus a secondary `Try again` anchor styled with `var(--border-color)` border / `var(--text-primary)` text whose `onclick` handler calls `location.reload()` (handler only ever runs client-side → SSR-safe without a `browser` guard).

**Optional companion:** `app/src/routes/+notfound.svelte` — same skeleton, `status` hardcoded 404, message "Page not found — the link may be dead or the item may have been removed.", actions: `Go home` + `Back to posts` (`href="/posts"`). SvelteKit renders it for any 404 (else falls back to `+error.svelte` with 404). Low cost, same tokens; recommend shipping it, but it is not required for the `/postGroups` fix.

Explicitly **not** doing in this file: no theme-switch JS, no fetch-based diagnostics, no i18n.

## 5. Validation plan

Precondition: stack up (`dev/harness/up.sh`, idempotent) and a valid admin session in `dev/harness/.run/state.json` (cookie `__Secure-better-auth.session_token`, expires 2026-09-27; if stale, re-login via `node dev/harness/drive.mjs --preset smoke --fresh`).

**V1 — 500 → 200 (required, from launch spec):**
```bash
cd /home/deer/Desktop/BiiigImageBoard
COOKIE=$(jq -r '.cookies[] | select(.name=="__Secure-better-auth.session_token") | .value' dev/harness/.run/state.json)
curl -sk -o /dev/null -w '%{http_code}\n' \
  -H "Cookie: __Secure-better-auth.session_token=$COOKIE" \
  https://localhost:5173/postGroups
# EXPECT: 200
```

**V2 — auth gate unchanged (anonymous):**
```bash
curl -sk -o /dev/null -w '%{http_code}\n' https://localhost:5173/postGroups
# EXPECT: 307 (redirect to /login — pre-existing behavior, must NOT be 500)
```

**V3 — pagination hrefs in SSR output (proves Fix 2 changed nothing user-visible):**
```bash
# len=2 forces multi-page pagination regardless of dataset size; page=2 ⇒ p=2 of ≥2
curl -sk -H "Cookie: __Secure-better-auth.session_token=$COOKIE" \
  "https://localhost:5173/postGroups?page=2&len=2" \
  | grep -o 'href="/postGroups\?page=[0-9]*[^"]*"' 
# EXPECT, in document order: page=1 (first), page=1 (prev <<<), page=3 (next >>>), page=N (last)
# i.e. left buttons go backwards, right buttons go forwards — identical to pre-fix rendering.
```

**V4 — harness re-capture of `/postGroups`:**
```bash
node dev/harness/drive.mjs --preset smoke
```
- Re-captures `dev/harness/shots/04-postGroups.png` (dark) plus 01–10; report in `dev/harness/.run/last-report.json`.
- PASS criteria: `httpErrors` contains no `500 GET .../postGroups`; step `04-postGroups` ok; screenshot shows the group grid + pagination controls (not the default error page); `tail dev/harness/.run/vite.log` after the run has no `ReferenceError: window is not defined` and no `[500] GET /postGroups`.
- Expectation caveat (not a regression): due to tracked issue #8 in `plans/batch-image-management-and-fixes.md` (group `children` are id strings but the page reads `thumbnailPath`/`uploadDate` on them, `+page.svelte:80-85`), the re-captured grid may show broken `/undefined` thumbnails. Out of Phase 0 scope.

**V5 — forced-error screenshot (themed `+error.svelte`), dark + light:**
1. Add a **temporary** throw route (validation-only artifact, deleted after capture):
   `app/src/routes/forced-error/+page.server.ts`:
   ```ts
   export const load = () => {
       throw new Error('Forced error for +error.svelte validation (Phase 0)');
   };
   ```
   (Public route — no login needed; SSR throw → HTTP 500 → themed error page.)
2. Add scenario `dev/harness/scenarios/forced-error.json`:
   ```json
   { "name": "forced-error", "baseUrl": "https://localhost:5173",
     "viewport": { "width": 1440, "height": 900 }, "theme": "dark",
     "steps": [ { "goto": "/forced-error", "screenshot": "04b-forced-error-dark",
                  "expect": { "selector": "body", "text": "500" } } ] }
   ```
   Run: `node dev/harness/drive.mjs --scenario dev/harness/scenarios/forced-error.json`
3. Repeat with `"theme": "light"` → `04c-forced-error-light` (harness maps `theme` to `colorScheme`; theme init also honors stored preference — set it explicitly per run as above).
4. **Visual PASS criteria** (read the PNGs): status `500` + message clearly legible on `--bg-primary` in BOTH themes; site chrome (nav/logo) present; card borders/buttons use the token palette; no dark-on-dark text.
5. **Delete** `app/src/routes/forced-error/` and the scenario file; re-run `curl -sk -o /dev/null -w '%{http_code}' https://localhost:5173/forced-error` → expect `404`.

**V6 — themed 404 (validates `+notfound.svelte` if shipped):**
```bash
node dev/harness/drive.mjs --url https://localhost:5173/definitely-not-a-page --out 04d-notfound
```
PASS: themed 404 page rendered, legible in the captured theme.

**V7 — no new static errors:**
```bash
cd app && npm run check 2>&1 | grep -E 'postGroups|\+error|\+notfound' || true
```
Baseline is dirty (existing plan item #10: ~150 pre-existing errors); PASS = **zero** diagnostics in the three touched/new files.

## 6. Change list (for the implementation pass)

| File | Change |
|---|---|
| `app/src/routes/postGroups/+page.svelte` | Fix 1 (import `$app/state` `page`, l.30) + Fix 2 (rename `prevPage`/`nextPage` formulas l.33-39, rebind l.53-58, label typos l.53/58) |
| `app/src/routes/+error.svelte` | **new** — themed error page per §4 |
| `app/src/routes/+notfound.svelte` | **new, optional** — themed 404 per §4 |
| `app/src/routes/forced-error/+page.server.ts` | temporary, validation only, **deleted after V5** |

## 7. Residual risks

- **Stale session:** the `state.json` cookie expires 2026-09-27; if it lapses before validation, V1 will 307 — refresh via `--fresh` and re-run.
- **Fix 2 is output-identical by construction, but only if both halves land together.** A half-applied edit silently inverts pagination; V3 exists specifically to catch that.
- **Re-captured `04-postGroups.png` will still look broken** (thumbnails) due to tracked issue #8 (children id/shape mismatch) — do not mistake that for a Phase 0 failure.
- **Old vite.log lines:** the pre-fix `[500] GET /postGroups` entries remain in `dev/harness/.run/vite.log`; V4 must judge only the tail after the fix (or restart the server / check timestamps).
- **Error-page first paint** for dark-preferring users is light-themed until `theme.initialize()` runs on mount (pre-existing app-wide behavior; token-based design makes the swap seamless).
- **`+error.svelte` inside root layout:** if a future change moves theme/nav initialization into the page-level slot, the error page chrome would degrade; out of scope now.
- Forced-error route, if left behind by accident, would be a public 500 endpoint — V5 step 5 asserts its removal.

---
Verification evidence trail: `postGroups/+page.svelte:30` (window) · `vite.log` ×4 `[500] GET /postGroups` stacks · `postGroups/+page.server.ts:11-14` (307 gate) · `posts/+page.svelte:8,43` · `postsDynamic/+page.svelte:4,32` · `pageNav.svelte:60-63` (convention) · `.svelte-kit/output/server/entries/pages/postGroups/_page.svelte.js:30,43` (rendered href/label proof) · `find: no +error/+notfound` · `theme.css` token blocks · `shots/04-postGroups.png` (dark-on-dark) · `drive.mjs` (preset/smoke steps, state.json reuse, scenario schema) · `app.html:7-10` (global fonts) · `plans/batch-image-management-and-fixes.md` items #5/#8.