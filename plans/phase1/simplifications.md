# Phase 1 Simplifications B2–B6 — Design for the Implementation Lane

## Summary

Designs for the five approved Phase 1 simplification items (scope: `plans/phase1/scope.md`), verified line-by-line against the working tree. B1 (`app/src/lib/SearchTxtToFilter.ts`) is **excluded per owner decision** and is not touched, discussed, or recommended here.

- **B2** — delete the dead `actions.delete` form action in `app/src/routes/review/+page.server.ts` (no form anywhere references it; the live delete path is `POST /api/review/delete`). Drags along only the `imageController` import.
- **B3** — delete the dead "Username (Optional)" input + state on `/signUp` (never sent to the auth API; the better-auth user model has no `username` field).
- **B4** — delete the dead `onSubmit` function in `searchBar.svelte` (contains the no-op `e.preventDefault` and the `console.log`; the function is never bound to the form, so the fix is a pure deletion with zero runtime change).
- **B5** — extract the copy-pasted search/notag filter block + `PAGE_SIZE 200` into a new shared server helper `app/src/lib/server/reviewFilter.ts`, imported by both review server files, with byte-identical query behavior.
- **B6** — restore a mobile top/left inset on the `/tags` `h1` (scoped `≤768px` media query in `tags/+page.svelte` only; the layout-level top spacing belongs to workstream A1).

## Current state (verified)

### B2 — dead `actions.delete` in review `+page.server.ts`

- `app/src/routes/review/+page.server.ts:55-75` exports `actions.delete` (`formData`-based, 307-redirect when unauthenticated, calls `imageController.getImage` at :68 and `imageController.deleteImage` at :73).
- **No consumer exists.** Grep for `<form`, `form=`, `action=` across `app/src/routes/review/**` and across every component rendered there (`sideBar.svelte`, `searchBar.svelte`, `tagSection.svelte`, `returnButton.svelte`): zero matches. Grep for `formAction`/`use:enhance` across `app/src`: the only `use:enhance` is `routes/admin/users/+page.svelte:22` (unrelated). Repo-wide `<form`/`action=` inventory (signUp:40, searchBar:14, admin/users:20, posts/[slug]:327, postGroups/[slug]:28/43, config:225, login:34) contains nothing targeting `/review`.
- **The live path is the API.** `app/src/routes/review/+page.svelte:76-80` (`deleteCurrent()`) does `fetch('/api/review/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ imageId }) })`. The endpoint exists at `app/src/routes/api/review/delete/+server.ts` and deletes via the same `imageController.deleteImage`.
- **What the dead action drags along:** only the import at `+page.server.ts:3` (`imageController`). `redirect` (:1) is still used by `load` (:10); `ImageModel` (:2) is still used by `load` (:33, :36). Nothing else references the action.
- Behavioral note (no action needed): the dead action used `imageController.getImage` (a pass-through to `ImageModel.getImageById`) and 307-redirected when unauthenticated; the live API uses `ImageModel.getImageById` directly and 401s. Delete semantics are identical; only the dead transport disappears.

### B3 — dead "Your Username" input on `/signUp`

- `app/src/routes/signUp/+page.svelte:9` — `let username = $state('');`
- `app/src/routes/signUp/+page.svelte:46-49` — the field block:
  - :47 `<label for="name">Username (Optional)</label>` (pre-existing bug: `for` points at the Name input — moot once removed)
  - :48 `<input id="username" type="text" bind:value={username} placeholder="Your Username" />`
- `handleSignUp` (:11-21) sends only `{ email, password, name }` to `authClient.signUp.email` (:13-17). `username` is never read anywhere after binding. Repo-wide case-insensitive grep for `username`: only the 3 lines above.
- **No username field on the user model.** `app/src/lib/auth.ts:55-67` — `user.additionalFields` contains exactly `role` (:57-61) and `passwordChangeRequired` (:62-65).
- **Server side:** `app/src/routes/signUp/` contains only `+page.svelte` (no `+page.server.ts`) — there are no server load/actions referencing username.
- Also present in the file (NOT part of B3, listed in Additional candidates): unused `isLoading` state (:8) and `console.log(data)`/`console.log(error)` (:19-20).

