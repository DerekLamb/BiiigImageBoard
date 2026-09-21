<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Tags</title>
</svelte:head>

<h1>Tags</h1>

{#if data.tags.length === 0}
	<p class="empty">No tags yet — add tags from a post's detail page.</p>
{:else}
	<div class="tag-grid">
		{#each data.tags as tag}
			<a class="chip" href={'/posts?search=' + encodeURIComponent(tag)}>{tag}</a>
		{/each}
	</div>
{/if}

<style>
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

	.tag-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
	}

	.chip {
		background: var(--bg-input);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 8px 14px;
		font-family: 'Montserrat', sans-serif;
		text-decoration: none;
		transition:
			background-color 0.3s ease,
			color 0.3s ease;
	}

	.chip:hover {
		background: var(--button-primary);
		color: var(--button-text);
	}

	.empty {
		color: var(--text-secondary);
		text-align: center;
		font-family: 'Montserrat', sans-serif;
		margin-top: 40px;
	}
</style>
