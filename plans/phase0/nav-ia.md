# Phase 0 — Nav / IA Fixes (Design Doc)

Scope: **design only** — no code edits in this phase. Every target below is file:line-precise for the implementing worker.
App: SvelteKit + Svelte (classic runes syntax), better-auth + MongoDB, CSS-variable theming (`app/src/lib/styles/theme.css`), Playwright dev harness (`dev/harness/`).

---

## Item 1 — No theme control on mobile (SlideMenu)

### Evidence

- Desktop theme toggle exists only in the navbar: `app/src/lib/navigation.svelte:26`
  (`<button class="theme-toggle" on:click={toggleTheme} title="Toggle theme">`, handler at lines 11–13 → `theme.toggle()`).
- Theme store: `app/src/lib/stores/themeStore.ts` — `theme.toggle()` flips light↔dark, persists to `localStorage['theme']`, sets `document.documentElement[data-theme]`. The `/config` page uses the same store (`theme.set(newTheme)` in `config/+page.svelte`, `handleThemeChange`).
- Mobile off-canvas menu: `app/src/lib/svelteComponents/slideMenu.svelte` is a **generic slot container** (`<slot/>` at line 9, bottom-anchored strip, `justify-content: end` + `align-items: flex-end`). It contains no theme entry. It is fed entirely from `navigation.svelte:41–50` (`{#key menuOpen}<SlideMenu {menuOpen}>…</SlideMenu>{/key}`, one `<li>` per nav link, each with `on:click={toggleMenu}`).
- Consequence: below 768px the navbar (and its 🌙 button) is `display: none`; mobile users are locked to system theme. Confirmed in `dev/harness/shots-mobile/*.png` (no theme control visible).

### Design (smallest correct change)

