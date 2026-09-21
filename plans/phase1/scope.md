# Phase 1 scope — mobile IA + simplifications

Approved by the project owner 2026-09-20. Phase 0 (fix the broken) is complete
(commits 910a866 + 7ce986d + auth fix 3e1a517).

## Owner decisions

- **B1 (`SearchTxtToFilter.ts`): leave alone for now** — neither delete nor wire in.
- **A5 pagination bar: keep the BOTTOM bar** (top instance removed).
- **B7 (new): remove hold-to-scrub pagination** from `pageNav.svelte` as part of
  the simplification work — all viewports, not just mobile.
- No additional requirements from owner's phone testing of Phase 0.

## Workstream A — mobile IA (390px target, desktop regression-safe)

| ID | Item |
|----|------|
| A1 | Sticky top app bar (brand + hamburger top-right) replaces the bottom-right FAB at ≤768px; active-route indicator on nav (desktop + mobile menu, the Phase 0 deferral); resolves the 600–768px dead-hamburger band (slideMenu hidden @min-width 600 vs hamburger @max-width 768) |
| A2 | 2-column adaptive grid on mobile listing pages (currently single ~350px column at 390px) |
| A3 | /postsByDate compact filter row on mobile — restore Event gap selector + event count lost when the sidebar hides; green '+1' overflow cell → overlay badge |
| A4 | Fluid theme-aware home hero (kill fixed 800px×1200px + 100px child margins; hero allowed to move to theme tokens) |
| A5 | One pagination bar per page — keep BOTTOM only; remove duplicate top instance |
| A6 | /posts mobile toolbar compaction — single row at ≤768px (native selects stay; styling tokenization is Phase 2) |

## Workstream B — simplifications / dead code

| ID | Item |
|----|------|
| B1 | ~~`SearchTxtToFilter.ts`~~ — **EXCLUDED per owner decision** |
| B2 | Remove dead `actions.delete` in review `+page.server.ts` (client deletes via `/api/review/delete`) |
| B3 | Remove dead "Your Username" input on /signUp (never sent to the auth API; no username field on users) |
| B4 | Fix no-op `e.preventDefault` (missing parens) + remove `console.log` leftover in `searchBar.svelte` |
| B5 | De-duplicate the copy-pasted filter block between review `+page.server.ts` and `api/review/page/+server.ts` |
| B6 | Tags h1 top-edge clipping nit (from Phase 0 after-shots) |
| B7 | **Remove hold-to-scrub pagination** (pageNav.svelte): arm logic, drag tiers, notched ruler, haptics; keep simple prev/next, page indicator, `buildUrl` param preservation, 44px touch targets, aria attributes. Assess entanglement with the "return page from post position" feature — keep that if separable |

## Explicitly deferred (Phases 2/3)

Color tokenization (review palette, ControlBar, pageNav hardcoded white), native
selects → DropDown, human-readable dates, emoji → SVG icons, light/dark accent
alignment, viewport meta / `<main>` / skip link / prefers-reduced-motion /
empty states / self-hosted fonts. Tracked issue #8 (postGroups group-thumbnail
shape) stays its own ticket.

## Design docs (produced by read-only design lanes)

- `plans/phase1/mobile-nav.md` — A1
- `plans/phase1/mobile-layout.md` — A2–A6 + B7
- `plans/phase1/simplifications.md` — B2–B6

## Process (same as Phase 0)

Design lanes → owner peer approval → pre-impl commit (shots backed up to
`shots-phase1-before*`) → single-writer impl lane (B work first, then A; no
commit) → dev-harness vision verify against before-shots → post-impl commit.
