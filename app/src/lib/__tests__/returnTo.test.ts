import { describe, it, expect, beforeEach, vi } from 'vitest';

// Run the module as if in a real browser tab (it guards writes with `browser`).
vi.mock('esm-env', () => ({ BROWSER: true, WORKER: false, BROWSER_OR_WORKER: true, DEV: false }));
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import BackToPrevious from '$lib/backToPrevious.svelte';
import {
	saveReturnState,
	clearReturnState,
	getReturnState,
	returnToUrl,
} from '$lib/returnTo.svelte.ts';

beforeEach(() => {
	clearReturnState();
	cleanup();
});

describe('returnTo module (calculated return page)', () => {
	it('falls back to the given URL when no listing was left', () => {
		expect(returnToUrl('/posts')).toBe('/posts');
		expect(getReturnState().url).toBeNull();
	});

	it('records the listing left, preserving search and pagination', () => {
		const listing = '/posts?page=3&len=24&query=cat';
		saveReturnState(listing, 480);

		expect(returnToUrl('/posts')).toBe(listing);
		expect(getReturnState().url).toBe(listing);
		expect(getReturnState().scrollY).toBe(480);
	});

	it('overwrites the previous listing when navigating listings', () => {
		saveReturnState('/posts?page=1', 0);
		saveReturnState('/postsByDate?page=2', 120);

		expect(returnToUrl('/posts')).toBe('/postsByDate?page=2');
	});

	it('restores the fallback after clearing', () => {
		saveReturnState('/posts?page=3', 999);
		clearReturnState();

		expect(returnToUrl('/posts')).toBe('/posts');
		expect(getReturnState().url).toBeNull();
		expect(getReturnState().scrollY).toBe(0);
	});
});

describe('BackToPrevious component', () => {
	it('renders the fallback when no return page is known', () => {
		const { getByRole } = render(BackToPrevious, {
			props: { fallback: '/posts', label: '← Posts' },
		});

		expect(getByRole('link', { name: '← Posts' }).getAttribute('href')).toBe('/posts');
	});

	it('renders the last visited listing as the return page', () => {
		const listing = '/posts?page=3&len=24&query=cat';
		saveReturnState(listing, 480);

		const { getByRole } = render(BackToPrevious, {
			props: { fallback: '/posts', label: '← Posts' },
		});

		expect(getByRole('link', { name: '← Posts' }).getAttribute('href')).toBe(listing);
	});

	it('updates when the return page changes', async () => {
		saveReturnState('/posts?page=2', 0);
		const { getByRole } = render(BackToPrevious, {
			props: { fallback: '/posts', label: '← Posts' },
		});

		saveReturnState('/postGroups?page=1', 0);
		await tick();
		expect(getByRole('link', { name: '← Posts' }).getAttribute('href')).toBe(
			'/postGroups?page=1'
		);
	});
});