**File: `app/src/lib/navigation.svelte` only. `slideMenu.svelte` needs no change** (slot content is compiled in navigation.svelte's scope, so its scoped `.theme-toggle` styles — lines 98–118 — already apply to elements inside the slot; the existing `<a>` links prove this).

1. **Placement** — add one `<li>` as the **last** item in the slot list, after the Login `<li>` (current last entry at line 49, before `</SlideMenu>` at line 50). Because the menu strip is bottom-anchored, this puts the control at the bottom-left of the strip — clear of the fixed bottom-right hamburger (`.menu-button`, line 33).
2. **Markup** (reuses the existing handler at line 11 and the existing `.theme-toggle` class, so icon + circular button + colors match the desktop control 1:1):
   ```svelte
   <li class="theme-row">
       <button class="theme-toggle" on:click={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
           <span class="icon">🌙</span>
       </button>
   </li>
   ```
   - Icon: keep the **static 🌙** to match existing toggle semantics (the desktop button is also a static 🌙; not making the icon theme-reactive keeps the change minimal — see Simplifications §6).
   - `aria-label` for a11y parity (desktop has only `title`).
3. **Toggle semantics** — call the existing `toggleTheme()` → `theme.toggle()`. Do **not** use the `/config`-style `theme.set()` select; that would introduce a second semantic (explicit choice) where the rest of the nav uses flip.
4. **Close-on-toggle behavior** — **keep the menu open** after toggling (do not add `on:click={toggleMenu}`). Rationale: this is an in-place control, not navigation; closing would force reopen to toggle back, and the `{#key menuOpen}` wrapper remounts `SlideMenu` on every open-state change, so a click-through close adds needless churn. (If the team prefers strict consistency with the 7 nav links, the fallback is adding `on:click={toggleMenu}` — one extra attribute; not recommended.)
5. **No new CSS needed.** The shared `li` rule (margin `10px 30px`) and the existing `.theme-toggle` rule (36px circle, `var(--button-bg)`, visible in both themes) cover it. Optionally add a `padding-top` on `.theme-row` if visual separation from "Login" is desired — cosmetic, defer.

### Risks / notes

- `slideMenu.svelte:10–13` hides the container at `min-width: 600px` while `navigation.svelte` shows the hamburger at `max-width: 768px` → **at 600–768px widths the hamburger is visible but opens a hidden menu** (pre-existing dead control on tablet widths). Out of scope for Phase 0, but the validation viewport (390px) is unaffected; flag for a later breakpoint-alignment fix.
- `theme.initialize()` runs in `+layout.svelte` `onMount`, so the store is live by the time the menu can be opened; no init edge case.

---

## Item 2 — `/tags` is a stub

### Evidence

- `app/src/routes/tags/+page.svelte` (21 lines): fetches `/api/tags` in `onMount` (lines 12–17) into `tagList`, then renders only `<div>Tags Here</div>` (line 19). No styling, no tokens — near-invisible in dark theme (confirmed `dev/harness/shots/06-tags.png`) and effectively blank on mobile (confirmed `dev/harness/shots-mobile/m06-tags.png`: dim "Tags Here" top-left, rest empty).
- API contract: `app/src/routes/api/tags/+server.ts` GET → `json(tags)` where `tags: string[]` comes from `TagModel.getAll()` (`app/src/lib/server/models/tagModel.ts` = `imageCollection.distinct('tags')` filtered to truthy). Error path returns `{ success: false }` (non-array — any client renderer must guard).
- Tag-search encoding on `/posts`: `app/src/routes/posts/+page.server.ts:15,26` — `?search=<term>` → `filter.tags = { $all: [searchTerm] }` (the **entire query string is one tag value**; `?notag=<tag>` is the separate exclusion param, line 16/28). Same semantics in `review/+page.server.ts:15,20`, `postsSmart`, `postGroups`.
- Existing chip convention: `app/src/lib/tag.svelte:12` links `<a href="/posts?search={tag}">`; `:11` links `<a href="/posts?search=-{tag}">` — **the `-` exclude link is broken** against the live server (server reads `notag`, not a `-` prefix; the prefix parser `SearchTxtToFilter.ts` is orphaned — zero imports repo-wide — and itself buggy: `$options: '1'` typo, stray `console.log`). **Design the /tags chips with positive links only.**
- `Tags` is a primary nav item in both desktop (navigation.svelte line 23) and mobile (line 46) navs, and in `LISTING_ROOTS` (`+layout.svelte` line 15).

### Option A — Minimal real tag page (recommended)

**Files:**
- **New:** `app/src/routes/tags/+page.server.ts` — server-side load (matches the `/posts`, `/admin/users` convention; removes the client-fetch race that left the commented-out `document.title = `#${tagList}`` nonsense in place):
  ```ts
  import { TagModel } from '$lib/server/models/tagModel';
  export const load = async () => {
      let tags: string[] = [];
      try { tags = await TagModel.getAll(); } catch (e) { console.error(e); }
      return { tags };
  };
  ```
  (`/api/tags` stays as-is — `tagSection.svelte` still consumes it.)
- **Rewrite:** `app/src/routes/tags/+page.svelte` (~45 lines incl. styles):
  - `<h1>Tags</h1>` (`var(--text-primary)`, Montserrat, matching `/config`'s `h1` treatment).
  - **Grid:** `<div class="tag-grid">` with `display: flex; flex-wrap: wrap; gap: 8px; max-width: 600px; margin: 0 auto; padding: 20px;` (config-container proportions) — mobile-friendly by construction (chips wrap at any width; no JS).
  - **Chip:** one per tag: `<a class="chip" href="/posts?search=" + encodeURIComponent(tag)>{tag}</a>`. Token styling: `background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 14px; font-family: 'Montserrat'; text-decoration: none; transition: background-color .3s ease, color .3s ease;` hover: `background: var(--button-primary); color: var(--button-text);` (same pairing as tagSection's Edit button — visible in both themes). `encodeURIComponent` is required for correctness (tags may contain spaces/symbols); the live `$all` semantics make single-tag links exact.
  - **Empty state:** `{#if data.tags.length === 0}<p class="empty">No tags yet — add tags from a post's detail page.</p>{/if}` with `color: var(--text-secondary); text-align: center;`.
  - **Title:** `document.title = 'Tags'` (replace the dead commented line).
  - No loading state needed (server load), no error UI beyond the try/catch above (graceful → empty state).

**Effort:** ~0.5–1 h (1 new small file, 1 page rewrite, tokens already exist). **IA effect:** primary nav item becomes truthful.

### Option B — Remove Tags from nav

- Delete `<a href="/tags">Tags</a>` from `navigation.svelte` line 23 (desktop) and line 46 (SlideMenu); drop `'/tags'` from `LISTING_ROOTS` in `+layout.svelte:15`.
- **Effort:** ~5 min. **Downsides:** the route stays public and blank (URLs/screenshots share it); hides a first-class concept — tag search *is* the site's main search mechanism and every post detail has an editable tag section; discoverability regression.

### Recommendation: **Option A**

1. Zero backend work — `TagModel` + `/api/tags` already exist and are exercised in prod paths (`tagSection.svelte`).
2. Conventions already solved the hard parts: chip link format (`tag.svelte:12`), page proportions (`config`), tokens (both themes defined).
3. Option B only deletes the symptom (a visible link) while the dead endpoint and blank page remain reachable; for the same or less effort A makes the IA honest instead of shrinking it.

---

## Item 3 — `/config` is unreachable (broken admin gate)

### Root cause (verified chain)

- `app/src/routes/config/+page.server.ts:11`: `if (locals.user.username !== 'admin') redirect(307, '/login')`.
- better-auth users have **no `username` field**: `UserWithRole` in `app/src/lib/auth.ts:8–17` = `{ id, email, name, image?, role, emailVerified, createdAt, updatedAt }`; `hooks.server.ts:17–20` sets `locals.user = session.user` (plain object, no username); live session payload in `dev/harness/.run/state.json` confirms user = `{ name: "Admin", email: "admin@example.com", role: "admin", … }` — no username.
- Therefore the gate is `undefined !== 'admin'` → **true for everyone, including the logged-in admin** → `redirect(307, '/login')`; `login/+page.svelte` then does `goto('/')` after sign-in. Net effect: admin bounces `/config → /login → home` — exactly the home hero captured in `dev/harness/shots/08-config.png` (and m08-config).

### Design — role check (chosen) vs ADMIN_EMAIL match (rejected)

**Chosen: `role === 'admin'`.** Justification:

1. **Codebase precedent** — the existing admin gate at `app/src/routes/admin/users/+page.server.ts:13` is `if (user.role !== 'admin') redirect(302, '/')` (and `:27` in its action). Matching it makes auth checks uniform.
2. **Ready-made helper, currently unused** — `isAdmin(user)` at `app/src/lib/auth.ts:155` exists for exactly this; using it gives one definition of "admin".
3. **`ADMIN_EMAIL` is a seed value, not an identity** — `app/.env:7` feeds `initializeAdminUser()` in `auth.ts` (initialization path only). The admin panel (`/admin/users` action) can create **additional admins**, and an admin can change their email; an email comparison would silently break in either case and couples per-request auth to an env var (plus case/normalization pitfalls). `role` is the actual authorization field on every user row.

**Exact targets in `app/src/routes/config/+page.server.ts`:**

```ts
// line 2: add import
import { isAdmin } from '$lib/auth';

// lines 6–17: replace load()
export const load = async ({ locals }) => {
    if (!locals.user) {
        redirect(307, '/login');
    }
    if (!isAdmin(locals.user)) {
        redirect(302, '/');          // non-admin logged-in users → home, matching /admin/users:13
    }
    return { user: locals.user };    // username doesn't exist; return the user object
};

// lines 20–25: actions.default — add the same gate after the existing !locals.user check
// (defense in depth: today any logged-in user can trigger updateAllThumbnails())
```

- Non-admin redirect target is `/` (not `/login`) — consistent with `admin/users/+page.server.ts:13`; sending a *logged-in* user to `/login` is what produced the confusing current loop.
- **`app/src/routes/config/+page.svelte:6`**: `export let currentUser = data.username;` → `export let currentUser = data.user?.email;` (the "Logged in as:" line at ~139 then shows `admin@example.com` — more identifying than `name: "Admin"`).

### Nav placement: keep `/config` OUT of the nav

- It's an admin settings page (Appearance/Browsing/Image Processing/Account in `config/+page.svelte`), not a browsing destination; `/admin/users` is likewise not nav-linked. Adding it for everyone is wrong; a session-conditional nav link would require client auth subscription in `navigation.svelte` (flash + complexity) — not justified in Phase 0.
- **Optional one-line discoverability win (recommended):** add a "Settings" link (`<a href="/config">`) on the `/admin/users` page so admins who can reach the panel can also reach settings.

### Related finding — no active-route indicator in nav (optional sub-item)

`navigation.svelte` renders 7 plain `<a>` links with only a hover blink animation; nothing marks the current route (no `aria-current`, no active style), so on mobile especially there's no way to see where you are once the SlideMenu closes. If taken on in this phase: subscribe to the `$page` store in `navigation.svelte`, compare `$page.url.pathname` to each href, apply a `class:active` (e.g. `color: var(--text-accent)`) and `aria-current="page"` — ~10 lines, self-contained in one file. Marked **optional**; do not block the three fixes on it.

### Related security note (flag, out of Phase 0 scope)

`app/src/routes/api/process/+server.ts` POST `start` has **no auth at all** — the `/config` page exists to administer it, yet anyone who knows the URL can trigger a full-image reprocess (CPU/disk DoS vector). The page-level gate fixed here does not protect the endpoint. Recommend a follow-up: session/role check in the POST handler.

---

## Cross-cutting simplification opportunities

1. **`app/src/lib/SearchTxtToFilter.ts` is orphaned** — zero imports repo-wide (grep-verified), and buggy (`$options: '1'` typo at the `$nor` branch, stray `console.log`). Live search semantics are the simpler `$all`-whole-string in each page server. **Delete it** (or wire it in deliberately as a future multi-term search — a separate decision).
2. **`app/src/routes/api/tags/+server.ts:11`** — `tags.filter((tag) => tag);` is a no-op (no `return`, result discarded); `TagModel.getAll()` already filters. Delete the line.
3. **`app/src/routes/signUp/+page.svelte:48`** — the "Your Username" input is dead: `username` state is bound but never included in the `authClient.signUp.email` call (lines 14–18). Remove the field (users have no username — see Item 3) to stop implying one exists.
4. **`config/+page.svelte`** duplicates theme-store bookkeeping (`currentTheme` + direct `localStorage.getItem('theme')` in `loadPreferences` alongside `theme.initialize()` in the layout). Consolidate onto the `theme` store later; not needed for the gate fix (only the line 6 `data.username` change is required).
5. **`tag.svelte:11` exclude links** (`/posts?search=-{tag}`) don't match the live server contract (`notag` param). Either change to `/posts?notag={tag}` or accept as known-broken; decide when touching tag UI, don't silently propagate the pattern from the new `/tags` page (which uses positive links only, per Item 2).
6. **Static 🌙 icon** in both theme toggles regardless of current theme; a `$theme`-reactive ☀️/🌙 is a nice-to-have, deferred to keep Item 1 minimal.

---

## Validation plan

### Harness

Stack: `bash dev/harness/up.sh` (Mongo + Vite, idempotent). Driver: `node dev/harness/drive.mjs` (Playwright; supports `goto/route`, `click`, `fill`, `waitFor`, `screenshot`, `eval`, `expect`, `conditional`; writes `dev/harness/.run/last-report.json`; exits non-zero on any failed step, page error, or HTTP ≥400 — so a 307 loop on `/config` fails the run automatically).

### New scenario (create at implement time) — `dev/harness/scenarios/nav-ia-validation.json`

Viewport **390×844**, theme `dark` (→ `colorScheme: dark`, so `theme.initialize()` boots dark and a toggle flips to `light` — observable). Login via `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `app/.env` (harness default behavior; storage state persists in `.run/state.json`).

```json
{
  "name": "nav-ia-validation",
  "viewport": { "width": 390, "height": 844 },
  "theme": "dark",
  "outDir": "dev/harness/shots-mobile",
  "steps": [
    { "route": "/posts", "screenshot": "m11-mobile-posts" },
    { "click": ".menu-button" },
    { "waitFor": ".menu-container.open" },
    { "screenshot": "m12-slide-menu-open" },
    { "eval": "document.documentElement.getAttribute('data-theme')", "label": "theme-before-toggle" },
    { "click": ".menu-container button.theme-toggle" },
    { "wait": 400 },
    { "eval": "document.documentElement.getAttribute('data-theme')", "label": "theme-after-toggle" },
    { "screenshot": "m13-slide-menu-after-theme-toggle" },
    { "route": "/tags", "screenshot": "m14-tags" },
    { "expect": { "selector": "h1", "text": "Tags" } },
    { "route": "/config", "screenshot": "m15-config-admin" },
    { "expect": { "selector": "h1", "text": "Settings" }, "expectText": "Appearance" },
    { "expect": { "selector": ".user-info", "text": "admin@example.com" } }
  ]
}
```

Acceptance of the three items from this run:
- **Item 1:** `m12-slide-menu-open.png` shows the SlideMenu with a visible 🌙 circular button as the last entry; `theme-before-toggle` = `dark`, `theme-after-toggle` = `light` (and the shot reflects the flipped theme); menu stays open after toggle.
- **Item 2:** `m14-tags.png` shows the "Tags" heading + wrapped tag chips (or the empty-state sentence on a tag-less DB) — no more near-blank page; chips link `/posts?search=…` (verifiable by tapping one chip → `/posts` search results; optional extra step).
- **Item 3:** `m15-config-admin.png` shows the **Settings** UI (Appearance / Browsing / Image Processing sections) with "Logged in as: admin@example.com" at 200 — **no** redirect to `/login`/home; the driver's `httpErrors` list must be empty for `/config`.

### Desktop regression

`node dev/harness/drive.mjs --preset smoke` (1440×900; re-captures `06-tags`, `08-config`, `09-admin-users`) — confirms no desktop regressions and the same `/config` 200 as admin.

### Manual / optional checks (parent runs)

- **Negative gate:** as a non-admin session, `/config` must redirect to `/` (302) — requires a non-admin user; create one via `/admin/users` or seed, then re-point the scenario with its credentials. (Skip if no non-admin account exists; note in the report.)
- Spot-check the 600–768px tablet width (known pre-existing dead-hamburger, documented above) — expected to be unchanged, not a regression.

### Commands for the implementing/verifying session

```bash
bash dev/harness/up.sh
node dev/harness/drive.mjs --scenario dev/harness/scenarios/nav-ia-validation.json
node dev/harness/drive.mjs --preset smoke
```

---

## Out of scope (Phase 0)

- 600–768px breakpoint alignment (hamburger opens a hidden SlideMenu).
- `/api/process` auth (flagged above as follow-up).
- Multi-term/regex search (wiring or deleting `SearchTxtToFilter.ts` is a separate decision; deletion itself is a one-line PR if the team approves).
- Admin-conditional nav entries, active-route indicator (optional sub-item only).
```

## Review
- **Correct (verified, with evidence):**
  - Item 1 target is minimal and correct: `SlideMenu` is a slot container (`slideMenu.svelte:9`), `toggleTheme()`/`theme` already imported in `navigation.svelte:11`, `.theme-toggle` scoped styles apply to slot content — a single `<li>` addition in `navigation.svelte` (after line 49) is the smallest correct change.
  - Item 2 contract verified end-to-end: `TagModel.getAll()` → `string[]`; live tag search is `?search=<tag>` via `$all` (`posts/+page.server.ts:26`); chip convention exists in `tag.svelte:12`; screenshots confirm the blank/dim state.
  - Item 3 root cause verified against three independent sources: `UserWithRole` in `auth.ts:8–17`, session payload in `dev/harness/.run/state.json` (role: `admin`, no username), and the home-hero `/config` screenshots (`08-config.png`). The role-gate design matches existing precedent (`admin/users/+page.server.ts:13`) and the unused `isAdmin()` helper (`auth.ts:155`).
- **Blocker:** none — this is a design deliverable; no code was touched.
- **Note (severity-tagged findings beyond the three items):**
  - medium: `POST /api/process` (`app/src/routes/api/process/+server.ts`) has no auth — any visitor can trigger full image reprocessing; the `/config` gate fix does not cover it.
  - medium: 600–768px widths show the hamburger but `slideMenu.svelte:10–13` hides the container — dead mobile menu on tablets (pre-existing).
  - low: `tag.svelte:11` `-` exclude links don't match the live `notag` contract; `api/tags/+server.ts:11` no-op filter; `SearchTxtToFilter.ts` orphaned and buggy; dead username input in `signUp/+page.svelte:48`; no active-route indicator in nav.
- **Residual risks:** design is design-only; exact line numbers were verified against current file contents but will drift if files change before implementation — the implementing worker should re-check the three anchor lines (`navigation.svelte:49`, `config/+page.server.ts:11`, `tags/+page.svelte:19`).