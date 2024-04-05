<script lang="ts">
import { improvImageSize, imageCount } from "$lib/stores/searchStore";
import Image from "$lib/image.svelte";
import TagSection from "$lib/tagSection.svelte";
import SideBar from "$lib/sideBar.svelte";
import SearchBar from "$lib/searchBar.svelte";
import { onMount, beforeUpdate } from "svelte";
import { goto } from "$app/navigation";

/** @type {import('./$types').PageData} */ 
export let data;

let nextPage = null;
let prevPage = null;
let firstPage = null;
let lastPage = null;
const sizes = [100, 110, 150, 200, 300];
const numImages = [24, 32, 48, 60, 72, 84, 96];

function handleSizeChange() {
    improvImageSize.set(selectedSize);
}

function reloadCurrPage() {
    const numImageParam = $imageCount === 24 ? "" : `&len=${$imageCount}`;
    const url = new URL(window.location.href);
    url.searchParams.set("page", data.currPage.toString());
    url.searchParams.set("len", $imageCount.toString());
    goto(url.toString());
}

const calculatePages = () => {
    if ($imageCount !== 24) {
        reloadCurrPage();
    }
    const numImageParam = $imageCount === 24 ? "" : `&len=${$imageCount}`;

    const url = new URL(window.location.href);
    url.searchParams.set("numImages", $imageCount.toString());

    nextPage =
        data.currPage > 1
            ? `${url.pathname}?page=${data.currPage - 1}${numImageParam}`
            : null;
    prevPage =
        data.currPage < data.pageNum
            ? `${url.pathname}?page=${data.currPage + 1}${numImageParam}`
            : null;
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

<div class = midContainer>
    <SideBar>
        <SearchBar />
        <TagSection editable={false}/>
    </SideBar>
    <div class = "imageBrowser">
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
            <select bind:value={$improvImageSize} on:change={handleSizeChange}>
                {#each sizes as size}
                    <option value={size}>{size}</option>
                {/each}
            </select>
        </span>
        <span> Length:
            <select bind:value={$imageCount} on:change={reloadCurrPage}>
                {#each numImages as num}
                    <option value={num}>{num}</option>
                {/each}
        </span>
        <div class = "imageGrid" style="grid-template-columns: repeat(auto-fit, minmax({$improvImageSize}px, 1fr)">
        {#each data.images as image}
            {#if image.thumbnailPath}
                <div class = "imageBox">
                    <Image src = "/{image.thumbnailPath}" link = "/posts/{image.uploadDate}" imageName = {image.originalName} thumbnail={true}></Image>
                </div>
            {:else}
                <div class = "imageBox">
                    <Image src = "/{image.imagePath}" link = "/posts/{image.uploadDate}" imageName = {image.originalName} ></Image>
                </div>
            {/if}
        {/each}
        </div>
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
    </div>
    <div class = "footerSpacer"></div>
</div>

<style>
    .midContainer{
        display:grid;
        height:100%;

    }

    .footerSpacer{
        height: 30px;
    }
    
    @media (min-width:960px) {
        .midContainer{
            grid-template-columns: 1fr 4fr;
        }

        .imageGrid{
            gap:5px;
        }
    }

    .imageBrowser{
        display: flex;
        flex-wrap: wrap;
        flex-grow: 1;
    }

    .imageGrid{
        display: grid;
        gap:10px;
        width: 100%;
    }

    .imageBox{
        position: relative;
        width: 100%;
        overflow:hidden;
    }

    .pgnumCont{
        margin: 12px;
        width: 100%;
        display: flex;
        justify-content: space-around;
    }

    .pageNum{
        width: 100%;
        font-size: 2rem;
        text-decoration: none;
        margin: .2em;
        color: #808080;
    }

    .pageNum:link{
        color: #345D7E;
    }

    .pageNum:visited{
        color: #345D7E;
    }

    .pageNum:hover{
        color: #7bb7a2;
        transition:.2s;
    }

    span{
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        margin: 5px 10px;
        color: #5b5b5b;
    }

    select {
        font-family: 'Montserrat', sans-serif;
        font-size: 17px;
        appearance: none;
        color: #345D7E;
        background-color: #ffe4ed;
        border-radius: 7px;
    }
</style>