### B4 — no-op `e.preventDefault` + `console.log` in `searchBar.svelte`

- `app/src/lib/searchBar.svelte:4-11` — the `onSubmit` function:
  - :5 `e.preventDefault;` — missing parentheses; a property access that does nothing.
  - :7 `const formData = ...` — assigned, never used.
  - :8-10 builds `data` and `console.log(data)` — a leftover log.
- **Deeper finding: `onSubmit` is never bound.** The form at :14 is `<form action="/posts">` — no `method` (defaults to GET), no `target`, and **no `onsubmit` attribute** (grep for `onsubmit|onSubmit` in the file matches only the definition at :4). The function is dead code; the no-op and the log are both unreachable.
- **Observed runtime behavior (unchanged by the fix):** native browser form submission → full document navigation to `/posts?search=<input value>`, from whatever page the SearchBar is rendered on.
- **Usage inventory (9 pages):** `routes/+page.svelte:8`, `routes/posts/+page.svelte:69`, `routes/postGroups/+page.svelte:48`, `routes/postGroups/[slug]/+page.svelte:14`, `routes/postsByDate/+page.svelte:52`, `routes/postsByDate/[slug]/+page.svelte:163`, `routes/postsDynamic/+page.svelte:291`, `routes/postsSmart/+page.svelte:159`, `routes/review/+page.svelte:152`.
- The `improvSearch` store import (:2) is live (bound at :21) and stays.

### B5 — duplicated filter block + `PAGE_SIZE 200`

- Block in `app/src/routes/review/+page.server.ts:18-31`: `let filter: any = {};` + `if (searchTerm) { filter.tags = { $all: [searchTerm] }; }` + `if (notag) { if (filter.tags) { $all+$not combo } else { $not only } }`. `const PAGE_SIZE = 200;` at :6; consumed at :36 (`findImages(filter, PAGE_SIZE, 0, { uploadDate: -1 })`) and :51 (`pageSize: PAGE_SIZE`).
- Byte-identical copy in `app/src/routes/api/review/page/+server.ts:16-29` (same statement order and shape), `const PAGE_SIZE = 200;` at :5; consumed at :31 (`const skip = page * PAGE_SIZE;`) and :32 (`findImages(filter, PAGE_SIZE, skip, { uploadDate: -1 })`).
- **No other file duplicates this exact block.** Grep for `$all`/`$not`/`notag` across `app/src` found near-miss variants that are deliberately out of scope:
  - `routes/posts/+page.server.ts:24-37` and `routes/postsSmart/+page.server.ts:24-37` — same shape but guarded by `notag.length > 0`/`searchTerm.length > 0` (behaviorally identical for strings) and embedded in different pagination (dynamic `len`, `imageId` anchoring, `imageController.getImageCount()`).
  - `routes/test/+page.server.ts:15-33` — different params (`tags` array from `getAll('tags')`).
  - `routes/api/page/+server.ts:18-35` — different semantics (`getAll('notag')` array).
- `ImageModel.findImages` (`app/src/lib/server/models/imageModel.ts:18`) has default `sort = { uploadDate: -1 }`; both call sites pass the sort explicitly — kept verbatim in the design below.
- `PAGE_SIZE = 200` exists in exactly these two files (repo-wide grep).

### B6 — Tags h1 top-edge clipping at 390px

Evidence: Phase 0 after-shots `dev/harness/shots-mobile/m06-tags.png` (dark, 390×844) and `m14-tags.png` (light) — the "Tags" h1 sits at the top-left viewport corner: glyph top at the very top edge (clipped in both shots), text starting at x=0; the empty-state line also runs past the right edge (separate nit, not in scope).

