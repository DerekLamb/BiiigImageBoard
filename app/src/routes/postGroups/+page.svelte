<script lang="ts">
	import TagSection from '$lib/tagSection.svelte';
	import SideBar from '$lib/sideBar.svelte';
	import SearchBar from '$lib/searchBar.svelte';
	import Image from '$lib/image.svelte';
	import PageNav from '$lib/pageNav.svelte';
	import { groupCount } from '$lib/stores/searchStore';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	/** @type {import('./$types').PageData} */

	interface ServerData {
		groups: {
			name: string;
			uploadDate: string;
			children: string[];
			groups: string[];
			groupType: string;
			groupTags: string[];
		}[];
		pageNum: number;
		currPage: number;
		length: number;
		searchTerm: string;
	}

	let { data }: { data: PageData } = $props();

	const sizes = [100, 110, 150, 200, 300];
	const numImages = [24, 32, 48, 60, 72, 84, 96];

	const pathname = $derived(page.url.pathname);
</script>

<div class="midContainer">
	<SideBar>
		<SearchBar />
		<TagSection editable={false} />
	</SideBar>
	<div class="groupBrowser" style="grid-template-columns: repeat(auto-fit, minmax({110}px, 1fr)">
		<PageNav
			baseUrl={pathname}
			currentPage={data.currPage}
			totalPages={data.pageNum}
			length={$groupCount}
			ariaLabel="Top pagination"
			hideOnMobile
		/>
		<span>
			Size:
			<select>
				{#each sizes as size}
					<option value={size}>{size}</option>
				{/each}
			</select>
		</span>
		<span>
			Length:
			<select bind:value={$groupCount}>
				{#each numImages as num}
					<option value={num}>{num}</option>
				{/each}
			</select></span
		>
		<div class="groupGrid">
			{#each data.groups as group}
				<p>{group.name}</p>
				{#each group.children as image}
					<Image
						src="/{image.thumbnailPath}"
						mainLink="/posts/{image.uploadDate}"
						imageName={image.originalName}
						thumbnail={true}
					></Image>
				{/each}
			{/each}
		</div>

		<PageNav
			baseUrl={pathname}
			currentPage={data.currPage}
			totalPages={data.pageNum}
			length={$groupCount}
			ariaLabel="Bottom pagination"
		/>
	</div>
	<div class="footerSpacer"></div>
</div>

<style>
	.midContainer {
		display: grid;
		height: 100%;
		align-self: stretch;
	}

	.footerSpacer {
		height: 30px;
	}

	@media (min-width: 960px) {
		.midContainer {
			grid-template-columns: 1fr 4fr;
		}

		.groupGrid {
			gap: 5px;
		}
	}
</style>
