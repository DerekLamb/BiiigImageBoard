<script lang="ts">
	import TagSection from '$lib/tagSection.svelte';
	import SideBar from '$lib/sideBar.svelte';
	import SearchBar from '$lib/searchBar.svelte';
	import Image from '$lib/image.svelte';
	import { groupCount } from '$lib/stores/searchStore';
    import type { PageData } from './$types'
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

	const pathname = $derived(new URL(window.location.href).pathname);
	const numImageParam = $derived($groupCount === 24 ? '' : `&len=${$groupCount}`);

	const nextPage = $derived(
		data.currPage > 1 ? `${pathname}?page=${data.currPage - 1}${numImageParam}` : null
	);

	const prevPage = $derived(
		data.currPage < data.pageNum ? `${pathname}?page=${data.currPage + 1}${numImageParam}` : null
	);

	const firstPage = $derived(`${pathname}?page=1${numImageParam}`);
	const lastPage = $derived(`${pathname}?page=${data.pageNum}${numImageParam}`);
</script>

<div class="midContainer">
	<SideBar>
		<SearchBar />
		<TagSection editable={false} />
	</SideBar>
	<div class="groupBrowser" style="grid-template-columns: repeat(auto-fit, minmax({110}px, 1fr)">
		<div class="pgnumCont">
			<div class="prevPageCont">
				<a href={firstPage} class="pageNum">&lt&lt/</a>
				<a href={nextPage} class="pageNum">&lt&lt&lt</a>
			</div>
			<div class="nextPageCont">
				<a href={prevPage} class="pageNum">&gt&gt&gt</a>
				<a href={lastPage} class="pageNum">\&gt&gt</a>
			</div>
		</div>
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
			<select>
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
