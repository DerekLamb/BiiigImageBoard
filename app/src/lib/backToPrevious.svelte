<script lang="ts">
	import { returnToUrl } from '$lib/returnTo.svelte.ts';

	let {
		fallback = '/',
		label = '← Back',
	}: {
		fallback?: string;
		label?: string;
	} = $props();

	// The return page as a reactive computation: the listing the user last
	// left when one is known, otherwise `fallback` (also during SSR).
	let href: string = $derived(returnToUrl(fallback));
</script>

<a href={href} class="backLink" data-sveltekit-noscroll>{label}</a>

<style>
	.backLink {
		color: var(--text-accent, var(--text-secondary));
		text-decoration: none;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.backLink:hover {
		text-decoration: underline;
	}
</style>
