<script lang="ts">
    
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import SearchBar from "$lib/searchBar.svelte";
import Image from "$lib/image.svelte";
import { groupSize, groupCount } from "$lib/stores/searchStore";
import { onMount, beforeUpdate } from "svelte";
/** @type {import('./$types').PageData} */ 

interface ServerData {
    groups:{
        name: string, 
        uploadDate: string, 
        children: string[], 
        groups: string[], 
        groupType: string, 
        groupTags: string[], 
    }[];
    pageNum: number;
    currPage: number;
    length: number;
    searchTerm: string;
}

export let data : ServerData;

let nextPage: string | null = null;
let prevPage: string | null = null;
let firstPage: string | null = null;
let lastPage: string | null = null;
const sizes = [100, 110, 150, 200, 300];
const numImages = [24, 32, 48, 60, 72, 84, 96];

const calculatePages = () => {
    if ($groupCount !== 24) {
        reloadCurrPage();
    }
    const numImageParam = $groupCount === 24 ? "" : `&len=${$groupCount}`;

    const url = new URL(window.location.href);
    url.searchParams.set("numImages", $groupCount.toString());

    nextPage = data.currPage > 1 ? `${url.pathname}?page=${data.currPage - 1}${numImageParam}` : null;
    prevPage = data.currPage < data.pageNum ? `${url.pathname}?page=${data.currPage + 1}${numImageParam}` : null;
    firstPage = `${url.pathname}?page=1${numImageParam}`;
    lastPage = `${url.pathname}?page=${data.pageNum}${numImageParam}`;
};

onMount(() => {
    calculatePages();
});

beforeUpdate(() => {
    calculatePages();
});


</script>

<div class = "midContainer" >
    <SideBar>
        <SearchBar />
        <TagSection editable={false}/>
    </SideBar>
    <div class = "groupBrowser" style="grid-template-columns: repeat(auto-fit, minmax({110}px, 1fr)">
        <div class = "pgnumCont">
            <div class="prevPageCont">
                <a href={firstPage} class="pageNum">&lt&lt/</a>
                <a href={nextPage} class="pageNum">&lt&lt&lt</a>
            </div>
            <div class="nextPageCont">
                <a href={prevPage} class="pageNum">&gt&gt&gt</a>
                <a href={lastPage} class="pageNum">\&gt&gt</a>
            </div>
        </div>
        <span> Size:
            <select  >
                {#each sizes as size}
                    <option value={size}>{size}</option>
                {/each}
            </select>
        </span>
        <span> Length:
            <select  >
                {#each numImages as num}
                    <option value={num}>{num}</option>
                {/each}
        </span>
        <div class="groupGrid">
        {#each data.groups as group}
            <p>{group.name}</p>
            {#each group.children as image}
                {#await }
                    <p>Loading...</p>
                {:then } 
                    <Image src = "/{image.thumbnailPath}" 
                    mainLink = "/posts/{image.uploadDate}" 
                    imageName = {image.originalName} 
                    thumbnail={true}></Image>
                {/await}   
            {/each}
        {/each}
        </div>
    </div>
    <div class="footerSpacer"></div>
</div>

<style>
    .midContainer{
        display:grid;
        height:100%;
        align-self: stretch;
    }

    .footerSpacer{
        height: 30px;
    }

    @media (min-width:960px) {
        .midContainer{
            grid-template-columns: 1fr 4fr;
        }

        .groupGrid{
            gap:5px;
        }
    }
</style>