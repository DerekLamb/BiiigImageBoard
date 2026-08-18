<script lang="ts">
	import { browser } from '$app/environment';
	import { loadReturnState } from '$lib/stores/viewState';

	let {
		fallback = '/',
		label = '← Back',
	}: {
		fallback?: string;
		label?: string;
	} = $props();

	let href: string = $state(fallback);

	// Resolve the previously-viewed page on the client (sessionStorage isn't
	// available during SSR). Falls back to `fallback` when there's no history.
	$effect(() => {
		href = browser ? loadReturnState()?.url || fallback : fallback;
	});
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
