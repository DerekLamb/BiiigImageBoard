import { browser } from '$app/environment';

/**
 * In-memory return-to state: the last "listing" page the user left, so
 * detail pages can offer a "back to previous page" that preserves search,
 * pagination and scroll position.
 *
 * This is a *calculated* value, not a store: the URL is derived reactively
 * from module-level $state (persisted across SPA navigations because the
 * module is loaded once per tab). Nothing is written to sessionStorage —
 * a fresh tab or hard reload simply falls back to the page's default link.
 */
const returnState = $state<{ url: string | null; scrollY: number }>({
	url: null,
	scrollY: 0,
});

export function saveReturnState(url: string, scrollY: number): void {
	if (!browser) return;
	returnState.url = url;
	returnState.scrollY = scrollY;
}

export function clearReturnState(): void {
	returnState.url = null;
	returnState.scrollY = 0;
}

/**
 * The return page as a reactive computation: the remembered listing when
 * one exists, otherwise `fallback`. Safe to use inside `$derived`,
 * `$effect` or templates — it tracks the underlying state.
 */
export function returnToUrl(fallback: string): string {
	return returnState.url ?? fallback;
}

/** Read the raw reactive state (url + scrollY) directly. */
export function getReturnState(): { url: string | null; scrollY: number } {
	return returnState;
}