Verified cause chain — at `≤768px` nothing above the page slot contributes any in-flow height, and no margin/padding remains in the wrapper chain:

1. `app/src/routes/+layout.svelte:132-140` (`@media (max-width: 768px)`): `.logo { display: none; }` at :138 — the logo block was the only element providing top spacing (`.logo h1 { margin: 10px; }` at :101).
2. `app/src/routes/+layout.svelte:114-123`: `.boxContainer { margin: 0; max-width: 100%; }` at :116 (base is `margin: 0px 50px` at :87).
3. `app/src/routes/+layout.svelte:132-140`: `.flexContainer { margin: 0 0; }` at :134 (base is `margin: 0 5vw` at :129). Body margin is already 0 (`:global(body) { margin: 0; }` at :73).
4. Inside `.flexContainer`, the Navigation element renders nothing in-flow before the slot at `≤768px`: `.navContainer` is `display: none` (`app/src/lib/navigation.svelte:73-81`, padding at :87), the `.menu-button` FAB is `position: fixed` (:156), and `SlideMenu`'s `.menu-container` is `position: fixed` (`app/src/lib/svelteComponents/slideMenu.svelte:30`, `display: none` at `≥600px` via :15-19). **The page's `<h1>` is the first in-flow box, at (0,0).**
5. `app/src/routes/tags/+page.svelte:24-28` — the scoped `h1` rule sets only `margin-bottom: 10px` (:27). Top spacing therefore relies solely on the UA default `margin-block-start: 0.67em`, which Orbitron's tall vertical metrics largely consume (inference — see Risks), and there is **zero left inset**.
6. Desktop control shot `dev/harness/shots/06-tags.png` (1440×900) shows the same h1 with proper spacing, where logo + nav provide the top room — confirming the mobile-specific cause. Other mobile pages show the same zero-top-margin pattern (`m02-posts.png`: pagination bar at y=0), i.e. this is a layout-wide trait that A1 (sticky top app bar) will own globally; B6 fixes only `/tags`.

## Recommended fix

### B2 — remove `actions.delete` (+ its import)

`app/src/routes/review/+page.server.ts`:

1. Delete line 3:
```diff
-import imageController from '$lib/server/controllers/imageController';
```
2. Delete lines 54-75 (the blank line plus the entire export), so the file ends at line 53 (`};` closing `load`):
```diff
-
-export const actions = {
-	delete: async ({ request, locals }) => {
-		if (!locals.user) {
-			redirect(307, '/login');
-		}
-
-		const data = await request.formData();
-		const imageId = data.get('imageId') as string;
-
-		if (!imageId) {
-			return { success: false, error: 'Missing imageId' };
-		}
-
-		const image = await imageController.getImage(imageId);
-		if (!image) {
-			return { success: false, error: 'Image not found' };
-		}
-
-		return await imageController.deleteImage(image);
-	}
-};
```
3. Keep `redirect` (:1) and `ImageModel` (:2) — still used by `load`. No client file imports this route's generated `Actions` type (verified: no `formAction`/`use:enhance` against `/review`).
4. Note: B5 also edits this file (filter block + `PAGE_SIZE`). Implement **B2 first, then B5**, or apply B5's "final state" snippet below which already includes B2.

### B3 — remove the username field + state

`app/src/routes/signUp/+page.svelte`:

