<script lang="ts">
	import { returnToUrl } from '$lib/returnTo.svelte.ts';

	let {
		href,
		fallback = '/',
		label = '← Back',
	}: {
		href?: string;
		fallback?: string;
		label?: string;
	} = $props();

	// An explicit (calculated) return page takes precedence when given;
	// otherwise the reactive saved state; otherwise `fallback`.
	let linkHref: string = $derived(href ?? returnToUrl(fallback));
</script>

<a href={linkHref} class="backLink" data-sveltekit-noscroll>{label}</a>

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
