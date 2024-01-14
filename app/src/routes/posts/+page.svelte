<script>
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
const sizes = [100,150,200,300,400,500];
// let selectedNumImages = 24;
const numImages = [24,32,48,60,72,84,96];

function handleSizeChange(){
    improvImageSize.set(selectedSize);
}

function reloadPage() {
    const numImageParam = ($imageCount === 24) ? "" : `&len=${$imageCount}`;
    goto(`/posts?page=${data.currPage}${numImageParam}`);
}

const calculatePages = () => {
    const numImageParam = ($imageCount === 24) ? "" : `&len=${$imageCount}`;
    nextPage = (data.currPage > 1) ? `/posts?page=${data.currPage - 1}${numImageParam}` : null;
    prevPage = (data.currPage < data.pageNum) ? `/posts?page=${data.currPage + 1}${numImageParam}` : null;
  }

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
            <a href={nextPage} class="pageNum">&lt&lt&lt</a>
            <a href={prevPage} class="pageNum">&gt&gt&gt</a>
        </div>
        <span> Image Size:
            <select bind:value={$improvImageSize} on:change={handleSizeChange}>
                {#each sizes as size}
                    <option value={size}>{size}</option>
                {/each}
            </select>
        </span>
        <span> # of Images:
            <select bind:value={$imageCount} on:change={reloadPage}>
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
            <a href={nextPage} class="pageNum">&lt&lt&lt</a>
            <a href={prevPage} class="pageNum">&gt&gt&gt</a>
        </div>
    </div>
        
</div>

<style>
    .midContainer{
        display:grid;
        height:100%;

    }
    
    @media (min-width:960px) {
        .midContainer{
            grid-template-columns: 1fr 4fr;
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
    }

    .pageNum{
        width: 100%;
        font-size: 2rem;
        text-decoration: none;
        margin: .2em;
        color: #808080;

    }

    .pageNum:link{
        color: #808080;
    }

    .pageNum:visited{
        color: #808080;
    }

    .pageNum:hover{
        color: #7bb7a2;
        transition:.2s;
    }

    span{
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        margin: 5px 10px;
        color: #808080;
    }

    select {
        font-family: 'Montserrat', sans-serif;
        font-size: 17px;
        appearance: none;
        color: #d1d1d1;
        background-color: #678c96;
        border-radius: 5px;
    }
</style>