1. Delete line 9:
```diff
-	let username = $state('');
```
2. Delete lines 46-50 (the field block plus its trailing blank line) so exactly one blank line remains between the Name and Email fields:
```diff
 				<div class="field">
 					<label for="name">Name </label>
 					<input id="name" type="text" bind:value={name} placeholder="Your Name" />
 				</div>
 
-				<div class="field">
-					<label for="name">Username (Optional)</label>
-					<input id="username" type="text" bind:value={username} placeholder="Your Username" />
-				</div>
-
 				<div class="field">
 					<label for="email">Email</label>
```
3. Leave everything else byte-identical, including `handleSignUp` and its `console.log`s (those are candidate #4 in Additional candidates, not B3).

### B4 — delete the dead `onSubmit` function

`app/src/lib/searchBar.svelte` — delete lines 3-11 (blank line + function). The script block becomes:
```diff
 <script lang="ts">
 	import { improvSearch } from '$lib/stores/searchStore';
-
-	function onSubmit(e: SubmitEvent) {
-		e.preventDefault;
-
-		const formData = new FormData(e.target as HTMLFormElement);
-		const data = Object.fromEntries(new FormData(e.target as HTMLFormElement));
-
-		console.log(data);
-	}
 </script>
```
The `<form action="/posts">` (:14) is untouched and keeps submitting natively (GET `/posts?search=...`) — behavior-preserving by construction, because the deleted code was never executed.

### B5 — shared server helper

**New file** `app/src/lib/server/reviewFilter.ts`:
```ts
/**
 * Shared review-listing filter + page size.
 *
 * routes/review/+page.server.ts (load) and routes/api/review/page/+server.ts (GET)
 * must keep byte-identical query behavior, so both call this instead of
 * maintaining their own copy of the tag-filter block.
 */
export const REVIEW_PAGE_SIZE = 200;

export function buildReviewFilter(searchTerm: string, notag: string): any {
	const filter: any = {};
	if (searchTerm) {
		filter.tags = { $all: [searchTerm] };
	}
	if (notag) {
		if (filter.tags) {
			filter.tags = {
				$all: [searchTerm],
				$not: { $in: [notag] }
			};
		} else {
			filter.tags = { $not: { $in: [notag] } };
		}
	}
	return filter;
}
```
The conditionals are the existing block moved verbatim (same operator shapes for all four input combinations: `''`+`''` → `{}`, search only → `{ tags: { $all: [s] } }`, notag only → `{ tags: { $not: { $in: [n] } } }`, both → `{ tags: { $all: [s], $not: { $in: [n] } } }`). Return type `any` matches the current `filter: any` at both call sites and keeps svelte-check quiet.

**`app/src/routes/review/+page.server.ts`** — statements that move: :6 (`const PAGE_SIZE = 200;`) and :18-31 (the filter block). Resulting file (already includes B2):
```ts
import { redirect } from '@sveltejs/kit';
import { ImageModel } from '$lib/server/models/imageModel';
import { buildReviewFilter, REVIEW_PAGE_SIZE } from '$lib/server/reviewFilter';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		redirect(307, '/login');
	}

	const searchParams = url.searchParams;
	const startId = searchParams.get('start') || '';
	const searchTerm = searchParams.get('search') || '';
	const notag = searchParams.get('notag') || '';

	const filter = buildReviewFilter(searchTerm, notag);

	const totalImages = await ImageModel.countFilteredImages(filter);

	const page = 0;
	const images = await ImageModel.findImages(filter, REVIEW_PAGE_SIZE, 0, { uploadDate: -1 });

	let startIndex = 0;
	if (startId) {
		const idx = images.findIndex((img) => img.uploadDate === startId || img._id === startId);
		if (idx >= 0) startIndex = idx;
	}

	return {
		images,
		startIndex,
		searchTerm,
		notag,
		page,
		totalImages,
		pageSize: REVIEW_PAGE_SIZE
	};
};
```

**`app/src/routes/api/review/page/+server.ts`** — statements that move: :5 (`const PAGE_SIZE = 200;`) and :16-29 (the filter block). Resulting file:
```ts
import { json } from '@sveltejs/kit';
import { ImageModel } from '$lib/server/models/imageModel';
import { buildReviewFilter, REVIEW_PAGE_SIZE } from '$lib/server/reviewFilter';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const searchTerm = url.searchParams.get('search') || '';
	const notag = url.searchParams.get('notag') || '';
	const page = parseInt(url.searchParams.get('page') || '0', 10);

	const filter = buildReviewFilter(searchTerm, notag);

	const skip = page * REVIEW_PAGE_SIZE;
	const images = await ImageModel.findImages(filter, REVIEW_PAGE_SIZE, skip, { uploadDate: -1 });

	return json({ images, page });
};
```

Everything that stays at the call sites: param extraction, the `countFilteredImages(filter)` call (review), `page` parsing and `skip = page * PAGE_SIZE` math (api), the explicit `{ uploadDate: -1 }` sort, and both response shapes (`{ images, page }` / the load return keys). Query shape, sort, and pagination math are therefore byte-identical.

### B6 — mobile inset for the `/tags` h1 (page-scoped only)

`app/src/routes/tags/+page.svelte` — insert one media query in `<style>` directly after the existing `h1` rule (after line 28):
```css
	h1 {
		color: var(--text-primary);
		font-family: 'Orbitron', sans-serif;
		margin-bottom: 10px;
	}

	/* B6: at <=768px the layout hides .logo (the only top spacing) and zeroes
	   .boxContainer/.flexContainer margins, so this h1 lands at the viewport's
	   top-left corner (after-shots m06-tags.png / m14-tags.png). Inset it to
	   match .tag-grid's 20px padding (this file, .tag-grid rule). */
	@media (max-width: 768px) {
		h1 {
			margin-top: 20px;
			margin-left: 20px;
		}
	}
```
- `margin-top: 20px` fixes the reported top-edge clipping; `margin-left: 20px` fixes the left-edge touch visible in the same shots and aligns the h1 with `.tag-grid`'s 20px left padding (:36). If the owner wants strictly top-only, drop the `margin-left` line — nothing else changes.
- **No layout changes.** A global `≤768px` `padding-top` on `.boxContainer`/`.flexContainer` would shift every mobile page (posts, review, upload, …) and collides with A1's sticky top app bar, which owns global top spacing in this same phase. `/tags`-scoped, per the "don't change anything else about /tags" constraint.
- At 600–768px this simply adds 20px to whatever spacing exists there; desktop (`>768px`) is untouched.

## Alternatives considered

- **B4a — "fix" the no-op by adding parentheses and binding `onsubmit={onSubmit}`.** Rejected: a real `e.preventDefault()` would stop the native submit, so search would stop navigating to `/posts?search=...` — a behavior change, not a fix. If the original intent was preventDefault + SPA `goto(...)`, that is a feature (new navigation semantics, back-button behavior, and it would no longer leave `/review` on submit) and belongs in a separate work item, not a simplification.
- **B4b — keep the function, delete only :5 and :10.** Rejected as inferior: the function would remain unbound dead code (and `formData` at :7 is unused). Deletion of the whole function is the same behavior with less dead code.
- **B5a — also migrate `posts/+page.server.ts` / `postsSmart/+page.server.ts` to the helper.** Rejected for this item: their blocks are near-miss variants (`.length > 0` guards, dynamic `len`, `imageId` anchoring, different counting). The helper is shaped so they can adopt it in a follow-up (see Simplification opportunities), but folding them in now would widen the behavioral-comparison surface beyond the two byte-identical files in scope.
- **B5b — put the helper in an existing file (e.g. `imageModel.ts`).** Rejected: the model is data-access; a filter *builder* + page-size constant is listing-route concern. A small dedicated module under `app/src/lib/server/` (same directory as `models/`/`controllers/`) is the pattern of least surprise.
- **B6a — fix in `+layout.svelte` (top padding on the container chain at `≤768px`).** Rejected: changes every mobile page in a phase where A1 is simultaneously redesigning the mobile top bar; also violates "do not change anything else about /tags" by changing everything else.
- **B6b — add `padding-top` to `.flexContainer` only for `/tags` via a route-scoped `:global` selector.** Rejected: route-scoped global selectors into the layout box are more fragile than a plain mobile media query on the element itself.

## Simplification opportunities

- **B2 + B5 touch the same file.** The final-state snippet in Recommended fix (B5) already includes B2; implementing B2 first and then B5 yields the same file. Do not leave the intermediate `const PAGE_SIZE = 200;` in place when applying B5.
- **`posts/+page.server.ts:24-37` and `postsSmart/+page.server.ts:24-37`** can reuse `buildReviewFilter` in a follow-up (guards `notag.length > 0` vs truthy are behaviorally identical for the string inputs they receive) — owner decides; not designed here.
- **`ImageModel.findImages`** (`imageModel.ts:18`) already defaults to `sort = { uploadDate: -1 }`; the explicit sort args at both call sites are redundant but are kept verbatim for byte-identical behavior. Dropping them is a cosmetic follow-up, not part of B5.
- **`improvSearch` store** (`searchStore.ts:23`) persists the search text to localStorage and is only consumed by the SearchBar input binding — it pre-fills the input on every page but no page reads the stored value into the URL. Whether that persistence is intentional is a product question (listed only as context; not designed).

## Validation plan

Prerequisites: dev stack stays as-is (vite :5173, mongo :27017); do not touch `dev/harness/.run/state.json`; do not re-run the harness before the pre-impl backup step defined in the scope process.

1. **svelte-check (all items):** in `app/`, `npm run check` must report **no more than the 97 errors / 35 warnings baseline — zero new**. All edits here are deletions or verbatim moves, so counts can only stay equal or drop (e.g. if a dead variable currently emits a warning).
2. **B2:**
   - Live delete still works via the API: log in as admin → `/review` → select first image → click `🗑️ Delete` → `Yes, Delete` → image disappears from the list, `N / total` counter decrements, no page errors.
   - Dead endpoint is gone: with an authenticated session, `POST /review` (multipart, field `imageId` = a throwaway test image) → **HTTP 405** (SvelteKit returns 405 when a route exports no actions). Unauthenticated `POST /review` → 307 to `/login` (load guard unchanged).
   - Harness `m05-review` screenshot visually identical to the pre-impl backup.
3. **B3:**
   - `GET /signUp` HTML before vs after: diff shows only the removed username field block; nothing else changes.
   - Harness: `/signUp` (logged out) renders exactly 3 inputs (Name, Email, Password) + the SignUp button.
   - Signup POST behavior is unchanged by construction (request body `{ email, password, name }` is identical before/after — username was never sent). Do **not** create a new user in the real DB to test this (the auth before-hook only allows signup when the user table is empty or an admin is signed in).
4. **B4:**
   - Harness: `goto /posts` → `fill #searchQueryInput` "test" → `press Enter` → URL is `/posts?search=test` (full document navigation). Repeat from `/` (home) → lands on `/posts?search=test`.
   - No new console errors. Note: the removed `console.log` was unreachable (dead function), so console output is byte-identical before/after.
5. **B5 — before/after API parity (the ideal curl comparison, done via authenticated in-page fetch to avoid hand-rolling cookies):**
   - Pre-impl: one-off harness scenario with `eval` steps (authenticated page context) fetching `GET /api/review/page` for the matrix `{}`, `{search: T}`, `{notag: T}`, `{search: A, notag: B}`, `{page: 1}` (T/A = real tags from the DB; non-matching strings are acceptable and still meaningful) — save the raw JSON.
   - Post-impl: re-run the identical matrix → **byte-identical JSON** (payload contains stable `_id`/`uploadDate` strings; no timestamps).
   - `/review` SSR: `GET /review` and `GET /review?search=A&notag=B` before/after → identical rendered image list and `N / total` position text.
   - Harness `m05-review` screenshot unchanged.
6. **B6:**
   - Harness 390×844 `/tags` (dark, m06 equivalent + light, m14 equivalent): h1 glyph top at least 20px below the viewport top edge, 20px left inset; every other pixel on the page (empty-state line, FAB, background) identical.
   - Desktop 1440×900 `/tags` shot unchanged (the media query is `≤768px` only).
7. **Harness selector note (all steps):** the app has **no `<main>` element** on any page (sole exception: `/signUp`, which does use `<main>`) — harness `waitFor`/`expect` steps must not probe `main` generally, and must not use a **bare `h1`** (on desktop it also matches the layout's logo `h1` "b..d"). Scope probes to page-specific containers: `.tag-grid, .empty` for `/tags`, `.reviewContainer` for `/review`, `.searchBar` for search, `main` for `/signUp` only, `.config-container` for `/config`.

## Risks / open questions

- **B2 — low.** Only risk: an unknown external client POSTing to `/review` with form data. Grep found none; post-change such requests get 405 instead of silently deleting — acceptable, and arguably safer. Typegen `Actions` type changes but nothing imports it.
- **B3 — low.** The signup request payload is unchanged; the removed label's broken `for="name"` disappears with it. Left alone on purpose: `isLoading` (unused), the two `console.log`s, and the Name label's trailing space.
- **B4 — none.** Pure deletion of unreachable code. If the team later wants SPA search navigation (no full reload), that is a deliberate feature change to spec separately.
- **B5 — low.** New file + two import edits; no client impact. The `any` return type is deliberate (parity with call sites, no new svelte-check noise). If the before/after JSON diff in the validation plan shows ANY difference, stop and investigate — the moved statements are verbatim, so a diff would indicate a transcription error, not a design difference.
- **B6 — low, one open question.** The fix adds a deterministic 20px inset, so it works regardless of the exact split between the UA `0.67em` margin and Orbitron's font metrics in the observed clipping — but that split itself could not be adjudicated without a live browser (this design lane is read-only with no shell); the "clipped vs merely touching" distinction rests on the after-shots plus CSS analysis that no element above the h1 has height at `≤768px`. The 20px value is a design choice (matches `.tag-grid` padding), not a spec requirement. Also: the 600–768px band has its own nav oddity (FAB visible per `navigation.svelte:73-81` while `SlideMenu` is `display: none` per `slideMenu.svelte:15-19`) — that is A1's territory and does not affect this fix.
- **Global:** the svelte-check baseline (97/35) is as provided by the orchestrator; it could not be re-run from this read-only lane. Constraint applied: zero new diagnostics (drops are fine).

## Additional candidates (owner decides, NOT designed)

1. **`app/src/routes/api/tags/+server.ts:12`** — `tags.filter((tag) => tag);` discards its return value (no-op); `TagModel.getAll` (`app/src/lib/server/models/tagModel.ts:6`) already filters truthy values. Same file: leftover `console.log(body)` at :25 in the POST handler.
2. **`app/src/lib/returnButton.svelte:14`** — stray `<input type="hidden" name="contentId">` rendered outside any `<form>`; its only usage (`app/src/routes/review/+page.svelte:154`) is on a page with no form, so it is never submitted. The sibling `<button type="submit">` (:11) is likewise outside any form and submits nothing.
3. **`app/src/routes/config/+page.svelte`** — duplicated theme bookkeeping: local `currentTheme` (:22) + raw `localStorage.getItem('theme')` (:32) duplicate `app/src/lib/stores/themeStore.ts`, which already owns the `theme` localStorage key, the `data-theme` attribute, and the reactive store; the select binds the local var (:142-143 via `handleThemeChange` :111-113). Stale select display is possible if the theme is toggled from the nav button while `/config` is mounted.
4. **`app/src/routes/signUp/+page.svelte:8`** — `isLoading` declared but never read or written; :19-20 — `console.log(data)` / `console.log(error)` leftovers in `handleSignUp`. (Adjacent to B3; B3 deliberately leaves them untouched.)
5. **`app/src/lib/stores/searchStore.ts`** — dead exports with no import site anywhere in `app/src`: `improvCurrPage` (:24), `menuOpen` (:25), `groupSize` (:28), `currPage` (:31), `presentationMode` (:32). `groupSize` additionally re-wraps the same `'imageSize'` localStorage key as the live `improvImageSize` (:26) as a separate store instance (two independent stores over one key would silently diverge if ever used).
