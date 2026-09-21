<script lang="ts">
	import { page } from '$app/state';
	import { building } from '$app/environment';

	const status = $derived(page.status);
	const isNotFound = $derived(status === 404);

	const errorMessage = $derived(page.error?.message || 'An unexpected error occurred.');
	const errorStack = $derived(
		page.error instanceof Error && !building ? page.error.stack : undefined
	);

	function tryAgain(e: MouseEvent) {
		e.preventDefault();
		location.reload();
	}
</script>

<div class="errorWrap">
	<div class="errorCard">
		<div class="errorNumber">{status}</div>
		{#if isNotFound}
			<p class="errorTitle">Page not found</p>
			<p class="errorMsg">The link may be dead or the item may have been removed.</p>
			<div class="errorActions">
				<a class="errorPrimary" href="/">Go home</a>
				<a class="errorSecondary" href="/posts">Back to posts</a>
			</div>
		{:else}
			<p class="errorTitle">Something went wrong</p>
			<p class="errorMsg">{errorMessage}</p>
			<div class="errorActions">
				<a class="errorPrimary" href="/">Go home</a>
				<a class="errorSecondary" href="/" onclick={tryAgain}>Try again</a>
			</div>
		{/if}
		{#if errorStack}
			<pre class="errorStack">{errorStack}</pre>
		{/if}
	</div>
</div>

<style>
	.errorWrap {
		min-height: calc(100vh - 160px);
		display: grid;
		place-items: center;
		padding: 20px 0;
	}

	.errorCard {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2.5rem 3rem;
		text-align: center;
		max-width: 560px;
		width: 100%;
		transition: background-color 0.3s ease;
	}

	.errorNumber {
		font-family: 'Orbitron', sans-serif;
		font-size: 4rem;
		line-height: 1;
		color: var(--text-primary);
		margin-bottom: 12px;
	}

	.errorTitle {
		font-family: 'Montserrat', sans-serif;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 8px 0;
	}

	.errorMsg {
		font-family: 'Montserrat', sans-serif;
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0 0 24px 0;
	}

	.errorActions {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.errorPrimary,
	.errorSecondary {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.95rem;
		border-radius: 8px;
		padding: 6px 16px;
		text-decoration: none;
		display: inline-block;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.errorPrimary {
		background: var(--button-bg);
		color: var(--button-text);
	}

	.errorSecondary {
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		background: transparent;
	}

	.errorPrimary:hover,
	.errorSecondary:hover {
		opacity: 0.8;
	}

	.errorStack {
		margin-top: 20px;
		padding: 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.75rem;
		text-align: left;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
