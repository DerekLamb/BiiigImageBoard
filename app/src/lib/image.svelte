<script lang="ts">
	import { goto } from '$app/navigation';
	import { createEventDispatcher, onMount } from 'svelte';

	export let src = '';
	export let alt = 'TestAlt';
	export let thumbnail = false;
	export let upScore = -1;
	export let downScore = -1;
	export let leftLink = '';
	export let rightLink = '';
	export let mainLink = '';
	export let selectMode = false;
	export let fallbackSrc = '';
	export let lazy = false;

	const dispatch = createEventDispatcher();

	let imgClass = thumbnail ? 'thumbnail' : 'full-img';

	let imgElement: HTMLImageElement | undefined;
	let failed = false;
	let attemptedFallback = false;

	function handleImageError() {
		// If a fallback source is available (e.g. thumbnail -> full image), try it once.
		if (!attemptedFallback && fallbackSrc) {
			attemptedFallback = true;
			src = fallbackSrc;
			return;
		}
		failed = true;
	}

	// The error event can fire before hydration attaches the on:error listener
	// (SSR renders the <img> first and the 404 returns quickly), so also
	// check the loaded state a couple of times after mount.
	onMount(() => {
		const check = () => {
			if (imgElement && imgElement.complete && imgElement.naturalWidth === 0) {
				handleImageError();
			}
		};
		check();
		const t1 = setTimeout(check, 100);
		const t2 = setTimeout(check, 500);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	});

	function handleClick(event: MouseEvent) {
		// In select mode, dispatch click event instead of navigating
		if (selectMode) {
			dispatch('click', { event, mainLink, leftLink, rightLink });
			return;
		}

		// Normal navigation behavior
		if (mainLink != '') {
			goto(mainLink);
			return;
		}

		if (imgElement) {
			const bounds = imgElement.getBoundingClientRect();
			const x = event.clientX - bounds.left;
			const targetLink = x < bounds.width / 2 ? leftLink : rightLink;

			if (targetLink) goto(targetLink, { noScroll: true });

			return;
		}
	}
</script>

<div class="container">
	{#if failed}
		<div class="placeholder" title="Image unavailable">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<circle cx="8.5" cy="8.5" r="1.5" />
				<path d="M21 15l-5-5L5 21" />
			</svg>
		</div>
	{:else if selectMode}
		<img
			class={imgClass}
			{src}
			{alt}
			bind:this={imgElement}
			loading={lazy ? 'lazy' : undefined}
			on:click|preventDefault={handleClick}
			on:error={handleImageError}
		/>
	{:else}
		<a href={mainLink || '#'}>
			<img
				class={imgClass}
				{src}
				{alt}
				bind:this={imgElement}
				loading={lazy ? 'lazy' : undefined}
				on:click|preventDefault={handleClick}
				on:error={handleImageError}
			/>
		</a>
	{/if}
	{#if upScore != -1 && downScore != -1}
		<span class="score">{upScore} &#x1F446 {downScore} &#x1F447 </span>
	{/if}
</div>

<style>
	.container {
		width: 100%;
		box-sizing: border-box;
		padding: 4px;
		display: flex;
		flex-direction: column;
		border-radius: 5px;
	}

	.container img {
		width: 100%; /* Makes the image responsive, scales with the width of the parent */
		height: auto; /* Keeps the image aspect ratio */
		object-fit: cover;
		border-radius: 5px;
	}

	.container span {
		display: block; /* Ensures the title appears on a new line below the image */
		overflow: hidden; /* Ensures the text doesn't overflow the container */
		white-space: nowrap; /* Keeps the title in a single line */
		text-overflow: ellipsis; /* Adds an ellipsis if the title is too long */
		font-size: 1em; /* Adjust as needed */
		margin-top: 8px; /* Space between the image and the title */
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1 / 1;
		width: 100%;
		border-radius: 5px;
		background-color: var(--bg-secondary, #f4f4f4);
		border: 1px dashed var(--border-color, #d0d0d0);
		color: var(--text-secondary, #999);
	}

	.placeholder svg {
		width: 34px;
		height: 34px;
	}
</style>
