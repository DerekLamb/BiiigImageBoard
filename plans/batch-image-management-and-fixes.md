# Plan: Necessary Fixes + Batch Image Management (Delete)

Status: **draft / awaiting decisions**
Recon inputs: `.pi/planning/recon-fixes.md` (code-quality), `.pi/planning/recon-harness.md`
(dev-harness), plus direct inspection. Screenshots in `dev/harness/shots/`.

## Goal

Two related tracks:

1. **Necessary fixes** — the verified bugs and consistency gaps that block or
   undermine image management, especially anything that risks data loss,
   orphaned files, or "lost" images.
2. **Batch image management (delete)** — make multi-image selection + delete
   actually work end-to-end, safely, with clear feedback.

Track 2 depends on Track 1: a correct, single deletion workflow is the
foundation for batch delete.

---

## Track 1 — Necessary fixes

### P0 (data integrity / security)

**1. Deletion is non-atomic and leaks files.**
- `BatchService.deleteImages` → `ImageModel.deleteManyImages` deletes Mongo
  docs only; never removes `imagePath`/`thumbnailPath`
  (`batchService.ts:46-54`, `imageModel.ts:121-129`).
- Single delete (`imageController.deleteImage`, `imageController.ts:50-77`)
  deletes the DB doc first, then files, ignores `FileOperationResult.success`,
  and still reports success when file cleanup fails
  (`localImageStorage.ts:33-49`).
- **Fix:** one server-side delete workflow for single *and* batch:
  load docs → delete original + thumbnail → verify `FileOperationResult` →
  delete DB doc → remove group/tag/dedup references. Return explicit
  per-image results and a partial-failure summary. Never report success if
  files remain.

**2. Deleted images can reappear via recovery.**
- `recoveryService` scans `images/` and re-adds files not in the DB
  (`recoveryService.ts`, `POST /api/recovery`). Because batch delete leaves
  files, a recovery run can resurrect "deleted" images.
- **Fix:** make delete and recovery agree. If hard delete, remove files so
  recovery has nothing to re-add. If soft delete/trash, move files to a
  directory recovery ignores and mark docs so recovery skips them.

**3. Deleting a group strands its images.**
- Group creation sets each child's `group` to the group id
  (`groupController.ts:76-82`); group delete removes only the group doc
  (`groupController.ts:104-110`, `groupModel.ts:107-114`); root aggregate
  excludes `group: []` non-empty (`unifiedModel.ts:31-49`).
- **Fix:** in the delete-group workflow, first clear the group id from each
  child image, then delete the group. Decide cascade vs return-to-root (see
  Open Decisions).

**4. Delete has authentication but no authorization.**
- `/api/posts`, `/api/review/delete`, `postGroups/[slug]`, `posts/[slug]`
  only check `if (!locals.user)` (`api/posts/+server.ts:5-8`,
  `api/review/delete/+server.ts:5-8`, etc.). Any authenticated user can
  delete. Admin role infra already exists (`auth.ts:149-150`,
  `admin/users/+page.server.ts`).
- **Fix:** enforce an explicit policy (recommend admin-only) at the server
  boundary with 403s. Apply consistently to image + group delete.

### P1 (correctness)

**5. `/postGroups` 500s during SSR.**
- `postGroups/+page.svelte:30` runs
  `new URL(window.location.href)` in component init; `window` is undefined
  during SSR. Confirmed live (500 GET `/postGroups`).
- **Fix:** use SvelteKit `page.url` / `browser` instead of `window`.

**6. `/postsDynamic` bulk delete posts to an empty route.**
- Client calls `/api/update` (`postsDynamic/+page.svelte:256-264`), but
  `api/update/+server.ts` is empty.
- **Fix:** route to the working batch endpoint (see Track 2).

**7. `/postsSmart` pagination ignores the active filter.**
- Fetches with `filter(search/notag)` but computes totals with
  `getImageCount()` (`postsSmart/+page.server.ts:24-39,61-64`).
- **Fix:** use `ImageModel.countFilteredImages(filter)` with the same filter.

**8. `/postGroups` renders child ids as image docs.**
- Group children are id strings (`DocTypes.ts:8-16`) but the page accesses
  `thumbnailPath`/`uploadDate`/`originalName` on them
  (`postGroups/+page.svelte:80-85`), matching `svelte-check` errors.
- **Fix:** load full child docs server-side, or render from
  `group.thumbnailPaths` only.

### P2 (consistency / hygiene)

**9. Aggregated listing contracts disagree.** Search is accepted in
`postsDynamic`/`postGroups` loaders but ignored by `aggController`/
`groupController`; page counts drift from displayed data
(`aggController.ts:6-13`, `groupController.ts:23-30`). Pick one contract per
route and pass filter/total through consistently.

**10. Pre-existing check/lint baseline.** `npm run check` = 150 errors / 36
warnings; `npm run lint` fails with a parser error in
`mongodbCollectionFactory.ts:5`. Tests pass (28/28). Decide whether to burn
down the baseline as part of this work or separately.

---

## Track 2 — Batch image management (delete)

### What already exists
- Multi-select plumbing: `contentGrid.svelte` (`selectedIds`,
  `onToggleSelection`, gated by `groupMode`), `ImageCard.svelte` overlay,
  `ControlBar.svelte` ("Delete Selected" dispatches `delete-selected`).
- Handlers exist on `postsDynamic/+page.svelte` for `delete-selected` /
  `add-to-group` / `clear-selection`.
- Batch API exists: `POST /api/posts` → `BatchService.handleBatchOperation`
  (`favorite | delete | groupNew | groupAdd`).
