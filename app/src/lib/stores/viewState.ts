import { browser } from '$app/environment';

const KEY = 'bib.returnTo';

export interface ViewState {
	url: string;
	scrollY: number;
}

/**
 * Remember the listing page the user was on before navigating into a detail
 * page. Stored per-tab (sessionStorage) so detail pages can offer a real
 * "back to previous page" that preserves search, pagination and scroll.
 */
export function saveReturnState(url: string, scrollY: number): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(KEY, JSON.stringify({ url, scrollY } satisfies ViewState));
	} catch {
		/* storage unavailable — ignore */
	}
}

export function loadReturnState(): ViewState | null {
	if (!browser) return null;
	try {
		const raw = sessionStorage.getItem(KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			typeof (parsed as ViewState).url === 'string'
		) {
			return parsed as ViewState;
		}
	} catch {
		/* ignore malformed value */
	}
	return null;
}

export function clearReturnState(): void {
	if (!browser) return;
	try {
		sessionStorage.removeItem(KEY);
	} catch {
		/* ignore */
	}
}