- Single-delete confirmation modal pattern in `review/+page.svelte`.
- Harness observation: default `/posts` and `/postsDynamic` show no selection
  UI until "Enter Group Mode"; `/review` is single-image only.

### Proposed shape
1. **One deletion workflow** (server, from P0 #1): a
   `deleteImagesWithFiles(ids, { reason, actor })` used by single and batch.
   Handles file removal, group-ref cleanup, per-image result.
2. **One batch endpoint**: consolidate on the existing `/api/posts` batch
   route (or a clearer `/api/images/batch`), remove the empty `/api/update`
   dead end, and fix `/postsDynamic` to call it.
3. **Selection UX**: reuse `contentGrid` + `ControlBar`. Enable selection on
   the routes where it is appropriate (recommend `/posts` and `/postsDynamic`
   first; `/review` stays focused single-image). Show count, "select all
   visible", clear.
4. **Confirmation + feedback**: reuse `confirmationModal.svelte`; show
   selected count; after delete, show a summary including partial failures
   and refresh the grid/pagination.
5. **Pagination after delete**: clamp page index so deleting the last items on
   a page doesn't land on an empty page.

### Explicitly out of scope for the first slice
- Batch tagging, batch favorite, group management changes (unless trivial
  reuse). The readme's "mass tagging" can be a follow-up on the same
  selection framework.
- A full trash/undo UI, unless the soft-delete decision below says otherwise.

---

## Decisions (locked)

1. **Authorization:** delete/trash actions are **admin-only** (`isAdmin`).
2. **Deletion model:** **soft delete / trash.** Deleting marks an image for
   deletion and keeps its files; a dedicated, easy-to-review admin surface
   handles restore and permanent purge.
3. **Group delete:** clear the group id from member images (**return children
   to root**), then delete the group doc. Revisit cascade later if needed.
4. **Batch selection routes:** `/posts` and `/postsDynamic` now; `/review`
   stays single-image for now (revisit later).
5. **Feedback:** confirmation before delete (reuse `confirmationModal`).
6. **Baseline:** burn down the `svelte-check`/prettier baseline as part of
   this work.

---

## Soft-delete / trash design (locked direction)

**Data model**
- Add to image docs: `deletedAt: Date | null` (default `null`), `deletedBy`.
- Soft delete = set `deletedAt`/`deletedBy`; **files stay on disk**.
- Permanent purge = the hard-delete workflow (files + doc + refs).

**Query discipline (centralized in `ImageModel`)**
- All normal reads exclude `deletedAt != null` by default: `findImages`,
  `countAllImages`/`countFilteredImages`, `getAllHashes`, `getAdjacents`,
  `unifiedModel` aggregation, group-child expansion.
- Provide an explicit `includeDeleted`/`onlyDeleted` opt-in for the trash
  surface, so normal callers cannot accidentally surface trashed images.

**Recovery coordination (fixes P0 #2)**
- `recoveryService` must skip a file when *any* doc (including soft-deleted)
  already references it. Verify by path/filename, not only by active docs.

**Admin trash surface (“easy to review delete function”)**
- Route `/trash` (admin-only) listing soft-deleted images with: preview,
  deleted-at/by, per-item **Restore**, per-item **Delete forever**, and
  **Empty trash**. Multi-select + bulk restore/purge, reusing the same
  selection/`ControlBar` primitives as `/posts`.
- `/review` and the grids gain a link to `/trash` for admins.

**Delete workflow (server, single entry point)**
- `softDeleteImages(ids, actor)` — mark docs, return per-image results.
- `purgeImages(ids, actor)` — load docs → delete original + thumbnail →
  verify `FileOperationResult` → delete DB doc → remove group/dedup refs.
  Never report success while files remain.
- Both enforce admin at the route boundary and return partial-failure
  summaries.

**Group delete**
- `deleteGroup(groupId, actor)`: clear the id from each child's `group` array,
  then delete the group doc.

**Batch delete**
- `/api/posts` batch `delete` becomes soft delete via `softDeleteImages`;
  `/postsDynamic` is repointed there (drops the empty `/api/update` dead end).

---

## Remaining open questions (non-blocking)

- Trash retention: auto-purge after N days, or manual "Empty trash" only?
  (Default to manual only for the first slice.)
- `deletedAt` backfill: existing docs lack the field; treat missing as active
  (`{ deletedAt: { $in: [null, undefined] } }`) rather than migrating.

---

## Suggested phasing (decisions locked)

- **Phase 0 — baseline + safety net:** fix the prettier parser error and
  format; triage and burn down `svelte-check` errors. Add deletion-workflow
  unit tests (mock storage/model) using throwaway fixtures only; never
  destructive against real data.
- **Phase 1 — soft-delete foundation:** `deletedAt`/`deletedBy`, centralized
  query exclusion, recovery coordination, `softDeleteImages`/`purgeImages`,
  group-delete cleanup, admin authz. Add `/trash` admin surface.
- **Phase 2 — batch delete UX:** wire `/api/posts` batch delete to soft
  delete, repoint `/postsDynamic`, enable selection + confirmation + result
  feedback on `/posts` and `/postsDynamic`, clamp pagination after delete.
- **Phase 3 — P1/P2 fixes:** `/postGroups` SSR + child shape, `postsSmart`
  pagination, aggregated-listing contract consistency.

## Validation

- Unit tests for the deletion workflow (mock storage/model): success, missing
  doc, file-delete failure, partial batch, group-ref cleanup.
- Harness scenarios (dev-harness agent, vision): selection UI, confirmation
  modal, post-delete grid/pagination, `/postGroups` renders (no 500),
  `/postsSmart` filtered page count.
- `npm test` must stay green; track `npm run check`/`lint` deltas against the
  known baseline.
